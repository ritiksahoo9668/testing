import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function loadEnvFiles(): void {
  const candidates = [
    resolve(rootDir, '.env'),
    resolve(rootDir, `.env.${process.env.E2E_ENV ?? 'local'}`),
    resolve(rootDir, '.env.local'),
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      loadDotenv({ path: file, override: false });
    }
  }
}

loadEnvFiles();

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  });

const optionalPositiveInt = z
  .union([z.number(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  });

const traceModeSchema = z.enum(['off', 'on', 'retain-on-failure', 'on-first-retry']);
const screenshotModeSchema = z.enum(['off', 'on', 'only-on-failure']);
const videoModeSchema = z.enum(['off', 'on', 'retain-on-failure', 'on-first-retry']);

const envSchema = z.object({
  E2E_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  E2E_HEADLESS: booleanFromEnv.default(true),
  E2E_SLOW_MO: z.coerce.number().nonnegative().default(0),
  E2E_WORKERS: optionalPositiveInt,
  E2E_RETRIES: z.coerce.number().nonnegative().default(process.env.CI ? 2 : 0),
  E2E_TIMEOUT_MS: z.coerce.number().positive().default(60_000),
  E2E_ACTION_TIMEOUT_MS: z.coerce.number().positive().default(15_000),
  E2E_NAVIGATION_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
  E2E_ERP_TENANT_SLUG: z.string().min(1).default('demo'),
  E2E_ERP_UI_BASE_URL: z.string().url().optional(),
  E2E_ERP_API_BASE_URL: z.string().url().default('http://127.0.0.1:8001/api/v1'),
  E2E_SUPERADMIN_UI_BASE_URL: z.string().url().default('http://127.0.0.1:5173'),
  E2E_SUPERADMIN_API_BASE_URL: z.string().url().default('http://127.0.0.1:8010/api'),
  E2E_ERP_USERNAME: z.string().optional(),
  E2E_ERP_PASSWORD: z.string().optional(),
  E2E_SUPERADMIN_USERNAME: z.string().optional(),
  E2E_SUPERADMIN_PASSWORD: z.string().optional(),
  E2E_AUTH_STORAGE_STATE: z.string().default('storage/erp-auth.json'),
  E2E_SUPERADMIN_AUTH_STORAGE_STATE: z.string().default('storage/superadmin-auth.json'),
  E2E_SKIP_GLOBAL_SETUP: booleanFromEnv.default(false),
  E2E_TRACE: traceModeSchema.default('on-first-retry'),
  E2E_VIDEO: videoModeSchema.default('retain-on-failure'),
  E2E_SCREENSHOT: screenshotModeSchema.default('only-on-failure'),
  E2E_ENABLE_A11Y: booleanFromEnv.default(false),
  E2E_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  E2E_API_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
  E2E_PERF_NAVIGATION_MS: z.coerce.number().positive().default(5_000),
  E2E_PERF_API_MS: z.coerce.number().positive().default(3_000),
  E2E_KEEP_TEST_DATA: booleanFromEnv.default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid E2E environment configuration:\n${details}`);
}

const env = parsed.data;

function buildTenantUiBaseUrl(tenantSlug: string): string {
  return `http://${tenantSlug}.127.0.0.1.nip.io:8002`;
}

export const e2eConfig = {
  rootDir,
  env: env.E2E_ENV,
  isCI: Boolean(process.env.CI),
  headless: env.E2E_HEADLESS,
  slowMo: env.E2E_SLOW_MO,
  workers: env.E2E_WORKERS,
  retries: env.E2E_RETRIES,
  timeoutMs: env.E2E_TIMEOUT_MS,
  actionTimeoutMs: env.E2E_ACTION_TIMEOUT_MS,
  navigationTimeoutMs: env.E2E_NAVIGATION_TIMEOUT_MS,
  erp: {
    tenantSlug: env.E2E_ERP_TENANT_SLUG,
    uiBaseUrl: env.E2E_ERP_UI_BASE_URL ?? buildTenantUiBaseUrl(env.E2E_ERP_TENANT_SLUG),
    apiBaseUrl: env.E2E_ERP_API_BASE_URL.replace(/\/$/, ''),
    username: env.E2E_ERP_USERNAME,
    password: env.E2E_ERP_PASSWORD,
    authStorageStatePath: resolve(rootDir, env.E2E_AUTH_STORAGE_STATE),
  },
  superAdmin: {
    uiBaseUrl: env.E2E_SUPERADMIN_UI_BASE_URL.replace(/\/$/, ''),
    apiBaseUrl: env.E2E_SUPERADMIN_API_BASE_URL.replace(/\/$/, ''),
    username: env.E2E_SUPERADMIN_USERNAME,
    password: env.E2E_SUPERADMIN_PASSWORD,
    authStorageStatePath: resolve(rootDir, env.E2E_SUPERADMIN_AUTH_STORAGE_STATE),
  },
  skipGlobalSetup: env.E2E_SKIP_GLOBAL_SETUP,
  trace: env.E2E_TRACE,
  video: env.E2E_VIDEO,
  screenshot: env.E2E_SCREENSHOT,
  enableA11y: env.E2E_ENABLE_A11Y,
  logLevel: env.E2E_LOG_LEVEL,
  apiTimeoutMs: env.E2E_API_TIMEOUT_MS,
  perf: {
    navigationMs: env.E2E_PERF_NAVIGATION_MS,
    apiMs: env.E2E_PERF_API_MS,
  },
  keepTestData: env.E2E_KEEP_TEST_DATA,
} as const;

export type E2eConfig = typeof e2eConfig;

export function resolveFromRoot(relativePath: string): string {
  return resolve(rootDir, relativePath);
}

export function hasErpCredentials(): boolean {
  return Boolean(e2eConfig.erp.username && e2eConfig.erp.password);
}

export function hasSuperAdminCredentials(): boolean {
  return Boolean(e2eConfig.superAdmin.username && e2eConfig.superAdmin.password);
}
