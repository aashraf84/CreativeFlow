import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const departments = await db.department.findMany({
      where: { organizationId: org.id },
      include: {
        _count: { select: { employees: true, jobPostings: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: departments })
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const department = await db.department.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || '#10b981',
        headId: body.headId || null,
        organizationId: org.id,
      },
      include: {
        _count: { select: { employees: true, jobPostings: true } },
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Departments POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
