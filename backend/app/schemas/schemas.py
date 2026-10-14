from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class MagazineBase(BaseModel):
    name: str
    url_oai_pmh: str
    description: Optional[str] = None


class MagazineCreate(MagazineBase):
    pass


class MagazineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MagazineResponse(MagazineBase):
    id: int
    is_active: bool
    last_sync: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArticleBase(BaseModel):
    title: str
    authors: List[str]
    abstract: Optional[str] = None
    keywords: List[str]


class ArticleCreate(ArticleBase):
    oai_identifier: str
    magazine_id: int
    publication_date: Optional[datetime] = None
    url: Optional[str] = None
    doi: Optional[str] = None


class ArticleResponse(ArticleBase):
    id: int
    oai_identifier: str
    magazine_id: int
    publication_date: Optional[datetime] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    issn: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    language: Optional[str] = None
    article_type: str = "artigo"
    publisher: Optional[str] = None
    license: Optional[str] = None
    open_access: Optional[bool] = None
    author_details: Optional[List[dict]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SearchRequest(BaseModel):
    query: str = ""
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    magazine_id: Optional[int] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    language: Optional[str] = None
    keyword: Optional[str] = None
    has_doi: Optional[bool] = None
    search_type: str = "simple"  # "simple" or "boolean"
    limit: int = 20
    offset: int = 0


class SearchResponse(BaseModel):
    total: int
    articles: List[ArticleResponse]
    facets: Optional[dict] = None


class SyncLogResponse(BaseModel):
    id: int
    magazine_id: int
    status: str
    articles_new: int
    articles_updated: int
    articles_failed: int
    duration_seconds: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    message: Optional[str] = None

    model_config = {"from_attributes": True}
