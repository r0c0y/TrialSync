import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('trialsync_session', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  })
  return response
}
