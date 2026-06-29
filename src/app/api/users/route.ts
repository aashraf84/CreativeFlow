import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users - List all users for the organization
export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })

    const users = await db.user.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
