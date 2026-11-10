let memoryAccessToken: string | null = null;

export interface JwtPayload {
  sub?: string;
  userId?: number;
  fullName?: string;
  role?: string;
  permissions?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function clearAccessToken(): void {
  memoryAccessToken = null;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds; check with 5s buffer
  return Date.now() >= (payload.exp - 5) * 1000;
}
