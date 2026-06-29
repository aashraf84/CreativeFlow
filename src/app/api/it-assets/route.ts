import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (category) where.category = category
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
      ]
    }

    const itAssets = await db.iTAsset.findMany({
      where,
      include: {
        assignedTo: true,
        issuances: {
          include: {
            issuedTo: true,
            issuedBy: true,
          },
          orderBy: { issueDate: 'desc' },
        },
        _count: { select: { issuances: true } },
      },
      orderBy: { assetTag: 'asc' },
    })

    return NextResponse.json({ data: itAssets })
  } catch (error) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Generate asset tag if not provided
    const assetTag = body.assetTag || `IT-${body.category.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    // Check unique assetTag
    const existing = await db.iTAsset.findUnique({ where: { assetTag } })
    if (existing) {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }

    const itAsset = await db.iTAsset.create({
      data: {
        assetTag,
        name: body.name,
        category: body.category,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        specifications: body.specifications || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost || null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        vendor: body.vendor || null,
        invoiceNumber: body.invoiceNumber || null,
        condition: body.condition || 'new',
        status: body.status || 'available',
        assignedToId: body.assignedToId || null,
        location: body.location || null,
        notes: body.notes || null,
        imageUrl: body.imageUrl || null,
        organizationId: org.id,
      },
      include: {
        assignedTo: true,
        _count: { select: { issuances: true } },
      },
    })

    return NextResponse.json(itAsset, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
