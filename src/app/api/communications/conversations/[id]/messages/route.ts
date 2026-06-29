import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

    const conversation = await db.conversation.findUnique({ where: { id } })
    if (!conversation) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where = { conversationId: id }
    const total = await db.communicationMessage.count({ where })
    const totalPages = Math.ceil(total / limit)

    const messages = await db.communicationMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      messages,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Conversation messages GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.body || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: body, type' },
        { status: 400 }
      )
    }

    const conversation = await db.conversation.findUnique({ where: { id } })
    if (!conversation) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // For email, subject and recipientEmail are expected
    if (body.type === 'email' && !body.recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required for email messages' },
        { status: 400 }
      )
    }

    // For WhatsApp, recipientPhone is expected
    if (body.type === 'whatsapp' && !body.recipientPhone) {
      return NextResponse.json(
        { error: 'recipientPhone is required for WhatsApp messages' },
        { status: 400 }
      )
    }

    // Create the message record with status "queued"
    const message = await db.communicationMessage.create({
      data: {
        conversationId: id,
        senderId: body.senderId || null,
        senderName: body.senderName || 'System',
        senderEmail: body.senderEmail || null,
        senderPhone: body.senderPhone || null,
        recipientName: body.recipientName || '',
        recipientEmail: body.recipientEmail || null,
        recipientPhone: body.recipientPhone || null,
        subject: body.subject || conversation.subject,
        body: body.body,
        htmlBody: body.htmlBody || null,
        mediaUrls: body.mediaUrls || null,
        type: body.type,
        direction: body.direction || 'outbound',
        status: 'queued',
        templateId: body.templateId || null,
        organizationId: conversation.organizationId,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        template: { select: { id: true, name: true } },
      },
    })

    // Simulate sending the message
    try {
      if (body.type === 'email') {
        // Simulate email sending — in production, integrate with an email provider
        console.log(`[Email] Sending to: ${body.recipientEmail}, Subject: ${body.subject || conversation.subject}`)
      } else if (body.type === 'whatsapp') {
        // Simulate WhatsApp sending — in production, integrate with WhatsApp Business API
        console.log(`[WhatsApp] Sending to: ${body.recipientPhone}, Body: ${body.body.substring(0, 50)}...`)
      }

      // Update message status to "sent"
      await db.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          deliveredAt: new Date(),
        },
      })
    } catch (sendError) {
      console.error('Message send error:', sendError)
      await db.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          failureReason: sendError instanceof Error ? sendError.message : 'Unknown error',
        },
      })
    }

    // Update conversation's lastMessageAt and lastMessagePreview
    await db.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: body.body.substring(0, 100),
      },
    })

    // Fetch the final message state
    const finalMessage = await db.communicationMessage.findUnique({
      where: { id: message.id },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        template: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ message: finalMessage }, { status: 201 })
  } catch (error) {
    console.error('Conversation messages POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
