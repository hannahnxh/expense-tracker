import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from .models import TransactionType, SavingsDestination, BillingCycle


# ---------- Category ----------
class CategoryBase(BaseModel):
    name: str
    color: str = "#4C9A79"
    icon: str = "tag"


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Transaction ----------
class TransactionBase(BaseModel):
    amount: float
    type: TransactionType
    date: dt.date
    description: str = ""
    category_id: Optional[int] = None
    savings_destination: Optional[SavingsDestination] = None


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: Optional[Category] = None


# ---------- Subscription ----------
class SubscriptionBase(BaseModel):
    name: str
    amount: float
    billing_cycle: BillingCycle = BillingCycle.monthly
    next_billing_date: dt.date
    category_id: Optional[int] = None
    active: bool = True
    notes: str = ""


class SubscriptionCreate(SubscriptionBase):
    pass


class Subscription(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: Optional[Category] = None


# ---------- Dashboard ----------
class CategoryBreakdown(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    total: float
    percentage: float


class MonthlyPoint(BaseModel):
    month: str  # "2026-08"
    income: float
    expense: float
    saved: float


class SavingsBreakdown(BaseModel):
    destination: str
    total: float


class DashboardSummary(BaseModel):
    total_income: float
    total_expense: float
    total_saved: float
    net: float
    category_breakdown: List[CategoryBreakdown]
    savings_breakdown: List[SavingsBreakdown]
    monthly_trend: List[MonthlyPoint]
    subscription_monthly_cost: float
