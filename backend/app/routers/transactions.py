import datetime as dt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[schemas.Transaction])
def list_transactions(
    db: Session = Depends(get_db),
    type: Optional[models.TransactionType] = None,
    category_id: Optional[int] = None,
    start: Optional[dt.date] = None,
    end: Optional[dt.date] = None,
    limit: int = Query(default=200, le=1000),
):
    q = db.query(models.Transaction)
    if type:
        q = q.filter(models.Transaction.type == type)
    if category_id:
        q = q.filter(models.Transaction.category_id == category_id)
    if start:
        q = q.filter(models.Transaction.date >= start)
    if end:
        q = q.filter(models.Transaction.date <= end)
    return q.order_by(models.Transaction.date.desc(), models.Transaction.id.desc()).limit(limit).all()


@router.post("", response_model=schemas.Transaction)
def create_transaction(payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    txn = models.Transaction(**payload.model_dump())
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.put("/{txn_id}", response_model=schemas.Transaction)
def update_transaction(txn_id: int, payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for k, v in payload.model_dump().items():
        setattr(txn, k, v)
    db.commit()
    db.refresh(txn)
    return txn


@router.delete("/{txn_id}")
def delete_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"ok": True}
