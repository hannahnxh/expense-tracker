import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


def _monthly_equivalent(amount: float, cycle: models.BillingCycle) -> float:
    if cycle == models.BillingCycle.yearly:
        return amount / 12
    if cycle == models.BillingCycle.weekly:
        return amount * 52 / 12
    return amount


@router.get("", response_model=list[schemas.Subscription])
def list_subscriptions(db: Session = Depends(get_db), active_only: bool = False):
    q = db.query(models.Subscription)
    if active_only:
        q = q.filter(models.Subscription.active.is_(True))
    return q.order_by(models.Subscription.next_billing_date).all()


@router.post("", response_model=schemas.Subscription)
def create_subscription(payload: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    sub = models.Subscription(**payload.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.put("/{sub_id}", response_model=schemas.Subscription)
def update_subscription(sub_id: int, payload: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    for k, v in payload.model_dump().items():
        setattr(sub, k, v)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{sub_id}")
def delete_subscription(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
    return {"ok": True}


@router.get("/summary")
def subscriptions_summary(db: Session = Depends(get_db)):
    subs = db.query(models.Subscription).filter(models.Subscription.active.is_(True)).all()
    monthly_total = sum(_monthly_equivalent(s.amount, s.billing_cycle) for s in subs)
    today = dt.date.today()
    upcoming = sorted(
        [s for s in subs if (s.next_billing_date - today).days <= 14],
        key=lambda s: s.next_billing_date,
    )
    return {
        "monthly_total": round(monthly_total, 2),
        "yearly_total": round(monthly_total * 12, 2),
        "active_count": len(subs),
        "upcoming": [schemas.Subscription.model_validate(s).model_dump(mode="json") for s in upcoming],
    }
