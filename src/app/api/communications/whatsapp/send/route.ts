import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const body = await request.json()

    if (!body.to || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, body' },
        { status: 400 }
      )
    }

    // Determine conversationId — create or link
    const conversationId = body.conversationId || null

    let resolvedConversationId = conversationId
    if (!resolvedConversationId) {
      const conversation = await db.conversation.create({
        data: {
          subject: body.subject || `WhatsApp: ${body.to}`,
          type: 'whatsapp',
          channel: 'whatsapp',
          status: 'active',
          priority: body.priority || 'normal',
          organizationId: org.id,
          lastMessageAt: new Date(),
          lastMessagePreview: body.body.substring(0, 100),
          unreadCount: 0,
        },
      })
      resolvedConversationId = conversation.id
    }

    // Create the message record
    const message = await db.communicationMessage.create({
      data: {
        conversationId: resolvedConversationId,
        senderId: body.senderId || null,
        senderName: body.senderName || 'System',
        senderPhone: body.senderPhone || null,
        recipientName: body.recipientName || body.to,
        recipientEmail: null,
        recipientPhone: body.to,
        subject: null,
        body: body.body,
        htmlBody: null,
        mediaUrls: body.mediaUrls || null,
        type: 'whatsapp',
        direction: 'outbound',
        status: 'queued',
        organizationId: org.id,
        templateId: body.templateId || null,
      },
    })

    // Simulate WhatsApp sending
    try {
      console.log(`[WhatsApp Send] To: ${body.to}, Body: ${body.body.substring(0, 50)}...`)

      // In production, integrate with WhatsApp Business API here (e.g., Twilio, MessageBird, etc.)
      await db.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          deliveredAt: new Date(),
          externalId: `wa_${Date.now()}_${message.id}`,
        },
      })
    } catch (sendError) {
      console.error('WhatsApp send error:', sendError)
      await db.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          failureReason: sendError instanceof Error ? sendError.message : 'Unknown error',
        },
      })
    }

    // Update conversation
    await db.conversation.update({
      where: { id: resolvedConversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: body.body.substring(0, 100),
      },
    })

    // Fetch final message state
    const finalMessage = await db.communicationMessage.findUnique({
      where: { id: message.id },
    })

    return NextResponse.json({
      success: true,
      messageId: message.id,
      conversationId: resolvedConversationId,
      message: finalMessage,
    }, { status: 201 })
  } catch (error) {
    console.error('WhatsApp send POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
