import base64

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, is_admin
from app.core import ratelimit
from app.core.database import SavedArticle, SearchHistory, User, get_db
from app.core.security import DUMMY_HASH, create_access_token, hash_password, verify_password
from app.schemas.account import LoginRequest, RegisterRequest, TokenResponse, UserResponse, UserUpdate

router = APIRouter(tags=["auth"])


def user_response(user: User, db: Session) -> UserResponse:
    saved = db.query(func.count(SavedArticle.id)).filter(SavedArticle.user_id == user.id).scalar() or 0
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        institution=user.institution,
        areas=user.areas or [],
        save_history=user.save_history,
        saved_count=saved,
        is_admin=is_admin(user),
        avatar_url=(
            f"data:{user.avatar_mime};base64,{base64.b64encode(user.avatar).decode('ascii')}" if user.avatar else None
        ),
        created_at=user.created_at,
    )


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe uma conta com esse e-mail")

    user = User(
        name=data.name,
        email=data.email,
        institution=(data.institution or "").strip() or None,
        areas=list(dict.fromkeys(data.areas)),
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Dois cadastros simultaneos com o mesmo e-mail
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe uma conta com esse e-mail")
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id), user=user_response(user, db))


@router.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "?"
    wait = ratelimit.retry_after(data.email, ip)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas. Tente de novo em {max(1, wait // 60)} min.",
            headers={"Retry-After": str(wait)},
        )
    user = db.query(User).filter(User.email == data.email).first()
    # Sempre confere um hash, exista a conta ou nao, e responde igual nos dois casos
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not valid:
        ratelimit.register_failure(data.email, ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha incorretos")
    ratelimit.reset(data.email)
    token = create_access_token(user.id, remember=data.remember)
    return TokenResponse(access_token=token, user=user_response(user, db))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_response(user, db)


@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fields = data.model_dump(exclude_unset=True)
    if "name" in fields and fields["name"] is not None:
        user.name = fields["name"].strip()
    if "institution" in fields:
        user.institution = (fields["institution"] or "").strip() or None
    if "areas" in fields and fields["areas"] is not None:
        user.areas = list(dict.fromkeys(fields["areas"]))
    if "save_history" in fields and fields["save_history"] is not None:
        user.save_history = fields["save_history"]
        if not user.save_history:
            # Desligar o historico apaga o que ja estava guardado
            db.query(SearchHistory).filter(SearchHistory.user_id == user.id).delete()
    db.commit()
    db.refresh(user)
    return user_response(user, db)


MAX_AVATAR_BYTES = 200 * 1024


def _image_mime(data: bytes) -> str | None:
    """Tipo pelo conteudo do arquivo, nunca pelo cabecalho enviado (que o cliente pode forjar)."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.put("/me/avatar", response_model=UserResponse)
async def set_avatar(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Recusa antes de ler quando o cliente ja declara um corpo grande demais
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Imagem grande demais")

    data = await request.body()
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Imagem grande demais")
    mime = _image_mime(data)
    if not mime:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Use uma imagem JPEG, PNG ou WebP"
        )

    user.avatar = data
    user.avatar_mime = mime
    db.commit()
    db.refresh(user)
    return user_response(user, db)


@router.delete("/me/avatar", status_code=status.HTTP_204_NO_CONTENT)
def delete_avatar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.avatar = None
    user.avatar_mime = None
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
