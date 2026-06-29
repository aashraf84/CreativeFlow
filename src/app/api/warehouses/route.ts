import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const warehouses = await db.warehouse.findMany({
      where: { organizationId: org.id },
      include: {
        _count: { select: { stockLevels: true, stockMovements: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: warehouses })
  } catch (error) {
    console.error('Warehouses GET error:', error)
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

    const warehouse = await db.warehouse.create({
      data: {
        name: body.name,
        code: body.code,
        location: body.location || null,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
      include: {
        _count: { select: { stockLevels: true, stockMovements: true } },
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error('Warehouses POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
