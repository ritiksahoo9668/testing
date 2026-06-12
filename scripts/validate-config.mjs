import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(resolve(rootDir, 'playwright.config.ts'))) {
  console.error('playwright.config.ts not found');
  process.exit(1);
}

if (!existsSync(resolve(rootDir, 'src/config/environment.ts'))) {
  console.error('environment config not found');
  process.exit(1);
}

console.log('E2E configuration structure validated successfully.');
