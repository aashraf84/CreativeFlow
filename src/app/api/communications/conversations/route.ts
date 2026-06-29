import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const clientId = searchParams.get('clientId')
    const influencerId = searchParams.get('influencerId')
    const campaignId = searchParams.get('campaignId')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const where: Record<string, unknown> = { organizationId: org.id }

    if (type) where.type = type
    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId
    if (clientId) where.clientId = clientId
    if (influencerId) where.influencerId = influencerId
    if (campaignId) where.campaignId = campaignId

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { lastMessagePreview: { contains: search } },
      ]
    }

    const total = await db.conversation.count({ where })
    const totalPages = Math.ceil(total / limit)

    const conversations = await db.conversation.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
        campaign: { select: { id: true, name: true, status: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            body: true,
            type: true,
            direction: true,
            senderName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      conversations,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Conversations GET error:', error)
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

    if (!body.subject || !body.type || !body.channel || !body.recipientName || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, type, channel, recipientName, body' },
        { status: 400 }
      )
    }

    // Create conversation + first message atomically
    const conversation = await db.conversation.create({
      data: {
        subject: body.subject,
        type: body.type,
        channel: body.channel,
        priority: body.priority || 'normal',
        status: 'active',
        clientId: body.clientId || null,
        influencerId: body.influencerId || null,
        campaignId: body.campaignId || null,
        assignedToId: body.assignedToId || null,
        tags: body.tags || null,
        organizationId: org.id,
        lastMessageAt: new Date(),
        lastMessagePreview: body.body.substring(0, 100),
        unreadCount: 0,
        messages: {
          create: {
            senderId: body.senderId || null,
            senderName: body.senderName || 'System',
            senderEmail: body.senderEmail || null,
            senderPhone: body.senderPhone || null,
            recipientName: body.recipientName,
            recipientEmail: body.recipientEmail || null,
            recipientPhone: body.recipientPhone || null,
            subject: body.subject,
            body: body.body,
            htmlBody: body.htmlBody || null,
            mediaUrls: body.mediaUrls || null,
            type: body.type,
            direction: body.direction || 'outbound',
            status: 'queued',
            templateId: body.templateId || null,
            organizationId: org.id,
          },
        },
      },
      include: {
        client: { select: { id: true, name: true, logo: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
        campaign: { select: { id: true, name: true, status: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
        messages: true,
      },
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
