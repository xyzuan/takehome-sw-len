# AGENTS.md

This project was built with opencode (Agentic AI).

> **Nested guidance:** stack-specific instructions live in `backend/AGENTS.md` and `frontend/AGENTS.md`. Agents read the nearest file, so the nested files override/supplement this root guidance when working inside those directories.

## AI Workflow

The development used the superpowers skill set:
- `brainstorming` — guided design dialogue to choose stack and architecture
- `writing-plans` — detailed task-by-task implementation plan with full code
- `subagent-driven-development` — fresh subagent per task with review between tasks
- Implementation executed task by task with verification at each step

## Key Decisions Made with AI

- Generic Entity model with type enum (flexible for vehicles, IoT, facilities)
- PostGIS + GORM with gogis.Point (github.com/restayway/gogis) for geometry(Point, 4326)
- Explicit SQL migrations (no GORM AutoMigrate)
- mapcn/MapLibre for zero-config free map tiles
- Flat API envelope: { status_code, message, data, meta?, errors? }
- Laravel-style pagination: { current_page, last_page, per_page, total }
- Backend-side search with ILIKE for name filtering
- Bbox viewport filtering via PostGIS `ST_Within(location, ST_MakeEnvelope(..., 4326))` — DB returns only entities in the viewport so the client renders a lightweight marker set
- Client-side marker fade-in animation via Web Animations API (CSS didn't reach MapLibre portaled DOM)
- keepPreviousData on map query to prevent marker unmount during viewport changes
- Custom focus mode: 3D pitch + continuous RAF rotation, locked interactions, saved map view restore
- Draft entity pattern: live marker updates (type/status/position) during edit before save
- 100 seed entities in circular distribution around Bandung (PT Len Industri center)
- Dark mode toggle with CARTO light/dark map theme switching

## Architecture

Two services orchestrated by `docker-compose.yml` (db: postgis, backend: Go/Gin, frontend: React/Vite). See the nested files for per-stack structure, code style, do's/don'ts, and commands:

- [`backend/AGENTS.md`](backend/AGENTS.md) — Go + Gin + GORM + PostGIS service
- [`frontend/AGENTS.md`](frontend/AGENTS.md) — React 19 + Vite + Tailwind + shadcn/ui + mapcn

## Security

### Allowed without confirmation
- Read any project file
- Run `docker compose` build / logs / ps
- Run `go test` / `go build` inside the backend container
- Run `npx tsc --noEmit` for type checking

### Requires explicit confirmation
- `docker compose down -v` — **destroys all database data** (re-seeds on next start)
- Running or adding new SQL migrations (schema changes)
- Adding new production dependencies (`go get`, `npm install <pkg>`)
- Pushing to any branch or creating PRs
- Modifying `docker-compose.yml` credentials or ports

### Protected resources
- Never commit `.env` files, API keys, or real credentials
- Never modify `internal/db/migrations/0001_init.*.sql` — add a new versioned migration instead

## Commands

```bash
# Start everything
docker compose up -d --build

# Reset database (destroys all data, re-seeds on next startup)
docker compose down -v && docker compose up -d --build
```

For per-stack commands (rebuild single service, logs, type-check, Go tests), see `backend/AGENTS.md` and `frontend/AGENTS.md`.
