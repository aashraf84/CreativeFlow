import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
    if (body.tax !== undefined) updateData.tax = body.tax
    if (body.total !== undefined) updateData.total = body.total
    if (body.expectedDate !== undefined) updateData.expectedDate = body.expectedDate ? new Date(body.expectedDate) : null
    if (body.notes !== undefined) updateData.notes = body.notes

    const purchaseOrder = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        poItems: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error('PurchaseOrder PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
    await db.purchaseOrder.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Purchase order deleted' })
  } catch (error) {
    console.error('PurchaseOrder DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
