import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const clients = await db.client.findMany({
      where: { organizationId: org.id },
      include: {
        _count: { select: { campaigns: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Clients GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
