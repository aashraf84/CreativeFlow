import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Total revenue (approved expenses in revenue categories or income accounts)
    const revenueAccounts = await db.account.findMany({
      where: { organizationId: org.id, type: 'revenue' },
    })
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0)

    // Total expenses by category
    const expenses = await db.expense.findMany({
      where: { organizationId: org.id, status: 'approved' },
    })
    const expensesByCategory: Record<string, number> = {}
    for (const expense of expenses) {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount
    }
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Net income
    const netIncome = totalRevenue - totalExpenses

    // Account balances by type
    const allAccounts = await db.account.findMany({
      where: { organizationId: org.id },
    })
    const accountBalancesByType: Record<string, { count: number; totalBalance: number }> = {}
    for (const account of allAccounts) {
      if (!accountBalancesByType[account.type]) {
        accountBalancesByType[account.type] = { count: 0, totalBalance: 0 }
      }
      accountBalancesByType[account.type].count += 1
      accountBalancesByType[account.type].totalBalance += account.balance
    }

    return NextResponse.json({
      data: {
        totalRevenue,
        totalExpenses,
        netIncome,
        expensesByCategory,
        accountBalancesByType,
        revenueAccounts: revenueAccounts.map(a => ({ id: a.id, code: a.code, name: a.name, balance: a.balance })),
        expenseAccounts: allAccounts.filter(a => a.type === 'expense').map(a => ({ id: a.id, code: a.code, name: a.name, balance: a.balance })),
      },
    })
  } catch (error) {
    console.error('FinancialReports GET error:', error)
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 })
  }
}
