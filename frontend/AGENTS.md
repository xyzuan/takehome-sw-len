# Frontend AGENTS.md

React 19 + Vite + Tailwind + shadcn/ui + mapcn (MapLibre). See the root `AGENTS.md` for project-wide context, AI workflow, and key decisions.

## Architecture

- `src/types/` — domain type aliases (EntityType, EntityStatus)
- `src/interfaces/` — TS interfaces (Entity, EntityInput, EntityQueryParams, ApiResponse, PaginationMeta)
- `src/constants/` — query keys, label formatting, entity type/status styles
- `src/schemas/` — zod validation schema (entitySchema mirroring backend rules)
- `src/services/` — API functions + TanStack Query hooks (map, search infinite, detail, CRUD mutations)
- `src/libs/` — axios client (envelope unwrap + ApiError), query client
- `src/store/` — Zustand UI store (pickMode, selectedEntityId, activeOverlay, draftEntity, draftLatLng, typeFilter, statusFilter, search, darkMode, bbox, zoom, pendingFlyTo, savedMapView, committedPos, debugMode, renderedCount)
- `src/features/entities/components/` — feature components: EntityMap (full-screen map + bbox tracking + focus handler + rotation), MarkerLayer (fade-in markers + status dots + tooltips), PickMode, BottomNavigation, InAreaCard, EntityCard, EntityCardSkeleton, EntityDetailCard (with delete confirmation popover), EntityEditCard, EntityAddCard, EntityFilterCard, EntityForm, SearchResults, SearchListSkeleton, DebugOverlay, EntityContainer
- `src/features/entities/hooks/` — useBboxTracker, useMapFocusHandler, useMapRotation
- `src/components/ui/` — shadcn/ui primitives (button, card, dialog, sheet, alert-dialog, popover, select, tabs, input, label, badge, separator, sonner, map, expandable-button)

## Code Style

- TypeScript **strict mode** enabled (`tsconfig.app.json`)
- Path alias `@/` → `./src/` (configured in both `vite.config.ts` and `tsconfig.app.json`) — always import via `@/...`, never relative paths that cross feature boundaries
- Functional components + hooks only (no class components)
- oxlint with `react` + `typescript` plugins; `react/rules-of-hooks` is an error (`.oxlintrc.json`)
- Server state via TanStack Query (`useQuery` / `useMutation` / `useInfiniteQuery`); ephemeral UI state via Zustand (`src/store/ui.ts`)
- Forms via `react-hook-form` + `zodResolver(entitySchema)` — schema in `src/schemas/entity.ts` must mirror backend validator tags
- API calls go through the axios client (`src/libs/axios.ts`) which unwraps the flat envelope and throws `ApiError`; never call `fetch`/`axios` directly from components

## Do

- Follow the form pattern in `src/features/entities/components/EntityForm.tsx` (react-hook-form + zodResolver)
- Follow the API hook pattern in `src/services/entity.ts` (TanStack Query + axios client)
- Reuse shadcn/ui primitives from `src/components/ui/` before creating new UI elements
- Keep the validation schema (`src/schemas/entity.ts`) in sync with backend validator tags when rules change
- Write components as arrow functions (`export const Foo = () => {...}`) — exception: vendored shadcn/ui primitives in `src/components/ui/` keep their upstream `function` style

## Don't

- Don't call `fetch` or `axios` directly from components — use the client in `src/libs/axios.ts`
- Don't add new npm dependencies without checking they're already in `package.json`
- Don't run `npx lint`, `npm run lint`, or `jest` — they OOM this machine (see Commands)
- Don't add class components or `styled-components` — use Tailwind utilities + shadcn/ui
- Don't use `function` declarations for components in `src/features/` — use arrow functions (`export const Foo = () => {...}`); vendored shadcn/ui primitives in `src/components/ui/` are the only exception

## Testing

- No test files currently exist in the frontend
- When added: keep test files next to the source with a `.test.ts(x)` suffix
- **Do not** use Jest — it OOMs the machine; prefer Vitest if frontend tests are added later

## Commands

```bash
# Rebuild just the frontend
docker compose up -d --build --force-recreate --no-deps frontend

# View logs
docker compose logs -f frontend

# Type-check frontend (fast, project-wide — tsc has no per-file mode)
cd frontend && npx tsc --noEmit -p tsconfig.app.json
```
