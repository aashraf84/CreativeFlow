import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/demo-login
export async function POST(request: Request) {
  try {
    const demoUser = await db.user.findFirst({
      where: { isDemo: true, role: 'demo' },
      include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
    })

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
    return NextResponse.json({ error: 'Failed to login. Database may be starting up.' }, { status: 500 })
  }
}
