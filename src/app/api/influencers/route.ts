import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getFollowerRange(followers: number): string {
  if (followers < 10000) return 'nano'
  if (followers < 100000) return 'micro'
  if (followers < 500000) return 'mid'
  if (followers < 1000000) return 'macro'
  return 'mega'
}

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ influencers: [], data: [] })
    }

    const { searchParams } = new URL(request.url)

    // Parse all 16 query parameters
    const search = searchParams.get('search')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const niche = searchParams.get('niche')
    const minFollowers = searchParams.get('minFollowers')
    const maxFollowers = searchParams.get('maxFollowers')
    const minEngagement = searchParams.get('minEngagement')
    const maxEngagement = searchParams.get('maxEngagement')
    const minRate = searchParams.get('minRate')
    const maxRate = searchParams.get('maxRate')
    const clientId = searchParams.get('clientId')
    const campaignId = searchParams.get('campaignId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build where clause
    const where: Record<string, unknown> = { organizationId: org.id }

    // Full-text search across name, username, niche, email, notes
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { niche: { contains: search } },
        { email: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (platform) where.platform = platform
    if (status) where.status = status
    if (niche) where.niche = { contains: niche }

    // Followers range filter
    if (minFollowers || maxFollowers) {
      const followersFilter: Record<string, number> = {}
      if (minFollowers) followersFilter.gte = parseInt(minFollowers, 10)
      if (maxFollowers) followersFilter.lte = parseInt(maxFollowers, 10)
      where.followers = followersFilter
    }

    // Engagement rate range filter
    if (minEngagement || maxEngagement) {
      const engagementFilter: Record<string, number> = {}
      if (minEngagement) engagementFilter.gte = parseFloat(minEngagement)
      if (maxEngagement) engagementFilter.lte = parseFloat(maxEngagement)
      where.engagementRate = engagementFilter
    }

    // Rate range filter
    if (minRate || maxRate) {
      const rateFilter: Record<string, number> = {}
      if (minRate) rateFilter.gte = parseFloat(minRate)
      if (maxRate) rateFilter.lte = parseFloat(maxRate)
      where.rate = rateFilter
    }

    if (clientId) where.clientId = clientId
    if (campaignId) where.campaignId = campaignId

    // Validate and build sort
    const allowedSortFields = ['name', 'followers', 'engagementRate', 'rate', 'createdAt', 'contractEnd']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // Get total count and paginated results in parallel
    const total = await db.influencer.count({ where })
    const totalPages = Math.ceil(total / limit)

    const influencers = await db.influencer.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { [validSortBy]: validSortOrder },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Build facets from all org influencers (for navigation/filtering UI)
    const allInfluencers = await db.influencer.findMany({
      where: { organizationId: org.id },
      select: {
        platform: true,
        status: true,
        niche: true,
        followers: true,
        engagementRate: true,
        rate: true,
      },
    })

    // Platform facets
    const platforms: Record<string, number> = {}
    allInfluencers.forEach((inf) => {
      platforms[inf.platform] = (platforms[inf.platform] || 0) + 1
    })

    // Status facets
    const statuses: Record<string, number> = {}
    allInfluencers.forEach((inf) => {
      statuses[inf.status] = (statuses[inf.status] || 0) + 1
    })

    // Niche facets
    const niches: Record<string, number> = {}
    allInfluencers.forEach((inf) => {
      if (inf.niche) {
        niches[inf.niche] = (niches[inf.niche] || 0) + 1
      }
    })

    // Follower range facets
    const followerRanges: Record<string, number> = { nano: 0, micro: 0, mid: 0, macro: 0, mega: 0 }
    allInfluencers.forEach((inf) => {
      const range = getFollowerRange(inf.followers)
      followerRanges[range] += 1
    })

    // Average engagement, rate, and total reach
    const avgEngagement = allInfluencers.length > 0
      ? Math.round((allInfluencers.reduce((sum, inf) => sum + inf.engagementRate, 0) / allInfluencers.length) * 100) / 100
      : 0

    const ratesWithValues = allInfluencers.filter((inf) => inf.rate !== null)
    const avgRate = ratesWithValues.length > 0
      ? Math.round(ratesWithValues.reduce((sum, inf) => sum + (inf.rate || 0), 0) / ratesWithValues.length)
      : 0

    const totalReach = allInfluencers.reduce((sum, inf) => sum + inf.followers, 0)

    return NextResponse.json({
      influencers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      facets: {
        platforms,
        statuses,
        niches,
        followerRanges,
        avgEngagement,
        avgRate,
        totalReach,
      },
    })
  } catch (error) {
    console.error('Influencers GET error:', error)
    return NextResponse.json({ influencers: [], data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ influencers: [], data: [] })
    }

    const body = await request.json()
    const influencer = await db.influencer.create({
      data: {
        name: body.name,
        username: body.username,
        platform: body.platform,
        followers: body.followers || 0,
        engagementRate: body.engagementRate || 0,
        niche: body.niche || null,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
        status: body.status || 'prospect',
        rate: body.rate || null,
        contractStart: body.contractStart ? new Date(body.contractStart) : null,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        clientId: body.clientId || null,
        campaignId: body.campaignId || null,
        organizationId: org.id,
      },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ influencer }, { status: 201 })
  } catch (error) {
    console.error('Influencers POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
