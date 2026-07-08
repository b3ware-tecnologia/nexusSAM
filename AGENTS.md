# nexusSAM — Session State

## Database
- **Backend:** PostgreSQL (Railway service `Postgres`, internal URL via DATABASE_URL, public fallback via DATABASE_PUBLIC_URL)
- **Schema:** Single JSONB table `app_state` in `src/db.ts`
- **Persistence flow:** `initDatabase()` on startup → `loadState()` → `cachedPgState` → route handlers read cache → `saveDatabase()` writes to PostgreSQL via `saveState()`
- **State:** CLEAN — all demo data wiped. Only 4 admin users remain (usr-1..usr-4) so login works. Licenses, computers, SaaS, cloud, containers, reports, etc. all empty.

## Architecture
- `src/db.ts` — `ensureSchema()`, `loadState()`, `saveState()` (async, PostgreSQL JSONB)
- `src/dbMock.ts` — `getDatabase()` returns `cachedPgState` (or JSON file fallback), `saveDatabase()` writes to PostgreSQL + updates cache. No more JSON file writes.
- `server.ts` — async IIFE at bottom calls `initDatabase()` → `setPgCache()` before `startServer()`
- `src/api.ts` — `patchGlobalFetch()` replaces `window.fetch` with `apiFetch`. Bug fixed: uses `(originalFetch || fetch)` to avoid infinite recursion.
- `railway.json` — deleted from git (commit `0a8e1db`)
- `data/` — in `.gitignore`, no longer actively written to

## Deployments
| Deploy | Status | What |
|--------|--------|------|
| `99fa1f03` | SUCCESS | Original Railway deploy with volume |
| `88fbe73` | SUCCESS | PostgreSQL persistence code |
| `9194acf` | SUCCESS | DATABASE_URL env var |
| `f1db9594` | SUCCESS | First PostgreSQL seed |
| `125da7f` | SUCCESS | PostgreSQL persistence verified |
| `ba34c366` | SUCCESS | DATABASE_PUBLIC_URL fallback |
| `a61dde84` | SUCCESS | Removed JSON file writes |
| `a383595f` | SUCCESS | Fixed fetch interceptor recursion |
| `4928400c` | SUCCESS | Database reset (all data cleared) |

## Credentials
- **Login:** ericob3ware@gmail.com / b3ware2026
- **JWT secret:** nexus-sam-jwt-secret-2024
- **Postgres:** postgresql://postgres:EJOZxJTLbepHxCtrCGrJaNqVomRNiuAz@postgres.railway.internal:5432/railway
- **Postgres public:** postgresql://postgres:EJOZxJTLbepHxCtrCGrJaNqVomRNiuAz@hayabusa.proxy.rlwy.net:57935/railway

## Next Steps (not done)
1. ~~Clean up the old `reset-db.ts` script (already deleted)~~
2. ~~Removed `fs` / `path` imports from `dbMock.ts` — JSON file fallback removed, now uses only PostgreSQL + defaults~~
3. ~~Added CORS middleware to `server.ts` (allows all origins; restrict in production)~~
4. ~~Railway service linking — already configured. `DATABASE_URL` and `DATABASE_PUBLIC_URL` auto-injected by Railway (service + Postgres in same project `miraculous-purpose`).~~
5. ~~PT-BR UI translation completed across 14 component files (LoginView, DashboardView, LicensesView, InvoiceIngestionView, DiagnosticsView, ReportsView, CustomFieldsView, InventoryView, SaaSView, CloudView, ContainerView, AdministrationView). Build compiles cleanly (only pre-existing TS2339 in server.ts).~~
