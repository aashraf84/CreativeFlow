import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const asset = await db.iTAsset.findUnique({
      where: { id },
      include: { issuances: { where: { status: 'issued' }, orderBy: { issueDate: 'desc' }, take: 1 } },
    })
    if (!asset) {
      return NextResponse.json({ data: [] })
    }

    // Find the active issuance for this asset
    const activeIssuance = asset.issuances[0]
    if (!activeIssuance) {
      return NextResponse.json({ success: true })
    }

    const returnCondition = body.returnCondition || asset.condition

    // Update the issuance record
    const issuance = await db.assetIssuance.update({
      where: { id: activeIssuance.id },
      data: {
        actualReturnDate: new Date(),
        returnCondition,
        status: 'returned',
        notes: body.notes ? `${activeIssuance.notes || ''}\nReturn note: ${body.notes}`.trim() : activeIssuance.notes,
      },
      include: {
        asset: true,
        issuedTo: true,
        issuedBy: true,
      },
    })

    // Update the asset: unassign, set status to "available", update condition
    await db.iTAsset.update({
      where: { id },
      data: {
        assignedToId: null,
        status: 'available',
        condition: returnCondition,
      },
    })

    return NextResponse.json(issuance)
  } catch (error) {
    console.error('IT Asset Return POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
