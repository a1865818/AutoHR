# AutoHR: AI-Powered Recruitment Platform

> An end-to-end hiring platform. Applicants apply to a job, LLM agents analyse and rank them, and the hiring team runs them through configurable interview rounds (technical, culture-fit, and others) on a kanban pipeline with automated email.

**Built by two people:** [Harry (Quang) Nguyen](https://github.com/QuangNguyen2609) and [Andrew (Tuan Minh) Nguyen](https://github.com/a1865818), May 2025 to June 2026.
This repository is a portfolio copy of the original private repo. It is shared with Harry's permission and keeps the **full, unaltered commit history** of both authors.

| | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| API | .NET 9 minimal APIs, JWT + refresh tokens, Swagger |
| Data | Supabase (PostgreSQL) |
| AI | LangGraph agents (business-context analysis, JD generation, resume ranking) on OpenAI GPT models |
| Integrations | Gmail API, Google Calendar |

## Who built what

| Area | Lead |
|---|---|
| LangGraph AI agents (`langgraph_server/`), platform architecture, auth/JWT foundation | Harry |
| Hiring-team product: jobs, candidates, ranking, interview pipeline, assessments & grading, culture-fit rounds (`react-frontEnd/`, matching `dotnet-backend/` endpoints) | Andrew |

- Andrew's detailed contributions, with commit links: [docs/CONTRIBUTIONS.md](docs/CONTRIBUTIONS.md)
- Engineering case study: [docs/CASE_STUDY.md](docs/CASE_STUDY.md)
- History check: `git shortlog -sn` (identities are consolidated through `.mailmap`)

> Note: one OAuth token file (`dotnet-backend/ai-hr/GmailAuth/`) was removed from history before publishing. No other content or authorship was changed.

---

# Running locally

## 🚀 Quick Start (One Command)

Choose your preferred method:

### Option 1: Using Make (Simplest)

```bash
make dev
```

### Option 2: Using npm

```bash
npm run dev
```

### Option 3: Using the shell script

```bash
./start-dev.sh both
```

All commands will start:

- ✅ .NET Backend (configurable ports)
- ✅ Next.js Frontend (configurable port)

## ⚙️ Environment Configuration

### Quick Setup

Create a `.env` file in the root directory to customize ports and URLs:

```bash
# Copy the example file
cp .env.example .env

# Edit the values
nano .env
```

### Environment Variables

| Variable              | Default                                        | Description       |
| --------------------- | ---------------------------------------------- | ----------------- |
| `ASPNETCORE_URLS`     | `http://localhost:5189;https://localhost:7273` | Backend URLs      |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5189`                        | Frontend API URL  |
| `FRONTEND_PORT`       | `3000`                                         | Frontend port     |
| `ALLOWED_ORIGINS`     | `http://localhost:3000,https://localhost:3000` | CORS origins      |
| `SUPABASE_URL`        | -                                              | Your Supabase URL |
| `SUPABASE_KEY`        | -                                              | Your Supabase Key |

### Example .env file:

```env
# Backend Configuration
ASPNETCORE_URLS=http://localhost:5189;https://localhost:7273
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5189
FRONTEND_PORT=3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
```

## 📋 All Available Commands

### Make Commands (Simplest)

```bash
make dev        # Start both frontend and backend
make start      # Same as 'make dev'
make backend    # Start only backend
make frontend   # Start only frontend
make status     # Check service status
make stop       # Stop all services
make install    # Install all dependencies
make clean      # Stop services and clean up logs
make help       # Show all available commands
```

### NPM Scripts

```bash
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
npm run dev:custom       # Start with custom env variables
npm run install:frontend # Install frontend dependencies
npm run build           # Build frontend for production
npm run status          # Check service status
npm run stop            # Stop all services
npm run env:setup       # Setup environment files
```

### Shell Script Commands

```bash
./start-dev.sh both      # Start both services
./start-dev.sh backend   # Start only backend
./start-dev.sh frontend  # Start only frontend
./start-dev.sh status    # Check service status
./start-dev.sh stop      # Stop all services
```

## 🌐 URLs (Configurable)

Default URLs (customizable via `.env`):

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5189
- **Swagger UI**: http://localhost:5189/swagger
- **Test Connection**: http://localhost:3000/test-connection

## 🛠️ Manual Setup (if needed)

### Prerequisites

- .NET 9.0 SDK
- Node.js 18+
- npm

### Backend Setup

```bash
cd dotnet-backend/ai-hr
# Create .env file with your Supabase credentials
dotnet run
```

### Frontend Setup

```bash
cd react-frontEnd/ai-hr
npm install
npm run dev
```

## 🧪 Testing the Connection

1. Start both services: `make dev` (or `npm run dev`)
2. Open: http://localhost:3000/test-connection (or your configured port)
3. The page will show your current API URL configuration
4. Click the test buttons to verify the connection

## 📁 Project Structure

```
AutoHR/
├── dotnet-backend/ai-hr/     # .NET Web API
│   ├── .env                  # Backend environment variables
│   └── .env.example          # Backend environment template
├── react-frontEnd/ai-hr/     # Next.js Frontend
│   ├── .env.local            # Frontend environment variables
│   └── .env.local.example    # Frontend environment template
├── .env                      # Root environment variables
├── .env.example              # Root environment template
├── package.json              # Root npm scripts
├── Makefile                  # Make commands
├── start-dev.sh              # Development script
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

## 🔧 Configuration Details

- **CORS**: ✅ Configured via `ALLOWED_ORIGINS` environment variable
- **Proxy**: ✅ Next.js proxies `/api/*` to backend using `NEXT_PUBLIC_API_URL`
- **Ports**: All ports configurable via environment variables
- **No Hardcoded Values**: Everything loads from environment variables with sensible defaults

## 📝 Logs

### Using `make dev` or `npm run dev`

Logs from both services appear in the same terminal with color coding.

### Using `./start-dev.sh both`

Logs are saved to separate files:

- `backend.log` - Backend logs
- `frontend.log` - Frontend logs

View logs: `tail -f backend.log` or `tail -f frontend.log`

## 🛑 Stopping Services

```bash
make stop
# OR
npm run stop
# OR
./start-dev.sh stop
# OR
Ctrl+C (if running in foreground)
```

## 💡 Pro Tips

- **Fastest start**: `make dev`
- **Check what's running**: `make status`
- **Clean restart**: `make clean && make dev`
- **See all commands**: `make help`
- **Custom ports**: Create `.env` file and set your preferred ports
- **Environment setup**: Run `npm run env:setup` to create template files
