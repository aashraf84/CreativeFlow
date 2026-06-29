import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Retry failed')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const user = await withRetry(() =>
      db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
      })
    )

    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    if (!user.password || user.password !== password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    if (user.isDemo) return NextResponse.json({ error: 'Please use the Demo Login button' }, { status: 403 })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id, email: user.email, name: user.name, avatar: user.avatar,
        role: user.role, isDemo: false, organizationId: user.organizationId, organization: user.organization,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again in a moment.' }, { status: 500 })
  }
}
