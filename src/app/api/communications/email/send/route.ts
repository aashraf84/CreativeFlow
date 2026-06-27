import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    // Determine conversationId — create or link
    const conversationId = body.conversationId || null

    // If no conversationId provided, optionally create a new conversation
    let resolvedConversationId = conversationId
    if (!resolvedConversationId) {
      const conversation = await db.conversation.create({
        data: {
          subject: body.subject,
          type: 'email',
          channel: 'email',
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
        senderEmail: body.senderEmail || null,
        recipientName: body.recipientName || body.to,
        recipientEmail: body.to,
        recipientPhone: null,
        subject: body.subject,
        body: body.body,
        htmlBody: body.htmlBody || null,
        mediaUrls: body.mediaUrls || null,
        type: 'email',
        direction: 'outbound',
        status: 'queued',
        organizationId: org.id,
        templateId: body.templateId || null,
      },
    })

    // Simulate email sending
    try {
      console.log(`[Email Send] To: ${body.to}, Subject: ${body.subject}, CC: ${body.cc || 'none'}, BCC: ${body.bcc || 'none'}`)

      // In production, integrate with an email provider here (e.g., SendGrid, AWS SES, etc.)
      // For now, mark as sent
      await db.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          deliveredAt: new Date(),
          externalId: `email_${Date.now()}_${message.id}`,
        },
      })
    } catch (sendError) {
      console.error('Email send error:', sendError)
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
    console.error('Email send POST error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
