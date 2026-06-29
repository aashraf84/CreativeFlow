import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
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
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
