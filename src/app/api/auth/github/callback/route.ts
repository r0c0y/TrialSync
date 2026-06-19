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
    const ghRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = await ghRes.json();

    // Fetch email if not public
    let email = ghUser.email;
    if (!email) {
      try {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const emails = await emailRes.json();
        const primary = emails?.find((e: any) => e.primary && e.verified);
        if (primary) email = primary.email;
      } catch {}
    }

    // Build session
    const session = {
      id: `github-${ghUser.id}`,
      email: email || `${ghUser.login}@github.com`,
      name: ghUser.name || ghUser.login,
      role: 'Clinical Program Lead',
      isDemo: false,
      avatar: ghUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ghUser.login}&backgroundColor=b6e3f4`,
      githubLogin: ghUser.login,
    };

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set('trialsync_session', JSON.stringify(session), {
      path: '/',
      maxAge: 86400 * 30,
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  } catch (err: any) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
