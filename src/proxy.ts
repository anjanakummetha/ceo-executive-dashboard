import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Next 16 renamed the `middleware` file convention to `proxy` — the old
// src/middleware.ts silently stopped enforcing auth. This is the auth gate.

const SESSION_COOKIE = 'ceo_dashboard_session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function authRequired(): boolean {
  return process.env.REQUIRE_AUTH === 'true';
}

/**
 * The 4:45 AM job has no browser session, so it authenticates with a shared
 * secret instead. Deliberately narrow: one path, POST only, and only when
 * BRIEFING_CRON_TOKEN is configured — an unset token grants nothing.
 */
function isBriefingCronRequest(request: NextRequest): boolean {
  if (request.method !== 'POST') return false;
  if (request.nextUrl.pathname !== '/api/hermes/briefing') return false;
  const expected = process.env.BRIEFING_CRON_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get('x-briefing-token');
  if (!provided || provided.length !== expected.length) return false;
  // Constant-time-ish compare: never short-circuit on the first differing byte.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  if (!authRequired()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isBriefingCronRequest(request)) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    if (pathname === '/login' && (await hasValidSession(request))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!(await hasValidSession(request))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
