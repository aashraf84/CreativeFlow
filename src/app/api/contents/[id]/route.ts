import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const content = await db.content.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
        campaign: { select: { id: true, name: true, status: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        posts: {
          include: {
            socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
          },
        },
      },
    })

    if (!content) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Content GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get current content for activity logging
    const currentContent = await db.content.findUnique({
      where: { id },
      select: { stage: true, assigneeId: true, title: true },
    })

    if (!currentContent) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.format !== undefined) updateData.format = body.format
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId
    if (body.teamId !== undefined) updateData.teamId = body.teamId
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null

    const content = await db.content.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    // Log activity for stage changes
    if (body.stage && body.stage !== currentContent.stage) {
      const org = await db.organization.findFirst()
      if (org && body.actorId) {
        await db.activityLog.create({
          data: {
            action: 'moved',
            entity: 'content',
            entityId: id,
            details: JSON.stringify({
              title: currentContent.title,
              fromStage: currentContent.stage,
              toStage: body.stage,
            }),
            organizationId: org.id,
            actorId: body.actorId,
          },
        })
      }
    }

    // Log activity for assignment changes
    if (body.assigneeId && body.assigneeId !== currentContent.assigneeId) {
      const org = await db.organization.findFirst()
      const assignee = await db.user.findUnique({ where: { id: body.assigneeId }, select: { name: true } })
      if (org && body.actorId) {
        await db.activityLog.create({
          data: {
            action: 'assigned',
            entity: 'content',
            entityId: id,
            details: JSON.stringify({
              title: currentContent.title,
              assignee: assignee?.name || 'Unknown',
            }),
            organizationId: org.id,
            actorId: body.actorId,
          },
        })
      }
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Content PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete related records first
    await db.comment.deleteMany({ where: { contentId: id } })
    await db.post.deleteMany({ where: { contentId: id } })
    await db.content.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Content deleted' })
  } catch (error) {
    console.error('Content DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
