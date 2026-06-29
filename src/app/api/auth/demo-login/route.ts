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
    const demoUser = await withRetry(() =>
      db.user.findFirst({
        where: { isDemo: true, role: 'demo' },
        include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
      })
    )

    if (!demoUser) {
      return NextResponse.json({ error: 'Demo account not configured' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: demoUser.id, email: demoUser.email, name: demoUser.name, avatar: demoUser.avatar,
        role: 'demo', isDemo: true, organizationId: demoUser.organizationId, organization: demoUser.organization,
        permissions: { canCreate: false, canEdit: false, canDelete: false, canApprove: false, canPost: false }
      }
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again in a moment.' }, { status: 500 })
  }
}
