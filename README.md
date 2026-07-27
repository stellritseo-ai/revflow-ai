# 🚀 RevFlow AI — Enterprise Revenue Recovery Platform

> **AI-powered missed call recovery for dental clinics and medical spas.**
> Automatically qualifies patients, books appointments, and tracks revenue attribution.

---

## 📋 Table of Contents

- [Project Vision](#project-vision)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Quick Start — How to Run Everything](#quick-start--how-to-run-everything)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Authentication & Roles](#authentication--roles)
- [What Has Been Built](#what-has-been-built)
- [Roadmap — What's Coming Next](#roadmap--whats-coming-next)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Vision

RevFlow AI helps dental clinics and medical spas **recover revenue from missed calls**. When a patient calls and no one answers, an AI agent:
1. Automatically calls back
2. Qualifies the patient (insurance, treatment type, urgency)
3. Books them directly into the clinic's PMS (Dentrix, Open Dental, Eaglesoft)
4. Tracks the revenue attribution for each recovered appointment

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | ≥0.115 | REST API framework |
| **Python** | 3.12 | Language |
| **PostgreSQL** | 15 | Primary relational database |
| **Redis** | Latest | Caching, session management |
| **SQLAlchemy** | ≥2.0 (async) | ORM with async session support |
| **Alembic** | ≥1.13 | Database migrations |
| **python-jose** | ≥3.3 | JWT token generation & verification |
| **structlog** | ≥24 | Structured JSON logging |
| **asyncpg** | ≥0.29 | Async PostgreSQL driver |
| **uvicorn** | ≥0.30 | ASGI server |
| **Pydantic v2** | ≥2.8 | Data validation & serialization |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 | React SSR/SSG framework |
| **React** | 19 | UI library |
| **TypeScript** | ≥5 | Type safety |
| **Tailwind CSS** | ≥4 | Utility-first CSS framework |
| **Zustand** | Latest | Lightweight global state management |
| **Lucide React** | Latest | Icon library |

---

## 🏗 Architecture Overview

```
rev-flow/
├── backend/          ← FastAPI Python REST API
│   ├── app/
│   │   ├── api/      ← Route handlers (v1/auth, v1/health)
│   │   ├── core/     ← Auth, DB, Redis, Config, Logging
│   │   └── models/   ← SQLAlchemy ORM models
│   ├── alembic/      ← Database migration scripts
│   └── .env          ← Local environment config
│
├── frontend/         ← Next.js 15 React app
│   └── src/
│       ├── app/      ← Next.js App Router pages
│       │   ├── auth/ ← Login, Signup, Reset pages
│       │   └── health/
│       └── lib/      ← API client, Zustand auth store
│
├── venv/             ← Python virtual environment (shared)
└── docker-compose.yml
```

---

## 📁 Project Structure

### Backend `backend/`
```
backend/
├── app/
│   ├── api/
│   │   ├── api.py                    ← Root API router
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── health.py         ← GET /api/v1/health
│   │           └── auth.py           ← POST /sync, /login-dev, /me
│   ├── core/
│   │   ├── config.py                 ← Pydantic settings from .env
│   │   ├── database.py               ← Async SQLAlchemy session factory
│   │   ├── redis.py                  ← Redis connection pool
│   │   ├── logging.py                ← structlog setup
│   │   ├── exceptions.py             ← Global error handlers
│   │   └── auth.py                   ← JWT decode, RBAC helpers
│   ├── models/
│   │   ├── base.py                   ← SQLAlchemy DeclarativeBase with timestamps
│   │   └── models.py                 ← Client, User, AuditLog models
│   └── main.py                       ← FastAPI app, CORS, middleware
├── alembic/
│   ├── env.py                        ← Async migration runner
│   └── versions/
│       └── 88869a953c67_create_initial_auth_tables.py
├── requirements.txt
├── Dockerfile
└── .env
```

### Frontend `frontend/`
```
frontend/
└── src/
    ├── app/
    │   ├── layout.tsx                ← Root layout with fonts
    │   ├── page.tsx                  ← Dashboard (protected)
    │   ├── health/page.tsx           ← System health page
    │   └── auth/
    │       ├── layout.tsx            ← Split-screen auth layout
    │       ├── login/page.tsx        ← Login + Dev role simulator
    │       ├── signup/page.tsx       ← Clinic onboarding
    │       └── reset/page.tsx        ← Password reset
    └── lib/
        ├── api-client.ts             ← fetch wrapper with auto token injection
        └── auth-store.ts             ← Zustand store (session, login, logout)
```

---

## ⚡ Quick Start — How to Run Everything

> **Prerequisites**: macOS, PostgreSQL 15, Redis, Node.js 20+, Python 3.12

### Step 1 — Clone and enter project
```bash
cd /Users/jitensony/reactwebsite/rev-flow
```

### Step 2 — Start PostgreSQL (if not running)
```bash
brew services start postgresql@15
# Verify it's running:
psql revflow -c "SELECT 1"
```

### Step 3 — Start Redis (if not running)
```bash
brew services start redis
# Verify it's running:
redis-cli ping  # Should return: PONG
```

### Step 4 — Start Backend (FastAPI + uvicorn)
```bash
cd backend
source ../venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
✅ You should see: `Uvicorn running on http://127.0.0.1:8000`

### Step 5 — Start Frontend (Next.js)
Open a **new terminal tab**:
```bash
cd frontend
npm run dev
```
✅ You should see: `- Local: http://localhost:3000`

### Step 6 — Open in Browser
| URL | Description |
|---|---|
| http://localhost:3000 | Frontend (redirects to login) |
| http://localhost:3000/auth/login | Login page with dev role selector |
| http://localhost:3000/auth/signup | Clinic onboarding |
| http://localhost:8000/docs | Swagger API docs |
| http://localhost:8000/api/v1/health | Backend health check JSON |

---

## 🔧 Environment Configuration

File: `backend/.env`

```env
# Project metadata
PROJECT_NAME="RevFlow AI"
ENVIRONMENT=development
LOG_LEVEL=debug

# Database URL (local macOS Homebrew Postgres)
DATABASE_URL=postgresql+asyncpg://jitensony@localhost:5432/revflow

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS — allowed frontend origins
CORS_ORIGINS=["http://localhost:3000"]
```

> ⚠️ **Important**: The database URL uses `jitensony` (your macOS username) as the Postgres role.
> If you're on a different machine, replace `jitensony` with your macOS username: `whoami`

---

## 🗄 Database Setup

```bash
# Create the database (one-time)
createdb revflow

# Activate venv and run migrations
cd backend
source ../venv/bin/activate
alembic upgrade head
```

### Tables Created
| Table | Purpose |
|---|---|
| `clients` | Clinic tenants (name, subdomain, is_active) |
| `users` | Platform users (email, role, client_id) |
| `audit_logs` | Action logs (login, signup, role_change) |
| `alembic_version` | Migration tracking |

### Inspect database manually
```bash
psql revflow -c "SELECT * FROM clients;"
psql revflow -c "SELECT * FROM users;"
psql revflow -c "SELECT * FROM audit_logs;"
```

---

## 📡 API Reference

### Health
```
GET  /api/v1/health         → DB + Redis health check
```

### Authentication
```
POST /api/v1/auth/sync      → Register/sync a user + clinic tenant to DB
POST /api/v1/auth/login-dev → Dev mode: generate JWT for any role
GET  /api/v1/auth/me        → Get current user details (requires Bearer token)
```

### Example: Register a clinic
```bash
curl -X POST http://localhost:8000/api/v1/auth/sync \
  -H "Content-Type: application/json" \
  -d '{
    "id": "usr_test001",
    "email": "owner@mypractice.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "clinic_owner",
    "client_name": "Smith Dental",
    "subdomain": "smith-dental"
  }'
```

### Example: Dev login as Doctor
```bash
curl -X POST http://localhost:8000/api/v1/auth/login-dev \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@test.com", "role": "doctor"}'
```

---

## 🔐 Authentication & Roles

### Developer Mode (Local Testing)
On the login page at `http://localhost:3000/auth/login`:
- Scroll down to the **"Developer Access Portal"** panel
- Click any of the 6 role buttons to auto-fill credentials
- Click **Sign In** to authenticate with a mock JWT token

### Available Roles
| Role | Description | Access Level |
|---|---|---|
| `super_admin` | Full system control across all tenants | Everything |
| `clinic_owner` | Control over their specific clinic | Clinic-wide |
| `receptionist` | Patient lists, calendar, communication | Front desk |
| `doctor` | Clinical records, schedule | Clinical |
| `marketing` | Revenue metrics, lead dashboards | Analytics |
| `billing` | Subscription status, billing | Finance |

### How JWT auth works (Dev Mode)
1. Frontend calls `POST /api/v1/auth/login-dev` with email + role
2. Backend creates/updates a user record and returns a JWT token
3. Frontend stores the JWT in `localStorage` under key `revflow_token`
4. All subsequent API calls automatically include `Authorization: Bearer <token>`
5. Protected routes call `GET /api/v1/auth/me` to validate and load the session

---

## ✅ What Has Been Built

### Step 1 — Foundation (COMPLETE ✅)
- Monorepo workspace structure, FastAPI backend, Next.js 15 frontend, Docker Compose setup.

### Step 2 — Authentication & RBAC (COMPLETE ✅)
- JWT token generation, 6-role RBAC system, Auth endpoints, Zustand auth state store.

### Step 3 — Multi-Tenant Architecture (COMPLETE ✅)
- Row-level security, FastAPI middleware for `client_id`, tenant configuration profiles.

### Step 4 — Enterprise Dashboard & Navigation (COMPLETE ✅)
- Role-based unified layouts, navigation sidebars, breadcrumbs, and profile drop-downs.

### Step 5 — Clinic Management & Staff (COMPLETE ✅)
- Settings forms, Locations, Users, Operating Hours.

### Step 6 — AI Brain (Gemini + RAG) (COMPLETE ✅)
- RAG pipelines, Knowledge Base uploads, AI Profiles, Call Scripts.

### Step 7 — Communication Hub (COMPLETE ✅)
- Unified inbox, Missed call routing, Webhooks for Twilio/Vapi.

### Step 8 — Patient CRM (COMPLETE ✅)
- Patient lists, profiles, medical history sync.

### Step 9 — PMS Integration Hub (COMPLETE ✅)
- Sync interfaces for Dentrix, Open Dental, Eaglesoft.

### Step 10 — AI Scheduling Engine (COMPLETE ✅)
- Real-time availability, conflict detection, provider matching.

### Step 11 — Revenue Recovery & Recall (COMPLETE ✅)
- Automated tasks, recall campaigns, missed call pipelines.

### Step 12 — Analytics & Business Intelligence (COMPLETE ✅)
- Revenue attribution, conversion tracking, live KPI boards, conversational AI assistant.

### Step 13 — Marketing Automation (COMPLETE ✅)
- Email/SMS campaigns, review generation, landing pages, patient journeys.

### Step 14 — Super Admin SaaS Platform (COMPLETE ✅)
- Multi-tenant control center, billing, feature flags, global metrics.

### Step 15 — AI Studio & Workflow Builder (COMPLETE ✅)
- Visual workflow builder, AI agent deployments, prompt management.

### Step 16 — Mobile Workforce Platform (COMPLETE ✅)
- React Native + Expo setup for iOS/Android apps sharing business logic.

### Step 17 — Production Infrastructure & DevOps (COMPLETE ✅)
- Kubernetes manifests, CI/CD pipelines (GitHub Actions), Observability (Prometheus/Grafana), Disaster Recovery Runbooks.

### Step 18: DevOps & Infrastructure (COMPLETE ✅)
- [x] Docker
- [x] Kubernetes
- [x] CI/CD (GitHub Actions)
- [x] Nginx
- [x] Redis
- [x] PostgreSQL
- [x] Object Storage
- [x] Auto Scaling
- [x] Load Balancer

### Step 19: Monitoring & Observability (COMPLETE ✅)
- [x] OpenTelemetry
- [x] Prometheus
- [x] Grafana
- [x] Loki
- [x] Sentry
- [x] Health checks
- [x] Alerting

### Step 20: Performance Optimization
- Database indexing
- Query optimization
- Redis caching
- CDN
- Image optimization
- Lazy loading
- API response optimization

### Step 21: Automated Testing
- Unit tests
- Integration tests
- End-to-end tests
- API tests
- Load tests
- Security regression tests

### Step 22: Production Deployment
- Staging environment
- Production environment
- Blue/Green deployment
- Automated rollback
- Backup & disaster recovery
- SSL/TLS configuration
- Domain setup

---

## 🐛 Troubleshooting

### Port 8000 Already in Use
```bash
# Find and kill the blocking process
lsof -ti:8000 | xargs kill -9

# Then restart
uvicorn app.main:app --reload --port 8000
```

### Backend won't start — ModuleNotFoundError
```bash
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
```

### Alembic migration fails — Database not found
```bash
createdb revflow
alembic upgrade head
```

### Frontend npm errors
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### "Failed to fetch" on signup/login
This means the backend is **not running**. Start it:
```bash
cd backend && source ../venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

### PostgreSQL connection refused
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start it
brew services start postgresql@15
```

### Redis connection refused
```bash
# Check if Redis is running
brew services list | grep redis

# Start it
brew services start redis
```

---

## 📝 Notes for AI Assistants

> If you are reading this as an AI assistant helping with this project, here are the key facts:

1. **PostgreSQL username** = `jitensony` (macOS system username, no password)
2. **venv location** = `/Users/jitensony/reactwebsite/rev-flow/venv/`
3. **Backend must be started from** `backend/` directory with `source ../venv/bin/activate`
4. **Migrations** are in `backend/alembic/versions/`
5. **Current completed steps**: Step 1 (Foundation) through Step 19 (Monitoring & Observability)
6. **Next step to build**: Step 20 — Performance Optimization
7. **All models use UUID primary keys** (except `User.id` which is a String for Clerk compatibility)
8. **Auth flow**: `POST /auth/sync` → creates tenant + user → `POST /auth/login-dev` → returns JWT → stored in `localStorage` as `revflow_token`
9. **Frontend store**: `src/lib/auth-store.ts` — Zustand store, initialized via `initialize()` called in `useEffect`

---

*© 2026 RevFlow AI Inc. — Built for HIPAA-compliant dental and medspa clinics.*
