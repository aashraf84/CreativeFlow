import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const account = await db.account.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true, balance: true } },
        _count: { select: { journalLines: true } },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Compute balance from journal entry lines (posted entries only)
    const lineAgg = await db.journalEntryLine.aggregate({
      where: {
        accountId: id,
        journalEntry: { status: 'posted' },
      },
      _sum: { debit: true, credit: true },
    })

    const totalDebit = lineAgg._sum.debit || 0
    const totalCredit = lineAgg._sum.credit || 0

    // Computed balance depends on normal balance side
    let computedBalance: number
    if (account.normalBalance === 'debit') {
      computedBalance = totalDebit - totalCredit
    } else {
      computedBalance = totalCredit - totalDebit
    }

    // Recent transactions for this account
    const recentLines = await db.journalEntryLine.findMany({
      where: {
        accountId: id,
        journalEntry: { status: 'posted' },
      },
      include: {
        journalEntry: { select: { id: true, number: true, date: true, description: true, reference: true } },
      },
      orderBy: { journalEntry: { date: 'desc' } },
      take: 10,
    })

    return NextResponse.json({
      data: {
        ...account,
        computedBalance,
        totalDebit,
        totalCredit,
        recentTransactions: recentLines,
      },
    })
  } catch (error) {
    console.error('Account GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.account.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.code !== undefined) updateData.code = body.code
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.normalBalance !== undefined) updateData.normalBalance = body.normalBalance
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null
    if (body.balance !== undefined) updateData.balance = body.balance
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const account = await db.account.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true, balance: true } },
        _count: { select: { journalLines: true } },
      },
    })

    return NextResponse.json({ data: account })
  } catch (error) {
    console.error('Account PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.account.findUnique({
      where: { id },
      include: { _count: { select: { journalLines: true, children: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Prevent deletion if account has journal lines
    if (existing._count.journalLines > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing journal entry lines' },
        { status: 400 }
      )
    }

    // Prevent deletion if account has children
    if (existing._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with child accounts' },
        { status: 400 }
      )
    }

    await db.account.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Account deleted' })
  } catch (error) {
    console.error('Account DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
