# AGENTS.md

This project was built with opencode (Agentic AI).

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
- Client-side marker fade-in animation via Web Animations API (CSS didn't reach MapLibre portaled DOM)
- keepPreviousData on map query to prevent marker unmount during viewport changes
- Custom focus mode: 3D pitch + continuous RAF rotation, locked interactions, saved map view restore
- Draft entity pattern: live marker updates (type/status/position) during edit before save
- 100 seed entities in circular distribution around Bandung (PT Len Industri center)
- Dark mode toggle with CARTO light/dark map theme switching

## Architecture

### Backend (Go + Gin + GORM + PostGIS)
- `cmd/server/main.go` — Gin server entrypoint with CORS, routes, DB connect, migrations, seed
- `internal/config` — env var loading
- `internal/db` — GORM connection, PostGIS Point type, embedded SQL migration runner
- `internal/models` — Entity struct + validator tags + EntityInput + MapCluster
- `internal/handlers` — Gin handlers with flat envelope response helpers
- `internal/services` — business logic (CRUD, map bbox query, pagination, search)
- `internal/validation` — custom lat/lng validators, Gin binding registration
- `migrations/` — versioned SQL files (0001_init)
- `seed/` — 100 demo entities in circular distribution around Bandung

### Frontend (React 19 + Vite + Tailwind + shadcn/ui + mapcn)
- `src/types/` — domain type aliases (EntityType, EntityStatus)
- `src/interface/` — TS interfaces (Entity, EntityInput, ApiResponse, PaginationMeta, EntityCluster)
- `src/consts/` — query keys, label formatting
- `src/libs/` — axios client (envelope unwrap + ApiError), query client
- `src/store/` — Zustand UI store (pickMode, selectedEntityId, activeOverlay, draftEntity, darkMode, bbox, zoom, pendingFlyTo, savedMapView, committedPos)
- `src/features/entities/` — API functions, TanStack Query hooks (map, search infinite, detail, CRUD mutations), zod schema, EntityForm
- `src/components/map/` — EntityMap (full-screen map + bbox tracking + focus handler + rotation), MarkerLayer (fade-in markers + status dots + tooltips), PickMode
- `src/components/` — BottomNavigation, InAreaCard, EntityCard, EntityCardSkeleton, EntityDetailCard, EntityEditCard, EntityAddCard, EntityFilterCard, SearchResults, DeleteConfirm

## Commands

```bash
# Start everything
docker compose up -d --build

# Rebuild just the backend
docker compose up -d --build --force-recreate --no-deps backend

# Rebuild just the frontend
docker compose up -d --build --force-recreate --no-deps frontend

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run Go tests inside container
docker compose exec backend go test ./...

# Type-check frontend (do NOT run npx lint or jest — they OOM the machine)
cd frontend && npx tsc --noEmit -p tsconfig.app.json

# Go commands without local Go installation
docker run --rm -v $(pwd)/backend:/app -w /app golang:1.23-alpine sh -c "go build ./..."

# Reset database (destroys all data, re-seeds on next startup)
docker compose down -v && docker compose up -d --build
```
