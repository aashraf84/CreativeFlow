import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { organizationId: org.id }

    if (type) where.type = type
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const templates = await db.communicationTemplate.findMany({
      where,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.name || !body.body || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, body, type' },
        { status: 400 }
      )
    }

    const template = await db.communicationTemplate.create({
      data: {
        name: body.name,
        subject: body.subject || null,
        body: body.body,
        type: body.type,
        category: body.category || null,
        variables: body.variables || null,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
