import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  const demoUser = {
    id: 'demo-user-001',
    email: 'demo@trialsync.dev',
    name: 'Clinical Lead (Demo)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4',
    role: 'Clinical Research Director',
    isDemo: true,
  }

  const response = NextResponse.json(demoUser)

  response.cookies.set('trialsync_session', JSON.stringify(demoUser), {
    path: '/',
    maxAge: 86400 * 30,
    sameSite: 'lax',
    httpOnly: false,
  })

  return response
}
