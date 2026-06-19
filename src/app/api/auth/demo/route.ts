import { NextResponse } from 'next/server'

export async function POST() {
  const demoUser = {
    id: 'demo-user-001',
    email: 'demo@trialsync.dev',
    name: 'Clinical Lead (Demo)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4',
    role: 'Clinical Research Director'
  }

  const token = Buffer.from(JSON.stringify({ ...demoUser, exp: Date.now() + 86400000 * 30 })).toString('base64')

  return NextResponse.json({ user: demoUser, token })
}
