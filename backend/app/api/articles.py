from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db, Article
from app.schemas.schemas import ArticleResponse, SearchRequest, SearchResponse
from app.core.elasticsearch_client import get_elasticsearch_client
from typing import List, Optional

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("/", response_model=List[ArticleResponse])
def list_articles(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    articles = db.query(Article)\
        .order_by(desc(Article.publication_date))\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return articles


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artigo não encontrado"
        )
    
    return article


@router.post("/search", response_model=SearchResponse)
def search_articles(
    search: SearchRequest,
    db: Session = Depends(get_db)
):

    query = db.query(Article)
    
    if search.query:
        search_term = f"%{search.query}%"
        query = query.filter(
            (Article.title.ilike(search_term)) |
            (Article.abstract.ilike(search_term))
        )
    
    if search.date_from:
        query = query.filter(Article.publication_date >= search.date_from)
    
    if search.date_to:
        query = query.filter(Article.publication_date <= search.date_to)
    
    # Filtro de revista
    if search.magazine_id:
        query = query.filter(Article.magazine_id == search.magazine_id)
    
    total = query.count()
    articles = query\
        .order_by(desc(Article.publication_date))\
        .offset(search.offset)\
        .limit(search.limit)\
        .all()
    
    return SearchResponse(
        total=total,
        articles=articles,
        facets={
            "total_results": total,
            "limit": search.limit,
            "offset": search.offset
        }
    )


@router.post("/elasticsearch/search", response_model=SearchResponse)
def search_elasticsearch(
    search: SearchRequest,
    db: Session = Depends(get_db)
):
    es_client = get_elasticsearch_client()
    
    # Buscar no Elasticsearch
    es_results = es_client.search(
        query=search.query,
        magazine_id=search.magazine_id,
        limit=search.limit,
        offset=search.offset
    )
    
    article_ids = [int(doc.get("article_id")) for doc in es_results.get("articles", [])]
    articles = []
    if article_ids:
        articles = db.query(Article).filter(Article.id.in_(article_ids)).all()
    
    return SearchResponse(
        total=es_results.get("total", 0),
        articles=articles,
        facets={
            "search_engine": "elasticsearch",
            "total_results": es_results.get("total", 0),
            "limit": search.limit,
            "offset": search.offset
        }
    )


@router.get("/elasticsearch/suggest")
def suggest_search(q: str, limit: int = 5):
    es_client = get_elasticsearch_client()
    suggestions = es_client.suggest(query=q, limit=limit)
    
    return {
        "query": q,
        "suggestions": suggestions,
        "count": len(suggestions)
    }


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
                "updated_at": a.updated_at
            }
            for a in articles
        ]
        
        es_client.bulk_index_articles(articles_data)
        
        return {
            "status": "success",
            "message": f"Indexados {len(articles_data)} artículos no Elasticsearch",
            "total_indexed": len(articles_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao reindexar: {str(e)}"
        )

