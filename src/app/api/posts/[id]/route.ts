import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await db.post.findUnique({
      where: { id },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true, avatar: true, followers: true } },
        contentItem: { select: { id: true, title: true, type: true, stage: true } },
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({
      ...post,
      engagement: post.engagement ? JSON.parse(post.engagement) : null,
    })
  } catch (error) {
    console.error('Post GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const currentPost = await db.post.findUnique({ where: { id }, select: { status: true } })
    if (!currentPost) {
      return NextResponse.json({ data: [] })
    }

    const updateData: Record<string, unknown> = {}
    if (body.content !== undefined) updateData.content = body.content
    if (body.mediaUrls !== undefined) updateData.mediaUrls = body.mediaUrls
    if (body.status !== undefined) updateData.status = body.status
    if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
    if (body.engagement !== undefined) updateData.engagement = JSON.stringify(body.engagement)
    if (body.failureReason !== undefined) updateData.failureReason = body.failureReason

    // If publishing, set publishedAt
    if (body.status === 'published' && !currentPost.status.includes('published')) {
      updateData.publishedAt = new Date()
    }

    const post = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        contentItem: { select: { id: true, title: true, type: true, stage: true } },
      },
    })

    // Log activity for status changes
    if (body.status && body.status !== currentPost.status) {
      const org = await db.organization.findFirst()
      if (org && body.actorId) {
        const socialAccount = await db.socialAccount.findUnique({
          where: { id: post.socialAccountId },
          select: { platform: true, username: true },
        })
        await db.activityLog.create({
          data: {
            action: body.status === 'published' ? 'published' : 'updated',
            entity: 'post',
            entityId: id,
            details: JSON.stringify({
              platform: socialAccount?.platform,
              account: socialAccount?.username,
              fromStatus: currentPost.status,
              toStatus: body.status,
            }),
            organizationId: org.id,
            actorId: body.actorId,
          },
        })
      }
    }

    return NextResponse.json({
      ...post,
      engagement: post.engagement ? JSON.parse(post.engagement) : null,
    })
  } catch (error) {
    console.error('Post PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    console.error('Post DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
