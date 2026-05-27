import re
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db, Article
from app.schemas.schemas import ArticleResponse, SearchRequest, SearchResponse
from app.core.elasticsearch_client import get_elasticsearch_client
from typing import List


def _strip_boolean_operators(query: str) -> str:
    clean = re.sub(r'\b(AND|OR|NOT)\b', ' ', query)
    clean = re.sub(r'[()"]', ' ', clean)
    return ' '.join(clean.split())

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
    query = db.query(Article)

    if search.query:
        search_term = f"%{search.query}%"
        query = query.filter((Article.title.ilike(search_term)) | (Article.abstract.ilike(search_term)))

    if search.date_from:
        query = query.filter(Article.publication_date >= search.date_from)

    if search.date_to:
        query = query.filter(Article.publication_date <= search.date_to)

    # Filtro de revista
    if search.magazine_id:
        query = query.filter(Article.magazine_id == search.magazine_id)

    total = query.count()
    articles = query.order_by(desc(Article.publication_date)).offset(search.offset).limit(search.limit).all()

    return SearchResponse(
        total=total, articles=articles, facets={"total_results": total, "limit": search.limit, "offset": search.offset}
    )


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
        sql_query = db.query(Article)
        clean_text = _strip_boolean_operators(search.query)
        if clean_text:
            term = f"%{clean_text}%"
            sql_query = sql_query.filter(
                (Article.title.ilike(term)) | (Article.abstract.ilike(term))
            )
        if search.magazine_id:
            sql_query = sql_query.filter(Article.magazine_id == search.magazine_id)
        if year_from:
            sql_query = sql_query.filter(Article.publication_date >= date(year_from, 1, 1))
        if year_to:
            sql_query = sql_query.filter(Article.publication_date <= date(year_to, 12, 31))
        total = sql_query.count()
        articles = sql_query.order_by(desc(Article.publication_date)).offset(search.offset).limit(search.limit).all()
        return SearchResponse(
            total=total,
            articles=articles,
            facets={"search_engine": "sql_fallback", "total_results": total, "limit": search.limit, "offset": search.offset},
        )

    article_ids = [int(doc.get("article_id")) for doc in es_results.get("articles", [])]
    articles = []
    if article_ids:
        articles = db.query(Article).filter(Article.id.in_(article_ids)).all()

    facets = es_results.get("facets", {})
    facets["search_engine"] = "elasticsearch"
    facets["total_results"] = es_results.get("total", 0)
    facets["limit"] = search.limit
    facets["offset"] = search.offset

    return SearchResponse(
        total=es_results.get("total", 0),
        articles=articles,
        facets=facets,
    )


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
