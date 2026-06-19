import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_SECRET || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  let redirectTo = '/dashboard';
  try {
    if (stateParam) {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
      redirectTo = decoded.from || '/dashboard';
    }
  } catch { /* ignore invalid state */ }

  if (!code || !GITHUB_CLIENT_ID) {
    return NextResponse.redirect(new URL(`/login?error=github_failed`, request.url));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
    }

    // Fetch GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = await userRes.json();

    // Build session payload
    const session = {
      email: ghUser.email || `${ghUser.login}@github.com`,
      name: ghUser.name || ghUser.login,
      role: 'Clinical Program Lead',
      isDemo: false,
      avatar: ghUser.login?.slice(0, 1)?.toUpperCase() || 'G',
      githubLogin: ghUser.login,
    };

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set('trialsync_session', JSON.stringify(session), {
      path: '/',
      maxAge: 86400,
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  } catch (err: any) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
