import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.schemas import ArticleResponse

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_email(value: str) -> str:
    value = value.strip().lower()
    if not _EMAIL_RE.match(value) or len(value) > 320:
        raise ValueError("E-mail inválido")
    return value


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: str
    institution: Optional[str] = Field(default=None, max_length=200)
    areas: List[str] = Field(default_factory=list, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    accept_terms: bool

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _clean_email(v)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Informe o nome completo")
        return v

    @field_validator("accept_terms")
    @classmethod
    def must_accept(cls, v: bool) -> bool:
        if not v:
            raise ValueError("É preciso aceitar os termos de uso")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str = Field(max_length=128)
    remember: bool = False

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    institution: Optional[str] = Field(default=None, max_length=200)
    areas: Optional[List[str]] = Field(default=None, max_length=20)
    save_history: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    institution: Optional[str] = None
    areas: List[str] = []
    save_history: bool
    saved_count: int = 0
    is_admin: bool = False
    # Foto como data URL (image/jpeg, png ou webp), ou nulo quando nao ha foto
    avatar_url: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class HistoryCreate(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    kind: str = Field(default="publicacoes", pattern="^(publicacoes|autores|revistas)$")
    area: Optional[str] = Field(default=None, max_length=100)
    result_count: Optional[int] = Field(default=None, ge=0)


class HistoryResponse(BaseModel):
    id: int
    query: str
    kind: str
    area: Optional[str] = None
    result_count: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TopSearch(BaseModel):
    query: str
    count: int


class SavedArticleResponse(BaseModel):
    saved_at: datetime
    article: ArticleResponse


class AlertCreate(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class AlertResponse(BaseModel):
    id: int
    query: str
    created_at: datetime

    model_config = {"from_attributes": True}
