# Project Structure — SaarthiCare

```
B:\SaarthiCare
├── .env.example
├── .gitignore
├── DEPLOYMENT.md
├── PROJECT_STRUCTURE.md
├── README.md
├── render.yaml
├── backend/
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── appointments.py
│   │   │   ├── auth.py
│   │   │   ├── followup.py
│   │   │   ├── health.py
│   │   │   ├── hospital.py
│   │   │   ├── middleware.py
│   │   │   ├── referrals.py
│   │   │   ├── storage.py
│   │   │   └── supervisor.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── supabase.py
│   │   │   └── supabase_auth.py
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   ├── schema.sql
│   │   │   └── seed.sql
│   │   ├── schemas/
│   │   │   └── health.py
│   │   └── services/
│   └── tests/
│       ├── test_appointments_api.py
│       ├── test_config.py
│       ├── test_supabase_auth.py
│       ├── test_supabase_config.py
│       ├── test_supabase_health_endpoint.py
│       └── test_supabase_migrations.py
├── docs/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── public/
│   │   └── _redirects
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
└── supabase/
    └── migrations/
        ├── 0001_initial_schema.sql
        ├── 0002_rls_policies.sql
        ├── 0003_storage_buckets.sql
        ├── 0004_seed_data.sql
        ├── 0005_audit_triggers.sql
        ├── 0006_realtime_setup.sql
        └── 0007_appointments.sql
```
