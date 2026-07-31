import { fromByteArray, toByteArray } from 'base64-js';
import { jwtDecode } from 'jwt-decode';

export class Base64 {
  static encode(plainText: string): string {
    const encodeMap: Record<string, string> = { '+': '-', '/': '_', '=': '' };
    return fromByteArray(pack(plainText)).replace(/[+/=]/g, m => {
      return encodeMap[m] ?? '';
    });
  }

  static decode(b64: string): string {
    const decodeMap: Record<string, string> = { '-': '+', '_': '/' };
    b64 = b64.replace(/[-_]/g, m => {
      return decodeMap[m] ?? '';
    });
    while (b64.length % 4) {
      b64 += '=';
    }

    return unpack(toByteArray(b64));
  }
}

export function pack(str: string) {
  const bytes: any = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(...[str.charCodeAt(i)]);
  }

  return bytes;
}

export function unpack(byteArray: any) {
  return String.fromCharCode(...byteArray);
}

export const base64 = { encode: Base64.encode, decode: Base64.decode };

export function capitalize(text: string): string {
  return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
}

export function currentTimestamp(): number {
  return Math.ceil(new Date().getTime() / 1000);
}

export function timeLeft(expiredAt: number): number {
  return Math.max(0, expiredAt - currentTimestamp());
}

export function filterObject<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  );
}

export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0;
}
// ─── Entreprise LocalStorage Helpers ─────────────────────────────
export function setEntrepriseData(data: any) {
  if (data) {
    localStorage.setItem('entrepriseData', JSON.stringify(data));
  }
}

export function getEntrepriseData(): any | null {
  const stored = localStorage.getItem('entrepriseData');
  return stored ? JSON.parse(stored) : null;
}

export function getEntrepriseId(): number | null {
  const data = getEntrepriseData();
  return data?.id ?? null;
}

export function removeEntrepriseData() {
  localStorage.removeItem('entrepriseData');
}
export function getDecodedToken(): any | null {
  const tokenDataStr = localStorage.getItem('tms_access_token');
  if (!tokenDataStr) return null;

  try {
    const tokenData = JSON.parse(tokenDataStr);
    const accessToken = tokenData.access_token;
    if (!accessToken) return null;

    return jwtDecode(accessToken);
  } catch (e) {
    console.error('Erreur decode token', e);
    return null;
  }
}
export function getRolesFromToken(): string[] {
  const userStr = localStorage.getItem('tms_user');
  if (!userStr) return [];

  try {
    const user = JSON.parse(userStr);
    if (Array.isArray(user.roles)) {
      return user.roles.map((r: any) => r.roleName ?? r);
    }
    if (typeof user.role === 'string') return [user.role];
    return [];
  } catch (e) {
    console.error('Erreur lecture tms_user', e);
    return [];
  }
}
export function isAdminRole(): boolean {
  const roles = getRolesFromToken();

  const adminRoles = [
    'ROLE_ADMIN',
    'ROLE_SUPERADMIN',
    'ROLE_SUPER_ADMIN',
    'SUPER_ADMIN',
    'ADMIN',
    'SUPERADMIN'
  ];

  return roles.some(r => adminRoles.includes(r));
}