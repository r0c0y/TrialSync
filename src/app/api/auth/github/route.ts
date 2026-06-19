import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_ID || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/github/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '/dashboard';

  if (!GITHUB_CLIENT_ID) {
    // GitHub OAuth not configured — fall back to demo login
    const res = NextResponse.redirect(new URL('/api/auth/demo?fallback=github', request.url));
    return res;
  }

  const state = Buffer.from(JSON.stringify({ from, ts: Date.now() })).toString('base64url');
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'read:user user:email',
    state,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
