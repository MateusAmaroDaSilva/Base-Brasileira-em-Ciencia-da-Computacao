import re
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, extract, cast, Text
from app.core.database import get_db, Article
from app.schemas.schemas import ArticleResponse, SearchRequest, SearchResponse
from app.core.elasticsearch_client import get_elasticsearch_client
from typing import List


def _strip_boolean_operators(query: str) -> str:
    clean = re.sub(r'\b(AND|OR|NOT)\b', ' ', query)
    clean = re.sub(r'[()"]', ' ', clean)
    return ' '.join(clean.split())


def _compute_sql_facets(db, text_query, magazine_id, year_from, year_to, language, keyword=None, has_doi=None):
    """
    Compute facets for all filter dimensions.
    Each dimension excludes its own filter so the user can switch values.
    """

    def base():
        q = db.query(Article)
        if text_query:
            term = f"%{text_query}%"
            q = q.filter((Article.title.ilike(term)) | (Article.abstract.ilike(term)))
        return q

    def apply_year(q):
        if year_from:
            q = q.filter(Article.publication_date >= date(year_from, 1, 1))
        if year_to:
            q = q.filter(Article.publication_date <= date(year_to, 12, 31))
        return q

    def apply_keyword(q):
        if keyword:
            q = q.filter(cast(Article.keywords, Text).ilike(f'%"{keyword}"%'))
        return q

    def apply_doi(q):
        if has_doi is True:
            q = q.filter(Article.doi.isnot(None))
        elif has_doi is False:
            q = q.filter(Article.doi.is_(None))
        return q

    # --- Revista facets (no magazine_id filter) ---
    mag_q = apply_doi(apply_keyword(apply_year(base())))
    if language:
        mag_q = mag_q.filter(Article.language == language)
    by_magazine = [
        {"id": r[0], "count": r[1]}
        for r in mag_q.with_entities(Article.magazine_id, func.count(Article.id))
        .group_by(Article.magazine_id).all()
    ]

    # --- Ano facets (no year filter) ---
    yr_q = apply_doi(apply_keyword(base()))
    if magazine_id:
        yr_q = yr_q.filter(Article.magazine_id == magazine_id)
    if language:
        yr_q = yr_q.filter(Article.language == language)
    yr_q = yr_q.filter(Article.publication_date.isnot(None))
    year_col = extract('year', Article.publication_date)
    by_year = [
        {"year": str(int(r[0])), "count": r[1]}
        for r in yr_q.with_entities(year_col, func.count(Article.id))
        .group_by(year_col).order_by(year_col).all()
        if r[0] is not None
    ]

    # --- Idioma facets (no language filter) ---
    lang_q = apply_doi(apply_keyword(apply_year(base())))
    if magazine_id:
        lang_q = lang_q.filter(Article.magazine_id == magazine_id)
    lang_q = lang_q.filter(Article.language.isnot(None))
    by_language = [
        {"code": r[0], "count": r[1]}
        for r in lang_q.with_entities(Article.language, func.count(Article.id))
        .group_by(Article.language).order_by(desc(func.count(Article.id))).all()
    ]

    # --- DOI facets (no has_doi filter) ---
    doi_q = apply_keyword(apply_year(base()))
    if magazine_id:
        doi_q = doi_q.filter(Article.magazine_id == magazine_id)
    if language:
        doi_q = doi_q.filter(Article.language == language)
    with_doi = doi_q.filter(Article.doi.isnot(None)).count()
    without_doi = doi_q.filter(Article.doi.is_(None)).count()
    by_doi = [
        {"value": "com_doi", "label": "Com DOI", "count": with_doi},
        {"value": "sem_doi", "label": "Sem DOI", "count": without_doi},
    ]

    return {
        "by_magazine": by_magazine,
        "by_year": by_year,
        "by_language": by_language,
        "by_doi": by_doi,
    }


def _compute_keyword_facets(db, text_query, magazine_id, year_from, year_to, language, has_doi, top_n=15):
    """Aggregate top keywords from matching articles (in Python — no keyword filter applied)."""
    q = db.query(Article.keywords)
    if text_query:
        term = f"%{text_query}%"
        q = q.filter((Article.title.ilike(term)) | (Article.abstract.ilike(term)))
    if magazine_id:
        q = q.filter(Article.magazine_id == magazine_id)
    if year_from:
        q = q.filter(Article.publication_date >= date(year_from, 1, 1))
    if year_to:
        q = q.filter(Article.publication_date <= date(year_to, 12, 31))
    if language:
        q = q.filter(Article.language == language)
    if has_doi is True:
        q = q.filter(Article.doi.isnot(None))
    elif has_doi is False:
        q = q.filter(Article.doi.is_(None))

    counts: dict = {}
    for (kws,) in q.all():
        if isinstance(kws, list):
            for kw in kws:
                if kw and isinstance(kw, str):
                    normalized = kw.strip().lower()
                    if normalized:
                        counts[normalized] = counts.get(normalized, 0) + 1

    top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"keyword": kw, "count": cnt} for kw, cnt in top]


router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("/", response_model=List[ArticleResponse])
def list_articles(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    articles = db.query(Article).order_by(desc(Article.publication_date)).offset(skip).limit(limit).all()
    return articles


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artigo não encontrado")
    return article


@router.post("/search", response_model=SearchResponse)
def search_articles(search: SearchRequest, db: Session = Depends(get_db)):
    year_from = search.year_from
    year_to = search.year_to
    if not year_from and search.date_from:
        year_from = search.date_from.year
    if not year_to and search.date_to:
        year_to = search.date_to.year

    query = db.query(Article)
    if search.query:
        term = f"%{search.query}%"
        query = query.filter((Article.title.ilike(term)) | (Article.abstract.ilike(term)))
    if year_from:
        query = query.filter(Article.publication_date >= date(year_from, 1, 1))
    if year_to:
        query = query.filter(Article.publication_date <= date(year_to, 12, 31))
    if search.magazine_id:
        query = query.filter(Article.magazine_id == search.magazine_id)
    if search.language:
        query = query.filter(Article.language == search.language)
    if search.keyword:
        query = query.filter(cast(Article.keywords, Text).ilike(f'%"{search.keyword}"%'))
    if search.has_doi is True:
        query = query.filter(Article.doi.isnot(None))
    elif search.has_doi is False:
        query = query.filter(Article.doi.is_(None))

    total = query.count()
    articles = query.order_by(desc(Article.publication_date)).offset(search.offset).limit(search.limit).all()

    facets = _compute_sql_facets(
        db, search.query, search.magazine_id, year_from, year_to,
        search.language, search.keyword, search.has_doi,
    )
    facets["by_keyword"] = _compute_keyword_facets(
        db, search.query, search.magazine_id, year_from, year_to,
        search.language, search.has_doi,
    )
    facets["search_engine"] = "sql"
    facets["total_results"] = total
    facets["limit"] = search.limit
    facets["offset"] = search.offset

    return SearchResponse(total=total, articles=articles, facets=facets)


@router.post("/elasticsearch/search", response_model=SearchResponse)
def search_elasticsearch(search: SearchRequest, db: Session = Depends(get_db)):
    es_client = get_elasticsearch_client()

    year_from = search.year_from
    year_to = search.year_to
    if not year_from and search.date_from:
        year_from = search.date_from.year
    if not year_to and search.date_to:
        year_to = search.date_to.year

    es_results = es_client.search(
        query=search.query,
        magazine_id=search.magazine_id,
        limit=search.limit,
        offset=search.offset,
        year_from=year_from,
        year_to=year_to,
        language=search.language,
        search_type=search.search_type,
    )

    if not es_results.get("available", True):
        clean_text = _strip_boolean_operators(search.query)
        sql_query = db.query(Article)
        if clean_text:
            term = f"%{clean_text}%"
            sql_query = sql_query.filter((Article.title.ilike(term)) | (Article.abstract.ilike(term)))
        if search.magazine_id:
            sql_query = sql_query.filter(Article.magazine_id == search.magazine_id)
        if year_from:
            sql_query = sql_query.filter(Article.publication_date >= date(year_from, 1, 1))
        if year_to:
            sql_query = sql_query.filter(Article.publication_date <= date(year_to, 12, 31))
        if search.keyword:
            sql_query = sql_query.filter(cast(Article.keywords, Text).ilike(f'%"{search.keyword}"%'))
        if search.has_doi is True:
            sql_query = sql_query.filter(Article.doi.isnot(None))
        elif search.has_doi is False:
            sql_query = sql_query.filter(Article.doi.is_(None))
        total = sql_query.count()
        articles = sql_query.order_by(desc(Article.publication_date)).offset(search.offset).limit(search.limit).all()
        facets = _compute_sql_facets(
            db, clean_text, search.magazine_id, year_from, year_to,
            search.language, search.keyword, search.has_doi,
        )
        facets["by_keyword"] = _compute_keyword_facets(
            db, clean_text, search.magazine_id, year_from, year_to,
            search.language, search.has_doi,
        )
        facets["search_engine"] = "sql_fallback"
        facets["total_results"] = total
        facets["limit"] = search.limit
        facets["offset"] = search.offset
        return SearchResponse(total=total, articles=articles, facets=facets)

    article_ids = [int(doc.get("article_id")) for doc in es_results.get("articles", [])]
    articles = []
    if article_ids:
        articles = db.query(Article).filter(Article.id.in_(article_ids)).all()

    facets = es_results.get("facets", {})
    facets["search_engine"] = "elasticsearch"
    facets["total_results"] = es_results.get("total", 0)
    facets["limit"] = search.limit
    facets["offset"] = search.offset

    return SearchResponse(total=es_results.get("total", 0), articles=articles, facets=facets)


@router.get("/elasticsearch/suggest")
def suggest_search(q: str, limit: int = 5):
    es_client = get_elasticsearch_client()
    suggestions = es_client.suggest(query=q, limit=limit)
    return {"query": q, "suggestions": suggestions, "count": len(suggestions)}


@router.post("/elasticsearch/reindex")
def reindex_articles(db: Session = Depends(get_db)):
    try:
        es_client = get_elasticsearch_client()
        es_client.recreate_index()
        articles = db.query(Article).all()
        articles_data = [
            {
                "id": a.id,
                "title": a.title,
                "abstract": a.abstract or "",
                "authors": a.authors or [],
                "keywords": a.keywords or [],
                "magazine_id": a.magazine_id,
                "publication_date": a.publication_date,
                "url": a.url,
                "oai_identifier": a.oai_identifier,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            }
            for a in articles
        ]
        es_client.bulk_index_articles(articles_data)
        return {
            "status": "success",
            "message": f"Indexados {len(articles_data)} artículos no Elasticsearch",
            "total_indexed": len(articles_data),
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao reindexar: {str(e)}")
