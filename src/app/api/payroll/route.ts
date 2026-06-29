import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status

    const payrollRuns = await db.payrollRun.findMany({
      where,
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
      orderBy: { runDate: 'desc' },
    })

    return NextResponse.json({ data: payrollRuns })
  } catch (error) {
    console.error('PayrollRuns GET error:', error)
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

    const payrollRun = await db.payrollRun.create({
      data: {
        period: body.period,
        status: body.status || 'draft',
        runDate: body.runDate ? new Date(body.runDate) : new Date(),
        totalGross: body.totalGross || 0,
        totalDeductions: body.totalDeductions || 0,
        totalNet: body.totalNet || 0,
        organizationId: org.id,
        items: body.items
          ? {
              create: body.items.map((item: Record<string, unknown>) => ({
                employeeId: item.employeeId as string,
                baseSalary: item.baseSalary as number,
                overtime: (item.overtime as number) || 0,
                bonuses: (item.bonuses as number) || 0,
                deductions: (item.deductions as number) || 0,
                tax: (item.tax as number) || 0,
                netPay: (item.netPay as number) || 0,
                organizationId: org.id,
              })),
            }
          : undefined,
      },
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

    return NextResponse.json(payrollRun, { status: 201 })
  } catch (error) {
    console.error('PayrollRuns POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
