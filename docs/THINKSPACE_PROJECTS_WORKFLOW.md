# Thinkspace Projects — Test Workflow

Playwright UI automation for **Thinkspace → Projects** at `/thinkspace/projects`.

## Demo video (full workflow)

Records a **26-step** headed walkthrough covering every Projects section (A–G):

```bash
npm run demo:thinkspace-projects
# or open the Thinkspace launcher and click Projects:
npm run launcher
```

Step definitions: `src/data/thinkspace/project-flow-demo.json`  
Spec: `tests/thinkspace/demo/project-module-flow.ui.spec.ts`

Includes: hub → dock launcher → Projects, access, refresh, bulk import UI, create draft, statutory (all 4 apps), action items (add + edit + validation), detail tabs (overview, milestones CRUD, gantt, comments, actions), edit draft, submit (Compliance / Finance / Under Review), Tasks link, cancel create, delete cleanup, return to hub.

## Coverage

| Section | Spec file | Cases |
|---------|-----------|-------|
| A. Access & navigation | `01-access-navigation.ui.spec.ts` | P-PR01, N-PR01 |
| B. Create draft | `02-create-workflow.ui.spec.ts` | P-PR02 |
| C. Submit workflow | `02-create-workflow.ui.spec.ts` | P-PR03–P-PR05, P-PR12 |
| D. Statutory approvals | `03-statutory-action-items.ui.spec.ts` | P-PR06 |
| E. Action items | `03-statutory-action-items.ui.spec.ts` | P-PR07–P-PR08 |
| F. Detail & lifecycle | `04-detail-lifecycle.ui.spec.ts` | P-PR09–P-PR11 |
| F. Milestones & comments | `06-milestones-comments.ui.spec.ts` | P-PR13–P-PR14 |
| G. Negative validation | `05-negative-validation.ui.spec.ts` | N-PR02–N-PR08 |

## Workflow stages (submit)

| Condition | `workflow_stage` |
|-----------|------------------|
| Save Draft | `Draft` |
| Submit, cost ≤ ₹500k, no statutory | `Under Review` |
| Submit, cost > ₹500k | `Finance Review` |
| Submit, statutory required, cost ≤ ₹500k | `Compliance Review` |

## Run commands

```bash
# All Projects tests (authenticated)
npx playwright test tests/thinkspace/projects --project=erp-authenticated

# Positive / negative only
npx playwright test tests/thinkspace/projects --project=erp-authenticated --grep @positive
npx playwright test tests/thinkspace/projects --project=erp-authenticated --grep @negative

# Single section
npx playwright test tests/thinkspace/projects/02-create-workflow.ui.spec.ts --project=erp-authenticated
```

Requires ERP auth setup (`storage/erp-auth.json`) and stack running on tenant URL from `testing/.env`.

## Key files

| File | Purpose |
|------|---------|
| `src/pages/thinkspace/ProjectsPage.ts` | Page object (create modal, statutory, action items, detail) |
| `src/api/ThinkspaceProjectApi.ts` | API helpers for verify/cleanup |
| `src/data/thinkspace/projects-test-matrix.json` | Test case matrix |
| `src/fixtures/projects.ts` | Projects fixture + auto cleanup |
