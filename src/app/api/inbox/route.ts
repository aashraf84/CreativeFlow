import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (platform) where.platform = platform
    if (status) where.status = status

    const messages = await db.inboxMessage.findMany({
      where,
      include: {
        socialAccount: { select: { id: true, platform: true, username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Inbox GET error:', error)
    return NextResponse.json({ data: [] })
  }
}
