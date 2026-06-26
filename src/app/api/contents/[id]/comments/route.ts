import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const comments = await db.comment.findMany({
      where: { contentId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.text || !body.userId) {
      return NextResponse.json({ error: 'Text and userId are required' }, { status: 400 })
    }

    const comment = await db.comment.create({
      data: {
        text: body.text,
        contentId: id,
        userId: body.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    })

    // Log activity
    const org = await db.organization.findFirst()
    const content = await db.content.findUnique({ where: { id }, select: { title: true } })
    if (org && content) {
      await db.activityLog.create({
        data: {
          action: 'commented',
          entity: 'content',
          entityId: id,
          details: JSON.stringify({ title: content.title, comment: body.text.substring(0, 50) }),
          organizationId: org.id,
          actorId: body.userId,
        },
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comments POST error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
