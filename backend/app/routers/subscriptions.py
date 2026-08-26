import calendar
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


def _advance_billing_date(d: dt.date, cycle: models.BillingCycle) -> dt.date:
    if cycle == models.BillingCycle.weekly:
        return d + dt.timedelta(days=7)
    if cycle == models.BillingCycle.yearly:
        try:
            return d.replace(year=d.year + 1)
        except ValueError:  # Feb 29 in a non-leap year
            return d.replace(year=d.year + 1, day=28)
    month = d.month + 1
    year = d.year
    if month > 12:
        month = 1
        year += 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return d.replace(year=year, month=month, day=day)


def process_due_subscriptions(db: Session) -> None:
    """Turn any subscription whose billing date has passed into an expense transaction."""
    today = dt.date.today()
    due_subs = db.query(models.Subscription).filter(
        models.Subscription.active.is_(True),
        models.Subscription.next_billing_date <= today,
    ).all()

    changed = False
    for sub in due_subs:
        while sub.next_billing_date <= today:
            db.add(models.Transaction(
                amount=sub.amount,
                type=models.TransactionType.expense,
                date=sub.next_billing_date,
                description=f"Subscription: {sub.name}",
                category_id=sub.category_id,
            ))
            sub.next_billing_date = _advance_billing_date(sub.next_billing_date, sub.billing_cycle)
            changed = True

    if changed:
        db.commit()


@router.get("", response_model=list[schemas.Subscription])
def list_subscriptions(db: Session = Depends(get_db), active_only: bool = False):
    process_due_subscriptions(db)
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
    process_due_subscriptions(db)
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
