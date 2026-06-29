import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.payrollRun.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.totalGross !== undefined) updateData.totalGross = body.totalGross
    if (body.totalDeductions !== undefined) updateData.totalDeductions = body.totalDeductions
    if (body.totalNet !== undefined) updateData.totalNet = body.totalNet

    const payrollRun = await db.payrollRun.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            employee: {
              include: {
                department: true,
                user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(payrollRun)
  } catch (error) {
    console.error('PayrollRun PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
