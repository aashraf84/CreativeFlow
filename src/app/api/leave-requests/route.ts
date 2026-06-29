import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: leaveRequests })
  } catch (error) {
    console.error('LeaveRequests GET error:', error)
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

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        days: body.days,
        reason: body.reason || null,
        status: body.status || 'pending',
        organizationId: org.id,
      },
      include: {
        employee: {
          include: {
            department: true,
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          },
        },
      },
    })

    return NextResponse.json(leaveRequest, { status: 201 })
  } catch (error) {
    console.error('LeaveRequests POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
