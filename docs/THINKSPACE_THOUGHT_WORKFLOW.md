# Thinkspace Thought — Test Workflow

Playwright UI automation for **Thinkspace → Thought** (Meeting Notes) at `/thinkspace/thought`.

## Demo video (full workflow)

Records a **37-step** headed walkthrough covering sections A–H and every workspace UI surface from the manual walkthrough:

```bash
npm run demo:thinkspace-thought
```

Step definitions: `src/data/thinkspace/thought-flow-demo.json`  
Spec: `tests/thinkspace/demo/thought-module-flow.ui.spec.ts`

### Workspace UI covered in demo

| UI surface | Steps |
|------------|-------|
| List **Open** link (`a[title="Open Workspace"]`) | 10 |
| Dock: Canvas / Comment & Action Logs / AI Summary | 11, 31 |
| Central **NodeContextMenu** (child, action, edit, comment) | 12 |
| Child menu: child, parent, sibling, action, edit, comment, **Delete** | 13–17, 29 |
| Nested child node | 14 |
| Comment cloud + **Comments** tab expand (COMMENT, Added by, Tagged, When, View on canvas, Create Action) | 22–23 |
| **Actions** tab expand (Owners) | 24 |
| **Materials** tab count 0→1, Add meeting material modal (DocFlow + Upload), file list, Preview Mode, Edit File, trash delete | 25–28 |
| Export JSON | 30 |

Also includes: list access, analytics, create meeting (contributors/guest/agenda), return to list after create, undo/redo/zoom, node search, contributors panel, action validation, RSVP, list log modals, analytics search, cancel create, API cleanup.

## Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/thinkspace/thought` | Meeting Notes list | Create, search, RSVP, log previews |
| `/thinkspace/thought/workspace?meeting={id}` | Mind-map workspace | Canvas, dock, export, actions |
| `/thinkspace/thought/analytics` | Meeting intelligence | Stats + global search |
| `/thinkspace/thought/guest/join` | Guest OTP join | Not in default automation suite |

## Coverage

| Section | Spec file | Cases |
|---------|-----------|-------|
| A. Access & navigation | `01-access-navigation.ui.spec.ts` | P-TH01–P-TH02, N-TH01, N-TH04 |
| B. Create meeting | `02-create-meeting.ui.spec.ts` | P-TH03–P-TH05, N-TH02 |
| C. List, search & RSVP | `03-list-search-rsvp.ui.spec.ts` | P-TH06–P-TH10 |
| D. Workspace & canvas | `04-workspace-canvas.ui.spec.ts` | P-TH11–P-TH17, P-TH27 |
| E. Comments & actions | `05-comments-actions.ui.spec.ts` | P-TH18–P-TH21, N-TH03, P-TH19 |
| F. Materials, export & AI | `06-materials-export-ai.ui.spec.ts` | P-TH22–P-TH24 |
| G. Analytics | `07-analytics.ui.spec.ts` | P-TH25–P-TH26 |

## Run commands

```bash
# All Thought tests (authenticated)
npx playwright test tests/thinkspace/thought --project=erp-authenticated

# Positive / negative only
npx playwright test tests/thinkspace/thought --project=erp-authenticated --grep @positive
npx playwright test tests/thinkspace/thought --project=erp-authenticated --grep @negative

# Demo video
npm run demo:thinkspace-thought
```

Requires ERP auth setup (`storage/erp-auth.json`) and stack running on tenant URL from `testing/.env`.

## Key files

| File | Purpose |
|------|---------|
| `src/pages/thinkspace/ThoughtListPage.ts` | List, create modal, search, RSVP |
| `src/pages/thinkspace/ThoughtWorkspacePage.ts` | Canvas, dock, export, actions, materials |
| `src/pages/thinkspace/ThoughtAnalyticsPage.ts` | Analytics dashboard |
| `src/api/ThoughtApi.ts` | API helpers for verify/cleanup |
| `src/data/thinkspace/thought-test-matrix.json` | Test case matrix |
| `src/fixtures/thought.ts` | Thought fixture + auto cleanup |

## Excluded from default automation

| Feature | Reason |
|---------|--------|
| Video call / LiveKit lobby | Media permissions, multi-user |
| Guest OTP join | Separate auth flow |
| Multi-user WebSocket collab | Two browser sessions |
| Enterprise lobby panels | Not wired in workspace header |
| DocFlow material link | Requires DocFlow data |
| AI Enhance / publish minutes | Optional external AI dependency |
| Delete meeting UI | API only (`thoughtDeleteMeeting`) |

## Locator strategy

No `data-testid` in Thought UI. Use:

- `#meeting-search`, `.thought-create-form`
- `aria-label`: Manage contributors, Undo, Redo, dock tools, zoom
- `role=tab` / `role=menuitem` for logs and export
- `.thought-export-btn`, `.thought-context-menu`, `.thought-node-root`
