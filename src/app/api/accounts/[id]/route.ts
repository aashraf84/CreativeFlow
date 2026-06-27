import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.account.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.code !== undefined) updateData.code = body.code
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.balance !== undefined) updateData.balance = body.balance
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const account = await db.account.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Account PUT error:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.account.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Account deleted' })
  } catch (error) {
    console.error('Account DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
