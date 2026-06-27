import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.expense.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.category !== undefined) updateData.category = body.category
    if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : null
    if (body.status !== undefined) updateData.status = body.status
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl
    if (body.approvedById !== undefined) updateData.approvedById = body.approvedById
    if (body.approvedAt !== undefined) updateData.approvedAt = body.approvedAt ? new Date(body.approvedAt) : new Date()

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        submittedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Expense PUT error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Expense deleted' })
  } catch (error) {
    console.error('Expense DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
