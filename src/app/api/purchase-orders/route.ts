import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        poItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    })

    return NextResponse.json({ data: purchaseOrders })
  } catch (error) {
    console.error('PurchaseOrders GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        number: body.number,
        vendorId: body.vendorId,
        status: body.status || 'draft',
        items: body.items || '[]',
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        total: body.total || 0,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        notes: body.notes || null,
        organizationId: org.id,
        poItems: body.poItems
          ? {
              create: body.poItems.map((item: Record<string, unknown>) => ({
                productId: item.productId as string,
                quantity: item.quantity as number,
                unitPrice: item.unitPrice as number,
                total: item.total as number,
              })),
            }
          : undefined,
      },
      include: {
        vendor: true,
        poItems: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error('PurchaseOrders POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
