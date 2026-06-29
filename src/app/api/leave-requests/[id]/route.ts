import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.leaveRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.approvedById !== undefined) updateData.approvedById = body.approvedById
    if (body.approvedAt !== undefined) updateData.approvedAt = body.approvedAt ? new Date(body.approvedAt) : new Date()
    if (body.comment !== undefined) updateData.comment = body.comment

    const leaveRequest = await db.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            department: true,
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
      },
    })

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error('LeaveRequest PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}
