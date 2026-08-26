import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, Base, SessionLocal
from .routers import categories, transactions, subscriptions, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# Comma-separated list of allowed origins, e.g. "https://your-frontend.up.railway.app,http://localhost:5173"
origins_env = os.getenv("CORS_ORIGINS", "*")
allow_origins = ["*"] if origins_env.strip() == "*" else [o.strip() for o in origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(subscriptions.router)
app.include_router(dashboard.router)

DEFAULT_CATEGORIES = [
    ("Groceries", "#4C9A79", "shopping-cart"),
    ("Rent/Mortgage", "#8B5E3C", "home"),
    ("Transport", "#3E7CB1", "car"),
    ("Dining Out", "#D98E4A", "utensils"),
    ("Entertainment", "#A45FBF", "film"),
    ("Utilities", "#5C7AEA", "zap"),
    ("Health", "#E15B64", "heart"),
    ("Shopping", "#E0B84B", "bag"),
    ("Travel", "#4FB3BF", "plane"),
    ("Other", "#9CA3AF", "tag"),
]


@app.on_event("startup")
def seed_default_categories():
    db = SessionLocal()
    try:
        existing = {c.name for c in db.query(models.Category).all()}
        for name, color, icon in DEFAULT_CATEGORIES:
            if name not in existing:
                db.add(models.Category(name=name, color=color, icon=icon))
        db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "expense-tracker-api"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
