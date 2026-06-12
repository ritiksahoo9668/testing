import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { e2eConfig, resolveFromRoot } from '../config/environment.js';

const jsonRecordSchema = z.record(z.unknown());

export function loadJsonData<T>(relativePath: string): T {
  const absolutePath = resolveFromRoot(relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Test data file not found: ${absolutePath}`);
  }
  const raw = readFileSync(absolutePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export function loadJsonDataIfExists<T>(relativePath: string): T | null {
  const absolutePath = resolveFromRoot(relativePath);
  if (!existsSync(absolutePath)) return null;
  return JSON.parse(readFileSync(absolutePath, 'utf-8')) as T;
}

export function getDataDrivenCases<T>(
  relativePath: string,
  itemSchema: z.ZodType<T>,
): T[] {
  const payload = loadJsonData<{ cases: unknown[] }>(relativePath);
  return payload.cases.map((item, index) => {
    const parsed = itemSchema.safeParse(item);
    if (!parsed.success) {
      throw new Error(
        `Invalid data-driven case at index ${index} in ${relativePath}: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  });
}

export function getEnvironmentTag(): string {
  return e2eConfig.env;
}

export function buildUniqueSuffix(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateRecord(data: unknown, label: string): Record<string, unknown> {
  const parsed = jsonRecordSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid ${label}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function resolveDataPath(...segments: string[]): string {
  return resolve(e2eConfig.rootDir, 'src/data', ...segments);
}
