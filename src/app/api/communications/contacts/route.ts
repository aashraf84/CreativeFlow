import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const preferredChannel = searchParams.get('preferredChannel')
    const isFavorite = searchParams.get('isFavorite')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where: Record<string, unknown> = { organizationId: org.id }

    if (role) where.role = role
    if (preferredChannel) where.preferredChannel = preferredChannel
    if (isFavorite !== null && isFavorite !== undefined && isFavorite !== '') {
      where.isFavorite = isFavorite === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
      ]
    }

    const total = await db.communicationContact.count({ where })
    const totalPages = Math.ceil(total / limit)

    const contacts = await db.communicationContact.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Contacts GET error:', error)
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

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const contact = await db.communicationContact.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        company: body.company || null,
        role: body.role || null,
        avatar: body.avatar || null,
        notes: body.notes || null,
        preferredChannel: body.preferredChannel || 'email',
        isFavorite: body.isFavorite || false,
        tags: body.tags || null,
        clientId: body.clientId || null,
        influencerId: body.influencerId || null,
        organizationId: org.id,
      },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Contacts POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
