import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await db.communicationTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Template GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const template = await db.communicationTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Template PUT error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.communicationTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    console.error('Template DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
