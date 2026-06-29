import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.vendor.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.category !== undefined) updateData.category = body.category
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const vendor = await db.vendor.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Vendor PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.vendor.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Vendor deleted' })
  } catch (error) {
    console.error('Vendor DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
