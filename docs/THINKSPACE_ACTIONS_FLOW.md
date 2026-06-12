# Thinkspace Actions Module Flow

> UI label: **Actions** · Route segment: **`task`** · API resource: **`thinkspace/tasks/`**

## Naming Map

| Layer | Identifier |
|-------|------------|
| Module slug (license) | `thinkspace-task` |
| i18n label | `flows.thinkspace.task` → `"Action"` |
| URL | `/thinkspace/task`, `/thinkspace/task/:taskId` |
| Main component | `ui_enterpriseplatform/src/pages/thinkspace/pages/TaskPage.tsx` |
| API list/create | `GET/POST /api/v1/thinkspace/tasks/` |
| Access gate | `ui_enterpriseplatform/src/app/thinkspaceAccess.ts` |

Legacy notification URLs `/thinkspace/action/:id` redirect to `/thinkspace/task/:id`.

---

## Flow Diagram

```mermaid
flowchart TD
  login[AuthenticatedUser] --> access{HasThinkspaceTaskLicense}
  access -->|no| forbidden[/403]
  access -->|yes| taskPage["/thinkspace/task"]
  taskPage --> todayView["Default: Today view"]
  todayView --> workMode["Work mode: Agenda/Action | Guided | Specific/Routine"]
  workMode --> filters["ActionTypeFilterBar optional"]
  taskPage --> bucketlist["Bucketlist panel FAB"]
  taskPage --> quickCreate["Quick-create modal"]
  taskPage --> rowClick["Click action row"]
  rowClick --> detailModal["/thinkspace/task/:id detail modal"]
  detailModal --> tabs["Progress | Updates/Events | Attachments | Hierarchy"]
  dock["Dock shortcut Actions"] --> taskPage
  notif["Notification deep link"] --> detailModal
  thought["Thought CreateActionModal"] --> detailModal
```

---

## Routes

Defined in `ui_enterpriseplatform/src/app/router.tsx`:

| Path | Component | Notes |
|------|-----------|-------|
| `/thinkspace` | `ThinkspaceHubPage` | Hub landing |
| `/thinkspace/task` | `TaskPage` | Primary Actions workspace |
| `/thinkspace/task/:taskId` | `TaskPage` | Same page; opens detail modal |
| `/thinkspace/metalk/actions` | `MetalkActionsPage` | Metalk-attributed actions list (requires `thinkspace-chat`) |
| `/thinkspace/thought/*` | Thought pages | Can create actions via `CreateActionModal` |

---

## Entry Points

| Entry | Path / trigger |
|-------|----------------|
| Dock launcher | `dockAppLauncherShortcuts.ts` → `/thinkspace/task` |
| Thinkspace registry | `thinkspaceRegistry.ts` → `/thinkspace/task` |
| Metalk nav | `/thinkspace/metalk/actions` |
| Notifications | `notificationNavigation.ts` → `/thinkspace/task/:id` |
| Thought workspace | Context menu → `CreateActionModal` → task API |
| Projects / Agendas | `/thinkspace/task?thinkspace_project=…` (quick-create auto-open) |

---

## TaskPage User Journey

1. Authenticated user navigates to `/thinkspace/task`
2. `RequireAuth` + `RequireModuleAccess` validate `thinkspace-task` license
3. Default view: **Today** (`?view=today`)
4. User toggles **Work mode** (`aria-label="Work mode"`): Agenda/Action, Guided, or Specific/Routine
5. Optional **Action type filters** (`aria-label="Filter actions by type"`)
6. **Bucketlist** capture via FAB (`aria-label="Open bucketlist"`)
7. **Quick-create** modal for specific/routine/agenda/subaction
8. Row click → URL `/thinkspace/task/:id` → **detail modal**
9. Detail tabs: Progress, Updates/Events, Attachments, Hierarchy

**Admin-only views:** Action pool, Timesheet (require `isErpAdmin`).

---

## API Endpoints (Actions / Tasks)

Base: `/api/v1/thinkspace/` (from `enterpriseplatform/thinkspace/urls.py`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `tasks/` | List actions |
| POST | `tasks/` | Create action |
| GET | `tasks/:id/` | Detail |
| PATCH | `tasks/:id/` | Update |
| POST | `tasks/:id/open/` | Assignee pickup |
| POST | `tasks/set-task-progress/` | Progress update |
| POST | `tasks/delete-task/` | Delete |
| GET | `tasks/get-task-hierarchy/` | Subactions tree |
| GET | `tasks/get-specific-task-updates/` | Updates tab |
| GET | `tasks/list-task-action-events/` | Events tab |
| POST | `tasks/post-task-update/` | Post update |
| GET/POST | `tasks/get-task-attachments/`, `add-attachment-to-task/`, … | Attachments |
| GET/POST/PATCH/DELETE | `bucket-list/` | Bucketlist |
| GET | `task-archive/` | Archive |
| GET/POST | `task-notifications/*` | Notifications |
| GET | `commos/actions/?source=metalk` | Metalk actions list |

Frontend client: `ui_enterpriseplatform/src/api/thinkspace.ts`

---

## Auth & Permissions

### Frontend

- `RequireAuth` — logged in
- `RequireModuleAccess` + `isThinkspacePathAllowed()` — `/thinkspace/task` requires `thinkspace-task` or parent `thinkspace`
- Missing access → `/403`

### Backend

- All task endpoints: `IsAuthenticated`
- List scoping: assignee/assigner visibility (`task_api_views.py`)
- `TaskPolicy` (`thinkspace/domain/policies/task_policy.py`):
  - **View:** staff, assignee, assigner, or listed in `responsible`
  - **Edit:** staff or assigner
  - **Progress:** staff or assignee

---

## Automation Selectors

Prefer aria-label, role, name, and id (minimal `data-testid` in production UI).

| Element | Selector |
|---------|----------|
| Work mode | `role=group` + `aria-label="Work mode"` |
| Type filters | `aria-label="Filter actions by type"` |
| Today view label | Text: `Actions · Today` |
| Week view | Button text containing `Week` |
| Bucketlist FAB | `aria-label="Open bucketlist"` |
| Close bucketlist | `aria-label="Close bucketlist"` |
| Detail modal close | `aria-label="Close"` |
| Row edit/delete | `aria-label="Edit action"`, `"Delete action"` |
| Week navigation | `aria-label="Previous week"`, `"Next week"` |
| Create attachments | `#create-attachments-input` |
| Detail file upload | `#task-file-input` |
| Guided category | `role=group` + `aria-label="Guided action category"` |

---

## UI Automation Assets

| Asset | Path |
|-------|------|
| Test case matrix | `testing/src/data/thinkspace/actions-test-matrix.json` |
| TaskPage POM | `testing/src/pages/thinkspace/TaskPage.ts` |
| TaskDetailModal POM | `testing/src/pages/thinkspace/TaskDetailModal.ts` |
| Workflow specs | `testing/tests/thinkspace/workflow/*.ui.spec.ts` |

**Test user requirements:** `thinkspace-task` module license, valid tenant credentials in `testing/.env`.

**Multi-tenant API URL:** Set `E2E_ERP_API_BASE_URL` to the tenant UI origin + `/api/v1` (e.g. `http://maithan-orch-warehouse.127.0.0.1.nip.io:8002/api/v1`), not loopback `127.0.0.1:8001`, so Django receives the correct tenant Host header.

---

## Out of Scope (Current Phase)

- Metalk Actions page automation
- Thought → Action creation
- Action pool / Timesheet admin views
- API-only / smoke / regression test tiers
