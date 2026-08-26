# Ledger — Expense Tracker

A personal expense tracker with a dashboard (spending by category, savings/investments,
subscription cost), a transaction log, and a subscription tracker.

- **Backend:** Python, FastAPI, SQLAlchemy (SQLite by default, Postgres-ready)
- **Frontend:** React (Vite), Tailwind CSS, Recharts

```
expense-tracker/
├── backend/     FastAPI app
└── frontend/    React app (Vite)
```

## 1. Run it locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

The first run creates `expenses.db` (SQLite) and seeds a handful of default
categories automatically. API docs are at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm run dev                # http://localhost:5173
```

## 2. Push to GitHub

```bash
cd expense-tracker
git init
git add .
git commit -m "Initial commit: expense tracker"
gh repo create expense-tracker --source=. --public --push
# or: create the repo on github.com, then
# git remote add origin <your-repo-url> && git push -u origin main
```

## 3. Deploy on Railway (two services, one repo)

Railway can deploy both the API and the frontend from the same GitHub repo —
you just point each service at a different subfolder.

### Backend service

1. In Railway: **New Project → Deploy from GitHub repo** → pick this repo.
2. On the service, open **Settings → Root Directory** and set it to `backend`.
3. Railway auto-detects Python via `requirements.txt` (Nixpacks) and uses the
   start command from `railway.json`/`Procfile`:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Variables** tab: add `CORS_ORIGINS` set to your frontend's Railway URL
   once you have it (comma-separate multiple origins). Leave `DATABASE_URL`
   unset to use SQLite, or attach Railway's Postgres plugin to get it set
   automatically for a persistent database (recommended — Railway's
   filesystem for SQLite is not guaranteed to persist across deploys).
5. Deploy, then copy the generated public URL (Settings → Networking →
   Generate Domain).

### Frontend service

1. In the same Railway project: **New Service → GitHub repo** (same repo again).
2. **Settings → Root Directory** → `frontend`.
3. Build command: `npm install && npm run build`. Start command:
   `npm run preview` (already wired to `--host 0.0.0.0 --port $PORT` in
   `package.json`).
4. **Variables** tab: add `VITE_API_URL` = the backend's public URL from the
   step above (no trailing slash). Vite bakes this in at build time, so
   redeploy the frontend if you ever change it.
5. Generate a public domain for this service too — that's the link you'll
   actually use.
6. Go back to the backend service's `CORS_ORIGINS` variable and set it to
   this frontend URL, then redeploy the backend.

That's it — two services, one repo, each with its own root directory and
its own public URL.

## Notes

- Categories are seeded on first boot (Groceries, Rent, Transport, etc.) —
  edit `DEFAULT_CATEGORIES` in `backend/app/main.py` or add your own via
  `POST /api/categories`.
- "Saved" transactions have a `savings_destination` of `bank` or
  `investment`, which is what powers the "where your savings sit" panel.
- Subscriptions normalize weekly/monthly/yearly costs to a monthly figure
  for the dashboard total.
