import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (userId) where.userId = userId
    if (isRead !== null) where.isRead = isRead === 'true'

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Mark notifications as read by ids
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      await db.notification.updateMany({
        where: { id: { in: body.ids } },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'Notifications marked as read' })
    }

    // Mark all as read for a user
    if (body.markAllRead && body.userId) {
      await db.notification.updateMany({
        where: { userId: body.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
