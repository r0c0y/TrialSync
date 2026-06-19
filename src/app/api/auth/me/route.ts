import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Try cookie first
  const sessionCookie = request.cookies.get('trialsync_session')
  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value)
      return NextResponse.json({
        id: session.id || session.email,
        email: session.email,
        name: session.name,
        avatar: session.avatar,
        role: session.role,
        isDemo: session.isDemo ?? false,
      })
    } catch {
      // invalid cookie, continue to auth header fallback
    }
  }

  // Fallback: check Authorization header (legacy)
  const auth = request.headers.get('Authorization')
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
      if (decoded.exp && decoded.exp < Date.now()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      return NextResponse.json({
        id: decoded.id || decoded.email,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.avatar,
        role: decoded.role,
        isDemo: decoded.isDemo ?? false,
      })
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}
