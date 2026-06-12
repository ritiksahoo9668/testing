# Maithan ERP — Project Analysis Report (Playwright Framework)

> Generated from repository inspection. Use this as the baseline before module-specific automation.

## Repository Layout

| Path | Role |
|------|------|
| `enterpriseplatform/` | Django 5.2 + DRF ERP backend (multi-tenant, PostgreSQL, Redis) |
| `ui_enterpriseplatform/` | React 19 + Vite 8 tenant SPA (`dyly-ui`) |
| `superadmin/` | Django Super Admin backend + React/Vite control plane |
| `e2e/` | **New** isolated Playwright automation layer |

Sibling-folder monorepo — no root npm workspace. Each app owns its own dependencies and scripts.

## Frontend Architecture (ERP UI)

- **Stack:** React 19, React Router 7, Zustand, ky, Tailwind CSS 4, Framer Motion, Headless UI
- **Entry:** `ui_enterpriseplatform/src/main.tsx` → `AppRoot.tsx`
- **Router:** `ui_enterpriseplatform/src/app/router.tsx` (lazy-loaded routes, auth guards)
- **Auth guards:** `RequireAuth`, `RequirePasswordChange`, `RequireModuleAccess`, `RequireSetupAccess`
- **SSO:** `SsoRootGate.tsx` handles `?sso=1#token=...` from Super Admin
- **Session:** Zustand persist key `dyly-session` (JWT access/refresh in localStorage)

### Key Routes

| Route | Purpose |
|-------|---------|
| `/login` | Password login |
| `/` | Home (authenticated) |
| `/profile` | User profile |
| `/setup` | Tenant setup wizard |
| `/:moduleSlug/*` | ERP modules (masters, procurement, HR, etc.) |
| `/thinkspace/*` | Collaboration workspace |
| `/email/*` | Email management |
| `/metalk/*` | Real-time messaging |

### Dev URLs

- UI: `http://<tenant>.127.0.0.1.nip.io:8002` (Vite `VITE_PORT=8002`)
- API proxy target: `http://127.0.0.1:8001` (`VITE_PROXY_TARGET`)
- Multi-tenant routing requires nip.io host (not plain localhost)

## Backend Architecture (ERP API)

- **Framework:** Django REST Framework + SimpleJWT
- **API prefix:** `/api/v1/`
- **Auth:** `POST /api/v1/auth/token/`, refresh, verify (envelope-wrapped responses)
- **Health:** `GET /api/v1/health/` (direct `{ ok, checks }` payload)
- **Account:** `GET /api/v1/core/account/me/`
- **Apps:** core, masters, administration, procurement, projects, sales, thinkspace, workflow, emailmgmt, hr

## Super Admin

- API: `http://127.0.0.1:8010/api/`
- Auth: `POST /api/auth/login/`, SSO `POST /api/auth/erp-token/`
- Frontend: `superadmin/frontend/` (separate Vite app)

## Authentication Flow

1. User opens tenant UI at nip.io host
2. Login form posts to `POST /api/v1/auth/token/` via Vite proxy
3. JWT stored in Zustand (`dyly-session` localStorage)
4. `RequireAuth` gate reads auth store; optional password-change redirect
5. Module access enforced by `RequireModuleAccess` + backend permissions

## UI Patterns (Reusable for POM)

| Pattern | Location | Locator Strategy |
|---------|----------|------------------|
| Login form | `LoginPageView.tsx` | `#login-username`, `#login-password`, role=button |
| Modal/dialog | `Modal.tsx` | `role=dialog`, Escape to close |
| Data tables | Module pages + `ResponsiveTable` | `<table>`, aria-label action buttons |
| Forms | `TextField`, `SelectField`, `Button` | `name`, `#id`, labels |
| Toasts/alerts | `Alert.tsx`, `ToastHost` | `role=status`, `aria-live` |
| App shell | `AppShell.tsx`, dock nav | `role=navigation` |
| Search | Module list pages | `role=searchbox`, aria-label search |
| Breadcrumbs | Module pages | `nav[aria-label]` |

**Note:** Minimal `data-testid` usage today — framework uses stable IDs, roles, names, and aria-labels.

## Existing Test Infrastructure

| Layer | Tool | Location |
|-------|------|----------|
| Backend API | pytest + pytest-django | `enterpriseplatform/erpplatform/tests/` |
| Frontend unit | Vitest (1 test file) | `ui_enterpriseplatform/src/` |
| E2E browser | **None (before this framework)** | — |
| CI | GitHub Actions | `enterpriseplatform/.github/workflows/ci.yml` (pytest only) |

## Framework Placement Decision

**Selected:** `d:\maithanerp\e2e\`

Rationale:
- Cross-app E2E (ERP + Super Admin + SSO) needs repo-root scope
- Keeps Playwright separate from Vitest unit tests and pytest API tests
- Aligns with Docker compose treating repo root as integration boundary

## Risks & Considerations

1. **Multi-tenant hosts** — automation must use nip.io URLs, not loopback-only
2. **No test IDs** — prefer role/label/id; recommend adding `data-testid` incrementally in production UI
3. **Lazy routes** — allow Suspense/loading states in wait strategies
4. **Credentials** — dedicated automation users per tenant required
5. **Super Admin SSO flows** — cross-origin; needs separate project/fixtures

## Recommended Module Automation Order (Future)

1. Auth + session reuse (foundation — in progress)
2. Health/smoke API checks
3. Masters (companies, vendors — table-heavy CRUD patterns)
4. Administration (user onboarding)
5. Procurement workflows
6. Thinkspace / Metalk (real-time — higher complexity)

## Browser Policy

**Chromium-only** for UI automation (`e2e/src/config/projects.ts`). Firefox and WebKit projects are disabled until cross-browser coverage is explicitly requested. See [THINKSPACE_ACTIONS_FLOW.md](./THINKSPACE_ACTIONS_FLOW.md) for the first module flow documented under this policy.
