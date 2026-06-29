import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const teams = await db.team.findMany({
      where: { organizationId: org.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
          orderBy: { role: 'desc' },
        },
        _count: { select: { contents: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Teams GET error:', error)
    return NextResponse.json({ data: [] })
  }
}
