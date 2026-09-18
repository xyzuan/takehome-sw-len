# AGENTS.md

This project was built with opencode (Agentic AI).

## AI Workflow

The development used the superpowers skill set:
- `brainstorming` — guided design dialogue to choose stack and architecture
- `writing-plans` — detailed task-by-task implementation plan with full code
- Implementation executed task by task with verification at each step

## Key Decisions Made with AI

- Generic Entity model with type enum (flexible for vehicles, IoT, facilities)
- PostGIS + GORM with gogis.Point (github.com/restayway/gogis) for geometry(Point, 4326)
- Explicit SQL migrations (no GORM AutoMigrate)
- mapcn/MapLibre for zero-config free map tiles
- Flat API envelope: { status_code, message, data, meta?, errors? }
- Laravel-style pagination: { current_page, last_page, per_page, total }

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
cd frontend && npx tsc --noEmit
```
