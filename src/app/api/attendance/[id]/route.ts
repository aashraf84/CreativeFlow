import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/attendance/[id]
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const record = await db.attendance.findUnique({
      where: { id },
      include: { employee: { select: { id: true, firstName: true, lastName: true, avatar: true, department: { select: { name: true } } } } }
    })
    if (!record) return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// PUT /api/attendance/[id]
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.clockIn !== undefined) updateData.clockIn = body.clockIn ? new Date(body.clockIn) : null
    if (body.clockOut !== undefined) updateData.clockOut = body.clockOut ? new Date(body.clockOut) : null
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes || null

    // Auto-calculate workHours
    if (body.clockIn !== undefined || body.clockOut !== undefined) {
      const existing = await db.attendance.findUnique({ where: { id } })
      if (existing) {
        const inTime = body.clockIn !== undefined ? (body.clockIn ? new Date(body.clockIn) : null) : existing.clockIn
        const outTime = body.clockOut !== undefined ? (body.clockOut ? new Date(body.clockOut) : null) : existing.clockOut
        if (inTime && outTime) {
          updateData.workHours = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60) * 100) / 100
        }
      }
    }

    const record = await db.attendance.update({
      where: { id },
      data: updateData,
      include: { employee: { select: { id: true, firstName: true, lastName: true, avatar: true, department: { select: { name: true } } } } }
    })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Attendance PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// DELETE /api/attendance/[id]
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.attendance.delete({ where: { id } })
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  } catch (error) {
    console.error('Attendance DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
