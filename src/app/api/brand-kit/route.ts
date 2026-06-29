import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (clientId) where.clientId = clientId
    if (type) where.type = type

    const brandKits = await db.brandKit.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ brandKits })
  } catch (error) {
    console.error('BrandKit GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const brandKit = await db.brandKit.create({
      data: {
        name: body.name,
        type: body.type,
        value: typeof body.value === 'string' ? body.value : JSON.stringify(body.value),
        clientId: body.clientId || null,
        organizationId: org.id,
      },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
    })

    return NextResponse.json({ brandKit }, { status: 201 })
  } catch (error) {
    console.error('BrandKit POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
