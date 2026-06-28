import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/serial-key - Validate serial key and register device
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
      include: {
        tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } },
        devices: true,
      }
    })

    if (!key) return NextResponse.json({ error: 'Invalid serial key' }, { status: 404 })
    if (!key.isActive) return NextResponse.json({ error: 'This serial key has been deactivated' }, { status: 403 })
    if (key.expiresAt && key.expiresAt < new Date()) return NextResponse.json({ error: 'This serial key has expired' }, { status: 403 })
    if (key.tenant.status !== 'active') return NextResponse.json({ error: 'Tenant account is not active' }, { status: 403 })

    const existingDevice = key.devices.find((d) => d.deviceId === deviceId)

    if (!existingDevice) {
      if (key.usedDevices >= key.maxDevices) {
        return NextResponse.json({ error: `Device limit reached. This key allows ${key.maxDevices} device(s).` }, { status: 403 })
      }
      await db.device.create({
        data: { deviceId, serialKeyId: key.id, tenantId: key.tenantId, userAgent: userAgent || null }
      })
      await db.serialKey.update({ where: { id: key.id }, data: { usedDevices: { increment: 1 } } })
    } else {
      await db.device.update({ where: { id: existingDevice.id }, data: { lastSeenAt: new Date() } })
    }

    return NextResponse.json({
      success: true,
      deviceRegistered: !existingDevice,
      tenant: { id: key.tenant.id, name: key.tenant.name, slug: key.tenant.slug, plan: key.tenant.plan },
    })
  } catch (error) {
    console.error('Serial key validation error:', error)
    return NextResponse.json({ error: 'Failed to validate serial key' }, { status: 500 })
  }
}

// GET /api/auth/serial-key - Check if device is registered
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
    if (!device.serialKey.isActive) return NextResponse.json({ registered: false, reason: 'Serial key deactivated' })
    if (device.serialKey.expiresAt && device.serialKey.expiresAt < new Date()) return NextResponse.json({ registered: false, reason: 'Serial key expired' })
    if (device.serialKey.tenant.status !== 'active') return NextResponse.json({ registered: false, reason: 'Tenant inactive' })

    await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } })

    return NextResponse.json({
      registered: true,
      tenant: { id: device.serialKey.tenant.id, name: device.serialKey.tenant.name, slug: device.serialKey.tenant.slug, plan: device.serialKey.tenant.plan }
    })
  } catch (error) {
    console.error('Device check error:', error)
    return NextResponse.json({ registered: false, error: 'Failed to check device' }, { status: 500 })
  }
}
