import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const period = searchParams.get('period') || ''

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get all accounts with their journal line aggregates from posted entries
    const accounts = await db.account.findMany({
      where: { organizationId: org.id, isActive: true },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true, balance: true } },
        _count: { select: { journalLines: true } },
      },
      orderBy: { code: 'asc' },
    })

    // Get all posted journal entry lines for computation
    const lineWhere: Record<string, unknown> = {
      journalEntry: { status: 'posted', organizationId: org.id },
    }
    if (period) {
      lineWhere.journalEntry = {
        ...((lineWhere.journalEntry as Record<string, unknown>) || {}),
        period,
      }
    }

    const journalLines = await db.journalEntryLine.findMany({
      where: lineWhere,
      include: {
        account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
        journalEntry: { select: { period: true, status: true } },
      },
    })

    // Compute debit/credit totals per account from journal lines
    const accountTotals: Record<string, { debit: number; credit: number }> = {}
    for (const line of journalLines) {
      if (!accountTotals[line.accountId]) {
        accountTotals[line.accountId] = { debit: 0, credit: 0 }
      }
      accountTotals[line.accountId].debit += line.debit
      accountTotals[line.accountId].credit += line.credit
    }

    // Compute balance for each account
    const accountsWithBalances = accounts.map((a) => {
      const totals = accountTotals[a.id] || { debit: 0, credit: 0 }
      const computedBalance =
        a.normalBalance === 'debit'
          ? totals.debit - totals.credit
          : totals.credit - totals.debit
      return {
        ...a,
        computedBalance,
        debitTotal: totals.debit,
        creditTotal: totals.credit,
      }
    })

    if (reportType === 'trial-balance') {
      const trialBalanceAccounts = accountsWithBalances
        .filter((a) => a.debitTotal > 0 || a.creditTotal > 0)
        .map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          type: a.type,
          debitTotal: a.debitTotal,
          creditTotal: a.creditTotal,
        }))

      const totalDebits = trialBalanceAccounts.reduce((s, a) => s + a.debitTotal, 0)
      const totalCredits = trialBalanceAccounts.reduce((s, a) => s + a.creditTotal, 0)

      return NextResponse.json({
        data: {
          accounts: trialBalanceAccounts,
          totalDebits,
          totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
        },
      })
    }

    if (reportType === 'balance-sheet') {
      const assetAccounts = accountsWithBalances.filter((a) => a.type === 'asset')
      const liabilityAccounts = accountsWithBalances.filter((a) => a.type === 'liability')
      const equityAccounts = accountsWithBalances.filter((a) => a.type === 'equity')

      const totalAssets = assetAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const totalEquity = equityAccounts.reduce((s, a) => s + a.computedBalance, 0)

      // Calculate net income to include in equity for balanced books
      const revenueAccounts = accounts.filter(a => a.type === 'revenue')
      const expenseAccounts = accounts.filter(a => a.type === 'expense')
      const totalRevenue = revenueAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const totalExpenses = expenseAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const netIncome = totalRevenue - totalExpenses

      return NextResponse.json({
        data: {
          assets: assetAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            category: a.category,
            parentId: a.parentId,
            balance: a.computedBalance,
          })),
          liabilities: liabilityAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            category: a.category,
            parentId: a.parentId,
            balance: a.computedBalance,
          })),
          equity: equityAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            category: a.category,
            parentId: a.parentId,
            balance: a.computedBalance,
          })),
          netIncome,
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalLiabilitiesAndEquity: totalLiabilities + totalEquity + netIncome,
          isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome)) < 0.01,
        },
      })
    }

    if (reportType === 'pnl') {
      const revenueAccounts = accountsWithBalances.filter((a) => a.type === 'revenue')
      const expenseAccounts = accountsWithBalances.filter((a) => a.type === 'expense')

      const totalRevenue = revenueAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const totalExpenses = expenseAccounts.reduce((s, a) => s + a.computedBalance, 0)
      const netIncome = totalRevenue - totalExpenses

      return NextResponse.json({
        data: {
          revenue: revenueAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            category: a.category,
            parentId: a.parentId,
            balance: a.computedBalance,
          })),
          expenses: expenseAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            category: a.category,
            parentId: a.parentId,
            balance: a.computedBalance,
          })),
          totalRevenue,
          totalExpenses,
          netIncome,
        },
      })
    }

    if (reportType === 'cash-flow') {
      // Simplified cash flow: find cash accounts and show net change
      const cashAccounts = accountsWithBalances.filter(
        (a) => a.type === 'asset' && (a.code.startsWith('1100') || a.code.startsWith('1300') || a.name.toLowerCase().includes('cash'))
      )
      const totalCash = cashAccounts.reduce((s, a) => s + a.computedBalance, 0)

      const operatingRevenue = accountsWithBalances
        .filter((a) => a.type === 'revenue')
        .reduce((s, a) => s + a.computedBalance, 0)
      const operatingExpenses = accountsWithBalances
        .filter((a) => a.type === 'expense')
        .reduce((s, a) => s + a.computedBalance, 0)
      const operatingCashFlow = operatingRevenue - operatingExpenses

      return NextResponse.json({
        data: {
          cashAccounts: cashAccounts.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            balance: a.computedBalance,
          })),
          totalCash,
          operatingCashFlow,
          investingCashFlow: 0,
          financingCashFlow: 0,
          netChange: totalCash,
        },
      })
    }

    // Default: overview
    const totalRevenue = accountsWithBalances
      .filter((a) => a.type === 'revenue')
      .reduce((s, a) => s + a.computedBalance, 0)
    const totalExpenses = accountsWithBalances
      .filter((a) => a.type === 'expense')
      .reduce((s, a) => s + a.computedBalance, 0)

    const accountBalancesByType: Record<string, { count: number; totalBalance: number }> = {}
    for (const account of accountsWithBalances) {
      if (!accountBalancesByType[account.type]) {
        accountBalancesByType[account.type] = { count: 0, totalBalance: 0 }
      }
      accountBalancesByType[account.type].count += 1
      accountBalancesByType[account.type].totalBalance += account.computedBalance
    }

    return NextResponse.json({
      data: {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        accountBalancesByType,
        revenueAccounts: accountsWithBalances
          .filter((a) => a.type === 'revenue')
          .map((a) => ({ id: a.id, code: a.code, name: a.name, balance: a.computedBalance })),
        expenseAccounts: accountsWithBalances
          .filter((a) => a.type === 'expense')
          .map((a) => ({ id: a.id, code: a.code, name: a.name, balance: a.computedBalance })),
      },
    })
  } catch (error) {
    console.error('FinancialReports GET error:', error)
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 })
  }
}
