import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const warehouseId = searchParams.get('warehouseId')
    const type = searchParams.get('type')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (productId) where.productId = productId
    if (warehouseId) where.warehouseId = warehouseId
    if (type) where.type = type

    const stockMovements = await db.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: stockMovements })
  } catch (error) {
    console.error('StockMovements GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const stockMovement = await db.stockMovement.create({
      data: {
        productId: body.productId,
        warehouseId: body.warehouseId,
        type: body.type,
        quantity: body.quantity,
        reference: body.reference || null,
        notes: body.notes || null,
        organizationId: org.id,
      },
      include: {
        product: true,
        warehouse: true,
      },
    })

    // Update stock level
    const existingLevel = await db.stockLevel.findUnique({
      where: {
        productId_warehouseId: {
          productId: body.productId,
          warehouseId: body.warehouseId,
        },
      },
    })

    if (existingLevel) {
      const quantityChange = body.type === 'in' ? body.quantity : body.type === 'out' ? -body.quantity : body.quantity
      await db.stockLevel.update({
        where: { id: existingLevel.id },
        data: { quantity: existingLevel.quantity + quantityChange },
      })
    } else if (body.type === 'in') {
      await db.stockLevel.create({
        data: {
          productId: body.productId,
          warehouseId: body.warehouseId,
          quantity: body.quantity,
          reservedQuantity: 0,
          organizationId: org.id,
        },
      })
    }

    return NextResponse.json(stockMovement, { status: 201 })
  } catch (error) {
    console.error('StockMovements POST error:', error)
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 })
  }
}
