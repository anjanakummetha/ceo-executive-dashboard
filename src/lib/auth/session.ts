import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'ceo_dashboard_session';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set (min 16 characters)');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub ?? ''),
      name: String(payload.name ?? payload.sub ?? 'User'),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function validateCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.DASHBOARD_USERNAME ?? 'kory';
  const expectedPass = process.env.DASHBOARD_PASSWORD;
  if (!expectedPass) return false;
  return username === expectedUser && password === expectedPass;
}
