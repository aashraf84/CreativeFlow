import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const dateFilter: Record<string, unknown> = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Content due dates
    const contentWhere: Record<string, unknown> = {
      organizationId: org.id,
      dueDate: Object.keys(dateFilter).length > 0 ? dateFilter : { not: null },
    }

    const contentDueDates = await db.content.findMany({
      where: contentWhere,
      select: {
        id: true,
        title: true,
        type: true,
        stage: true,
        priority: true,
        dueDate: true,
        team: { select: { id: true, name: true, color: true } },
        campaign: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Scheduled posts
    const postWhere: Record<string, unknown> = {
      organizationId: org.id,
      status: { in: ['scheduled', 'published'] },
      scheduledAt: Object.keys(dateFilter).length > 0 ? dateFilter : { not: null },
    }

    const scheduledPosts = await db.post.findMany({
      where: postWhere,
      select: {
        id: true,
        content: true,
        platform: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        contentItem: { select: { id: true, title: true, type: true } },
      },
    })

    // Format as calendar events
    const contentEvents = contentDueDates
      .filter((c) => c.dueDate !== null)
      .map((c) => ({
        id: `content-${c.id}`,
        type: 'content_due',
        title: c.title,
        contentType: c.type,
        stage: c.stage,
        priority: c.priority,
        date: c.dueDate,
        team: c.team,
        campaign: c.campaign,
        assignee: c.assignee,
      }))

    const postEvents = scheduledPosts
      .filter((p) => p.scheduledAt !== null)
      .map((p) => ({
        id: `post-${p.id}`,
        type: p.status === 'published' ? 'post_published' : 'post_scheduled',
        title: p.contentItem?.title || p.content.substring(0, 50),
        platform: p.platform,
        date: p.scheduledAt,
        publishedAt: p.publishedAt,
        socialAccount: p.socialAccount,
        contentItem: p.contentItem,
      }))

    // Combine and sort by date
    const events = [...contentEvents, ...postEvents].sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
    )

    return NextResponse.json({ events, totalContentDue: contentEvents.length, totalPosts: postEvents.length })
  } catch (error) {
    console.error('Calendar GET error:', error)
    return NextResponse.json({ data: [] })
  }
}
