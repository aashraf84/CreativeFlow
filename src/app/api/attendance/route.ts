import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/attendance - List attendance records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const org = await db.organization.findFirst()
    if (!org) return NextResponse.json({ data: [] })

    const where: Record<string, unknown> = { organizationId: org.id }
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            position: true,
            department: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

// POST /api/attendance - Create attendance record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) return NextResponse.json({ error: 'No organization' }, { status: 404 })

    let workHours: number | null = null
    if (body.clockIn && body.clockOut) {
      const inTime = new Date(body.clockIn)
      const outTime = new Date(body.clockOut)
      workHours = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60) * 100) / 100
    }

    const record = await db.attendance.create({
      data: {
        employeeId: body.employeeId,
        date: new Date(body.date),
        clockIn: body.clockIn ? new Date(body.clockIn) : null,
        clockOut: body.clockOut ? new Date(body.clockOut) : null,
        status: body.status || 'present',
        workHours,
        notes: body.notes || null,
        organizationId: org.id,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, avatar: true, department: { select: { name: true } } } } }
    })

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 })
  }
}
