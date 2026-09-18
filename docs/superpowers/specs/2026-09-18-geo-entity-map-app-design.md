# Geo Entity Map App — Design

**Date:** 2026-09-18
**Status:** Approved
**Deadline:** 2026-09-19 23:59 (take-home test)

## 1. Purpose

An application to display and manage entities that carry geographic location
information. Entities can represent real-world objects such as vehicles, IoT
devices, or facilities. The app lets a user add, view, update, and delete
entities and see them on a map.

This fulfills the take-home test PRD (`docs/prd/Take-Home Test — Software
Developer.md`):

- Frontend: React + TypeScript
- Backend: Go
- Data stored and retrieved through the backend
- Display entities on a map
- Add, delete, and update entities on the map
- View entity detail on the map
- Input validation on both backend and frontend
- Documentation: how to run, library choices, Agentic AI workflow

## 2. Architecture

A three-container Docker Compose stack:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  frontend   │────▶│  backend    │────▶│  db         │
│  (Vite/NG)  │ /api│  (Go/Gin)   │ SQL │  (PostGIS)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

- The frontend serves the UI and proxies `/api` requests to the backend.
- The backend exposes a REST API and persists entities to PostGIS.
- The database stores location as a PostGIS `geography(Point, 4326)` column.

### Containers

| Service   | Image / build               | Exposes        | Notes |
|-----------|-----------------------------|----------------|-------|
| `db`      | `postgis/postgis:17-3.4`    | `5432`         | volume for persistence, healthcheck |
| `backend` | Go multi-stage build         | `8080`         | `golang` build → `alpine` runtime; waits for `db` healthy |
| `frontend`| Node build → served by nginx | `5173` (dev) / `80` (prod) | dev uses Vite HMR with volume mount; prod uses nginx and proxies `/api` → `backend:8080` |

### Dev workflow

Go is not installed on the host, so the backend is developed inside its
container. `docker compose up` starts everything; frontend HMR works via a
volume mount for fast iteration.

## 3. Technology Stack

### Frontend

| Concern         | Choice                              | Rationale |
|-----------------|-------------------------------------|----------|
| Framework       | React 19 + TypeScript + Vite        | Modern, fast HMR, strong typing |
| Styling         | Tailwind CSS + shadcn/ui            | Utility-first speed; shadcn provides Dialog/Sheet/Popover/AlertDialog/Toast primitives for floating overlays |
| Map             | mapcn (`npx shadcn@latest add @mapcn/map`) | Built on MapLibre GL; zero-config free CARTO tiles, no API key; Tailwind/shadcn-native; markers, popups, draggable, `useMap` hook |
| Server state    | TanStack Query                      | CRUD caching, optimistic updates, refetch |
| Forms           | react-hook-form + zod              | Schema validation mirroring backend rules; inline error display |
| Icons           | lucide-react                        | Ships with mapcn; type/status marker icons |
| Ephemeral UI state | Zustand                        | Tiny; holds pick-mode flag, selected entity id, active overlay |

### Backend

| Concern         | Choice                              | Rationale |
|-----------------|-------------------------------------|----------|
| Router          | Go + Gin                            | JSON binding, middleware, struct-tag validation integration |
| ORM             | GORM (`gorm.io/gorm` + `gorm.io/driver/postgres`) | AutoMigrate, CRUD, hooks; PostGIS via custom `Point` type |
| Validation      | go-playground/validator             | Declarative struct-tag validation (serves PRD's backend-validation requirement) |
| Spatial type    | Custom `Point` type (lat, lng)      | Implements `GormValuerInterface` → `ST_SetSRID(ST_MakePoint(lng,lat),4326)` as geography; `Scanner` reads EWKB/EWKT back |
| Database        | PostgreSQL + PostGIS                | `geography(Point, 4326)` storage; `ST_Distance`/`ST_DWithin` for stretch spatial queries |

## 4. Data Model

Single `entities` table. Generic by design: a `type` enum distinguishes the
kind of real-world object, and an `attributes` JSONB column holds per-type
metadata without schema churn.

| Field         | DB type                          | Go/JSON type            | Validation |
|---------------|----------------------------------|-------------------------|------------|
| `id`          | UUID, primary key                | `string` (UUID)         | auto-generated |
| `device_id`   | varchar(100), unique             | `string`                | required, unique, 1–100 chars |
| `name`        | varchar(100)                     | `string`                | required, 1–100 chars |
| `type`        | varchar, enum                    | `string`                | required; one of `vehicle`, `iot`, `facility`, `other` |
| `status`      | varchar, enum                    | `string`                | required; one of `active`, `inactive`, `maintenance` |
| `description` | varchar(500), nullable           | `string`                | optional, max 500 chars |
| `location`    | `geography(Point, 4326)`         | exposed as `lat`, `lng`  | required; lat ∈ [-90, 90], lng ∈ [-180, 180] |
| `attributes`  | `jsonb`, nullable                 | `map[string]any`         | optional; free-form per-type metadata |
| `created_at`  | timestamptz                       | `string` (ISO 8601)     | auto-managed by GORM |
| `updated_at`  | timestamptz                       | `string` (ISO 8601)     | auto-managed by GORM |

A GiST index on the `location` column supports spatial queries (stretch).

## 5. REST API

All endpoints are prefixed with `/api`. Responses are JSON. The `location`
column is flattened to `lat` and `lng` in request and response bodies for
frontend friendliness.

| Method | Path                 | Purpose | Success |
|--------|----------------------|---------|---------|
| `GET`    | `/api/entities`      | list all; optional `?type=` and `?status=` filters | 200 + array |
| `GET`    | `/api/entities/:id`  | get one (detail view) | 200 + object |
| `POST`   | `/api/entities`      | create | 201 + object |
| `PUT`    | `/api/entities/:id`  | full replace | 200 + object |
| `DELETE` | `/api/entities/:id`  | delete | 204 |

### JSON shape (request and response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": "VAN-03-NORTH",
  "name": "Delivery Van 03",
  "type": "vehicle",
  "status": "active",
  "description": "Refrigerated van, north route",
  "lat": -6.2088,
  "lng": 106.8456,
  "attributes": { "plate": "B 1234 X" },
  "created_at": "2026-09-18T12:00:00Z",
  "updated_at": "2026-09-18T12:30:00Z"
}
```

Create/update requests omit `id`, `created_at`, and `updated_at` (server-managed).

### Error responses

Validation failures return `422 Unprocessable Entity` with field-level errors:

```json
{
  "error": "validation failed",
  "fields": {
    "name": "name is required",
    "lat": "lat must be between -90 and 90"
  }
}
```

Not found returns `404`. Malformed JSON returns `400`. A duplicate
`device_id` returns `409 Conflict` with a field-level error:

```json
{
  "error": "conflict",
  "fields": {
    "device_id": "device_id already exists"
  }
}
```

Server errors return `500` with a generic message.

### Stretch (only if time remains)

`GET /api/entities?near=lat,lng&radius=km` — returns entities within `radius`
kilometers using PostGIS `ST_DWithin` on the geography column. Showcases
PostGIS competence without being on the critical path.

## 6. Validation

The PRD requires validation on both ends. Rules are defined once in concept and
mirrored in each layer.

| Field         | Rule |
|---------------|------|
| `name`        | required, 1–100 characters |
| `device_id`   | required, unique, 1–100 characters |
| `type`        | required, one of `vehicle` / `iot` / `facility` / `other` |
| `status`      | required, one of `active` / `inactive` / `maintenance` |
| `description` | optional, max 500 characters |
| `lat`         | required, number in [-90, 90] |
| `lng`         | required, number in [-180, 180] |
| `attributes`  | optional, must be a JSON object (map) if present |

- **Backend:** Gin binds JSON into a struct; `go-playground/validator` tags
  (`required`, `oneof`, `min`, `max`, plus a custom `lat`/`lng` range
  validator) enforce the rules. Failures produce the 422 error shape above.
- **Frontend:** A `zod` schema mirrors the same rules and runs inside
  `react-hook-form` before submit. Inline errors display per field. The
  frontend also surfaces backend 422 errors if they slip past client checks.

## 7. Frontend UX

Full-screen map with floating overlays (shadcn/ui primitives rendered above
the map). This is the chosen layout approach.

### Layout

The map fills the viewport. All controls float above it as glassmorphic panels.

### Floating UI pieces

1. **Top bar** — app title, an "Add Entity" button, and a search/filter
   control: a text search by `name` plus `Select` dropdowns for `type` and
   `status`. Non-matching markers are hidden (filtered out of the
   rendered set client-side); matching results also populate a dropdown list.

2. **Add flow (map pick mode)** — Click "Add Entity" → the map enters pick
   mode (crosshair cursor, a banner reads "Click the map to place the entity").
   Clicking the map opens a `Dialog` with the add form, `lat`/`lng` pre-filled
   from the click. Submit creates the marker; a toast confirms. ESC or clicking
   "Add" again exits pick mode.

3. **Marker popup** — Clicking a marker opens a `MarkerPopup` showing name,
   type, status, and a short description, plus action buttons: **View
   detail**, **Edit**, **Delete**.

4. **Edit flow** — A `Dialog` with the same form, prefilled. Location is
   editable via a "Re-pick location" button that re-enters map pick mode and
   updates the marker's draft position. The marker is also `draggable` during
   edit, so the user can drag to relocate.

5. **Detail drawer** — "View detail" opens a `Sheet` sliding in from the
   right with the full entity record, including the `attributes` JSON
   rendered readably, plus Edit and Delete actions.

6. **Delete** — An `AlertDialog` confirms ("Delete this entity?"); on
   confirm the entity is removed, the marker disappears, and a toast confirms.

### Marker styling

- **Color and icon by `type`** via `lucide-react` icons inside `MarkerContent`:
  - `vehicle` — blue car icon
  - `iot` — purple sensor icon
  - `facility` — green building icon
  - `other` — gray dot
- **Status indicated by a ring/badge** around the marker:
  - `active` — solid ring
  - `inactive` — dimmed
  - `maintenance` — amber ring

### Interactions summary

| Action | Result |
|--------|--------|
| Click "Add Entity" | enter map pick mode |
| Click empty map (pick mode) | open add Dialog with lat/lng prefilled |
| Click marker | popup with view/edit/delete |
| Drag marker (edit mode) | relocate entity |
| Click search result | fly map to entity and open popup |
| Submit add/edit form | create/update entity, marker reflects change |
| Confirm delete | remove entity and marker |

### State management

- **TanStack Query** — all entity server state (list, create, update, delete)
  with optimistic updates for snappy UX.
- **Zustand (tiny)** — ephemeral UI state only: pick-mode on/off, currently
  selected entity id, active dialog/sheet. Form state stays local to each
  form component via `react-hook-form`.

## 8. Functional Requirement Coverage

| Requirement | How it is met |
|-------------|---------------|
| Display entities on map | `Map` + `MapMarker` rendering all entities; type/status styling |
| Add entity on map | Pick mode → Dialog form → POST |
| Delete entity on map | Marker popup → AlertDialog → DELETE |
| Update entity on map | Marker popup → Edit Dialog (+ drag/re-pick) → PUT |
| View entity detail on map | Marker popup → Sheet detail drawer |
| Backend validation | Gin + go-playground/validator struct tags |
| Frontend validation | zod schema in react-hook-form; inline errors |

## 9. Documentation Deliverables (per PRD)

- **README.md** — how to run (`docker compose up`), prerequisites, env vars.
- **Library choices** — a section (in README or `docs/`) explaining each
  choice and its rationale, summarized from the table in Section 3.
- **Agentic AI workflow** — description of how Agentic AI (this brainstorm +
  plan + implementation) was used; `AGENTS.md` file at repo root.

## 10. Project Structure

```
takehome-test/
├── docker-compose.yml
├── AGENTS.md
├── README.md
├── docs/
│   ├── prd/
│   └── superpowers/specs/
│       └── 2026-09-18-geo-entity-map-app-design.md
├── backend/
│   ├── Dockerfile
│   ├── go.mod
│   ├── cmd/
│   │   └── server/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── db/          # GORM init, AutoMigrate, Point type
│   │   ├── models/      # Entity struct + validation tags
│   │   ├── handlers/    # Gin handlers
│   │   ├── services/    # business logic
│   │   └── validation/  # custom validators
│   └── migrations/      # (if needed beyond AutoMigrate)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── components.json    # shadcn config
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── ui/        # shadcn + mapcn components
    │   │   └── map/       # EntityMap, MarkerLayer, PickMode
    │   ├── features/
    │   │   └── entities/  # list query, mutations, form, schema
    │   ├── lib/           # api client, query client
    │   └── store/         # zustand UI store
    └── ...
```

## 11. Risks and Assumptions

- **Deadline risk:** the deadline is tomorrow. The plan prioritizes a
  complete, working end-to-end app over polish. Stretch items (nearby query,
  hover effects) are explicitly deferred.
- **mapcn web worker:** mapcn loads the MapLibre web worker from unpkg by
  default. Under a strict CSP this needs a `script-src`/`worker-src` entry.
  For the take-home test the default is fine; self-hosting is a documented
  fallback if needed.
- **PostGIS via GORM:** the custom `Point` type pattern is verified in GORM
  docs (`GormValuerInterface` + `Scanner`). It adds a small amount of custom
  code but avoids raw-SQL everywhere.
- **Go not on host:** all Go work happens in the container; no local Go
  toolchain required.
- **CORS:** the frontend proxies `/api` to the backend through the dev server
  / nginx, so same-origin requests avoid CORS in the common case. The backend
  will include a permissive CORS middleware for direct access safety.
- **Assumed demo data:** an optional seed step will insert a few sample
  entities so the map is not empty on first load.

## 12. Out of Scope (deferred)

- Nearby/radius spatial query (stretch only)
- Bulk import/export
- Marker clustering for large datasets

## 13. Future Work (TODO)

- Authentication and multi-tenancy
- Entity history / audit trail
- Real-time location streaming
