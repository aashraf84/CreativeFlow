import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const socialAccountId = searchParams.get('socialAccountId')
    const contentId = searchParams.get('contentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status
    if (platform) where.platform = platform
    if (socialAccountId) where.socialAccountId = socialAccountId
    if (contentId) where.contentId = contentId

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          socialAccount: { select: { id: true, platform: true, username: true, displayName: true, avatar: true, followers: true } },
          contentItem: { select: { id: true, title: true, type: true, stage: true } },
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ])

    // Parse engagement JSON for each post
    const postsWithEngagement = posts.map((post) => ({
      ...post,
      engagement: post.engagement ? JSON.parse(post.engagement) : null,
    }))

    return NextResponse.json({
      posts: postsWithEngagement,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Posts GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    if (!body.content || !body.platform || !body.socialAccountId || !body.userId) {
      return NextResponse.json(
        { error: 'Content, platform, socialAccountId, and userId are required' },
        { status: 400 }
      )
    }

    const post = await db.post.create({
      data: {
        content: body.content,
        mediaUrls: body.mediaUrls || null,
        platform: body.platform,
        status: body.status || 'draft',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        socialAccountId: body.socialAccountId,
        contentId: body.contentId || null,
        userId: body.userId,
        organizationId: org.id,
      },
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        contentItem: { select: { id: true, title: true, type: true, stage: true } },
      },
    })

    // Log activity
    if (body.status === 'scheduled') {
      await db.activityLog.create({
        data: {
          action: 'created',
          entity: 'post',
          entityId: post.id,
          details: JSON.stringify({ platform: body.platform, status: 'scheduled', scheduledAt: body.scheduledAt }),
          organizationId: org.id,
          actorId: body.userId,
        },
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Posts POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
