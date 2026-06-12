import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type InvalidPhoneUsername = {
  value: string;
  reason: string;
};

export type LoginTestData = {
  invalidPhoneUsernames: InvalidPhoneUsername[];
  invalidPassword: string;
};

const data: LoginTestData = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'login-test-data.json'), 'utf-8'),
);

export function getLoginTestData(): LoginTestData {
  return data;
}

export function getInvalidPhoneUsernames(): InvalidPhoneUsername[] {
  return data.invalidPhoneUsernames;
}

export function getInvalidLoginPassword(): string {
  return data.invalidPassword;
}
