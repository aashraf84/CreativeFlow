import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (category) where.category = category
    if (status) where.status = status

    const expenses = await db.expense.findMany({
      where,
      include: {
        submittedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: expenses })
  } catch (error) {
    console.error('Expenses GET error:', error)
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

    const expense = await db.expense.create({
      data: {
        title: body.title,
        description: body.description || null,
        amount: body.amount,
        category: body.category,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status || 'pending',
        receiptUrl: body.receiptUrl || null,
        submittedById: body.submittedById,
        approvedById: body.approvedById || null,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : null,
        campaignId: body.campaignId || null,
        clientId: body.clientId || null,
        organizationId: org.id,
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
