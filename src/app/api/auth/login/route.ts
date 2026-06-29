import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/login - Login with email and password
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, deviceId } = body

    if (!email || typeof email !== 'string') return NextResponse.json({ success: true })
    if (!password || typeof password !== 'string') return NextResponse.json({ success: true })

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: { select: { id: true, name: true, slug: true, logo: true, plan: true, tenantId: true } } }
    })

    if (!user) return NextResponse.json({ success: false })
    if (user.password !== password) return NextResponse.json({ success: false })

    if (deviceId) {
      const device = await db.device.findUnique({
        where: { deviceId },
        include: { serialKey: { select: { tenantId: true } } }
      })
      if (!device) return NextResponse.json({ error: 'Device not registered. Please enter your serial key first.' }, { status: 403 })
      if (user.tenantId && device.serialKey.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'This account does not belong to the registered tenant' }, { status: 403 })
      }
    }

    if (user.isDemo) return NextResponse.json({ error: 'Please use the Demo Login button for demo access' }, { status: 403 })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id, email: user.email, name: user.name, avatar: user.avatar,
        role: user.role, isDemo: false, organizationId: user.organizationId, organization: user.organization,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ data: [] })
  }
}
