# Deployment Guide — SaarthiCare

This guide outlines how to deploy **SaarthiCare** in production across modern hosting platforms.

---

## 🏗️ Architecture Overview

- **Frontend**: Vite + React SPA (hosted on **Cloudflare Pages**)
- **Backend**: FastAPI (Python 3.11+) (hosted on **Render** Web Service)
- **Database / Auth**: Supabase PostgreSQL + Row Level Security (RLS)

---

## 🚀 1. Backend Deployment (Render)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`HarshBuild/SaarthiCare`).
4. Configure service settings:
   - **Name**: `saarthii-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables in Render:
   - `PYTHON_VERSION`: `3.11.0`
   - `APP_ENV`: `production`
   - `CORS_ORIGINS`: `*` (or your specific Cloudflare Pages URL)
   - `SECRET_KEY`: `<generate-random-secret-key>`
   - (Optional) Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
6. Click **Create Web Service**. Save your backend URL (e.g., `https://saarthii-api.onrender.com`).

---

## ☁️ 2. Frontend Deployment (Cloudflare Pages)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select the repository `HarshBuild/SaarthiCare`.
4. Configure Build Settings:
   - **Production Branch**: `master`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Build Output Directory**: `dist`
5. Set Environment Variables in Cloudflare Pages:
   - `VITE_API_BASE_URL`: `https://saarthii-api.onrender.com/api`
6. Click **Save and Deploy**.

> **Note on SPA Routing**: The project includes `frontend/public/_redirects` which automatically handles client-side routing rewrites (`/* /index.html 200`).

---

## 🔒 3. Environment Variables Reference

See `.env.example` in the root and `frontend/.env.example` for required variables.

### Backend (`backend/.env`)
- `APP_ENV=production`
- `CORS_ORIGINS=*`
- `SECRET_KEY=your-secret-key`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL=https://saarthii-api.onrender.com/api`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
