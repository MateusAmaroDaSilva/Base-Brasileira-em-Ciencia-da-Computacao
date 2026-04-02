from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
from app.core.config import settings

is_sqlite = "sqlite" in settings.DATABASE_URL

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Magazine(Base):
    __tablename__ = "magazines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    url_oai_pmh = Column(String(500), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    last_sync = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra_metadata = Column(JSON, default={})


class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    oai_identifier = Column(String(500), unique=True, index=True, nullable=False)
    magazine_id = Column(Integer, nullable=False, index=True)
    title = Column(String(500), nullable=False, index=True)
    authors = Column(JSON, default=[])
    abstract = Column(Text, nullable=True)
    keywords = Column(JSON, default=[])
    publication_date = Column(DateTime, nullable=True, index=True)
    url = Column(String(500), nullable=True)
    doi = Column(String(100), nullable=True)
    issn = Column(String(20), nullable=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    pages = Column(String(50), nullable=True)
    language = Column(String(10), default="pt")
    is_indexed = Column(Boolean, default=False, index=True)
    raw_metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SyncLog(Base):
    __tablename__ = "sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    magazine_id = Column(Integer, nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  
    articles_new = Column(Integer, default=0)
    articles_updated = Column(Integer, default=0)
    articles_failed = Column(Integer, default=0)
    errors = Column(JSON, default=[])
    duration_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    message = Column(Text, nullable=True)
