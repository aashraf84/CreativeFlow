import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json({ data: entry })
  } catch (error) {
    console.error('JournalEntry GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.journalEntry.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    // Only allow updates if status is draft (or status change to posted/void)
    if (existing.status !== 'draft' && body.status === existing.status) {
      return NextResponse.json(
        { error: 'Cannot modify a posted or voided journal entry' },
        { status: 400 }
      )
    }

    // If just changing status (post/void)
    if (body.status && body.status !== existing.status) {
      const updated = await db.journalEntry.update({
        where: { id },
        data: { status: body.status },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true, type: true } },
            },
          },
        },
      })
      return NextResponse.json({ data: updated })
    }

    // Full update for draft entries
    const lines = body.lines || []
    const totalDebit = lines.reduce((sum: number, l: { debit?: number }) => sum + (l.debit || 0), 0)
    const totalCredit = lines.reduce((sum: number, l: { credit?: number }) => sum + (l.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Total debits must equal total credits' },
        { status: 400 }
      )
    }

    // Delete existing lines and recreate
    await db.journalEntryLine.deleteMany({ where: { journalEntryId: id } })

    const updated = await db.journalEntry.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        description: body.description,
        reference: body.reference ?? undefined,
        source: body.source,
        period: body.period,
        isAdjusting: body.isAdjusting,
        totalDebit,
        totalCredit,
        lines: {
          create: lines.map((l: { accountId: string; debit?: number; credit?: number; description?: string }) => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            description: l.description || null,
            organizationId: existing.organizationId,
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

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('JournalEntry PUT error:', error)
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
  }
}
