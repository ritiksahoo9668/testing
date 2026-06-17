#!/usr/bin/env node
/**
 * Record a single Thinkspace Thought flow video (headed, slow, always on video).
 * Output: testing/test-results/.../video.webm
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

loadEnvFile();

if (!existsSync(resolve(rootDir, '.env'))) fail('Missing testing/.env');
if (!process.env.E2E_ERP_USERNAME) fail('Set E2E_ERP_USERNAME in .env');

process.env.E2E_VIDEO = 'on';
process.env.E2E_TRACE = 'on';
process.env.E2E_SCREENSHOT = 'on';
process.env.E2E_HEADLESS = 'false';
if (!process.env.E2E_SLOW_MO || process.env.E2E_SLOW_MO === '0') {
  process.env.E2E_SLOW_MO = '400';
}
if (!process.env.E2E_DEMO_PAUSE_MS) {
  process.env.E2E_DEMO_PAUSE_MS = '1200';
}

const flowPath = resolve(rootDir, 'src/data/thinkspace/thought-flow-demo.json');
let flowSteps = [];
if (existsSync(flowPath)) {
  const flow = JSON.parse(readFileSync(flowPath, 'utf-8'));
  flowSteps = flow.steps ?? [];
}

console.log('\n--- Thinkspace Thought — demo flow video ---\n');
console.log(`Tenant UI: ${process.env.E2E_ERP_UI_BASE_URL ?? '(from .env)'}`);
console.log('Recording: video=on, trace=on, headed, slowMo=' + process.env.E2E_SLOW_MO);
console.log('Output folder: testing/test-results/\n');
if (flowSteps.length) {
  console.log('Steps (see docs/THINKSPACE_THOUGHT_WORKFLOW.md):\n');
  for (const s of flowSteps) {
    console.log(`  ${s.order}. [${s.section}] ${s.title} (${s.matrixCases.join(', ')}) — ${s.crud}`);
  }
  console.log('');
}

async function checkStack() {
  const uiUrl = (process.env.E2E_ERP_UI_BASE_URL || 'http://demo.127.0.0.1.nip.io:8002').replace(/\/$/, '');
  try {
    const health = await fetch(`${uiUrl}/api/v1/health/`, { signal: AbortSignal.timeout(8000) });
    if (health.status === 502 || health.status === 504) {
      fail(
        `API proxy HTTP ${health.status} at ${uiUrl}/api/v1/health/\n` +
          '   Frontend (Vite :8002) is running but Django backend (:8001) is not.\n' +
          '   Start backend:\n' +
          '     cd d:\\maithanerp\\enterpriseplatform\n' +
          '     .\\.venv\\Scripts\\python.exe manage.py runserver 127.0.0.1:8001',
      );
    }
    if (!health.ok) {
      fail(`API health check failed: HTTP ${health.status} at ${uiUrl}/api/v1/health/`);
    }
    console.log(`✓ API healthy: ${uiUrl}/api/v1/health/\n`);
  } catch {
    fail(
      `Cannot reach ${uiUrl}/api/v1/health/\n` +
        '   Start both servers:\n' +
        '     Backend:  cd enterpriseplatform; .\\.venv\\Scripts\\python.exe manage.py runserver 127.0.0.1:8001\n' +
        '     Frontend: cd ui_enterpriseplatform; npm run dev',
    );
  }
}

await checkStack();

const setup = spawnSync(
  'npx',
  ['playwright', 'test', 'tests/setup/erp-auth.setup.ts', '--project=setup-erp-auth'],
  { cwd: rootDir, stdio: 'inherit', shell: true, env: process.env },
);
if (setup.status !== 0) process.exit(setup.status ?? 1);

const demo = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'tests/thinkspace/demo/thought-module-flow.ui.spec.ts',
    '--project=thinkspace-demo',
  ],
  { cwd: rootDir, stdio: 'inherit', shell: true, env: process.env },
);

if (demo.status === 0) {
  console.log('\n✅ Thought demo flow completed.');
  console.log('   Open test-results/ and find video.webm for the walkthrough test.\n');
} else {
  console.log('\n❌ Thought demo flow failed — check test-results/ for video/trace anyway.\n');
}

process.exit(demo.status ?? 1);
