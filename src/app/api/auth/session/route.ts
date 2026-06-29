import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ authenticated: false })

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
    })

    if (!user) return NextResponse.json({ authenticated: false, reason: 'User not found' })

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id, email: user.email, name: user.name, avatar: user.avatar,
        role: user.role, isDemo: user.isDemo, organizationId: user.organizationId, organization: user.organization,
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false, error: 'Failed to check session' }, { status: 500 })
  }
}
