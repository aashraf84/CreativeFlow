import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // ============================================
    // Post Engagement Stats
    // ============================================
    const publishedPosts = await db.post.findMany({
      where: {
        organizationId: org.id,
        status: 'published',
        publishedAt: { gte: startDate },
      },
      select: {
        id: true,
        platform: true,
        engagement: true,
        publishedAt: true,
        socialAccount: { select: { platform: true, username: true } },
      },
    })

    // Aggregate engagement metrics
    const totalEngagement = {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      saves: 0,
      views: 0,
    }

    const platformEngagement: Record<string, typeof totalEngagement & { postCount: number }> = {}

    publishedPosts.forEach((post) => {
      const engagement = post.engagement ? JSON.parse(post.engagement) : {}

      totalEngagement.likes += engagement.likes || 0
      totalEngagement.comments += engagement.comments || 0
      totalEngagement.shares += engagement.shares || engagement.retweets || 0
      totalEngagement.impressions += engagement.impressions || 0
      totalEngagement.saves += engagement.saves || 0
      totalEngagement.views += engagement.views || 0

      const platform = post.platform
      if (!platformEngagement[platform]) {
        platformEngagement[platform] = {
          likes: 0, comments: 0, shares: 0, impressions: 0, saves: 0, views: 0, postCount: 0,
        }
      }
      platformEngagement[platform].likes += engagement.likes || 0
      platformEngagement[platform].comments += engagement.comments || 0
      platformEngagement[platform].shares += engagement.shares || engagement.retweets || 0
      platformEngagement[platform].impressions += engagement.impressions || 0
      platformEngagement[platform].saves += engagement.saves || 0
      platformEngagement[platform].views += engagement.views || 0
      platformEngagement[platform].postCount += 1
    })

    // ============================================
    // Team Output Stats
    // ============================================
    const teams = await db.team.findMany({
      where: { organizationId: org.id },
      include: {
        _count: { select: { contents: true } },
        contents: {
          where: { createdAt: { gte: startDate } },
          select: { id: true, stage: true, createdAt: true },
        },
      },
    })

    const teamOutput = teams.map((team) => ({
      id: team.id,
      name: team.name,
      type: team.type,
      color: team.color,
      totalContent: team._count.contents,
      contentInPeriod: team.contents.length,
      contentByStage: team.contents.reduce((acc, c) => {
        acc[c.stage] = (acc[c.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }))

    // ============================================
    // Platform Breakdown
    // ============================================
    const socialAccounts = await db.socialAccount.findMany({
      where: { organizationId: org.id, isActive: true },
      select: {
        id: true,
        platform: true,
        username: true,
        followers: true,
        isVerified: true,
        _count: { select: { posts: true } },
      },
    })

    const platformBreakdown = socialAccounts.reduce((acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = {
          platform: account.platform,
          accounts: 0,
          totalFollowers: 0,
          totalPosts: 0,
          verifiedAccounts: 0,
        }
      }
      acc[account.platform].accounts += 1
      acc[account.platform].totalFollowers += account.followers
      acc[account.platform].totalPosts += account._count.posts
      if (account.isVerified) acc[account.platform].verifiedAccounts += 1
      return acc
    }, {} as Record<string, { platform: string; accounts: number; totalFollowers: number; totalPosts: number; verifiedAccounts: number }>)

    // ============================================
    // Content Pipeline Stats
    // ============================================
    const contentByStage = await db.content.groupBy({
      by: ['stage'],
      where: { organizationId: org.id },
      _count: { id: true },
    })

    const pipelineStats = contentByStage.reduce((acc, item) => {
      acc[item.stage] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // ============================================
    // Publishing Frequency (posts per day in period)
    // ============================================
    const publishingFrequency = publishedPosts.length / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / 86400000))

    // ============================================
    // Top Performing Posts
    // ============================================
    const topPosts = publishedPosts
      .map((post) => {
        const engagement = post.engagement ? JSON.parse(post.engagement) : {}
        const totalInteractions = (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || engagement.retweets || 0)
        return {
          id: post.id,
          platform: post.platform,
          socialAccount: post.socialAccount,
          publishedAt: post.publishedAt,
          engagement,
          totalInteractions,
        }
      })
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, 10)

    return NextResponse.json({
      period,
      startDate,
      endDate: now,
      totalEngagement,
      platformEngagement,
      teamOutput,
      platformBreakdown: Object.values(platformBreakdown),
      pipelineStats,
      publishedPostsCount: publishedPosts.length,
      publishingFrequency: Math.round(publishingFrequency * 10) / 10,
      topPerformingPosts: topPosts,
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
