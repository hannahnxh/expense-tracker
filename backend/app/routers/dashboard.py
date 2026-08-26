import datetime as dt
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from .subscriptions import _monthly_equivalent

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _month_key(d: dt.date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    start: dt.date | None = None,
    end: dt.date | None = None,
    months: int = Query(default=6, le=24),
):
    q = db.query(models.Transaction)
    if start:
        q = q.filter(models.Transaction.date >= start)
    if end:
        q = q.filter(models.Transaction.date <= end)
    txns = q.all()

    total_income = sum(t.amount for t in txns if t.type == models.TransactionType.income)
    total_expense = sum(t.amount for t in txns if t.type == models.TransactionType.expense)
    total_saved = sum(t.amount for t in txns if t.type == models.TransactionType.saving)

    # Category breakdown (expenses only)
    cat_totals: dict = defaultdict(float)
    cat_meta: dict = {}
    for t in txns:
        if t.type != models.TransactionType.expense:
            continue
        key = t.category_id
        cat_totals[key] += t.amount
        if t.category:
            cat_meta[key] = (t.category.name, t.category.color)
        else:
            cat_meta[key] = ("Uncategorized", "#9CA3AF")

    category_breakdown = []
    for cat_id, total in sorted(cat_totals.items(), key=lambda kv: -kv[1]):
        name, color = cat_meta[cat_id]
        pct = (total / total_expense * 100) if total_expense > 0 else 0
        category_breakdown.append(
            schemas.CategoryBreakdown(
                category_id=cat_id, category_name=name, color=color,
                total=round(total, 2), percentage=round(pct, 1),
            )
        )

    # Savings breakdown by destination
    dest_totals: dict = defaultdict(float)
    for t in txns:
        if t.type == models.TransactionType.saving:
            dest = t.savings_destination.value if t.savings_destination else "unspecified"
            dest_totals[dest] += t.amount
    savings_breakdown = [
        schemas.SavingsBreakdown(destination=d, total=round(v, 2)) for d, v in dest_totals.items()
    ]

    # Monthly trend for the last N months (independent of start/end filter, uses all data)
    all_txns = db.query(models.Transaction).all()
    monthly: dict = defaultdict(lambda: {"income": 0.0, "expense": 0.0, "saved": 0.0})
    for t in all_txns:
        mk = _month_key(t.date)
        if t.type == models.TransactionType.income:
            monthly[mk]["income"] += t.amount
        elif t.type == models.TransactionType.expense:
            monthly[mk]["expense"] += t.amount
        elif t.type == models.TransactionType.saving:
            monthly[mk]["saved"] += t.amount

    today = dt.date.today()
    month_keys = []
    y, m = today.year, today.month
    for _ in range(months):
        month_keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    month_keys.reverse()

    monthly_trend = [
        schemas.MonthlyPoint(
            month=mk,
            income=round(monthly[mk]["income"], 2),
            expense=round(monthly[mk]["expense"], 2),
            saved=round(monthly[mk]["saved"], 2),
        )
        for mk in month_keys
    ]

    active_subs = db.query(models.Subscription).filter(models.Subscription.active.is_(True)).all()
    subscription_monthly_cost = round(
        sum(_monthly_equivalent(s.amount, s.billing_cycle) for s in active_subs), 2
    )

    return schemas.DashboardSummary(
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        total_saved=round(total_saved, 2),
        net=round(total_income - total_expense - total_saved, 2),
        category_breakdown=category_breakdown,
        savings_breakdown=savings_breakdown,
        monthly_trend=monthly_trend,
        subscription_monthly_cost=subscription_monthly_cost,
    )
