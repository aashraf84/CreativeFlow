import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.taxRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.rate !== undefined) updateData.rate = body.rate
    if (body.type !== undefined) updateData.type = body.type
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const taxRate = await db.taxRate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: taxRate })
  } catch (error) {
    console.error('TaxRate PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.taxRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Soft delete - set isActive to false
    const taxRate = await db.taxRate.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ data: taxRate, message: 'Tax rate deactivated' })
  } catch (error) {
    console.error('TaxRate DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
