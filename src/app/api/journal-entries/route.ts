import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const period = searchParams.get('period')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = { organizationId: org.id }
    if (status) where.status = status
    if (source) where.source = source
    if (period) where.period = period
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { description: { contains: search } },
        { reference: { contains: search } },
      ]
    }

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.journalEntry.count({ where }),
    ])

    return NextResponse.json({
      data: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('JournalEntries GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Validate that totalDebit === totalCredit
    const lines = body.lines || []
    const totalDebit = lines.reduce((sum: number, l: { debit?: number }) => sum + (l.debit || 0), 0)
    const totalCredit = lines.reduce((sum: number, l: { credit?: number }) => sum + (l.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Total debits must equal total credits', totalDebit, totalCredit },
        { status: 400 }
      )
    }

    // Auto-generate number like JE-001
    const lastEntry = await db.journalEntry.findFirst({
      where: { organizationId: org.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    let nextNum = 1
    if (lastEntry?.number) {
      const match = lastEntry.number.match(/JE-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const number = `JE-${String(nextNum).padStart(3, '0')}`

    const entry = await db.journalEntry.create({
      data: {
        number,
        date: new Date(body.date),
        description: body.description,
        reference: body.reference || null,
        source: body.source || 'manual',
        sourceId: body.sourceId || null,
        status: body.status || 'draft',
        isAdjusting: body.isAdjusting || false,
        period: body.period,
        totalDebit,
        totalCredit,
        organizationId: org.id,
        createdById: body.createdById || null,
        lines: {
          create: lines.map((l: { accountId: string; debit?: number; credit?: number; description?: string }) => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            description: l.description || null,
            organizationId: org.id,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('JournalEntries POST error:', error)
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
