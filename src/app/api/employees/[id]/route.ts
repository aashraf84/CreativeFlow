import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.employee.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.position !== undefined) updateData.position = body.position
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId
    if (body.hireDate !== undefined) updateData.hireDate = body.hireDate ? new Date(body.hireDate) : null
    if (body.status !== undefined) updateData.status = body.status
    if (body.employmentType !== undefined) updateData.employmentType = body.employmentType
    if (body.salary !== undefined) updateData.salary = body.salary
    if (body.salaryCurrency !== undefined) updateData.salaryCurrency = body.salaryCurrency
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact
    if (body.address !== undefined) updateData.address = body.address
    if (body.notes !== undefined) updateData.notes = body.notes

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Employee PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.payrollItem.deleteMany({ where: { employeeId: id } })
    await db.leaveRequest.deleteMany({ where: { employeeId: id } })
    await db.employee.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Employee deleted' })
  } catch (error) {
    console.error('Employee DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
