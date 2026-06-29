import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (category) where.category = category

    const vendors = await db.vendor.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: vendors })
  } catch (error) {
    console.error('Vendors GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const vendor = await db.vendor.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        category: body.category || null,
        rating: body.rating || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error('Vendors POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
