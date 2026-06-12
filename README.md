# Maithan ERP — UI Testing (Thinkspace Actions)

Playwright UI automation for the **Thinkspace Actions** module (`/thinkspace/task`).  
Test cases are **positive** and **negative** workflow/validation scenarios only — no smoke, regression, or API-only suites.

## Quick start

```powershell
cd d:\maithanerp\testing
npm run setup          # first time only
# copy .env.example → .env and set tenant + credentials

npm run start          # start Django + UI (if not running)
npm test               # full Thinkspace Actions workflow (UI)
```

## Folder structure

```
testing/
├── src/
│   ├── data/thinkspace/
│   │   ├── actions-test-matrix.json   # Human-readable case catalog (CRUD, steps, validation)
│   │   └── actions-test-data.json     # Runnable datasets
│   ├── pages/thinkspace/              # Page objects (TaskPage, modals)
│   ├── fixtures/                      # Auth + thinkspace cleanup helpers
│   └── utils/test-case.ts             # Report annotations from matrix
├── tests/
│   ├── setup/erp-auth.setup.ts
│   └── thinkspace/workflow/           # UI specs A–G (positive / negative)
└── docs/THINKSPACE_ACTIONS_FLOW.md
```

## Workflow specs

| File | Section | Coverage |
|------|---------|----------|
| `01-access-navigation.ui.spec.ts` | A | Page load, Today/Week, work mode, deep link, guest login |
| `02-bucketlist.ui.spec.ts` | B | Add, FAB, Specific/Routine, delete, empty validation |
| `03-create-action.ui.spec.ts` | C | Create Specific, description, validation, cancel |
| `04-read-list.ui.spec.ts` | D | Open action from list row |
| `05-detail-update.ui.spec.ts` | E | Tabs, description, progress, post update |
| `06-lifecycle.ui.spec.ts` | F | Done, delete, full lifecycle |
| `07-week-view.ui.spec.ts` | G | Week navigation |
| `08-create-agenda.ui.spec.ts` | H | Create agenda (header, bulk, bucket, validation) |

Each test title follows the matrix id (e.g. `P-C01 — Create a Specific action…`).  
Annotations in the HTML report include **Summary**, **Steps**, **CRUD**, **UI location**, and **Expected**.

## Reports

Standard **Playwright HTML** + **classic Allure UI** (`allure-playwright` + `allure-commandline`).

| Report | Command | Output |
|--------|---------|--------|
| Playwright HTML | `npm run report` | `playwright-report/` |
| Allure UI (classic) | `npm run report:allure:open` | `MaithanErp/` — Overview, Suites, Categories, Graphs |

Flow:

```powershell
npm test                     # writes allure-results/ via allure-playwright
npm run report:allure:open   # generate + open classic Allure report in browser
```

The classic sidebar opens on **Overview** (test counts, suites, status chart).

**Module hierarchy** (Thinkspace module → Action Master → workflow section) appears under **Suites** and **Behaviors** after `npm test` writes fresh `allure-results/`.

**Categories** groups failed/broken tests by defect type only — it stays empty when all tests pass.

Requires a local **JDK** (Eclipse Temurin 17+). The report script auto-detects `JAVA_HOME` on Windows; set it manually if needed.

JUnit (`reports/junit/results.xml`) and JSON (`reports/json/results.json`) are written for CI.

## Failure artifacts

Configured in `.env` (defaults):

```env
E2E_SCREENSHOT=only-on-failure
E2E_VIDEO=retain-on-failure
E2E_TRACE=on-first-retry
```

| Location | Content |
|----------|---------|
| `playwright-report/` | Playwright HTML report (`npm run report`) |
| `allure-results/` | Raw Allure data (auto-created during `npm test`) |
| `MaithanErp/` | Allure HTML dashboard (`npm run report:allure:open`) |
| `test-results/` | Raw `.png` / `.webm` / trace per failed test |

## Commands

| Command | What runs |
|---------|-----------|
| `npm test` | All Thinkspace workflow UI tests |
| `npm run test:positive` | `@positive` only |
| `npm run test:negative` | `@negative` only |
| `npm run test:headed` | Visible browser |
| `npm run report` | Open Playwright HTML report |
| `npm run report:allure` | Generate classic Allure report (Python) |
| `npm run report:allure:open` | Generate + open Allure report in browser |
| `npm run report:allure:serve` | Serve existing Allure report (no regenerate) |

## Tenant `.env` example

```env
E2E_ERP_TENANT_SLUG=maithan-orch-warehouse
E2E_ERP_UI_BASE_URL=http://maithan-orch-warehouse.127.0.0.1.nip.io:8002
E2E_ERP_API_BASE_URL=http://maithan-orch-warehouse.127.0.0.1.nip.io:8002/api/v1
E2E_ERP_USERNAME=administrator@maithan.in
E2E_ERP_PASSWORD=your-password
```

API URL must use the tenant nip.io host (not `127.0.0.1:8001`) for setup/cleanup helpers.
