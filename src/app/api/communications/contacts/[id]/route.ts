import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contact = await db.communicationContact.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, email: true, phone: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true, email: true, phone: true } },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Fetch conversation history for this contact
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { clientId: contact.clientId || '___never___' },
          { influencerId: contact.influencerId || '___never___' },
        ],
        organizationId: contact.organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            body: true,
            type: true,
            direction: true,
            senderName: true,
            createdAt: true,
            status: true,
          },
        },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ contact, conversations })
  } catch (error) {
    console.error('Contact GET error:', error)
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
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber
    if (body.company !== undefined) updateData.company = body.company
    if (body.role !== undefined) updateData.role = body.role
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.preferredChannel !== undefined) updateData.preferredChannel = body.preferredChannel
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.clientId !== undefined) updateData.clientId = body.clientId
    if (body.influencerId !== undefined) updateData.influencerId = body.influencerId
    if (body.lastContactedAt !== undefined) {
      updateData.lastContactedAt = body.lastContactedAt ? new Date(body.lastContactedAt) : null
    }

    const contact = await db.communicationContact.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true } },
        influencer: { select: { id: true, name: true, username: true, platform: true } },
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Contact PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.communicationContact.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Contact deleted' })
  } catch (error) {
    console.error('Contact DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
