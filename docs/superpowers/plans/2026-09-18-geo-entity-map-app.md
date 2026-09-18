# Geo Entity Map App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack app to display and manage geo-located entities (vehicles, IoT devices, facilities) on a map, with CRUD operations, validation on both ends, and PostGIS spatial queries.

**Architecture:** Three-container Docker Compose stack — Postgres/PostGIS, Go/Gin backend (GORM for queries, explicit SQL migrations), React/Vite frontend (mapcn/MapLibre map, TanStack Query, shadcn/ui floating overlays). Frontend proxies `/api` to backend.

**Tech Stack:** Go + Gin + GORM + go-playground/validator + PostGIS | React 19 + TypeScript + Vite + Tailwind + shadcn/ui + mapcn (MapLibre GL) + TanStack Query + react-hook-form + zod + Zustand

## Global Constraints

- **Deadline:** 2026-09-19 23:59 — prioritize complete & working E2E over polish.
- **Go is NOT installed on the host** — all Go work happens inside the backend Docker container. Run Go commands via `docker compose exec backend <cmd>` or `docker compose run --rm backend <cmd>`.
- **Do NOT run `npx lint` or `jest`** — they OOM/freeze the machine. Use `tsc --noEmit` for frontend type-checking and browser verification. Go tests run inside the container (isolated memory).
- **No GORM AutoMigrate** — schema is managed by explicit versioned SQL files in `backend/migrations/`.
- **API envelope is flat:** `{ status_code, message, data, meta?, errors? }` — success inferred from `status_code` (2xx).
- **Frontend layers:** `src/types/*.type.ts` (enums), `src/interface/*.interface.ts` (shapes), `src/libs/` (axios + query clients), `src/consts/` (query keys). Do NOT use `src/lib`.
- **Node v24.19, npm 11, Docker 29.7, Compose v5.4** available on host.

---

## File Structure

### Backend
```
backend/
├── Dockerfile
├── go.mod
├── cmd/server/main.go           # Gin server entrypoint
├── internal/
│   ├── config/config.go         # env var loading
│   ├── db/db.go                 # GORM connection init
│   ├── db/point.go              # custom Point type (GormValuerInterface + Scanner)
│   ├── db/migrate.go            # migration runner (embedded SQL)
│   ├── models/entity.go         # Entity struct + validator tags
│   ├── handlers/entity.go       # Gin HTTP handlers
│   ├── handlers/response.go     # envelope helpers (success, error, etc.)
│   ├── services/entity.go       # business logic layer
│   └── validation/validators.go # custom lat/lng range validators
├── migrations/
│   ├── 0001_init.up.sql         # entities table + indexes + schema_migrations
│   └── 0001_init.down.sql       # rollback
└── seed/
    └── seed.go                  # seed demo entities (run via flag or on startup)
```

### Frontend
```
frontend/
├── Dockerfile
├── nginx.conf                   # prod: proxy /api -> backend:8080
├── vite.config.ts               # dev: proxy /api -> localhost:8080
├── package.json
├── tsconfig.json
├── components.json              # shadcn config
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind directives + theme vars
    ├── types/
    │   └── entity.type.ts       # EntityType, EntityStatus
    ├── interface/
    │   └── entity.interface.ts  # Entity, EntityInput, ApiResponse, PaginationMeta, etc.
    ├── consts/
    │   └── query-key.ts         # entityKeys
    ├── libs/
    │   ├── axios.ts             # axios instance + ApiError + response interceptor
    │   └── query.ts             # QueryClient setup
    ├── store/
    │   └── ui.ts                # Zustand: pickMode, selectedEntityId, activeOverlay
    ├── features/entities/
    │   ├── api.ts               # entity API functions (getMap, getList, getOne, create, update, delete)
    │   ├── hooks.ts             # TanStack Query hooks (queries + mutations)
    │   ├── schema.ts            # zod schema mirroring backend validation
    │   └── EntityForm.tsx       # react-hook-form form for add/edit
    ├── components/
    │   ├── ui/                   # shadcn + mapcn components (generated)
    │   └── map/
    │       ├── EntityMap.tsx     # full-screen map + markers
    │       ├── MarkerLayer.tsx   # renders MapMarker per entity
    │       └── PickMode.tsx       # crosshair + click-to-place logic
    └── components/
        ├── TopBar.tsx            # title + add button + search/filter
        ├── EntityDialog.tsx      # add/edit dialog wrapper
        ├── EntityPopup.tsx       # marker popup (view/edit/delete)
        ├── EntityDetail.tsx      # detail Sheet drawer
        └── DeleteConfirm.tsx     # AlertDialog
```

### Root
```
takehome-test/
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

---

## Task 1: Docker Compose + Container Skeletons

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

**Interfaces:**
- Produces: three runnable services (`db`, `backend`, `frontend`) that start and expose their ports. DB has a PostGIS healthcheck. Backend and frontend are placeholder servers that return 200.

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  db:
    image: postgis/postgis:17-3.4
    environment:
      POSTGRES_USER: geo
      POSTGRES_PASSWORD: geo
      POSTGRES_DB: geoapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U geo -d geoapp"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: geo
      DB_PASSWORD: geo
      DB_NAME: geoapp
      DB_SSLMODE: disable
      PORT: 8080
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 2: Write `backend/Dockerfile` (multi-stage)**

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /server .
EXPOSE 8080
CMD ["./server"]
```

- [ ] **Step 3: Write `frontend/Dockerfile` (multi-stage: build + nginx)**

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 4: Write `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 5: Verify containers start**

Run: `docker compose up -d db && docker compose ps db`
Expected: db status "healthy" after a few seconds.

(Backend and frontend will fail to build until we add source files — that's expected. We'll verify them after their respective scaffold tasks.)

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml backend/Dockerfile frontend/Dockerfile frontend/nginx.conf
git commit -m "infra: docker compose with PostGIS, backend, frontend containers"
```

---

## Task 2: Backend Scaffold — Go Project + Gin Server

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/server/main.go`
- Create: `backend/internal/config/config.go`

**Interfaces:**
- Consumes: env vars `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`, `PORT`
- Produces: a running Gin server on `:8080` with a `GET /api/health` endpoint returning 200.

- [ ] **Step 1: Initialize go module**

Run: `docker compose run --rm backend go mod init geoapp` (this will fail since there's no main.go yet — do it manually instead)

Write `backend/go.mod`:
```
module geoapp

go 1.23
```

- [ ] **Step 2: Write `backend/internal/config/config.go`**

```go
package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	Port       string
}

func Load() Config {
	return Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "geo"),
		DBPassword: getEnv("DB_PASSWORD", "geo"),
		DBName:     getEnv("DB_NAME", "geoapp"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		Port:       getEnv("PORT", "8080"),
	}
}

func (c Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=UTC"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

- [ ] **Step 3: Write `backend/cmd/server/main.go`**

```go
package main

import (
	"log"
	"net/http"

	"geoapp/internal/config"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	r := gin.Default()
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 4: Add dependencies via go mod**

Run inside container:
```bash
docker compose run --rm backend sh -c "go mod tidy"
```

This downloads Gin and writes `go.sum`.

- [ ] **Step 5: Verify backend starts and health check works**

Run: `docker compose up -d --build backend && sleep 3 && curl -s http://localhost:8080/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "backend: Go project scaffold with Gin server + health endpoint"
```

---

## Task 3: GORM Connection + PostGIS Point Type

**Files:**
- Create: `backend/internal/db/db.go`
- Create: `backend/internal/db/point.go`

**Interfaces:**
- Consumes: `config.Config` (DSN string)
- Produces: `db.Connect(cfg) *gorm.DB` — returns a connected GORM DB. `Point{Lat, Lng float64}` type that implements `GormValuerInterface` (writes `ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography`) and `sql.Scanner` (reads EWKT back).

- [ ] **Step 1: Write `backend/internal/db/point.go`**

```go
package db

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strconv"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Point holds a geographic coordinate. In the DB it is stored as
// geography(Point, 4326). In JSON it is flattened to lat/lng by the model.
type Point struct {
	Lat float64
	Lng float64
}

// GormDataType tells GORM the column type.
func (Point) GormDataType() string {
	return "geography(Point,4326)"
}

// GormValue produces the SQL expression for INSERT/UPDATE.
func (p Point) GormValue(ctx context.Context, db *gorm.DB) clause.Expr {
	return clause.Expr{
		SQL:  "ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography",
		Vars: []interface{}{p.Lng, p.Lat},
	}
}

// Scan reads EWKT ("SRID=4326;POINT(lng lat)") from the DB into the struct.
func (p *Point) Scan(src interface{}) error {
	var ewkt string
	switch v := src.(type) {
	case string:
		ewkt = v
	case []byte:
		ewkt = string(v)
	default:
		return fmt.Errorf("point: cannot scan %T", src)
	}
	// Parse "SRID=4326;POINT(lng lat)" or "POINT(lng lat)"
	ewkt = strings.TrimPrefix(ewkt, "SRID=4326;")
	ewkt = strings.TrimPrefix(ewkt, "POINT(")
	ewkt = strings.TrimSuffix(ewkt, ")")
	parts := strings.Fields(ewkt)
	if len(parts) != 2 {
		return fmt.Errorf("point: bad EWKT %q", src)
	}
	lng, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return err
	}
	lat, err := strconv.ParseFloat(parts[1], 64)
	if err != nil {
		return err
	}
	p.Lng = lng
	p.Lat = lat
	return nil
}

// Value is a fallback for driver.Valuer (not normally used since GormValue
// takes precedence, but keeps the type usable in raw queries).
func (p Point) Value() (driver.Value, error) {
	return fmt.Sprintf("SRID=4326;POINT(%f %f)", p.Lng, p.Lat), nil
}

// Ensure Point implements sql.Scanner at compile time.
var _ sql.Scanner = (*Point)(nil)
```

- [ ] **Step 2: Write `backend/internal/db/db.go`**

```go
package db

import (
	"fmt"
	"log"

	"geoapp/internal/config"
	"gorm.io/gorm"
	"gorm.io/driver/postgres"
)

// Connect opens a GORM connection to Postgres/PostGIS.
func Connect(cfg config.Config) (*gorm.DB, error) {
	gdb, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect to db: %w", err)
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(20)
	log.Println("connected to database")
	return gdb, nil
}
```

- [ ] **Step 3: Wire GORM into main.go**

Modify `backend/cmd/server/main.go` — add DB connection after config load:

```go
package main

import (
	"log"
	"net/http"

	"geoapp/internal/config"
	"geoapp/internal/db"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	_ = gdb // used by handlers in later tasks

	r := gin.Default()
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 4: Add GORM + postgres driver dependencies**

Run: `docker compose run --rm backend sh -c "go get gorm.io/gorm gorm.io/driver/postgres && go mod tidy"`

- [ ] **Step 5: Verify backend starts with DB connected**

Run: `docker compose up -d --build backend && sleep 4 && docker compose logs backend | tail -5`
Expected: logs show "connected to database" and "server starting on :8080".

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "backend: GORM connection + PostGIS Point type (GormValuerInterface + Scanner)"
```

---

## Task 4: Migration Runner + Initial Migration

**Files:**
- Create: `backend/internal/db/migrate.go`
- Create: `backend/migrations/0001_init.up.sql`
- Create: `backend/migrations/0001_init.down.sql`

**Interfaces:**
- Consumes: `*gorm.DB`
- Produces: `db.Migrate(gdb)` — runs all pending `.up.sql` files from the embedded `migrations/` directory, tracking applied versions in a `schema_migrations` table.

- [ ] **Step 1: Write `backend/migrations/0001_init.up.sql`**

```sql
CREATE TABLE IF NOT EXISTS entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   VARCHAR(100) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    description VARCHAR(500),
    location    geography(Point, 4326) NOT NULL,
    attributes  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_device_id ON entities (device_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities (type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities (status);
CREATE INDEX IF NOT EXISTS idx_entities_location ON entities USING GIST (location);

-- Enable pgcrypto for gen_random_uuid() (already in PostGIS image, but be safe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

- [ ] **Step 2: Write `backend/migrations/0001_init.down.sql`**

```sql
DROP TABLE IF EXISTS entities;
```

- [ ] **Step 3: Write `backend/internal/db/migrate.go`**

```go
package db

import (
	"embed"
	"fmt"
	"log"
	"regexp"
	"sort"
	"strconv"

	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// Migrate runs pending up-migrations in order. Tracks applied versions
// in a schema_migrations table. This is NOT GORM AutoMigrate.
func Migrate(gdb *gorm.DB) error {
	if err := gdb.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`).Error; err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	// Get applied versions
	type row struct{ Version int }
	var applied []row
	if err := gdb.Table("schema_migrations").Find(&applied).Error; err != nil {
		return err
	}
	appliedMap := map[int]bool{}
	for _, r := range applied {
		appliedMap[r.Version] = true
	}

	// List up-migration files
	entries, err := migrationFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	upRe := regexp.MustCompile(`^(\d+)_.*\.up\.sql$`)
	var versions []int
	fileByVersion := map[int]string{}
	for _, e := range entries {
		if m := upRe.FindStringSubmatch(e.Name()); m != nil {
			v, _ := strconv.Atoi(m[1])
			versions = append(versions, v)
			fileByVersion[v] = e.Name()
		}
	}
	sort.Ints(versions)

	for _, v := range versions {
		if appliedMap[v] {
			continue
		}
		sqlBytes, err := migrationFS.ReadFile("migrations/" + fileByVersion[v])
		if err != nil {
			return err
		}
		log.Printf("running migration %d: %s", v, fileByVersion[v])
		if err := gdb.Exec(string(sqlBytes)).Error; err != nil {
			return fmt.Errorf("migration %d: %w", v, err)
		}
		if err := gdb.Exec("INSERT INTO schema_migrations (version) VALUES (?)", v).Error; err != nil {
			return err
		}
	}
	log.Println("migrations complete")
	return nil
}
```

- [ ] **Step 4: Call Migrate in main.go**

Add after `db.Connect` in `backend/cmd/server/main.go`:

```go
	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}
```

Updated main.go:
```go
func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
```

- [ ] **Step 5: Verify migration runs on startup**

Run: `docker compose up -d --build backend && sleep 5 && docker compose exec db psql -U geo -d geoapp -c "\dt"`
Expected: tables `entities` and `schema_migrations` exist.

Run: `docker compose exec db psql -U geo -d geoapp -c "SELECT * FROM schema_migrations;"`
Expected: one row with version 1.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "backend: migration runner (embedded SQL) + initial entities table"
```

---

## Task 5: Entity Model + Validation

**Files:**
- Create: `backend/internal/models/entity.go`
- Create: `backend/internal/validation/validators.go`

**Interfaces:**
- Consumes: `db.Point` type
- Produces: `models.Entity` struct (GORM model with JSON tags + validator tags), `models.EntityInput` struct (for create/update binding). `validation.RegisterLatLng(v)` registers custom `lat`/`lng` range validators.

- [ ] **Step 1: Write `backend/internal/validation/validators.go`**

```go
package validation

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

// RegisterLatLng adds custom validators for latitude and longitude ranges.
func RegisterLatLng(v *validator.Validate) {
	_ = v.RegisterValidation("lat", func(fl validator.FieldLevel) bool {
		val := fl.Field().Float()
		return val >= -90 && val <= 90
	})
	_ = v.RegisterValidation("lng", func(fl validator.FieldLevel) bool {
		val := fl.Field().Float()
		return val >= -180 && val <= 180
	})
}

// FormatValidationErrors converts validator.ValidationErrors into a
// map[field]message for the API error response.
func FormatValidationErrors(err error) map[string]string {
	errors := map[string]string{}
	if ves, ok := err.(validator.ValidationErrors); ok {
		for _, fe := range ves {
			field := fe.Field()
			tag := fe.Tag()
			switch tag {
			case "required":
				errors[field] = fmt.Sprintf("%s is required", field)
			case "oneof":
				errors[field] = fmt.Sprintf("%s must be one of: %s", field, fe.Param())
			case "min":
				errors[field] = fmt.Sprintf("%s must be at least %s characters", field, fe.Param())
			case "max":
				errors[field] = fmt.Sprintf("%s must be at most %s characters", field, fe.Param())
			case "lat":
				errors[field] = "lat must be between -90 and 90"
			case "lng":
				errors[field] = "lng must be between -180 and 180"
			default:
				errors[field] = fmt.Sprintf("%s failed validation: %s", field, tag)
			}
		}
	}
	return errors
}
```

- [ ] **Step 2: Write `backend/internal/models/entity.go`**

```go
package models

import (
	"time"

	"geoapp/internal/db"
)

// Entity is the GORM model. Location is stored as geography(Point, 4326)
// but serialized as lat/lng in JSON.
type Entity struct {
	ID          string                 `gorm:"type:uuid;primaryKey"                   json:"id"`
	DeviceID    string                 `gorm:"column:device_id;type:varchar(100);uniqueIndex" json:"device_id"`
	Name        string                 `gorm:"type:varchar(100)"                        json:"name"`
	Type        string                 `gorm:"type:varchar(20)"                        json:"type"`
	Status      string                 `gorm:"type:varchar(20)"                        json:"status"`
	Description *string                `gorm:"type:varchar(500)"                       json:"description"`
	Location    db.Point               `gorm:"type:geography(Point,4326)"              json:"-"`
	Attributes  map[string]interface{} `gorm:"type:jsonb"                              json:"attributes"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

func (Entity) TableName() string { return "entities" }

// ToJSON converts the model to the flat JSON shape (lat/lng instead of location).
func (e *Entity) ToJSON() map[string]interface{} {
	desc := ""
	if e.Description != nil {
		desc = *e.Description
	}
	attrs := e.Attributes
	if attrs == nil {
		attrs = map[string]interface{}{}
	}
	return map[string]interface{}{
		"id":          e.ID,
		"device_id":   e.DeviceID,
		"name":        e.Name,
		"type":        e.Type,
		"status":      e.Status,
		"description": desc,
		"lat":         e.Location.Lat,
		"lng":         e.Location.Lng,
		"attributes":  attrs,
		"created_at":  e.CreatedAt.Format(time.RFC3339),
		"updated_at":  e.UpdatedAt.Format(time.RFC3339),
	}
}

// EntityInput is the request body for create/update.
type EntityInput struct {
	DeviceID    string                 `json:"device_id"   binding:"required,min=1,max=100"`
	Name        string                 `json:"name"        binding:"required,min=1,max=100"`
	Type        string                 `json:"type"        binding:"required,oneof=vehicle iot facility other"`
	Status      string                 `json:"status"      binding:"required,oneof=active inactive maintenance"`
	Description string                 `json:"description" binding:"omitempty,max=500"`
	Lat         float64                `json:"lat"         binding:"required,lat"`
	Lng         float64                `json:"lng"         binding:"required,lng"`
	Attributes  map[string]interface{} `json:"attributes"`
}

// ToModel converts an EntityInput into an Entity model (no ID/timestamps).
func (in *EntityInput) ToModel() Entity {
	desc := in.Description
	var descPtr *string
	if desc != "" {
		descPtr = &desc
	}
	return Entity{
		DeviceID:    in.DeviceID,
		Name:        in.Name,
		Type:        in.Type,
		Status:      in.Status,
		Description: descPtr,
		Location:    db.Point{Lat: in.Lat, Lng: in.Lng},
		Attributes:  in.Attributes,
	}
}
```

- [ ] **Step 3: Add go-playground/validator dependency**

Run: `docker compose run --rm backend sh -c "go get github.com/go-playground/validator/v10 && go mod tidy"`

- [ ] **Step 4: Register validators in main.go**

Add to `backend/cmd/server/main.go` after the `gin.Default()` line:

```go
import (
	// ... existing imports ...
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"geoapp/internal/validation"
)

// In main(), after r := gin.Default():
if v, ok := r.Validator.(*validator.Validate); ok {
	validation.RegisterLatLng(v)
}
```

Note: Gin uses `binding.Validator` internally. To register custom validators with Gin, use `binding.Validator = &CustomValidator{...}`. Here's the complete approach — add this file:

Create `backend/internal/validation/binding.go`:
```go
package validation

import (
	"reflect"

	"github.com/go-playground/validator/v10"
	"github.com/gin-gonic/gin/binding"
)

type customValidator struct {
	v *validator.Validate
}

func (cv *customValidator) ValidateStruct(obj interface{}) error {
	return cv.v.Struct(obj)
}

func (cv *customValidator) Engine() interface{} {
	return cv.v
}

// RegisterWithGin replaces Gin's default validator with one that knows
// about the custom lat/lng validators.
func RegisterWithGin() {
	v := validator.New()
	RegisterLatLng(v)
	binding.Validator = &customValidator{v: v}
}
```

Then in main.go, call `validation.RegisterWithGin()` before creating the router:
```go
func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}

	validation.RegisterWithGin()

	r := gin.Default()
	// ... routes ...
}
```

- [ ] **Step 5: Verify it compiles**

Run: `docker compose run --rm backend sh -c "go build ./..."`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "backend: Entity model + validator tags + custom lat/lng validators"
```

---

## Task 6: API Envelope Helpers + Service Layer + Handlers

**Files:**
- Create: `backend/internal/handlers/response.go`
- Create: `backend/internal/services/entity.go`
- Create: `backend/internal/handlers/entity.go`
- Modify: `backend/cmd/server/main.go` (register routes)

**Interfaces:**
- Consumes: `*gorm.DB`, `models.Entity`, `models.EntityInput`, `validation.FormatValidationErrors`
- Produces: all six REST endpoints wired and returning the flat envelope.

- [ ] **Step 1: Write `backend/internal/handlers/response.go`**

```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	StatusCode int                    `json:"status_code"`
	Message    string                 `json:"message"`
	Data       interface{}            `json:"data"`
	Meta       *PaginationMeta        `json:"meta,omitempty"`
	Errors     map[string]string      `json:"errors,omitempty"`
}

type PaginationMeta struct {
	CurrentPage int `json:"current_page"`
	LastPage    int `json:"last_page"`
	PerPage     int `json:"per_page"`
	Total       int `json:"total"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		StatusCode: http.StatusOK,
		Message:    "OK",
		Data:       data,
	})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{
		StatusCode: http.StatusCreated,
		Message:    "Created",
		Data:       data,
	})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func NotFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, Response{
		StatusCode: http.StatusNotFound,
		Message:    msg,
		Data:       nil,
	})
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, Response{
		StatusCode: http.StatusBadRequest,
		Message:    msg,
		Data:       nil,
	})
}

func ValidationError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusUnprocessableEntity, Response{
		StatusCode: http.StatusUnprocessableEntity,
		Message:    "validation failed",
		Data:       nil,
		Errors:     errors,
	})
}

func ConflictError(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusConflict, Response{
		StatusCode: http.StatusConflict,
		Message:    "conflict",
		Data:       nil,
		Errors:     errors,
	})
}

func ServerError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, Response{
		StatusCode: http.StatusInternalServerError,
		Message:    "internal server error",
		Data:       nil,
	})
}
```

- [ ] **Step 2: Write `backend/internal/services/entity.go`**

```go
package services

import (
	"errors"
	"fmt"
	"math"
	"strings"

	"geoapp/internal/db"
	"geoapp/internal/models"
	"gorm.io/gorm"
)

type EntityService struct {
	db *gorm.DB
}

func NewEntityService(gdb *gorm.DB) *EntityService {
	return &EntityService{db: gdb}
}

func (s *EntityService) List(page, perPage int, entityType, status string) ([]models.Entity, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	q := s.db.Model(&models.Entity{})
	if entityType != "" {
		q = q.Where("type = ?", entityType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var entities []models.Entity
	offset := (page - 1) * perPage
	if err := q.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&entities).Error; err != nil {
		return nil, 0, err
	}
	return entities, total, nil
}

func (s *EntityService) GetByMap(bbox string, entityType, status string) ([]models.Entity, error) {
	parts := strings.Split(bbox, ",")
	if len(parts) != 4 {
		return nil, fmt.Errorf("bbox must be minLng,minLat,maxLng,maxLat")
	}
	minLng, minLat, maxLng, maxLat := parts[0], parts[1], parts[2], parts[3]
	q := s.db.Model(&models.Entity{}).Where(
		"ST_Within(location, ST_MakeEnvelope(?, ?, ?, ?, 4326))",
		minLng, minLat, maxLng, maxLat,
	)
	if entityType != "" {
		q = q.Where("type = ?", entityType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var entities []models.Entity
	if err := q.Find(&entities).Error; err != nil {
		return nil, err
	}
	return entities, nil
}

func (s *EntityService) GetByID(id string) (*models.Entity, error) {
	var entity models.Entity
	if err := s.db.Where("id = ?", id).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Create(in *models.EntityInput) (*models.Entity, error) {
	entity := in.ToModel()
	if err := s.db.Create(&entity).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Update(id string, in *models.EntityInput) (*models.Entity, error) {
	var entity models.Entity
	if err := s.db.Where("id = ?", id).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	entity.DeviceID = in.DeviceID
	entity.Name = in.Name
	entity.Type = in.Type
	entity.Status = in.Status
	desc := in.Description
	if desc != "" {
		entity.Description = &desc
	} else {
		entity.Description = nil
	}
	entity.Location = db.Point{Lat: in.Lat, Lng: in.Lng}
	entity.Attributes = in.Attributes
	if err := s.db.Save(&entity).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return &entity, nil
}

func (s *EntityService) Delete(id string) (bool, error) {
	result := s.db.Where("id = ?", id).Delete(&models.Entity{})
	if result.Error != nil {
		return false, result.Error
	}
	return result.RowsAffected > 0, nil
}

var ErrConflict = errors.New("conflict")

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "unique constraint") ||
		strings.Contains(err.Error(), "duplicate key")
}

// PaginationMeta calculates last_page from total and per_page.
func CalcLastPage(total int64, perPage int) int {
	return int(math.Ceil(float64(total) / float64(perPage)))
}
```

- [ ] **Step 3: Write `backend/internal/handlers/entity.go`**

```go
package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"geoapp/internal/models"
	"geoapp/internal/services"
	"geoapp/internal/validation"
	"github.com/gin-gonic/gin"
)

type EntityHandler struct {
	svc *services.EntityService
}

func NewEntityHandler(svc *services.EntityService) *EntityHandler {
	return &EntityHandler{svc: svc}
}

func (h *EntityHandler) Register(r *gin.Engine) {
	api := r.Group("/api")
	api.GET("/entities", h.List)
	api.GET("/entities/map", h.Map)
	api.GET("/entities/:id", h.GetByID)
	api.POST("/entities", h.Create)
	api.PUT("/entities/:id", h.Update)
	api.DELETE("/entities/:id", h.Delete)
}

func (h *EntityHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	entityType := c.Query("type")
	status := c.Query("status")

	entities, total, err := h.svc.List(page, perPage, entityType, status)
	if err != nil {
		ServerError(c)
		return
	}

	data := make([]map[string]interface{}, len(entities))
	for i, e := range entities {
		data[i] = e.ToJSON()
	}

	lastPage := services.CalcLastPage(total, perPage)
	c.JSON(http.StatusOK, Response{
		StatusCode: http.StatusOK,
		Message:    "OK",
		Data:       data,
		Meta: &PaginationMeta{
			CurrentPage: page,
			LastPage:    lastPage,
			PerPage:     perPage,
			Total:       int(total),
		},
	})
}

func (h *EntityHandler) Map(c *gin.Context) {
	bbox := c.Query("bbox")
	if bbox == "" {
		BadRequest(c, "bbox query param is required (minLng,minLat,maxLng,maxLat)")
		return
	}
	entityType := c.Query("type")
	status := c.Query("status")

	entities, err := h.svc.GetByMap(bbox, entityType, status)
	if err != nil {
		ServerError(c)
		return
	}

	data := make([]map[string]interface{}, len(entities))
	for i, e := range entities {
		data[i] = e.ToJSON()
	}
	OK(c, data)
}

func (h *EntityHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	entity, err := h.svc.GetByID(id)
	if err != nil {
		ServerError(c)
		return
	}
	if entity == nil {
		NotFound(c, "entity not found")
		return
	}
	OK(c, entity.ToJSON())
}

func (h *EntityHandler) Create(c *gin.Context) {
	var in models.EntityInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fieldErrors := validation.FormatValidationErrors(err)
		if len(fieldErrors) > 0 {
			ValidationError(c, fieldErrors)
			return
		}
		BadRequest(c, "invalid JSON body")
		return
	}
	entity, err := h.svc.Create(&in)
	if err != nil {
		if errors.Is(err, services.ErrConflict) {
			ConflictError(c, map[string]string{"device_id": "device_id already exists"})
			return
		}
		ServerError(c)
		return
	}
	Created(c, entity.ToJSON())
}

func (h *EntityHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var in models.EntityInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fieldErrors := validation.FormatValidationErrors(err)
		if len(fieldErrors) > 0 {
			ValidationError(c, fieldErrors)
			return
		}
		BadRequest(c, "invalid JSON body")
		return
	}
	entity, err := h.svc.Update(id, &in)
	if err != nil {
		if errors.Is(err, services.ErrConflict) {
			ConflictError(c, map[string]string{"device_id": "device_id already exists"})
			return
		}
		ServerError(c)
		return
	}
	if entity == nil {
		NotFound(c, "entity not found")
		return
	}
	OK(c, entity.ToJSON())
}

func (h *EntityHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	deleted, err := h.svc.Delete(id)
	if err != nil {
		ServerError(c)
		return
	}
	if !deleted {
		NotFound(c, "entity not found")
		return
	}
	NoContent(c)
}
```

- [ ] **Step 4: Wire handlers + CORS into main.go**

Update `backend/cmd/server/main.go`:

```go
package main

import (
	"log"
	"net/http"

	"geoapp/internal/config"
	"geoapp/internal/db"
	"geoapp/internal/handlers"
	"geoapp/internal/services"
	"geoapp/internal/validation"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	gdb, err := db.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}

	validation.RegisterWithGin()

	r := gin.Default()
	r.Use(corsMiddleware())

	svc := services.NewEntityService(gdb)
	h := handlers.NewEntityHandler(svc)
	h.Register(r)

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
```

- [ ] **Step 5: Verify all endpoints work**

Run: `docker compose up -d --build backend && sleep 5`

Test create:
```bash
curl -s -X POST http://localhost:8080/api/entities \
  -H "Content-Type: application/json" \
  -d '{"device_id":"VAN-01","name":"Van 1","type":"vehicle","status":"active","lat":-6.2,"lng":106.8,"attributes":{"plate":"B 1234"}}' | jq .
```
Expected: 201 with `data` containing the entity + a UUID `id`.

Test list:
```bash
curl -s "http://localhost:8080/api/entities?page=1&per_page=10" | jq .
```
Expected: 200 with `data` array and `meta` pagination.

Test map:
```bash
curl -s "http://localhost:8080/api/entities/map?bbox=106.0,-7.0,107.0,-6.0" | jq .
```
Expected: 200 with `data` array (entity is within bbox).

Test get by id:
```bash
curl -s "http://localhost:8080/api/entities/<id>" | jq .
```

Test validation:
```bash
curl -s -X POST http://localhost:8080/api/entities \
  -H "Content-Type: application/json" \
  -d '{"name":"","type":"bad","status":"x","lat":999,"lng":999}' | jq .
```
Expected: 422 with `errors` map.

Test conflict:
```bash
curl -s -X POST http://localhost:8080/api/entities \
  -H "Content-Type: application/json" \
  -d '{"device_id":"VAN-01","name":"Dup","type":"vehicle","status":"active","lat":-6.2,"lng":106.8}' | jq .
```
Expected: 409 with `errors.device_id`.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "backend: API envelope + service + handlers (CRUD, map bbox, pagination)"
```

---

## Task 7: Backend Seed Data

**Files:**
- Create: `backend/seed/seed.go`
- Modify: `backend/cmd/server/main.go` (call seed on startup if table empty)

**Interfaces:**
- Consumes: `*gorm.DB`
- Produces: `seed.IfEmpty(gdb)` — inserts sample entities if the table is empty.

- [ ] **Step 1: Write `backend/seed/seed.go`**

```go
package seed

import (
	"log"

	"geoapp/internal/db"
	"geoapp/internal/models"
	"gorm.io/gorm"
)

func IfEmpty(gdb *gorm.DB) {
	var count int64
	gdb.Model(&models.Entity{}).Count(&count)
	if count > 0 {
		return
	}
	log.Println("seeding demo entities...")

	entities := []models.Entity{
		{DeviceID: "VAN-01-NORTH", Name: "Delivery Van 01", Type: "vehicle", Status: "active", Description: strPtr("North route"), Location: db.Point{Lat: -6.2088, Lng: 106.8456}, Attributes: map[string]interface{}{"plate": "B 1234 X"}},
		{DeviceID: "VAN-02-SOUTH", Name: "Delivery Van 02", Type: "vehicle", Status: "maintenance", Description: strPtr("South route, in service"), Location: db.Point{Lat: -6.3000, Lng: 106.8000}, Attributes: map[string]interface{}{"plate": "B 5678 Y"}},
		{DeviceID: "IOT-TEMP-01", Name: "Temp Sensor 01", Type: "iot", Status: "active", Description: strPtr("Rooftop temperature sensor"), Location: db.Point{Lat: -6.2500, Lng: 106.8500}, Attributes: map[string]interface{}{"battery": 87}},
		{DeviceID: "IOT-HUMID-02", Name: "Humidity Sensor 02", Type: "iot", Status: "inactive", Description: strPtr("Offline since last week"), Location: db.Point{Lat: -6.1800, Lng: 106.9000}, Attributes: map[string]interface{}{"battery": 12}},
		{DeviceID: "FAC-WAREHOUSE", Name: "Main Warehouse", Type: "facility", Status: "active", Description: strPtr("Central distribution center"), Location: db.Point{Lat: -6.1500, Lng: 106.7800}, Attributes: map[string]interface{}{"capacity": 5000}},
		{DeviceID: "MISC-001", Name: "Untracked Unit", Type: "other", Status: "inactive", Location: db.Point{Lat: -6.2200, Lng: 106.8700}},
	}

	for _, e := range entities {
		if err := gdb.Create(&e).Error; err != nil {
			log.Printf("seed error for %s: %v", e.DeviceID, err)
		}
	}
	log.Println("seeding complete")
}

func strPtr(s string) *string { return &s }
```

- [ ] **Step 2: Call seed in main.go**

Add after `db.Migrate(gdb)`:

```go
import "geoapp/seed"

// In main():
	seed.IfEmpty(gdb)
```

- [ ] **Step 3: Verify seed runs**

Run: `docker compose up -d --build backend && sleep 5 && curl -s "http://localhost:8080/api/entities?page=1&per_page=10" | jq '.data | length'`
Expected: 6 (the seeded entities).

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "backend: seed demo entities on startup if table is empty"
```

---

## Task 8: Frontend Scaffold — Vite + React + TS + Tailwind + shadcn/ui

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`
- Create: `frontend/components.json` (shadcn config)

**Interfaces:**
- Produces: a running Vite dev server on `:5173` with Tailwind + shadcn/ui + path alias `@/` configured.

- [ ] **Step 1: Scaffold the Vite project**

Run:
```bash
cd /home/ai/Workspaces/Works/LEN/takehome-test/frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install Tailwind CSS**

Run:
```bash
npm install tailwindcss @tailwindcss/vite
```

Add the Tailwind plugin to `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
```

Write `frontend/src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 3.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(0 0% 3.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(0 0% 3.9%);
  --color-primary: hsl(0 0% 9%);
  --color-primary-foreground: hsl(0 0% 98%);
  --color-secondary: hsl(0 0% 96.1%);
  --color-secondary-foreground: hsl(0 0% 9%);
  --color-muted: hsl(0 0% 96.1%);
  --color-muted-foreground: hsl(0 0% 45.1%);
  --color-accent: hsl(0 0% 96.1%);
  --color-accent-foreground: hsl(0 0% 9%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(0 0% 89.8%);
  --color-input: hsl(0 0% 89.8%);
  --color-ring: hsl(0 0% 3.9%);
  --radius: 0.5rem;
}

* { border-color: var(--color-border); }
body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 3: Configure path aliases in tsconfig**

Write `frontend/tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

Write `frontend/tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Initialize shadcn/ui + add mapcn**

Run:
```bash
npx shadcn@latest init -d
npx shadcn@latest add @mapcn/map
```

This creates `frontend/components.json` and installs `maplibre-gl`, `lucide-react`, plus shadcn UI primitives. It also creates `src/components/ui/map.tsx` (the mapcn component).

Then add the specific shadcn components we need:
```bash
npx shadcn@latest add dialog sheet alert-dialog select sonner
```

- [ ] **Step 5: Install app dependencies**

Run:
```bash
npm install @tanstack/react-query axios react-hook-form zod @hookform/resolvers zustand
```

- [ ] **Step 6: Write minimal App.tsx to verify the map renders**

Write `frontend/src/App.tsx`:
```tsx
import { Map } from '@/components/ui/map'

export default function App() {
  return (
    <div className="w-screen h-screen">
      <Map center={[106.8456, -6.2088]} zoom={11} />
    </div>
  )
}
```

- [ ] **Step 7: Verify frontend starts and map renders**

Run: `npm run dev` (in a separate terminal) — open `http://localhost:5173` in a browser.
Expected: full-screen map with CARTO tiles centered on Jakarta.

Also verify type-checking: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "frontend: Vite + React + TS + Tailwind + shadcn/ui + mapcn scaffold"
```

---

## Task 9: Frontend Contract Types + API Client + Query Client

**Files:**
- Create: `frontend/src/types/entity.type.ts`
- Create: `frontend/src/interface/entity.interface.ts`
- Create: `frontend/src/consts/query-key.ts`
- Create: `frontend/src/libs/axios.ts`
- Create: `frontend/src/libs/query.ts`

**Interfaces:**
- Produces: all TypeScript contract types, the axios client with `ApiError`, the query client, and the query-key factory.

- [ ] **Step 1: Write `frontend/src/types/entity.type.ts`**

```typescript
export type EntityType = "vehicle" | "iot" | "facility" | "other";
export type EntityStatus = "active" | "inactive" | "maintenance";
```

- [ ] **Step 2: Write `frontend/src/interface/entity.interface.ts`**

```typescript
import type { EntityType, EntityStatus } from "@/types/entity.type";

export interface Entity {
  id: string;
  device_id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description: string | null;
  lat: number;
  lng: number;
  attributes: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EntityInput {
  device_id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description?: string;
  lat: number;
  lng: number;
  attributes?: Record<string, unknown>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  errors?: Record<string, string>;
}

export interface EntityMapResponse extends ApiResponse<Entity[]> {}
export interface EntityListResponse extends ApiResponse<Entity[]> {}
export interface EntityResponse extends ApiResponse<Entity> {}
```

- [ ] **Step 3: Write `frontend/src/consts/query-key.ts`**

```typescript
export const entityKeys = {
  map: (bbox: string, filters?: string) =>
    ["entities", "map", bbox, filters] as const,
  list: (page: number, perPage: number, filters?: string) =>
    ["entities", "list", page, perPage, filters] as const,
  detail: (id: string) =>
    ["entities", "detail", id] as const,
};
```

- [ ] **Step 4: Write `frontend/src/libs/axios.ts`**

```typescript
import axios from "axios";
import type { ApiResponse } from "@/interface/entity.interface";

export class ApiError extends Error {
  constructor(
    public status_code: number,
    public message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Response interceptor: unwrap the flat envelope.
client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body.status_code >= 200 && body.status_code < 300) {
      return body.data;
    }
    throw new ApiError(body.status_code, body.message, body.errors);
  },
  (error) => {
    if (error.response?.data) {
      const body = error.response.data as ApiResponse<unknown>;
      throw new ApiError(body.status_code, body.message, body.errors);
    }
    throw new ApiError(0, error.message || "network error");
  },
);

export default client;
```

- [ ] **Step 5: Write `frontend/src/libs/query.ts`**

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
```

- [ ] **Step 6: Verify type-checking passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types frontend/src/interface frontend/src/consts frontend/src/libs
git commit -m "frontend: contract types, axios client, query client, query keys"
```

---

## Task 10: Entity API Functions + TanStack Query Hooks + Zod Schema

**Files:**
- Create: `frontend/src/features/entities/api.ts`
- Create: `frontend/src/features/entities/hooks.ts`
- Create: `frontend/src/features/entities/schema.ts`

**Interfaces:**
- Consumes: `libs/axios` client, `entityKeys`, `Entity`, `EntityInput`, `EntityMapResponse`, `EntityListResponse`, `EntityResponse`
- Produces: API functions (`fetchMap`, `fetchList`, `fetchOne`, `createEntity`, `updateEntity`, `deleteEntity`), query hooks (`useMapEntities`, `useEntities`, `useEntity`), mutation hooks (`useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`), and a zod schema.

- [ ] **Step 1: Write `frontend/src/features/entities/api.ts`**

```typescript
import client from "@/libs/axios";
import type { Entity, EntityInput } from "@/interface/entity.interface";

export async function fetchMap(bbox: string, type?: string, status?: string): Promise<Entity[]> {
  const params: Record<string, string> = { bbox };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities/map", { params }) as unknown as Promise<Entity[]>;
}

export async function fetchList(page: number, perPage: number, type?: string, status?: string) {
  const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities", { params }) as unknown as Promise<Entity[]>;
}

export async function fetchOne(id: string): Promise<Entity> {
  return client.get(`/entities/${id}`) as unknown as Promise<Entity>;
}

export async function createEntity(input: EntityInput): Promise<Entity> {
  return client.post("/entities", input) as unknown as Promise<Entity>;
}

export async function updateEntity(id: string, input: EntityInput): Promise<Entity> {
  return client.put(`/entities/${id}`, input) as unknown as Promise<Entity>;
}

export async function deleteEntity(id: string): Promise<void> {
  await client.delete(`/entities/${id}`);
}
```

- [ ] **Step 2: Write `frontend/src/features/entities/schema.ts`**

```typescript
import { z } from "zod";

export const entitySchema = z.object({
  device_id: z.string().min(1, "device_id is required").max(100, "device_id must be at most 100 characters"),
  name: z.string().min(1, "name is required").max(100, "name must be at most 100 characters"),
  type: z.enum(["vehicle", "iot", "facility", "other"], { error: "type must be one of: vehicle, iot, facility, other" }),
  status: z.enum(["active", "inactive", "maintenance"], { error: "status must be one of: active, inactive, maintenance" }),
  description: z.string().max(500, "description must be at most 500 characters").optional().or(z.literal("")),
  lat: z.number().min(-90, "lat must be between -90 and 90").max(90, "lat must be between -90 and 90"),
  lng: z.number().min(-180, "lng must be between -180 and 180").max(180, "lng must be between -180 and 180"),
});

export type EntityFormValues = z.infer<typeof entitySchema>;
```

- [ ] **Step 3: Write `frontend/src/features/entities/hooks.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entityKeys } from "@/consts/query-key";
import { fetchMap, fetchList, fetchOne, createEntity, updateEntity, deleteEntity } from "./api";
import type { EntityInput } from "@/interface/entity.interface";
import { toast } from "sonner";

export function useMapEntities(bbox: string | null, type?: string, status?: string) {
  return useQuery({
    queryKey: entityKeys.map(bbox ?? "", [type, status].filter(Boolean).join(",")),
    queryFn: () => fetchMap(bbox!, type, status),
    enabled: !!bbox,
  });
}

export function useEntities(page: number, perPage: number, type?: string, status?: string) {
  return useQuery({
    queryKey: entityKeys.list(page, perPage, [type, status].filter(Boolean).join(",")),
    queryFn: () => fetchList(page, perPage, type, status),
  });
}

export function useEntity(id: string | null) {
  return useQuery({
    queryKey: entityKeys.detail(id ?? ""),
    queryFn: () => fetchOne(id!),
    enabled: !!id,
  });
}

export function useCreateEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EntityInput) => createEntity(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity created");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to create entity");
    },
  });
}

export function useUpdateEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EntityInput }) => updateEntity(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity updated");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to update entity");
    },
  });
}

export function useDeleteEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity deleted");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to delete entity");
    },
  });
}
```

- [ ] **Step 4: Verify type-checking**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/entities/
git commit -m "frontend: entity API functions, query/mutation hooks, zod schema"
```

---

## Task 11: Zustand UI Store + Entity Form

**Files:**
- Create: `frontend/src/store/ui.ts`
- Create: `frontend/src/features/entities/EntityForm.tsx`

**Interfaces:**
- Produces: `useUIStore` (pickMode, selectedEntityId, activeOverlay, draftLatLng), and `<EntityForm>` component (react-hook-form + zod, used by both add and edit dialogs).

- [ ] **Step 1: Write `frontend/src/store/ui.ts`**

```typescript
import { create } from "zustand";

type Overlay = "none" | "add" | "edit" | "detail" | "delete";

interface UIState {
  pickMode: boolean;
  selectedEntityId: string | null;
  activeOverlay: Overlay;
  draftLatLng: { lat: number; lng: number } | null;

  setPickMode: (v: boolean) => void;
  setSelectedEntityId: (id: string | null) => void;
  setActiveOverlay: (o: Overlay) => void;
  setDraftLatLng: (coords: { lat: number; lng: number } | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  pickMode: false,
  selectedEntityId: null,
  activeOverlay: "none",
  draftLatLng: null,

  setPickMode: (v) => set({ pickMode: v }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setActiveOverlay: (o) => set({ activeOverlay: o }),
  setDraftLatLng: (coords) => set({ draftLatLng: coords }),
  reset: () => set({ pickMode: false, selectedEntityId: null, activeOverlay: "none", draftLatLng: null }),
}));
```

- [ ] **Step 2: Write `frontend/src/features/entities/EntityForm.tsx`**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entitySchema, type EntityFormValues } from "./schema";
import { useCreateEntity, useUpdateEntity } from "./hooks";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Entity } from "@/interface/entity.interface";

interface EntityFormProps {
  entity?: Entity | null; // present when editing
  onDone: () => void;
}

export function EntityForm({ entity, onDone }: EntityFormProps) {
  const createMut = useCreateEntity();
  const updateMut = useUpdateEntity();
  const draftLatLng = useUIStore((s) => s.draftLatLng);
  const isEdit = !!entity;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: entity
      ? {
          device_id: entity.device_id,
          name: entity.name,
          type: entity.type,
          status: entity.status,
          description: entity.description ?? "",
          lat: entity.lat,
          lng: entity.lng,
        }
      : {
          device_id: "",
          name: "",
          type: "vehicle",
          status: "active",
          description: "",
          lat: draftLatLng?.lat ?? 0,
          lng: draftLatLng?.lng ?? 0,
        },
  });

  // Update lat/lng when draft changes (pick mode)
  if (draftLatLng && !isEdit) {
    setValue("lat", draftLatLng.lat);
    setValue("lng", draftLatLng.lng);
  }

  const lat = watch("lat");
  const lng = watch("lng");
  const type = watch("type");
  const status = watch("status");

  const onSubmit = async (values: EntityFormValues) => {
    try {
      if (isEdit && entity) {
        await updateMut.mutateAsync({ id: entity.id, input: values });
      } else {
        await createMut.mutateAsync(values);
      }
      onDone();
    } catch {
      // errors surfaced via toast in hooks
    }
  };

  // Merge backend field errors if present
  const fieldErrors = {
    ...errors,
    ...(createMut.error as { errors?: Record<string,string> })?.errors,
    ...(updateMut.error as { errors?: Record<string,string> })?.errors,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="device_id">Device ID</Label>
        <Input id="device_id" {...register("device_id")} />
        {fieldErrors.device_id && (
          <p className="text-sm text-destructive">{fieldErrors.device_id.message ?? fieldErrors.device_id}</p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {fieldErrors.name && (
          <p className="text-sm text-destructive">{fieldErrors.name.message ?? fieldErrors.name}</p>
        )}
      </div>

      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setValue("type", v as EntityFormValues["type"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="iot">IoT</SelectItem>
            <SelectItem value="facility">Facility</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.type && <p className="text-sm text-destructive">{fieldErrors.type.message ?? fieldErrors.type}</p>}
      </div>

      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue("status", v as EntityFormValues["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.status && <p className="text-sm text-destructive">{fieldErrors.status.message ?? fieldErrors.status}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" {...register("description")} />
        {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description.message ?? fieldErrors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Latitude</Label>
          <Input type="number" step="any" value={lat} readOnly className="bg-muted" />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input type="number" step="any" value={lng} readOnly className="bg-muted" />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : isEdit ? "Update Entity" : "Create Entity"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Verify type-checking**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/store frontend/src/features/entities/EntityForm.tsx
git commit -m "frontend: Zustand UI store + entity form (react-hook-form + zod)"
```

---

## Task 12: Full-Screen Map + Marker Layer + Pick Mode

**Files:**
- Create: `frontend/src/components/map/EntityMap.tsx`
- Create: `frontend/src/components/map/MarkerLayer.tsx`
- Create: `frontend/src/components/map/PickMode.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useMapEntities` hook, `useUIStore`, mapcn `Map`/`MapMarker`/`MarkerContent`/`MarkerPopup`/`useMap`
- Produces: a full-screen map that loads entities via bbox, renders styled markers, and supports pick-mode click-to-place.

- [ ] **Step 1: Write `frontend/src/components/map/PickMode.tsx`**

```tsx
import { useEffect, type ReactNode } from "react";
import { useMap } from "@/components/ui/map";
import { useUIStore } from "@/store/ui";

// Listens for map clicks when pickMode is active. Calls onPick with lat/lng.
export function PickMode({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const { map, isLoaded } = useMap();
  const pickMode = useUIStore((s) => s.pickMode);

  useEffect(() => {
    if (!isLoaded || !map || !pickMode) return;

    const handleClick = (e: { lngLat: { lat: number; lng: number } }) => {
      onPick(e.lngLat.lat, e.lngLat.lng);
    };

    map.on("click", handleClick);
    map.getCanvas().style.cursor = "crosshair";

    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isLoaded, pickMode, onPick]);

  return null;
}
```

- [ ] **Step 2: Write `frontend/src/components/map/MarkerLayer.tsx`**

```tsx
import { MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import { Car, Cpu, Building, Circle } from "lucide-react";
import type { Entity } from "@/interface/entity.interface";
import { useUIStore } from "@/store/ui";

const typeStyles: Record<string, { icon: typeof Car; color: string }> = {
  vehicle: { icon: Car, color: "text-blue-500" },
  iot: { icon: Cpu, color: "text-purple-500" },
  facility: { icon: Building, color: "text-green-500" },
  other: { icon: Circle, color: "text-gray-500" },
};

const statusRing: Record<string, string> = {
  active: "ring-2 ring-blue-400",
  inactive: "opacity-50",
  maintenance: "ring-2 ring-amber-400",
};

interface MarkerLayerProps {
  entities: Entity[];
  onSelect: (entity: Entity) => void;
}

export function MarkerLayer({ entities, onSelect }: MarkerLayerProps) {
  return (
    <>
      {entities.map((entity) => {
        const style = typeStyles[entity.type] ?? typeStyles.other;
        const Icon = style.icon;
        return (
          <MapMarker key={entity.id} longitude={entity.lng} latitude={entity.lat}>
            <MarkerContent>
              <div className={`p-1 rounded-full bg-background shadow-md ${statusRing[entity.status] ?? ""}`}>
                <Icon className={`w-5 h-5 ${style.color}`} />
              </div>
            </MarkerContent>
            <MarkerPopup closeButton>
              <div className="space-y-1">
                <div className="font-medium">{entity.name}</div>
                <div className="text-xs text-muted-foreground">
                  {entity.type} · {entity.status}
                </div>
                {entity.description && (
                  <p className="text-xs">{entity.description}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => onSelect(entity)}
                  >
                    View detail
                  </button>
                  <button
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => onSelect(entity)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs text-destructive hover:underline"
                    onClick={() => onSelect(entity)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </MarkerPopup>
          </MapMarker>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/map/EntityMap.tsx`**

```tsx
import { useState, useCallback, type ReactNode } from "react";
import { Map, useMap } from "@/components/ui/map";
import { MarkerLayer } from "./MarkerLayer";
import { PickMode } from "./PickMode";
import { useMapEntities } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

function BboxTracker({ onBbox }: { onBbox: (bbox: string) => void }) {
  const { map, isLoaded } = useMap();

  const updateBbox = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    onBbox(bbox);
  }, [map, onBbox]);

  useState(() => {
    // not ideal but mapcn doesn't expose onLoad easily; use a small delay
  });

  if (isLoaded && map) {
    map.on("moveend", updateBbox);
    map.on("load", updateBbox);
  }

  return null;
}

export function EntityMap({ children }: { children?: ReactNode }) {
  const [bbox, setBbox] = useState<string | null>(null);
  const { data: entities } = useMapEntities(bbox);
  const pickMode = useUIStore((s) => s.pickMode);
  const setDraftLatLng = useUIStore((s) => s.setDraftLatLng);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setDraftLatLng({ lat, lng });
      setActiveOverlay("add");
      useUIStore.getState().setPickMode(false);
    },
    [setDraftLatLng, setActiveOverlay],
  );

  return (
    <Map center={[106.8456, -6.2088]} zoom={11} className="w-full h-full">
      <BboxTracker onBbox={setBbox} />
      {entities && <MarkerLayer entities={entities} onSelect={(e) => {
        useUIStore.getState().setSelectedEntityId(e.id);
        useUIStore.getState().setActiveOverlay("detail");
      }} />}
      {pickMode && <PickMode onPick={handlePick} />}
      {children}
    </Map>
  );
}
```

- [ ] **Step 4: Update `frontend/src/App.tsx`**

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "sonner";
import { EntityMap } from "@/components/map/EntityMap";
import { TopBar } from "@/components/TopBar";
import { EntityDialog } from "@/components/EntityDialog";
import { EntityDetail } from "@/components/EntityDetail";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { useUIStore } from "@/store/ui";

export default function App() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        <EntityMap />

        {/* Floating top bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <TopBar />
        </div>

        {/* Pick-mode banner */}
        {useUIStore((s) => s.pickMode) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border">
            <span className="text-sm font-medium">Click the map to place the entity</span>
          </div>
        )}

        {/* Add/Edit dialog */}
        <EntityDialog
          open={activeOverlay === "add" || activeOverlay === "edit"}
          mode={activeOverlay === "edit" ? "edit" : "add"}
          entityId={selectedEntityId}
          onClose={() => useUIStore.getState().setActiveOverlay("none")}
        />

        {/* Detail drawer */}
        <EntityDetail
          open={activeOverlay === "detail"}
          entityId={selectedEntityId}
          onClose={() => useUIStore.getState().setActiveOverlay("none")}
        />

        {/* Delete confirmation */}
        <DeleteConfirm
          open={activeOverlay === "delete"}
          entityId={selectedEntityId}
          onClose={() => useUIStore.getState().setActiveOverlay("none")}
        />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Verify type-checking**

Run: `npx tsc --noEmit`
Expected: no errors. (Some components referenced by App.tsx don't exist yet — create stubs first or expect errors until Task 13.)

Create stub files for `TopBar.tsx`, `EntityDialog.tsx`, `EntityDetail.tsx`, `DeleteConfirm.tsx` that export empty components, to be filled in Task 13:
```tsx
// frontend/src/components/TopBar.tsx
export function TopBar() { return null; }

// frontend/src/components/EntityDialog.tsx
export function EntityDialog() { return null; }

// frontend/src/components/EntityDetail.tsx
export function EntityDetail() { return null; }

// frontend/src/components/DeleteConfirm.tsx
export function DeleteConfirm() { return null; }
```

- [ ] **Step 6: Verify map renders with markers**

Run: `docker compose up -d --build` (ensure backend + db are running) then `npm run dev` in frontend.
Open browser at `http://localhost:5173`.
Expected: full-screen map centered on Jakarta with 6 colored markers (seeded entities). Clicking a marker opens a popup.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/map frontend/src/components/TopBar.tsx frontend/src/components/EntityDialog.tsx frontend/src/components/EntityDetail.tsx frontend/src/components/DeleteConfirm.tsx frontend/src/App.tsx
git commit -m "frontend: full-screen map + marker layer + pick mode + App shell"
```

---

## Task 13: Top Bar + Add/Edit Dialog + Detail Drawer + Delete Confirm

**Files:**
- Create: `frontend/src/components/TopBar.tsx` (replace stub)
- Create: `frontend/src/components/EntityDialog.tsx` (replace stub)
- Create: `frontend/src/components/EntityDetail.tsx` (replace stub)
- Create: `frontend/src/components/DeleteConfirm.tsx` (replace stub)

**Interfaces:**
- Consumes: `useUIStore`, `useEntity`, `useDeleteEntity`, `EntityForm`, shadcn `Dialog`/`Sheet`/`AlertDialog`/`Select`/`Input`/`Button`
- Produces: all floating overlay UI pieces wired to the Zustand store.

- [ ] **Step 1: Write `frontend/src/components/TopBar.tsx`**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/store/ui";
import { Plus } from "lucide-react";

export function TopBar() {
  const setPickMode = useUIStore((s) => s.setPickMode);
  const pickMode = useUIStore((s) => s.pickMode);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const handleAdd = () => {
    setPickMode(!pickMode);
  };

  return (
    <div className="flex items-center gap-3 bg-background/90 backdrop-blur border rounded-lg shadow-md px-4 py-2">
      <span className="font-semibold text-sm">Geo Entity Map</span>

      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs h-8"
      />

      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="vehicle">Vehicle</SelectItem>
          <SelectItem value="iot">IoT</SelectItem>
          <SelectItem value="facility">Facility</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>

      <Button size="sm" onClick={handleAdd} variant={pickMode ? "secondary" : "default"}>
        <Plus className="w-4 h-4 mr-1" />
        {pickMode ? "Cancel" : "Add Entity"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Write `frontend/src/components/EntityDialog.tsx`**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityForm } from "@/features/entities/EntityForm";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface EntityDialogProps {
  open: boolean;
  mode: "add" | "edit";
  entityId: string | null;
  onClose: () => void;
}

export function EntityDialog({ open, mode, entityId, onClose }: EntityDialogProps) {
  const { data: entity } = useEntity(mode === "edit" ? entityId : null);
  const reset = useUIStore((s) => s.reset);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Entity" : "Add Entity"}</DialogTitle>
        </DialogHeader>
        <EntityForm
          entity={mode === "edit" ? entity : null}
          onDone={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/EntityDetail.tsx`**

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface EntityDetailProps {
  open: boolean;
  entityId: string | null;
  onClose: () => void;
}

export function EntityDetail({ open, entityId, onClose }: EntityDetailProps) {
  const { data: entity } = useEntity(entityId);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{entity?.name ?? "Entity"}</SheetTitle>
        </SheetHeader>
        {entity && (
          <div className="space-y-4 mt-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Device ID</dt>
                <dd className="font-mono">{entity.device_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{entity.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{entity.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location</dt>
                <dd>{entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}</dd>
              </div>
              {entity.description && (
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-1">{entity.description}</dd>
                </div>
              )}
            </dl>

            {entity.attributes && Object.keys(entity.attributes).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Attributes</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(entity.attributes, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveOverlay("edit")}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActiveOverlay("delete")}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Write `frontend/src/components/DeleteConfirm.tsx`**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface DeleteConfirmProps {
  open: boolean;
  entityId: string | null;
  onClose: () => void;
}

export function DeleteConfirm({ open, entityId, onClose }: DeleteConfirmProps) {
  const deleteMut = useDeleteEntity();
  const reset = useUIStore((s) => s.reset);

  const handleConfirm = async () => {
    if (!entityId) return;
    await deleteMut.mutateAsync(entityId);
    reset();
    onClose();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entity?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The entity will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMut.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMut.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 5: Verify type-checking**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Verify full E2E flow in browser**

Run: `docker compose up -d --build` (all three services).
Open `http://localhost:5173`.

Test each flow:
1. **Map display** — 6 markers visible, colored by type, ringed by status.
2. **Add** — Click "Add Entity", click map, fill form, submit → new marker appears.
3. **Detail** — Click marker, "View detail" → slide-in drawer with full info.
4. **Edit** — From detail or popup, edit → form prefilled, submit → marker moves/updates.
5. **Delete** — Click "Delete" → confirm dialog → entity removed, marker disappears.
6. **Validation** — Submit empty form → inline errors show.
7. **Filter** — Select type/status → markers filtered.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/
git commit -m "frontend: top bar, add/edit dialog, detail drawer, delete confirm — full CRUD UI"
```

---

## Task 14: Integration Verification + Documentation

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Modify: `frontend/src/App.tsx` (any final fixes from E2E testing)

**Interfaces:**
- Produces: a fully documented, runnable app.

- [ ] **Step 1: Write `README.md`**

```markdown
# Geo Entity Map App

An application to display and manage geo-located entities (vehicles, IoT devices, facilities) on an interactive map. Built as a take-home test.

## Prerequisites

- Docker (tested with v29.7)
- Docker Compose (tested with v5.4)

## Running the App

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Database: localhost:5432 (user: geo, password: geo, db: geoapp)

The first start seeds 6 demo entities around Jakarta.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/entities/map?bbox=minLng,minLat,maxLng,maxLat | entities in viewport (PostGIS) |
| GET | /api/entities?page=1&per_page=20 | paginated list |
| GET | /api/entities/:id | single entity |
| POST | /api/entities | create |
| PUT | /api/entities/:id | full replace |
| DELETE | /api/entities/:id | delete |

## Library Choices

### Backend
- **Gin** — HTTP router with JSON binding and middleware. Chosen for its lightweight footprint and built-in validation integration.
- **GORM** — Go ORM for queries and CRUD. Used for data access only (not AutoMigrate); schema is managed by explicit SQL migrations.
- **go-playground/validator** — Struct-tag validation serving the PRD's backend validation requirement. Custom validators added for lat/lng ranges.
- **PostgreSQL + PostGIS** — Stores location as `geography(Point, 4326)`. Enables spatial queries (ST_Within for viewport filtering).

### Frontend
- **React 19 + TypeScript + Vite** — Modern, fast HMR, strong typing.
- **Tailwind CSS + shadcn/ui** — Utility-first styling + accessible component primitives (Dialog, Sheet, AlertDialog, Select) for the floating overlay UI.
- **mapcn (MapLibre GL)** — Free map components, zero-config CARTO tiles, no API key needed. Styled with Tailwind, integrates with shadcn.
- **TanStack Query** — Server state management with caching, optimistic updates, and auto-refetch.
- **react-hook-form + zod** — Form state + schema validation mirroring backend rules.
- **Zustand** — Minimal ephemeral UI state (pick mode, selected entity, active overlay).
- **lucide-react** — Icons for marker styling by entity type.

## Agentic AI Workflow

This project was built using Agentic AI (opencode with superpowers). The workflow:

1. **Brainstorming** — Explored requirements, chose tech stack, designed architecture through guided dialogue.
2. **Spec** — Wrote and reviewed a design document covering data model, API contract, validation rules, and UX.
3. **Plan** — Generated a task-by-task implementation plan with full code.
4. **Implementation** — Executed the plan task by task, verifying each step.

See `AGENTS.md` for AI agent configuration details.
```

- [ ] **Step 2: Write `AGENTS.md`**

```markdown
# AGENTS.md

This project was built with opencode (Agentic AI).

## AI Workflow

The development used the superpowers skill set:
- `brainstorming` — guided design dialogue to choose stack and architecture
- `writing-plans` — detailed task-by-task implementation plan with full code
- Implementation executed task by task with verification at each step

## Key Decisions Made with AI

- Generic Entity model with type enum (flexible for vehicles, IoT, facilities)
- PostGIS + GORM with custom Point type (GormValuerInterface)
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
```

- [ ] **Step 3: Full E2E verification**

Run: `docker compose up -d --build --force-recreate`
Wait for all services: `docker compose ps` — all should be "running"/"healthy".

Verify:
- `curl -s http://localhost:8080/api/health` → `{"status":"ok"}`
- `curl -s "http://localhost:8080/api/entities?page=1&per_page=10" | jq '.data | length'` → 6
- Open `http://localhost:5173` in browser — map with markers, all CRUD flows work.

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md
git commit -m "docs: README + AGENTS.md with run instructions, library choices, AI workflow"
```

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] All 6 functional requirements met (display, add, delete, update, detail, validation both ends)
- [ ] Docker compose brings up all 3 services successfully
- [ ] PostGIS bbox query works on the map endpoint
- [ ] Paginated list returns Laravel-style meta
- [ ] Validation errors return 422 with field-level errors
- [ ] Duplicate device_id returns 409
- [ ] Frontend types live in src/types, interfaces in src/interface, infra in src/libs, constants in src/consts
- [ ] No GORM AutoMigrate used
- [ ] README explains how to run and library choices
- [ ] AGENTS.md documents the AI workflow
