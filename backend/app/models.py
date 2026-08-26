import enum
import datetime as dt
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from .database import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    saving = "saving"


class SavingsDestination(str, enum.Enum):
    bank = "bank"
    investment = "investment"


class BillingCycle(str, enum.Enum):
    monthly = "monthly"
    yearly = "yearly"
    weekly = "weekly"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#4C9A79")  # hex color for charts/UI
    icon = Column(String, default="tag")

    transactions = relationship("Transaction", back_populates="category")
    subscriptions = relationship("Subscription", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)  # always positive
    type = Column(Enum(TransactionType), nullable=False, default=TransactionType.expense)
    date = Column(Date, nullable=False, default=dt.date.today)
    description = Column(String, default="")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    savings_destination = Column(Enum(SavingsDestination), nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    category = relationship("Category", back_populates="transactions")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_cycle = Column(Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    next_billing_date = Column(Date, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    active = Column(Boolean, default=True)
    notes = Column(String, default="")

    category = relationship("Category", back_populates="subscriptions")
