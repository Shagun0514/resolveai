# ResolveAI — Unified Customer Complaint Intelligence Platform

A production-ready full-stack banking complaint management system with AI-powered classification, sentiment analysis, entity extraction, and auto-generated responses.

---

## Architecture Overview

```
resolveai/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js       # JWT login/me
│   │   │   ├── complaintsController.js # Full CRUD + AI trigger
│   │   │   └── analyticsController.js  # Aggregated metrics
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verify + RBAC
│   │   │   └── errorHandler.js     # Centralized error handling
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── complaints.js
│   │   │   ├── users.js
│   │   │   └── analytics.js
│   │   ├── services/
│   │   │   └── aiService.js        # OpenAI GPT-4o-mini integration
│   │   ├── utils/
│   │   │   ├── migrate.js          # DB schema creation
│   │   │   └── seed.js             # Sample data seeding
│   │   └── index.js                # Express app entrypoint
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Layout.tsx      # Sidebar + topbar shell
│   │   │       └── Badges.tsx      # Priority/Status/Sentiment/SLA badges
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Zustand auth store
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx   # Overview + charts + critical list
│   │   │   ├── ComplaintsPage.tsx  # Filterable table with pagination
│   │   │   ├── ComplaintDetailPage.tsx  # Thread + AI panel + SLA
│   │   │   ├── NewComplaintPage.tsx     # Intake form with AI on submit
│   │   │   └── AnalyticsPage.tsx   # Recharts dashboards
│   │   ├── services/
│   │   │   └── api.ts              # Axios instance with JWT interceptors
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   └── utils/
│   │       └── helpers.ts          # Formatters, config maps, category icons
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Database Schema

```sql
users            -- id, name, email, password_hash, role (admin/agent/supervisor)
complaints       -- Full complaint record with AI fields, SLA timestamps, assignment
messages         -- Conversation thread per complaint (customer/agent/system/ai)
sla_policies     -- Per-priority response & resolution targets
audit_logs       -- Action tracking for compliance
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS, Recharts    |
| State      | TanStack Query v5, Zustand                      |
| Backend    | Node.js 20, Express 4                           |
| Database   | PostgreSQL 16                                   |
| AI         | OpenAI GPT-4o-mini (with intelligent fallback)  |
| Auth       | JWT (HS256), bcrypt                             |
| DevOps     | Docker, Docker Compose, nginx                   |

---

## Quick Start — Local Development

### Prerequisites

- Node.js >= 18
- PostgreSQL 14+ running locally (or use Docker)
- npm or yarn

### Step 1 — Clone & install dependencies

```bash
git clone <repo-url> resolveai
cd resolveai

# Install all dependencies at once
npm install
npm run install:all
```

### Step 2 — Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resolveai
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_super_secret_key_min_32_chars

# Optional — AI features work in mock mode without this
OPENAI_API_KEY=sk-your-key-here

FRONTEND_URL=http://localhost:5173
```

### Step 3 — Set up the database

```bash
# Make sure PostgreSQL is running, then:
cd backend

# Create tables
npm run db:migrate

# Insert sample data (8 complaints, 4 users)
npm run db:seed
```

### Step 4 — Start both servers

```bash
# From root (runs backend + frontend concurrently)
npm run dev

# Or separately:
cd backend && npm run dev    # → http://localhost:4000
cd frontend && npm run dev   # → http://localhost:5173
```

Open **http://localhost:5173**

---

## Quick Start — Docker

```bash
# Copy and configure env (at minimum set OPENAI_API_KEY if you have one)
cp backend/.env.example backend/.env

# Start all services (postgres + backend + frontend)
docker-compose up -d

# Wait ~10 seconds for postgres to initialize, then run migrations:
docker exec resolveai-backend node src/utils/migrate.js
docker exec resolveai-backend node src/utils/seed.js

# View logs
docker-compose logs -f backend
```

Open **http://localhost:5173**

To stop:
```bash
docker-compose down
```

---

## Demo Accounts

| Role       | Email                          | Password    |
|------------|-------------------------------|-------------|
| Admin      | admin@resolveai.com           | password123 |
| Agent      | agent1@resolveai.com          | password123 |
| Agent      | agent2@resolveai.com          | password123 |
| Supervisor | supervisor@resolveai.com      | password123 |

---

## Sample Data

The seed script creates 8 realistic banking complaints covering:

| Ticket       | Type                  | Priority | Status      |
|--------------|-----------------------|----------|-------------|
| TKT-2024-001 | Unauthorized $5,200 transfer | Critical | Open    |
| TKT-2024-002 | Mortgage refinancing delay  | High     | In Progress |
| TKT-2024-003 | Credit score error (87 pts) | High     | Open        |
| TKT-2024-004 | Mobile app crash after update | Medium | In Progress |
| TKT-2024-005 | Beneficiary update request  | Low      | Resolved    |
| TKT-2024-006 | Business account frozen (payroll) | Critical | Escalated |
| TKT-2024-007 | ATM swallowed card           | Medium   | Pending     |
| TKT-2024-008 | Positive feedback / compliment | Low    | Open        |

---

## API Reference

### Authentication

```
POST /api/auth/login       { email, password } → { token, user }
GET  /api/auth/me          → { user }
```

### Complaints

```
GET    /api/complaints                     List with filters + pagination
POST   /api/complaints                     Create + trigger AI analysis
GET    /api/complaints/:id                 Detail + full message thread
PATCH  /api/complaints/:id                 Update status/priority/assignment
POST   /api/complaints/:id/messages        Add reply or internal note
POST   /api/complaints/:id/reanalyze       Re-run AI on existing complaint
```

**GET /api/complaints query params:**

| Param       | Values                                      |
|-------------|---------------------------------------------|
| status      | open, in_progress, pending, escalated, resolved, closed |
| priority    | critical, high, medium, low                 |
| category    | Any AI category string                      |
| channel     | email, chat, api, phone, web                |
| sentiment   | positive, neutral, negative, very_negative  |
| assigned_to | user UUID, "me", "unassigned"               |
| search      | Full-text search across subject/name/email/ticket |
| page        | integer (default: 1)                        |
| limit       | integer (default: 20)                       |

### Analytics

```
GET  /api/analytics?days=30    Full breakdown by status/category/sentiment/channel/priority + SLA + trend
```

### Users

```
GET  /api/users                Admin/supervisor only — list all users
```

---

## AI Features

When a complaint is created or re-analyzed, the AI service runs:

1. **Classification** — Routes to one of 12 banking categories
2. **Sentiment Detection** — Scores from very_negative to positive (0.0–1.0)
3. **Entity Extraction** — Transaction IDs, amounts, dates, account numbers
4. **Summary Generation** — 2–3 sentence plain-language summary
5. **Response Drafting** — Professional 150–200 word agent response
6. **Priority Suggestion** — Recommended escalation level

**No OpenAI key?** The system includes a full rule-based fallback that works without any API key — keyword matching, regex entity extraction, and template responses. Set `OPENAI_API_KEY` in `.env` to enable GPT-4o-mini.

---

## SLA Policies

| Priority | First Response | Resolution | Escalation |
|----------|---------------|------------|------------|
| Critical | 1 hour        | 4 hours    | 2 hours    |
| High     | 2 hours       | 8 hours    | 4 hours    |
| Medium   | 4 hours       | 24 hours   | 12 hours   |
| Low      | 8 hours       | 72 hours   | 36 hours   |

SLA countdown shows in real-time on the complaints list and detail views. Overdue complaints get pulsing red badges.

---

## Role Permissions

| Feature                    | Agent | Supervisor | Admin |
|----------------------------|-------|------------|-------|
| View complaints            | ✅    | ✅         | ✅    |
| Create complaints          | ✅    | ✅         | ✅    |
| Update status/priority     | ✅    | ✅         | ✅    |
| Add replies / notes        | ✅    | ✅         | ✅    |
| Re-run AI analysis         | ✅    | ✅         | ✅    |
| View analytics             | ✅    | ✅         | ✅    |
| List all users             | ❌    | ✅         | ✅    |

---

## Environment Variables Reference

### Backend

| Variable         | Required | Default     | Description                          |
|------------------|----------|-------------|--------------------------------------|
| PORT             | No       | 4000        | API server port                      |
| NODE_ENV         | No       | development | Environment mode                     |
| DB_HOST          | Yes      | localhost   | PostgreSQL host                      |
| DB_PORT          | No       | 5432        | PostgreSQL port                      |
| DB_NAME          | Yes      | resolveai   | Database name                        |
| DB_USER          | Yes      | postgres    | Database user                        |
| DB_PASSWORD      | Yes      | —           | Database password                    |
| JWT_SECRET       | Yes      | —           | Min 32 char secret for signing JWTs  |
| JWT_EXPIRES_IN   | No       | 7d          | Token expiry                         |
| OPENAI_API_KEY   | No       | —           | Enables GPT-4o-mini AI features      |
| FRONTEND_URL     | No       | localhost:5173 | CORS allowed origin               |

---

## Extending the Application

### Add a new complaint channel

1. Add the channel to the `CHECK` constraint in `migrate.js`
2. Add it to `channelConfig` in `frontend/src/utils/helpers.ts`
3. Create a channel-specific intake form or webhook endpoint

### Add webhook ingestion (email/chat)

```js
// backend/src/routes/webhooks.js
router.post('/email', async (req, res) => {
  const { from, subject, body } = req.body; // from your email provider
  await createComplaintFromWebhook({ channel: 'email', subject, description: body, customer_email: from });
  res.sendStatus(200);
});
```

### Add real-time updates

Install `socket.io` on the backend and emit events on complaint mutation:

```js
io.emit('complaint:updated', { id, status });
```

Then subscribe in React with `useEffect` + socket.io-client.

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Set real `OPENAI_API_KEY`
- [ ] Use environment-specific DB credentials
- [ ] Enable HTTPS (nginx SSL termination or reverse proxy)
- [ ] Set `NODE_ENV=production`
- [ ] Configure log aggregation (e.g. Datadog, Papertrail)
- [ ] Set up DB backups
- [ ] Add rate limiting per user/IP for AI endpoints
- [ ] Configure email notifications for SLA breaches
