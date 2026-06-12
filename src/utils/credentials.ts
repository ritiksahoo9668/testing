import { e2eConfig } from '../config/environment.js';

export function getErpCredentials(): { username: string; password: string } {
  const username = e2eConfig.erp.username;
  const password = e2eConfig.erp.password;

  if (!username || !password) {
    throw new Error(
      'ERP credentials are not configured. Set E2E_ERP_USERNAME and E2E_ERP_PASSWORD in testing/.env',
    );
  }

  return { username, password };
}

export function getSuperAdminCredentials(): { username: string; password: string } {
  const username = e2eConfig.superAdmin.username;
  const password = e2eConfig.superAdmin.password;

  if (!username || !password) {
    throw new Error(
      'Super Admin credentials are not configured. Set E2E_SUPERADMIN_USERNAME and E2E_SUPERADMIN_PASSWORD in testing/.env',
    );
  }

  return { username, password };
}

export function maskSecret(value: string | undefined | null): string {
  if (!value) return '<empty>';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(value.length - 4, 8))}${value.slice(-2)}`;
}
