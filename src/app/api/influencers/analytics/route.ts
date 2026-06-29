import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const allInfluencers = await db.influencer.findMany({
      where: { organizationId: org.id },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    // ============================================
    // Overview
    // ============================================
    const totalInfluencers = allInfluencers.length
    const activeCollaborations = allInfluencers.filter(i => i.status === 'active').length
    const avgEngagement = totalInfluencers > 0
      ? Math.round((allInfluencers.reduce((sum, i) => sum + i.engagementRate, 0) / totalInfluencers) * 100) / 100
      : 0
    const totalReach = allInfluencers.reduce((sum, i) => sum + i.followers, 0)
    const ratesWithValues = allInfluencers.filter(i => i.rate !== null)
    const avgRate = ratesWithValues.length > 0
      ? Math.round(ratesWithValues.reduce((sum, i) => sum + (i.rate || 0), 0) / ratesWithValues.length * 100) / 100
      : 0

    // ============================================
    // Follower Tiers
    // ============================================
    const followerTiers: Record<string, { label: string; count: number }> = {
      nano: { label: 'Nano', count: 0 },
      micro: { label: 'Micro', count: 0 },
      midTier: { label: 'Mid-Tier', count: 0 },
      macro: { label: 'Macro', count: 0 },
      mega: { label: 'Mega', count: 0 },
    }
    allInfluencers.forEach(i => {
      if (i.followers >= 1000000) followerTiers.mega.count++
      else if (i.followers >= 500000) followerTiers.macro.count++
      else if (i.followers >= 100000) followerTiers.midTier.count++
      else if (i.followers >= 10000) followerTiers.micro.count++
      else followerTiers.nano.count++
    })

    // ============================================
    // By Platform
    // ============================================
    const platformMap: Record<string, { count: number; totalEngagement: number; totalRate: number; rateCount: number }> = {}
    allInfluencers.forEach(i => {
      if (!platformMap[i.platform]) {
        platformMap[i.platform] = { count: 0, totalEngagement: 0, totalRate: 0, rateCount: 0 }
      }
      platformMap[i.platform].count++
      platformMap[i.platform].totalEngagement += i.engagementRate
      if (i.rate !== null) {
        platformMap[i.platform].totalRate += i.rate
        platformMap[i.platform].rateCount++
      }
    })
    const byPlatform = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      count: data.count,
      avgEngagement: data.count > 0 ? Math.round((data.totalEngagement / data.count) * 100) / 100 : 0,
      avgRate: data.rateCount > 0 ? Math.round((data.totalRate / data.rateCount) * 100) / 100 : 0,
    }))

    // ============================================
    // Top Performers (top 5 by engagement rate)
    // ============================================
    const topPerformers = [...allInfluencers]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5)

    // ============================================
    // By Niche
    // ============================================
    const nicheMap: Record<string, number> = {}
    allInfluencers.forEach(i => {
      if (i.niche) {
        i.niche.split(',').forEach(n => {
          const trimmed = n.trim()
          if (trimmed) nicheMap[trimmed] = (nicheMap[trimmed] || 0) + 1
        })
      }
    })
    const byNiche = Object.entries(nicheMap)
      .map(([niche, count]) => ({ niche, count }))
      .sort((a, b) => b.count - a.count)

    // ============================================
    // Contracts Expiring in Next 30 Days
    // ============================================
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    const contractExpiring = allInfluencers.filter(i => {
      if (!i.contractEnd) return false
      const endDate = new Date(i.contractEnd)
      return endDate >= now && endDate <= thirtyDaysFromNow
    })

    // ============================================
    // Status Distribution
    // ============================================
    const statusMap: Record<string, number> = {}
    allInfluencers.forEach(i => {
      statusMap[i.status] = (statusMap[i.status] || 0) + 1
    })
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

    return NextResponse.json({
      overview: {
        totalInfluencers,
        activeCollaborations,
        avgEngagement,
        totalReach,
        avgRate,
      },
      followerTiers,
      byPlatform,
      topPerformers,
      byNiche,
      contractExpiring,
      statusDistribution,
    })
  } catch (error) {
    console.error('Influencer Analytics GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
