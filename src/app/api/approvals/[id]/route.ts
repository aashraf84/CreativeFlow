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
    if (body.status) updateData.status = body.status
    if (body.comment !== undefined) updateData.comment = body.comment
    if (body.reviewedById) {
      updateData.reviewedById = body.reviewedById
      updateData.reviewedAt = new Date()
    }

    const approval = await db.approval.update({
      where: { id },
      data: updateData,
      include: {
        requestedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        content: { select: { id: true, title: true, type: true, stage: true } },
        post: { select: { id: true, content: true, platform: true, status: true } },
      },
    })

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('Approval PUT error:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
