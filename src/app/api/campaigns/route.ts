import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, industry: true, logo: true, status: true } },
        _count: { select: { contents: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
