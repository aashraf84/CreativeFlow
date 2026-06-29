import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.iTAsset.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.assetTag !== undefined) updateData.assetTag = body.assetTag
    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    if (body.brand !== undefined) updateData.brand = body.brand
    if (body.model !== undefined) updateData.model = body.model
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber
    if (body.specifications !== undefined) updateData.specifications = body.specifications
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null
    if (body.purchaseCost !== undefined) updateData.purchaseCost = body.purchaseCost
    if (body.warrantyExpiry !== undefined) updateData.warrantyExpiry = body.warrantyExpiry ? new Date(body.warrantyExpiry) : null
    if (body.vendor !== undefined) updateData.vendor = body.vendor
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber
    if (body.location !== undefined) updateData.location = body.location
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.condition !== undefined) updateData.condition = body.condition

    // Handle assignedToId changes with automatic status updates
    if (body.assignedToId !== undefined) {
      if (body.assignedToId !== null) {
        // Assigning to a user → status becomes "issued"
        updateData.assignedToId = body.assignedToId
        if (body.status === undefined) {
          updateData.status = 'issued'
        }
      } else {
        // Unassigning → status becomes "available"
        updateData.assignedToId = null
        if (body.status === undefined) {
          updateData.status = 'available'
        }
      }
    }

    if (body.status !== undefined) updateData.status = body.status

    const itAsset = await db.iTAsset.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json(itAsset)
  } catch (error) {
    console.error('IT Asset PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.iTAsset.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    // Delete related issuances first
    await db.assetIssuance.deleteMany({ where: { assetId: id } })
    await db.iTAsset.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'IT Asset deleted' })
  } catch (error) {
    console.error('IT Asset DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
