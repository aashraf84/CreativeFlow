import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/demo-login - Login as demo user with view-only rights
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { deviceId } = body

    const demoUser = await db.user.findFirst({
      where: { isDemo: true, role: 'demo' },
      include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
    })

    if (!demoUser) return NextResponse.json({ error: 'Demo account not configured. Please seed the database first.' }, { status: 404 })

    if (deviceId) {
      try {
        const existingDevice = await db.device.findUnique({ where: { deviceId } })
        if (!existingDevice) {
          let demoKey = await db.serialKey.findFirst({ where: { key: 'DEMO-ACCESS-KEY' } })
          if (!demoKey) {
            const tenant = await db.tenant.findFirst()
            if (tenant) {
              demoKey = await db.serialKey.create({ data: { key: 'DEMO-ACCESS-KEY', tenantId: tenant.id, maxDevices: 999999, isActive: true } })
            }
          }
          if (demoKey) {
            await db.device.create({ data: { deviceId, serialKeyId: demoKey.id, tenantId: demoUser.organization?.tenantId || null, organizationId: demoUser.organizationId } })
            await db.serialKey.update({ where: { id: demoKey.id }, data: { usedDevices: { increment: 1 } } })
          }
        }
      } catch { /* non-blocking */ }
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
    return NextResponse.json({ error: 'Failed to login as demo' }, { status: 500 })
  }
}
