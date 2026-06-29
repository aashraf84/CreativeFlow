import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const folder = searchParams.get('folder')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (type) where.type = type
    if (folder) where.folder = folder
    if (clientId) where.clientId = clientId

    const assets = await db.asset.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Assets GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const body = await request.json()
    const asset = await db.asset.create({
      data: {
        name: body.name,
        type: body.type,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl || null,
        size: body.size || 0,
        mimeType: body.mimeType || null,
        tags: body.tags || null,
        folder: body.folder || null,
        metadata: body.metadata ? (typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata)) : null,
        uploadedById: body.uploadedById,
        clientId: body.clientId || null,
        organizationId: org.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('Assets POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
