"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Expense } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Paperclip,
  TrendingUp,
  ChevronDown,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Plane,
  Monitor,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  Megaphone,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

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

// ── Status config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  reimbursed: { label: "Reimbursed", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: Wallet },
}

// ── Category config ─────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  travel: { label: "Travel", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Plane },
  office: { label: "Office", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: Building2 },
  software: { label: "Software", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: Monitor },
  marketing: { label: "Marketing", color: "text-pink-700", bg: "bg-pink-50 border-pink-200", icon: Megaphone },
  equipment: { label: "Equipment", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: ShoppingBag },
  food: { label: "Food", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: UtensilsCrossed },
}

const CATEGORIES = ["All", "Travel", "Office", "Software", "Marketing", "Equipment", "Food"]
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "Reimbursed"]

// ── Chart configs ───────────────────────────────────────────────────
const barChartConfig: ChartConfig = {
  amount: { label: "Expenses", color: "#10b981" },
}

const DONUT_COLORS = ["#10b981", "#14b8a6", "#f59e0b", "#ec4899", "#f97316", "#e11d48"]

const donutChartConfig: ChartConfig = {
  travel: { label: "Travel", color: "#f97316" },
  office: { label: "Office", color: "#10b981" },
  software: { label: "Software", color: "#14b8a6" },
  marketing: { label: "Marketing", color: "#ec4899" },
  equipment: { label: "Equipment", color: "#f59e0b" },
  food: { label: "Food", color: "#e11d48" },
}

// ── Helpers ─────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function getCategoryKey(category: string): string {
  return category.toLowerCase()
}

export function ExpensesView() {
  const { expenses, setExpenses, currentUser } = useERPStore()
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formReceiptUrl, setFormReceiptUrl] = useState("")

  // ── KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    const pending = expenses.filter(e => e.status === "pending")
    const approved = expenses.filter(e => e.status === "approved")
    const rejected = expenses.filter(e => e.status === "rejected")
    return {
      total,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, e) => sum + e.amount, 0),
      approvedCount: approved.length,
      rejectedCount: rejected.length,
    }
  }, [expenses])

  // ── Monthly expense trend ─────────────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>()
    expenses.forEach(e => {
      const month = e.date ? format(new Date(e.date), "MMM yyyy") : "Unknown"
      map.set(month, (map.get(month) || 0) + e.amount)
    })
    return Array.from(map.entries())
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
      .slice(0, 12)
  }, [expenses])

  // ── Category breakdown ────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    expenses.forEach(e => {
      const key = getCategoryKey(e.category)
      map.set(key, (map.get(key) || 0) + e.amount)
    })
    return Array.from(map.entries()).map(([category, value]) => ({
      category,
      value: Math.round(value * 100) / 100,
      label: CATEGORY_CONFIG[category]?.label || category,
    }))
  }, [expenses])

  // ── Filtered expenses ─────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (statusFilter !== "All" && e.status !== statusFilter.toLowerCase()) return false
      if (categoryFilter !== "All" && getCategoryKey(e.category) !== categoryFilter.toLowerCase()) return false
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [expenses, statusFilter, categoryFilter, searchQuery])

  // ── Submit expense ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!formTitle || !formAmount || !formCategory) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          amount: parseFloat(formAmount),
          category: formCategory,
          date: formDate || new Date().toISOString(),
          description: formDescription || null,
          receiptUrl: formReceiptUrl || null,
          submittedById: currentUser?.id || "user-admin",
          status: "pending",
        }),
      })
      if (res.ok) {
        const newExpense = await res.json()
        setExpenses([newExpense, ...expenses])
        toast.success("Expense submitted")
        setShowSubmitDialog(false)
        resetForm()
      } else {
        toast.error("Failed to submit expense")
      }
    } catch (err) {
      console.error("Failed to submit expense:", err)
      toast.error("Failed to submit expense")
    } finally {
      setSubmitting(false)
    }
  }, [formTitle, formAmount, formCategory, formDate, formDescription, formReceiptUrl, currentUser, expenses, setExpenses])

  // ── Approve/Reject ────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, approvedById: currentUser?.id || "user-admin", approvedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        const updated = await res.json()
        setExpenses(expenses.map(e => e.id === id ? { ...e, ...updated } : e))
        toast.success(`Expense ${status}`)
      } else {
        toast.error(`Failed to ${status} expense`)
      }
    } catch (err) {
      console.error("Failed to update expense:", err)
      toast.error(`Failed to ${status} expense`)
    } finally {
      setActionLoading(null)
    }
  }, [currentUser, expenses, setExpenses])

  const resetForm = () => {
    setFormTitle("")
    setFormAmount("")
    setFormCategory("")
    setFormDate("")
    setFormDescription("")
    setFormReceiptUrl("")
  }

  // ── Render category badge ─────────────────────────────────────────
  const renderCategoryBadge = (category: string) => {
    const key = getCategoryKey(category)
    const config = CATEGORY_CONFIG[key]
    if (!config) return <Badge variant="outline" className="text-xs">{category}</Badge>
    const Icon = config.icon
    return (
      <Badge variant="outline" className={`gap-1 text-xs ${config.bg} ${config.color} border-current/20`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // ── Render status badge ───────────────────────────────────────────
  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status]
    if (!config) return <Badge variant="outline" className="text-xs">{status}</Badge>
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
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground text-sm">Track, submit, and approve company expenses</p>
        </div>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Submit Expense
        </Button>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} expense records</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(kpis.pendingAmount)} pending</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-teal-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.approvedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for reimbursement</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.rejectedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs revision</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2"
      >
        {/* Expense Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Monthly Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No expense data to display
              </div>
            ) : (
              <ChartContainer config={barChartConfig} className="h-[200px] w-full">
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-teal-600" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No category data to display
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ChartContainer config={donutChartConfig} className="h-[200px] w-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="var(--color-background)"
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {categoryBreakdown.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Filters & Tabs ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-8">
                  {STATUS_TABS.map(tab => (
                    <TabsTrigger key={tab} value={tab} className="text-xs px-3 h-7">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    className="pl-8 h-8 w-[200px] text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-sm">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No expenses found</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                  {searchQuery || statusFilter !== "All" || categoryFilter !== "All"
                    ? "Try adjusting your filters or search terms"
                    : "Submit your first expense to get started"}
                </p>
                {!searchQuery && statusFilter === "All" && categoryFilter === "All" && (
                  <Button
                    onClick={() => setShowSubmitDialog(true)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Submit Expense
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredExpenses.map((expense, index) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                            {React.createElement(
                              CATEGORY_CONFIG[getCategoryKey(expense.category)]?.icon || FileText,
                              { className: "h-4 w-4 text-emerald-600" }
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{expense.title}</p>
                              {expense.receiptUrl && (
                                <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {renderCategoryBadge(expense.category)}
                              <span className="text-xs text-muted-foreground">
                                {expense.date ? format(new Date(expense.date), "MMM d, yyyy") : "No date"}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {expense.submittedBy?.name || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-right sm:min-w-[100px]">
                            <p className="font-semibold text-sm">{formatCurrency(expense.amount)}</p>
                          </div>
                          {renderStatusBadge(expense.status)}

                          {expense.status === "pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                disabled={actionLoading === expense.id}
                                onClick={() => handleStatusChange(expense.id, "approved")}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={actionLoading === expense.id}
                                onClick={() => handleStatusChange(expense.id, "rejected")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                              {expense.receiptUrl && (
                                <DropdownMenuItem className="text-xs">View Receipt</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Submit Expense Dialog ─────────────────────────────────── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Submit Expense
            </DialogTitle>
            <DialogDescription>Fill in the details to submit a new expense for approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-title">Title *</Label>
              <Input
                id="exp-title"
                placeholder="e.g. Flight to NYC conference"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-category">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="exp-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
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
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea
                id="exp-desc"
                placeholder="Add details about this expense..."
                rows={3}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-receipt">Receipt URL</Label>
              <Input
                id="exp-receipt"
                placeholder="https://..."
                value={formReceiptUrl}
                onChange={e => setFormReceiptUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formTitle || !formAmount || !formCategory || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Submitting..." : "Submit Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
