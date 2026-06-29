import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice
    if (body.reorderLevel !== undefined) updateData.reorderLevel = body.reorderLevel
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        stockLevels: {
          include: {
            warehouse: true,
          },
        },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.stockMovement.deleteMany({ where: { productId: id } })
    await db.purchaseOrderItem.deleteMany({ where: { productId: id } })
    await db.stockLevel.deleteMany({ where: { productId: id } })
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
