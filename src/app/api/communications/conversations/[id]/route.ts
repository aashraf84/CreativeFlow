import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, logo: true, email: true, phone: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true, email: true, phone: true } },
        campaign: { select: { id: true, name: true, status: true } },
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            template: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Conversation GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.type !== undefined) updateData.type = body.type
    if (body.channel !== undefined) updateData.channel = body.channel
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null
    if (body.influencerId !== undefined) updateData.influencerId = body.influencerId || null
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId || null

    const conversation = await db.conversation.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, logo: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
        campaign: { select: { id: true, name: true, status: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Conversation PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
