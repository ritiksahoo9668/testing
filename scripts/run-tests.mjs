#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extraArgs = [...process.argv.slice(2)];

function loadEnvFile() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return {};
  const vars = {};
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
    if (!process.env[key]) process.env[key] = value;
  }
  return vars;
}

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function printFailedTests() {
  const junitPath = resolve(rootDir, 'reports/junit/results.xml');
  if (!existsSync(junitPath)) return;
  const xml = readFileSync(junitPath, 'utf-8');
  const failures = [...xml.matchAll(/<testcase[^>]*name="([^"]*)"[^>]*>[\s\S]*?<failure[^>]*>([\s\S]*?)<\/failure>/g)];
  if (!failures.length) return;
  console.log('\n--- Failed tests ---');
  for (const [, name, detail] of failures) {
    console.log(`\n✗ ${name}`);
    const line = detail.replace(/<[^>]+>/g, '').trim().split('\n')[0];
    if (line) console.log(`  ${line.slice(0, 240)}`);
  }
  console.log('\n  Screenshots/videos: testing/test-results/\n');
}

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) fail(`${label} returned HTTP ${res.status}: ${url}`);
    console.log(`✓ ${label} reachable`);
  } catch {
    fail(`${label} not reachable: ${url}\n   Run: npm run start`);
  }
}

loadEnvFile();
const uiUrl = process.env.E2E_ERP_UI_BASE_URL || 'http://demo.127.0.0.1.nip.io:8002';
if (!existsSync(resolve(rootDir, '.env'))) fail('Missing testing/.env');
if (!process.env.E2E_ERP_USERNAME) fail('Set E2E_ERP_USERNAME in .env');

console.log('\n--- Maithan ERP UI Testing (Login + Thinkspace Actions) ---\n');
console.log(`✓ Tenant UI: ${uiUrl}`);
await checkUrl(`${uiUrl.replace(/\/$/, '')}/login`, 'UI');
await checkUrl(`${uiUrl.replace(/\/$/, '')}/api/v1/health/`, 'API');

const playwrightArgs = [
  'playwright',
  'test',
  'tests/auth/login',
  'tests/thinkspace/hub',
  'tests/thinkspace/workflow',
  '--project=chromium-login-guest',
  '--grep-invert',
  '@server-reject',
  '--project=erp-authenticated',
  '--project=chromium-guest',
  ...extraArgs,
];

console.log(`\n▶ npx ${playwrightArgs.join(' ')}\n`);

const result = spawnSync('npx', playwrightArgs, { cwd: rootDir, stdio: 'inherit', shell: true, env: process.env });

if (result.status === 0) {
  console.log('\n✅ Tests passed.');
} else {
  printFailedTests();
  console.log('\n❌ Tests failed.');
}

console.log('\n--- Reports ---');
console.log('  Playwright HTML : npm run report');
console.log('  Allure UI       : npm run report:allure:open');
console.log('  Raw artifacts   : test-results/\n');

process.exit(result.status ?? 1);
