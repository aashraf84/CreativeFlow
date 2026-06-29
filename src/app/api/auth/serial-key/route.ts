import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/serial-key
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serialKey, deviceId, userAgent } = body

    if (!serialKey || typeof serialKey !== 'string') {
      return NextResponse.json({ error: 'Serial key is required' }, { status: 400 })
    }
    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    const key = await db.serialKey.findUnique({
      where: { key: serialKey.trim() },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } }
    })

    if (!key) return NextResponse.json({ error: 'Invalid serial key' }, { status: 404 })
    if (!key.isActive) return NextResponse.json({ error: 'Serial key deactivated' }, { status: 403 })

    // Register device (or update last seen)
    const existingDevice = await db.device.findUnique({ where: { deviceId } }).catch(() => null)
    if (!existingDevice) {
      await db.device.create({ data: { deviceId, serialKeyId: key.id, tenantId: key.tenantId, userAgent: userAgent || null } }).catch(() => {})
      await db.serialKey.update({ where: { id: key.id }, data: { usedDevices: { increment: 1 } } }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      tenant: { id: key.tenant.id, name: key.tenant.name, slug: key.tenant.slug, plan: key.tenant.plan },
    })
  } catch (error) {
    console.error('Serial key error:', error)
    return NextResponse.json({ error: 'Failed to validate serial key' }, { status: 500 })
  }
}

// GET /api/auth/serial-key
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    if (!deviceId) return NextResponse.json({ registered: false })

    const device = await db.device.findUnique({
      where: { deviceId },
      include: { serialKey: { include: { tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } } } }
    })

    if (!device) return NextResponse.json({ registered: false })

    return NextResponse.json({
      registered: true,
      tenant: { id: device.serialKey.tenant.id, name: device.serialKey.tenant.name, slug: device.serialKey.tenant.slug, plan: device.serialKey.tenant.plan }
    })
  } catch (error) {
    console.error('Device check error:', error)
    return NextResponse.json({ registered: false })
  }
}
