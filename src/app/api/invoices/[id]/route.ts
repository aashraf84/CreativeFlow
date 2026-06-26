import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.items !== undefined) updateData.items = typeof body.items === 'string' ? body.items : JSON.stringify(body.items)
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
    if (body.tax !== undefined) updateData.tax = body.tax
    if (body.total !== undefined) updateData.total = body.total
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId

    // Mark as paid
    if (body.status === 'paid') {
      updateData.paidAt = new Date()
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoice PUT error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Invoice deleted' })
  } catch (error) {
    console.error('Invoice DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
