# SAARTHII – Closed-Loop Healthcare Referral and Follow-Up System

> **Tagline:** Every Referral Deserves a Traceable Next Step.

---

## Quick Start (Windows PowerShell)

### 1. Install Dependencies

```powershell
# Terminal 1: Frontend
cd B:\SaarthiCare\frontend
npm install

# Terminal 2: Backend
cd B:\SaarthiCare\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Start Development Servers

```powershell
# Terminal 3: Frontend
cd B:\SaarthiCare\frontend
npm run dev
# Frontend runs at: http://localhost:5173

# Terminal 4: Backend
cd B:\SaarthiCare\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# Backend runs at: http://localhost:8000
```

### 3. Test Health Endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health"
```

Expected response:
```json
{
  "status": "healthy",
  "application": "SAARTHII",
  "version": "1.0.0"
}
```

### 4. Login (Demo Accounts)

| Role | Email | Password |
|------|-------|----------|
| PHC Staff | priya.sharma@saarthii.in | Password123! |
| Hospital Staff | ravi.kumar@saarthii.in | Password123! |
| Supervisor | anjali.reddy@saarthii.in | Password123! |

---

## Architecture

### Frontend (React + Vite + Tailwind)
- **Design System**: Navy/Teal healthcare palette
- **Components**: Button, Card, Badge, Input, Table, Modal, Alert, Tabs
- **Pages**: Login, PHC Dashboard, Hospital Dashboard, Supervisor Dashboard, Create Referral

### Backend (FastAPI + PostgreSQL)
- **API Routes**: `/api/health`, `/api/auth/login`, `/api/referrals`, `/api/hospital`, `/api/follow-ups`, `/api/supervisor`
- **Referral Closure Intelligence**: Deterministic rule engine validates workflow obligations
- **JWT Authentication**: Secure token-based auth with role-based access control

---

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/health | Health check |
| POST | /api/auth/login | User authentication |
| GET | /api/referrals | List referrals |
| POST | /api/referrals | Create new referral |
| GET | /api/referrals/{id}/closure-check | Run closure intelligence |
| POST | /api/referrals/{id}/close | Close referral |
| POST | /api/hospital/intake/{id}/arrive | Record patient arrival |
| POST | /api/outcomes/{id} | Record treatment outcome |
| POST | /api/back-referrals/{id} | Send back-referral |
| GET | /api/supervisor/analytics | Cross-facility metrics |
| GET | /api/supervisor/overdue | Overdue referral list |

---

## Referral Closure Intelligence (RCI)

RCI enforces a deterministic workflow contract:

```
CLOSURE BLOCKED if ANY:
1. Patient outcome not recorded
2. Back-referral required AND not submitted
3. Follow-up required AND not completed
```

Returns: Missing action, Responsible facility, Responsible role, Due date

---

## Project Structure

```
SAARTHII/
├── frontend/
│   ├── src/
│   │   ├── components/ui/      # Reusable UI components
│   │   ├── components/layout/  # Layout components
│   │   ├── pages/
│   │   │   ├── PHC/              # PHC Dashboard
│   │   │   ├── Hospital/         # Hospital Dashboard
│   │   │   ├── Supervisor/       # Supervisor Dashboard
│   │   │   ├── Login.jsx
│   │   │   └── Placeholder.jsx
│   │   └── styles/               # Tailwind config, CSS
│   └── package.json
└── backend/
    ├── app/
    │   ├── api/                   # REST API routers
    │   ├── core/                  # Configuration and security
    │   ├── database/              # DB connection, schema, seed data
    │   └── main.py                # Application entrypoint
    └── requirements.txt
```

---

## Development Roadmap

| Part | Feature |
|------|---------|
| 1-4 | ✅ Foundation, Design System, Schema, Auth |
| 5 | PHC Referral Creation Form (multi-step) |
| 6 | Hospital Intake Workflow |
| 7 | Patient Arrival & Outcome Tracking |
| 8 | Back-Referral Management |
| 9 | Follow-up Task System |
| 10 | QR Code Generation & Scanning |
| 11 | Supervisor Analytics |
| 12 | Testing & Validation |
| 13 | Final Polish & Demo |

---

## License

Internal Hackathon Project – SAARTHII Healthcare Team