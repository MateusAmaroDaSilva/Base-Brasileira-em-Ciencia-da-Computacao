from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    JSON,
    ForeignKey,
    LargeBinary,
    UniqueConstraint,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
from app.core.config import settings

is_sqlite = "sqlite" in settings.DATABASE_URL

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool, echo=False
    )
else:
    engine = create_engine(settings.DATABASE_URL, pool_size=20, max_overflow=0, echo=False)

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
    doi = Column(String(255), nullable=True)
    issn = Column(String(20), nullable=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    pages = Column(String(50), nullable=True)
    language = Column(String(10), default="pt")
    # artigo | artigo_conferencia | dissertacao | capitulo_livro | tese
    article_type = Column(String(30), default="artigo", nullable=False, server_default="artigo", index=True)
    publisher = Column(String(300), nullable=True)
    license = Column(String(300), nullable=True)
    # True so quando o registro prova (licenca CC); None = desconhecido
    open_access = Column(Boolean, nullable=True)
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


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(320), unique=True, index=True, nullable=False)
    password_hash = Column(String(100), nullable=False)
    institution = Column(String(200), nullable=True)
    areas = Column(JSON, default=[])
    # Quando desligado, as buscas deixam de ser guardadas e o historico existente e apagado
    save_history = Column(Boolean, default=True, nullable=False)
    # Foto de perfil (ja reduzida pelo frontend); fica no proprio banco para nao depender de volume de arquivos
    avatar = Column(LargeBinary, nullable=True)
    avatar_mime = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String(500), nullable=False)
    kind = Column(String(20), default="publicacoes", nullable=False)
    area = Column(String(100), nullable=True)
    result_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class SavedArticle(Base):
    __tablename__ = "saved_articles"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_saved_user_article"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    """Busca guardada. O envio de e-mails ainda nao existe: por enquanto so a lista e mantida."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
