from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.core.database import get_db, Article, Magazine
from app.schemas.schemas import MagazineCreate, MagazineResponse, MagazineUpdate
from collections import Counter
from typing import Dict, List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/magazines", tags=["magazines"])


@router.get("/", response_model=List[MagazineResponse])
def list_magazines(db: Session = Depends(get_db)):
    magazines = db.query(Magazine).all()
    return magazines


class MagazineStats(BaseModel):
    magazine_id: int
    articles: int
    # None quando a revista ainda nao informa datas / volume
    first_year: Optional[int] = None
    last_year: Optional[int] = None
    issues: Optional[int] = None
    with_doi: int = 0
    issn: Optional[str] = None
    types: Dict[str, int] = {}


@router.get("/stats", response_model=List[MagazineStats])
def magazines_stats(db: Session = Depends(get_db)):
    """Numeros de cada revista numa chamada so (artigos, anos, edicoes, DOI, ISSN, tipos)."""
    rows = db.query(
        Article.magazine_id, Article.publication_date, Article.volume, Article.issue,
        Article.doi, Article.issn, Article.article_type,
    ).all()
    acc: Dict[int, dict] = {}
    for mag_id, date, volume, issue, doi, issn, kind in rows:
        a = acc.setdefault(mag_id, {"n": 0, "years": [], "issues": set(), "doi": 0, "issn": Counter(), "types": Counter()})
        a["n"] += 1
        if date:
            a["years"].append(date.year)
        if volume or issue:
            a["issues"].add((volume or "", issue or ""))
        if doi:
            a["doi"] += 1
        if issn:
            a["issn"][issn] += 1
        a["types"][kind or "artigo"] += 1

    result = []
    for m in db.query(Magazine).order_by(Magazine.id).all():
        a = acc.get(m.id)
        if not a:
            result.append(MagazineStats(magazine_id=m.id, articles=0))
            continue
        result.append(MagazineStats(
            magazine_id=m.id,
            articles=a["n"],
            first_year=min(a["years"]) if a["years"] else None,
            last_year=max(a["years"]) if a["years"] else None,
            issues=len(a["issues"]) or None,
            with_doi=a["doi"],
            issn=a["issn"].most_common(1)[0][0] if a["issn"] else None,
            types=dict(a["types"]),
        ))
    return result


@router.post("/", response_model=MagazineResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_magazine(magazine: MagazineCreate, db: Session = Depends(get_db)):
    # Verificar duplicata
    existing = db.query(Magazine).filter(Magazine.url_oai_pmh == magazine.url_oai_pmh).first()

    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Revista com esta URL OAI-PMH já existe")

    db_magazine = Magazine(**magazine.model_dump())
    db.add(db_magazine)
    db.commit()
    db.refresh(db_magazine)
    return db_magazine


@router.get("/{magazine_id}", response_model=MagazineResponse)
def get_magazine(magazine_id: int, db: Session = Depends(get_db)):
    magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()

    if not magazine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revista não encontrada")

    return magazine


@router.put("/{magazine_id}", response_model=MagazineResponse, dependencies=[Depends(require_admin)])
def update_magazine(magazine_id: int, magazine: MagazineUpdate, db: Session = Depends(get_db)):
    db_magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()

    if not db_magazine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revista não encontrada")

    update_data = magazine.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_magazine, field, value)

    db.add(db_magazine)
    db.commit()
    db.refresh(db_magazine)
    return db_magazine


@router.delete("/{magazine_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_magazine(magazine_id: int, db: Session = Depends(get_db)):
    magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()

    if not magazine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revista não encontrada")

    db.delete(magazine)
    db.commit()
