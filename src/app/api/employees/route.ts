import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (departmentId) where.departmentId = departmentId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } },
      ]
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: employees })
  } catch (error) {
    console.error('Employees GET error:', error)
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

    const employee = await db.employee.create({
      data: {
        employeeId: body.employeeId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        avatar: body.avatar || null,
        position: body.position,
        departmentId: body.departmentId,
        hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
        status: body.status || 'active',
        employmentType: body.employmentType || 'full-time',
        salary: body.salary || null,
        salaryCurrency: body.salaryCurrency || 'USD',
        bankAccount: body.bankAccount || null,
        taxId: body.taxId || null,
        emergencyContact: body.emergencyContact || null,
        address: body.address || null,
        notes: body.notes || null,
        userId: body.userId || null,
        organizationId: org.id,
      },
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Employees POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
