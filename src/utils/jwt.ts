type JwtPayload = {
  user_id?: number | string;
  sub?: number | string;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromAccessToken(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const raw = payload.user_id ?? payload.sub;
  if (raw == null || raw === '') return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}
