# Technology Stack

**Analysis Date:** 2026-03-02

## Languages

**Primary:**
- JavaScript (ES2022+) - React frontend components and Express backend
- JSX - React component syntax, used throughout UI

**Secondary:**
- Python - Data pipeline scripts (transcript parsing, web scraping)
- SQL - PostgreSQL database migrations and queries

## Runtime

**Environment:**
- Node.js v22.21.0 (development)
- npm v11.6.2 (package manager)
- Lockfile: `package-lock.json` present (v3 format)

**Browser:**
- ES2022+ target (compiled via Vite)

## Frameworks

**Core:**
- React 18.2.0 - UI framework and component composition
- Express 4.18.2 - Backend HTTP server (port 3001)

**Build & Dev:**
- Vite 5.0.0 - Frontend build tool and dev server (port 5173)
- @vitejs/plugin-react 4.2.1 - React integration for Vite

**Data & Backend:**
- @supabase/supabase-js 2.91.0 - PostgreSQL client with real-time subscriptions
- Multer 2.0.2 - File upload handler (PDF transcript uploads)
- Puppeteer 24.35.0 - Browser automation for web scraping

**Utilities:**
- dotenv 16.3.1 - Environment variable configuration
- cors 2.8.5 - Cross-origin request handling for Express

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.91.0 - Provides database access, authentication, and real-time subscriptions for courses, programs, requirements data
- React 18.2.0 - Core UI framework; entire frontend depends on React hooks and component composition
- Express 4.18.2 - Backend proxy server; essential for UCSB API key protection and user management

**Infrastructure:**
- Multer 2.0.2 - Handles transcript PDF uploads; integrated with Python transcript parser
- Puppeteer 24.35.0 - Powers web scraping scripts for UCSB catalog data extraction
- dotenv 16.3.1 - Loads environment variables from `.env` (API keys, database credentials)

## Configuration

**Environment:**
- Configuration via `.env` file (development only)
- Frontend env vars prefixed with `VITE_` (accessible in browser)
- Backend env vars accessed via `process.env` (server-side only)

**Required env vars:**
- `UCSB_API_KEY` - Server-side UCSB Academic Curriculums API key
- `UCSB_API_BASE_URL` - UCSB API endpoint (default: https://api.ucsb.edu/academics/curriculums/v1)
- `VITE_SUPABASE_URL` - Supabase project URL (exposed to frontend)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (exposed to frontend)
- `SUPABASE_URL` - Supabase URL for import scripts
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server-side, for data imports only)

**Build:**
- `vite.config.js` - Vite configuration with React plugin and API proxy setup
  - Port: 5173 (dev), `/api` proxied to `localhost:3001`
- `tsconfig.json` - Not present; using JavaScript with JSDoc types

## Platform Requirements

**Development:**
- Node.js v22+
- npm v11+
- Python 3+ (for transcript parsing with `pdfplumber`)
- Express backend running on port 3001
- Vite dev server on port 5173

**Production:**
- Node.js v22+ (for Express server)
- Hosting: Vite builds to `dist/` directory (static site)
- Supabase PostgreSQL database
- PDF upload directory: `uploads/` (created dynamically)
- User data persisted in `data/users.json`

---

*Stack analysis: 2026-03-02*
