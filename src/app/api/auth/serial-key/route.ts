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
    const { serialKey, deviceId, userAgent } = body

    if (!serialKey || typeof serialKey !== 'string') {
      return NextResponse.json({ error: 'Serial key is required' }, { status: 400 })
    }
    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    const key = await withRetry(() =>
      db.serialKey.findUnique({
        where: { key: serialKey.trim() },
        include: { tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } }
      })
    )

    if (!key) return NextResponse.json({ error: 'Invalid serial key' }, { status: 404 })
    if (!key.isActive) return NextResponse.json({ error: 'Serial key deactivated' }, { status: 403 })

    // Register device (non-blocking)
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
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    if (!deviceId) return NextResponse.json({ registered: false })

    const device = await db.device.findUnique({
      where: { deviceId },
      include: { serialKey: { include: { tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } } } }
    }).catch(() => null)

    if (!device) return NextResponse.json({ registered: false })

    return NextResponse.json({
      registered: true,
      tenant: { id: device.serialKey.tenant.id, name: device.serialKey.tenant.name, slug: device.serialKey.tenant.slug, plan: device.serialKey.tenant.plan }
    })
  } catch (error) {
    return NextResponse.json({ registered: false })
  }
}
