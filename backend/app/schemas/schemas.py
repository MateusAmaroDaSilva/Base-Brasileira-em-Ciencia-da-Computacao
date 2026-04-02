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
    
    class Config:
        from_attributes = True


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
    created_at: datetime
    
    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    magazine_id: Optional[int] = None
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
    
    class Config:
        from_attributes = True
