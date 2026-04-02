from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db, Magazine
from app.schemas.schemas import MagazineCreate, MagazineResponse, MagazineUpdate
from typing import List

router = APIRouter(prefix="/magazines", tags=["magazines"])


@router.get("/", response_model=List[MagazineResponse])
def list_magazines(db: Session = Depends(get_db)):
    magazines = db.query(Magazine).all()
    return magazines


@router.post("/", response_model=MagazineResponse, status_code=status.HTTP_201_CREATED)
def create_magazine(magazine: MagazineCreate, db: Session = Depends(get_db)):
    # Verificar duplicata
    existing = db.query(Magazine).filter(
        Magazine.url_oai_pmh == magazine.url_oai_pmh
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Revista com esta URL OAI-PMH já existe"
        )
    
    db_magazine = Magazine(**magazine.model_dump())
    db.add(db_magazine)
    db.commit()
    db.refresh(db_magazine)
    return db_magazine


@router.get("/{magazine_id}", response_model=MagazineResponse)
def get_magazine(magazine_id: int, db: Session = Depends(get_db)):
    magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()
    
    if not magazine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revista não encontrada"
        )
    
    return magazine


@router.put("/{magazine_id}", response_model=MagazineResponse)
def update_magazine(
    magazine_id: int,
    magazine: MagazineUpdate,
    db: Session = Depends(get_db)
):
    db_magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()
    
    if not db_magazine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revista não encontrada"
        )
    
    update_data = magazine.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_magazine, field, value)
    
    db.add(db_magazine)
    db.commit()
    db.refresh(db_magazine)
    return db_magazine


@router.delete("/{magazine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_magazine(magazine_id: int, db: Session = Depends(get_db)):
    magazine = db.query(Magazine).filter(Magazine.id == magazine_id).first()
    
    if not magazine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Revista não encontrada"
        )
    
    db.delete(magazine)
    db.commit()
