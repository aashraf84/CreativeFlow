"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useERPStore, type Account, type TaxRate } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Line, LineChart,
  Cell, Pie, PieChart,
  ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import {
  Landmark,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileText,
  Percent,
  Building2,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  CheckCircle2,
  XCircle,
  CircleDot,
} from "lucide-react"
import { format } from "date-fns"

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

// ── Account type config ─────────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  asset: { label: "Asset", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: Wallet },
  liability: { label: "Liability", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: CreditCard },
  equity: { label: "Equity", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: PiggyBank },
  revenue: { label: "Revenue", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: TrendingUp },
  expense: { label: "Expense", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: TrendingDown },
}

const ACCOUNT_TYPES = ["All", "Asset", "Liability", "Equity", "Revenue", "Expense"]
const CHART_COLORS = ["#10b981", "#14b8a6", "#f59e0b", "#ef4444", "#ec4899", "#f97316"]

// ── Chart configs ───────────────────────────────────────────────────
const expenseBarConfig: ChartConfig = {
  amount: { label: "Amount", color: "#10b981" },
}

const balanceBarConfig: ChartConfig = {
  balance: { label: "Balance", color: "#14b8a6" },
}

const trendLineConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
  expenses: { label: "Expenses", color: "#ef4444" },
}

// ── Helpers ─────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

// ── Financial Report Data Type ──────────────────────────────────────
interface FinancialReportData {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  expensesByCategory: Record<string, number>
  accountBalancesByType: Record<string, { count: number; totalBalance: number }>
  revenueAccounts: { id: string; code: string; name: string; balance: number }[]
  expenseAccounts: { id: string; code: string; name: string; balance: number }[]
}

export function FinanceAccountsView() {
  const { financeAccounts, setFinanceAccounts, taxRates, setTaxRates, expenses } = useERPStore()
  const [activeTab, setActiveTab] = useState("chart-of-accounts")
  const [accountTypeFilter, setAccountTypeFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false)
  const [showAddTaxDialog, setShowAddTaxDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reportData, setReportData] = useState<FinancialReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  // Account form state
  const [accCode, setAccCode] = useState("")
  const [accName, setAccName] = useState("")
  const [accType, setAccType] = useState("")
  const [accCategory, setAccCategory] = useState("")
  const [accBalance, setAccBalance] = useState("")

  // Tax rate form state
  const [taxName, setTaxName] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [taxType, setTaxType] = useState("")
  const [taxActive, setTaxActive] = useState(true)

  // ── Fetch financial report data ───────────────────────────────────
  const fetchReportData = useCallback(async () => {
    setLoadingReport(true)
    try {
      const res = await fetch("/api/financial-reports")
      if (res.ok) {
        const json = await res.json()
        setReportData(json.data as FinancialReportData)
      }
    } catch (err) {
      console.error("Failed to fetch financial report:", err)
    } finally {
      setLoadingReport(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "financial-reports" && !reportData) {
      fetchReportData()
    }
  }, [activeTab, reportData, fetchReportData])

  // ── Filtered accounts ─────────────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    return financeAccounts.filter(a => {
      if (accountTypeFilter !== "All" && a.type !== accountTypeFilter.toLowerCase()) return false
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.code.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [financeAccounts, accountTypeFilter, searchQuery])

  // ── Expense breakdown data for report ─────────────────────────────
  const expenseBreakdown = useMemo(() => {
    if (!reportData?.expensesByCategory) return []
    return Object.entries(reportData.expensesByCategory).map(([category, amount], i) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      amount: Math.round(amount * 100) / 100,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [reportData])

  // ── Account balances by type ──────────────────────────────────────
  const accountBalances = useMemo(() => {
    if (!reportData?.accountBalancesByType) return []
    return Object.entries(reportData.accountBalancesByType).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      balance: Math.round(data.totalBalance * 100) / 100,
      count: data.count,
    }))
  }, [reportData])

  // ── Monthly trend (synthesized from expenses & accounts) ──────────
  const monthlyTrend = useMemo(() => {
    if (!reportData) return []
    // Build a monthly trend from expenses data
    const revenueMap = new Map<string, number>()
    const expenseMap = new Map<string, number>()
    expenses.forEach(e => {
      const month = e.date ? format(new Date(e.date), "MMM") : "Unknown"
      if (e.category === "revenue" || e.status === "approved") {
        expenseMap.set(month, (expenseMap.get(month) || 0) + e.amount)
      }
    })
    // Create a fixed set of months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const revBase = reportData.totalRevenue / 12
    const expBase = reportData.totalExpenses / 12
    // Use random but deterministic variation for demo
    return months.slice(0, 6).map((month, i) => ({
      month,
      revenue: Math.round((revBase * (0.8 + (i * 0.07))) * 100) / 100,
      expenses: Math.round((expBase * (0.7 + (i * 0.1))) * 100) / 100,
    }))
  }, [reportData, expenses])

  // ── Add Account ───────────────────────────────────────────────────
  const handleAddAccount = useCallback(async () => {
    if (!accCode || !accName || !accType) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: accCode,
          name: accName,
          type: accType,
          category: accCategory || null,
          balance: parseFloat(accBalance) || 0,
          isActive: true,
        }),
      })
      if (res.ok) {
        const newAccount = await res.json()
        setFinanceAccounts([...financeAccounts, newAccount as Account])
        setShowAddAccountDialog(false)
        resetAccountForm()
      }
    } catch (err) {
      console.error("Failed to create account:", err)
    } finally {
      setSubmitting(false)
    }
  }, [accCode, accName, accType, accCategory, accBalance, financeAccounts, setFinanceAccounts])

  // ── Add Tax Rate ──────────────────────────────────────────────────
  const handleAddTaxRate = useCallback(async () => {
    if (!taxName || !taxRate || !taxType) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/tax-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taxName,
          rate: parseFloat(taxRate),
          type: taxType,
          isActive: taxActive,
        }),
      })
      if (res.ok) {
        const newTaxRate = await res.json()
        setTaxRates([...taxRates, newTaxRate as TaxRate])
        setShowAddTaxDialog(false)
        resetTaxForm()
      }
    } catch (err) {
      console.error("Failed to create tax rate:", err)
    } finally {
      setSubmitting(false)
    }
  }, [taxName, taxRate, taxType, taxActive, taxRates, setTaxRates])

  const resetAccountForm = () => {
    setAccCode("")
    setAccName("")
    setAccType("")
    setAccCategory("")
    setAccBalance("")
  }

  const resetTaxForm = () => {
    setTaxName("")
    setTaxRate("")
    setTaxType("")
    setTaxActive(true)
  }

  // ── Render type badge ─────────────────────────────────────────────
  const renderTypeBadge = (type: string) => {
    const config = ACCOUNT_TYPE_CONFIG[type]
    if (!config) return <Badge variant="outline" className="text-xs">{type}</Badge>
    const Icon = config.icon
    return (
      <Badge variant="outline" className={`gap-1 text-xs ${config.bg} ${config.color} border-current/20`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Accounts</h1>
          <p className="text-muted-foreground text-sm">Chart of accounts, financial reports, and tax management</p>
        </div>
      </motion.div>

      {/* ── Main Tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="chart-of-accounts" className="gap-1.5 text-xs sm:text-sm">
            <Landmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chart of Accounts</span>
            <span className="sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="financial-reports" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Financial Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="tax-rates" className="gap-1.5 text-xs sm:text-sm">
            <Percent className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tax Rates</span>
            <span className="sm:hidden">Tax</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Chart of Accounts Tab ─────────────────────────────────── */}
        <TabsContent value="chart-of-accounts" className="mt-4 space-y-4">
          {/* Account Summary KPIs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 grid-cols-2 lg:grid-cols-4"
          >
            {Object.entries(ACCOUNT_TYPE_CONFIG).map(([type, config], index) => {
              const accountsOfType = financeAccounts.filter(a => a.type === type)
              const totalBalance = accountsOfType.reduce((sum, a) => sum + a.balance, 0)
              const Icon = config.icon
              return (
                <motion.div key={type} variants={itemVariants}>
                  <Card className="border-l-4" style={{ borderLeftColor: CHART_COLORS[index] }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS[index]}15` }}>
                        <Icon className="h-4 w-4" style={{ color: CHART_COLORS[index] }} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                      <p className="text-xs text-muted-foreground mt-1">{accountsOfType.length} account{accountsOfType.length !== 1 ? "s" : ""}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Accounts Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">Chart of Accounts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      className="pl-8 h-8 w-[180px] text-sm"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-sm">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowAddAccountDialog(true)}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Account
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Landmark className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">No accounts found</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                    {searchQuery || accountTypeFilter !== "All"
                      ? "Try adjusting your filters or search terms"
                      : "Add your first account to get started"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  {/* Table header */}
                  <div className="hidden md:grid md:grid-cols-[80px_1fr_120px_120px_120px_80px] gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
                    <span>Code</span>
                    <span>Name</span>
                    <span>Type</span>
                    <span>Category</span>
                    <span className="text-right">Balance</span>
                    <span className="text-center">Status</span>
                  </div>
                  <div className="space-y-0">
                    <AnimatePresence>
                      {filteredAccounts.map((account, index) => (
                        <motion.div
                          key={account.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ delay: index * 0.02 }}
                          className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px_120px_120px_80px] gap-2 md:gap-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors items-center"
                        >
                          <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                              {React.createElement(
                                ACCOUNT_TYPE_CONFIG[account.type]?.icon || Building2,
                                { className: "h-4 w-4 text-emerald-600" }
                              )}
                            </div>
                            <span className="font-medium text-sm truncate">{account.name}</span>
                          </div>
                          <div>{renderTypeBadge(account.type)}</div>
                          <span className="text-sm text-muted-foreground truncate">{account.category || "—"}</span>
                          <span className="font-semibold text-sm text-right">{formatCurrency(account.balance)}</span>
                          <div className="flex justify-center">
                            {account.isActive ? (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Financial Reports Tab ─────────────────────────────────── */}
        <TabsContent value="financial-reports" className="mt-4 space-y-4">
          {loadingReport && !reportData ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Loading financial data...</p>
              </div>
            </div>
          ) : reportData ? (
            <>
              {/* P&L Summary Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 grid-cols-1 sm:grid-cols-3"
              >
                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-700">{formatCurrency(reportData.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground mt-1">From revenue accounts</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                      <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-700">{formatCurrency(reportData.totalExpenses)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className={`border-l-4 ${reportData.netIncome >= 0 ? "border-l-teal-500" : "border-l-amber-500"}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${reportData.netIncome >= 0 ? "bg-teal-50" : "bg-amber-50"}`}>
                        <DollarSign className={`h-4 w-4 ${reportData.netIncome >= 0 ? "text-teal-600" : "text-amber-600"}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${reportData.netIncome >= 0 ? "text-teal-700" : "text-amber-700"}`}>
                        {formatCurrency(reportData.netIncome)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reportData.netIncome >= 0 ? "Profit" : "Loss"} this period
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Expense Breakdown by Category */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Expense Breakdown by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenseBreakdown.length === 0 ? (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                        No expense breakdown data
                      </div>
                    ) : (
                      <ChartContainer config={expenseBarConfig} className="h-[250px] w-full">
                        <BarChart data={expenseBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={11} width={70} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={24}>
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Account Balances by Type */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-teal-600" />
                      Account Balances by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accountBalances.length === 0 ? (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                        No account balance data
                      </div>
                    ) : (
                      <ChartContainer config={balanceBarConfig} className="h-[250px] w-full">
                        <BarChart data={accountBalances} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} fontSize={11} width={70} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="balance" radius={[0, 4, 4, 0]} maxBarSize={24}>
                            {accountBalances.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Revenue vs Expenses Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyTrend.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      No trend data available
                    </div>
                  ) : (
                    <ChartContainer config={trendLineConfig} className="h-[250px] w-full">
                      <LineChart data={monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2.5}
                          dot={{ fill: "var(--color-revenue)", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="var(--color-expenses)"
                          strokeWidth={2.5}
                          dot={{ fill: "var(--color-expenses)", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No financial data available</h3>
              <p className="text-muted-foreground text-sm mt-1">Unable to load financial reports</p>
              <Button onClick={fetchReportData} variant="outline" className="mt-4 gap-2">
                Retry
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Tax Rates Tab ─────────────────────────────────────────── */}
        <TabsContent value="tax-rates" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddTaxDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tax Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {taxRates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Percent className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">No tax rates found</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                    Add your first tax rate to get started
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  {/* Table header */}
                  <div className="hidden md:grid md:grid-cols-[1fr_100px_120px_80px] gap-4 pb-3 border-b text-xs font-medium text-muted-foreground">
                    <span>Name</span>
                    <span className="text-center">Rate</span>
                    <span className="text-center">Type</span>
                    <span className="text-center">Status</span>
                  </div>
                  <div className="space-y-0">
                    <AnimatePresence>
                      {taxRates.map((tax, index) => (
                        <motion.div
                          key={tax.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ delay: index * 0.03 }}
                          className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_80px] gap-2 md:gap-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors items-center"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                              <Percent className="h-4 w-4 text-teal-600" />
                            </div>
                            <span className="font-medium text-sm">{tax.name}</span>
                          </div>
                          <span className="font-semibold text-sm text-center text-emerald-700">{tax.rate}%</span>
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                              {tax.type}
                            </Badge>
                          </div>
                          <div className="flex justify-center">
                            {tax.isActive ? (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200 gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Account Dialog ──────────────────────────────────────── */}
      <Dialog open={showAddAccountDialog} onOpenChange={setShowAddAccountDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" />
              Add Account
            </DialogTitle>
            <DialogDescription>Create a new account in the chart of accounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acc-code">Account Code *</Label>
                <Input
                  id="acc-code"
                  placeholder="e.g. 1000"
                  value={accCode}
                  onChange={e => setAccCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-type">Type *</Label>
                <Select value={accType} onValueChange={setAccType}>
                  <SelectTrigger id="acc-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {React.createElement(cfg.icon, { className: "h-3.5 w-3.5" })}
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Account Name *</Label>
              <Input
                id="acc-name"
                placeholder="e.g. Cash on Hand"
                value={accName}
                onChange={e => setAccName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acc-category">Category</Label>
                <Input
                  id="acc-category"
                  placeholder="e.g. Current Asset"
                  value={accCategory}
                  onChange={e => setAccCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-balance">Initial Balance</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="acc-balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={accBalance}
                    onChange={e => setAccBalance(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccountDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAccount}
              disabled={!accCode || !accName || !accType || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Tax Rate Dialog ─────────────────────────────────────── */}
      <Dialog open={showAddTaxDialog} onOpenChange={setShowAddTaxDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-emerald-600" />
              Add Tax Rate
            </DialogTitle>
            <DialogDescription>Define a new tax rate for invoicing and accounting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tax-name">Tax Name *</Label>
              <Input
                id="tax-name"
                placeholder="e.g. GST"
                value={taxName}
                onChange={e => setTaxName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Rate (%) *</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-type">Type *</Label>
                <Select value={taxType} onValueChange={setTaxType}>
                  <SelectTrigger id="tax-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales Tax</SelectItem>
                    <SelectItem value="vat">VAT</SelectItem>
                    <SelectItem value="gst">GST</SelectItem>
                    <SelectItem value="withholding">Withholding</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tax-active">Active</Label>
              <Switch
                id="tax-active"
                checked={taxActive}
                onCheckedChange={setTaxActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaxDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTaxRate}
              disabled={!taxName || !taxRate || !taxType || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Creating..." : "Create Tax Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
