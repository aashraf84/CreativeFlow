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
    if (body.status === 'replied') updateData.repliedAt = new Date()

    const message = await db.inboxMessage.update({
      where: { id },
      data: updateData,
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true, avatar: true } },
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Inbox PUT error:', error)
    return NextResponse.json({ error: 'Failed to update inbox message' }, { status: 500 })
  }
}
