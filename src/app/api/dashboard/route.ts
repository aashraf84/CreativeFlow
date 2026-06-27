import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get the first organization (Vortex Digital)
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found. Please seed the database.' }, { status: 404 })
    }

    // Total content by stage
    const allContent = await db.content.findMany({
      where: { organizationId: org.id },
      select: { stage: true },
    })
    const contentByStage = allContent.reduce((acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Posts published this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const postsPublishedThisWeek = await db.post.count({
      where: {
        organizationId: org.id,
        status: 'published',
        publishedAt: { gte: oneWeekAgo },
      },
    })

    // Posts published this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    const postsPublishedThisMonth = await db.post.count({
      where: {
        organizationId: org.id,
        status: 'published',
        publishedAt: { gte: oneMonthAgo },
      },
    })

    // Scheduled posts count
    const scheduledPosts = await db.post.count({
      where: {
        organizationId: org.id,
        status: 'scheduled',
      },
    })

    // Draft posts count
    const draftPosts = await db.post.count({
      where: {
        organizationId: org.id,
        status: 'draft',
      },
    })

    // Team productivity stats
    const teams = await db.team.findMany({
      where: { organizationId: org.id },
      include: {
        members: { include: { user: true } },
        contents: {
          where: { stage: { not: 'archived' } },
          select: { id: true, stage: true, priority: true },
        },
      },
    })

    const teamStats = teams.map((team) => ({
      id: team.id,
      name: team.name,
      type: team.type,
      color: team.color,
      memberCount: team.members.length,
      contentCount: team.contents.length,
      contentByStage: team.contents.reduce((acc, item) => {
        acc[item.stage] = (acc[item.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }))

    // Content by type
    const contentByType = allContent.length > 0
      ? (await db.content.findMany({
          where: { organizationId: org.id },
          select: { type: true },
        })).reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      : {}

    // Content by priority
    const contentByPriority = (await db.content.findMany({
      where: { organizationId: org.id, stage: { not: 'archived' } },
      select: { priority: true },
    })).reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Active campaigns
    const activeCampaigns = await db.campaign.count({
      where: { organizationId: org.id, status: 'active' },
    })

    // Total clients
    const totalClients = await db.client.count({
      where: { organizationId: org.id },
    })

    // Social accounts count
    const socialAccountsCount = await db.socialAccount.count({
      where: { organizationId: org.id, isActive: true },
    })

    // Recent activity log (last 20)
    const recentActivity = await db.activityLog.findMany({
      where: { organizationId: org.id },
      include: {
        actor: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Overdue content
    const overdueContent = await db.content.count({
      where: {
        organizationId: org.id,
        dueDate: { lt: new Date() },
        stage: { notIn: ['archived', 'disseminate'] },
      },
    })

    // ── New dashboard stats ──────────────────────────────────────────

    // Pending approvals count
    const pendingApprovals = await db.approval.count({
      where: { organizationId: org.id, status: 'pending' },
    })

    // Revenue stats from invoices
    const invoices = await db.invoice.findMany({
      where: { organizationId: org.id },
      select: { total: true, status: true },
    })
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0)
    const outstandingRevenue = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft').reduce((sum, inv) => sum + inv.total, 0)

    // Time tracked this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const timeEntriesThisWeek = await db.timeEntry.findMany({
      where: {
        organizationId: org.id,
        date: { gte: weekStart },
      },
      select: { hours: true },
    })
    const timeTrackedThisWeek = timeEntriesThisWeek.reduce((sum, entry) => sum + entry.hours, 0)

    // Unread inbox count
    const unreadInbox = await db.inboxMessage.count({
      where: { organizationId: org.id, status: 'unread' },
    })

    // Asset count
    const assetCount = await db.asset.count({
      where: { organizationId: org.id },
    })

    // Platform breakdown - posts by platform
    const postsByPlatform = await db.post.findMany({
      where: { organizationId: org.id },
      select: { platform: true, engagement: true },
    })
    const platformBreakdown = Object.entries(
      postsByPlatform.reduce((acc, post) => {
        if (!acc[post.platform]) acc[post.platform] = { posts: 0, engagement: 0 }
        acc[post.platform].posts++
        // Parse engagement JSON to get total engagement
        if (post.engagement) {
          try {
            const eng = JSON.parse(post.engagement)
            const total = Object.values(eng).reduce((sum: number, v: unknown) => sum + (typeof v === 'number' ? v : 0), 0)
            acc[post.platform].engagement += total
          } catch { /* ignore */ }
        }
        return acc
      }, {} as Record<string, { posts: number; engagement: number }>)
    ).map(([platform, data]) => ({ platform, posts: data.posts, engagement: data.engagement }))

    return NextResponse.json({
      contentByStage,
      contentByType,
      contentByPriority,
      postsPublishedThisWeek,
      postsPublishedThisMonth,
      scheduledPosts,
      draftPosts,
      teamStats,
      activeCampaigns,
      totalClients,
      socialAccountsCount,
      overdueContent,
      totalContent: allContent.length,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        details: a.details ? JSON.parse(a.details) : null,
        actor: a.actor,
        createdAt: a.createdAt,
      })),
      pendingApprovals,
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      timeTrackedThisWeek,
      unreadInbox,
      assetCount,
      platformBreakdown,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
