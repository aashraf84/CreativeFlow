import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const asset = await db.iTAsset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json({ data: [] })
    }

    if (asset.status === 'issued') {
      return NextResponse.json({ success: true })
    }

    if (asset.status === 'retired' || asset.status === 'lost') {
      return NextResponse.json({ success: true })
    }

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    // Create the issuance record
    const issuance = await db.assetIssuance.create({
      data: {
        assetId: id,
        issuedToId: body.issuedToId,
        issuedById: body.issuedById,
        issueDate: new Date(),
        expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
        issueCondition: asset.condition,
        purpose: body.purpose || null,
        notes: body.notes || null,
        status: 'issued',
        organizationId: org.id,
      },
      include: {
        asset: true,
        issuedTo: true,
        issuedBy: true,
      },
    })

    // Update the asset: assign to user, set status to "issued"
    await db.iTAsset.update({
      where: { id },
      data: {
        assignedToId: body.issuedToId,
        status: 'issued',
      },
    })

    return NextResponse.json(issuance, { status: 201 })
  } catch (error) {
    console.error('IT Asset Issue POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
