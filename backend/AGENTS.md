# Backend AGENTS.md

Go + Gin + GORM + PostGIS service. See the root `AGENTS.md` for project-wide context, AI workflow, and key decisions.

## Architecture

- `cmd/server/main.go` — Gin server entrypoint with CORS, routes, DB connect, migrations, seed
- `internal/config` — env var loading
- `internal/db` — GORM connection, PostGIS Point type, embedded SQL migration runner
- `internal/models` — Entity struct + validator tags + EntityInput
- `internal/handlers` — Gin handlers with flat envelope response helpers
- `internal/services` — business logic (CRUD, map bbox query, pagination, search)
- `internal/validation` — custom lat/lng validators, Gin binding registration
- `internal/db/migrations/` — versioned SQL files (0001_init.up.sql / 0001_init.down.sql)
- `seed/` — 100 demo entities in circular distribution around Bandung (PT Len Industri center)

## Code Style

- Gin handlers in `internal/handlers/` stay thin — business logic lives in `internal/services/`
- Request binding via `models.EntityInput` with `go-playground/validator` struct tags; custom `lat`/`lng` validators registered in `internal/validation/`
- All HTTP responses use the flat envelope helpers in `internal/handlers/response.go`: `{ status_code, message, data, meta?, errors? }`
- Schema managed by explicit SQL migrations in `internal/db/migrations/` — **never** use GORM AutoMigrate
- Location stored as `gogis.Point` (`geometry(Point, 4326)`); serialized as `lat`/`lng` in JSON via `Entity.ToJSON()`

## Do

- Follow the handler pattern in `internal/handlers/entity.go` (thin handler → service → envelope response)
- Follow the model pattern in `internal/models/entity.go` (validator tags + `ToJSON()`)
- Keep backend validator tags in sync with the frontend validation schema (`frontend/src/schemas/entity.ts`) when rules change

## Don't

- Don't use GORM AutoMigrate — add a new versioned SQL file in `internal/db/migrations/` instead
- Don't add new Go dependencies without checking they're already in `go.mod`
- Don't commit secrets or real DB credentials — the `geo`/`geo` creds in `docker-compose.yml` are demo-only
- Don't modify `internal/db/migrations/0001_init.*.sql` — add a new versioned migration instead

## Testing

- No test files currently exist in the backend
- When added: `docker compose exec backend go test ./...` — place `*_test.go` files alongside the package they test

## Commands

```bash
# Rebuild just the backend
docker compose up -d --build --force-recreate --no-deps backend

# View logs
docker compose logs -f backend

# --- File-scoped (preferred for single-package changes) ---

# Build/test a single Go package (replace <pkg>)
docker compose exec backend go build ./internal/<pkg>/...
docker compose exec backend go test ./internal/<pkg>/...

# --- Project-wide (when changes span multiple packages) ---

# Run all Go tests inside container
docker compose exec backend go test ./...

# Go commands without local Go installation
docker run --rm -v $(pwd)/backend:/app -w /app golang:1.23-alpine sh -c "go build ./..."
```
