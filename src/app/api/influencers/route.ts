import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const niche = searchParams.get('niche')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (platform) where.platform = platform
    if (status) where.status = status
    if (niche) where.niche = { contains: niche }

    const influencers = await db.influencer.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ influencers })
  } catch (error) {
    console.error('Influencers GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch influencers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
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
    return NextResponse.json({ error: 'Failed to create influencer' }, { status: 500 })
  }
}
