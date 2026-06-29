import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const billable = searchParams.get('billable')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (userId) where.userId = userId
    if (clientId) where.clientId = clientId
    if (billable !== null && billable !== undefined) where.billable = billable === 'true'
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.date = dateFilter
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ timeEntries })
  } catch (error) {
    console.error('TimeEntries GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const timeEntry = await db.timeEntry.create({
      data: {
        description: body.description,
        hours: body.hours,
        billable: body.billable !== undefined ? body.billable : true,
        date: new Date(body.date),
        userId: body.userId,
        clientId: body.clientId || null,
        campaignId: body.campaignId || null,
        contentId: body.contentId || null,
        organizationId: org.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ timeEntry }, { status: 201 })
  } catch (error) {
    console.error('TimeEntries POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
