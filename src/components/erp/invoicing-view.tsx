"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Invoice, type TimeEntry } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit3,
  Send,
  Download,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Timer,
  User,
  Briefcase,
  X,
  Receipt,
  Banknote,
} from "lucide-react"

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
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  sent: { label: "Sent", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  paid: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  overdue: { label: "Overdue", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  cancelled: { label: "Cancelled", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
}

// ── Chart config ────────────────────────────────────────────────────
const revenueChartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
}

// ── Line item type ──────────────────────────────────────────────────
interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

// ── Format helpers ──────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

// ── Main Component ──────────────────────────────────────────────────
export function InvoicingView() {
  const { invoices, clients, campaigns, timeEntries, setInvoices, setTimeEntries } = useERPStore()

  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddTimeDialog, setShowAddTimeDialog] = useState(false)

  // Expanded invoice
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)

  // Create invoice form state
  const [formClientId, setFormClientId] = useState("")
  const [formCampaignId, setFormCampaignId] = useState("")
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ])
  const [formTaxRate, setFormTaxRate] = useState(10)
  const [formDueDate, setFormDueDate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  // Time entry form
  const [timeFormDescription, setTimeFormDescription] = useState("")
  const [timeFormHours, setTimeFormHours] = useState(1)
  const [timeFormClientId, setTimeFormClientId] = useState("")
  const [timeFormDate, setTimeFormDate] = useState(new Date().toISOString().split("T")[0])
  const [timeFormBillable, setTimeFormBillable] = useState(true)

  // ── Computed values ────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (clientFilter !== "all" && inv.clientId !== clientFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesNumber = inv.number.toLowerCase().includes(q)
        const matchesClient = inv.client.name.toLowerCase().includes(q)
        const matchesCampaign = inv.campaign?.name.toLowerCase().includes(q) ?? false
        if (!matchesNumber && !matchesClient && !matchesCampaign) return false
      }
      return true
    })
  }, [invoices, statusFilter, clientFilter, searchQuery])

  const totalRevenue = useMemo(() => invoices.reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const paidRevenue = useMemo(() => invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const outstandingRevenue = useMemo(() => invoices.filter((inv) => inv.status === "sent").reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const overdueRevenue = useMemo(() => invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const overdueCount = useMemo(() => invoices.filter((inv) => inv.status === "overdue").length, [invoices])

  // Revenue chart data - last 6 months
  const revenueChartData = useMemo(() => {
    const months: { month: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new MonthEnd(d.getFullYear(), d.getMonth())
      const rev = invoices
        .filter((inv) => {
          const created = new Date(inv.createdAt)
          return created >= monthStart && created <= monthEnd && (inv.status === "paid" || inv.status === "sent")
        })
        .reduce((sum, inv) => sum + inv.total, 0)
      months.push({ month: monthLabel, revenue: Math.round(rev) })
    }
    return months
  }, [invoices])

  // Form computed
  const formSubtotal = useMemo(() => formLineItems.reduce((sum, item) => sum + item.amount, 0), [formLineItems])
  const formTax = useMemo(() => formSubtotal * (formTaxRate / 100), [formSubtotal, formTaxRate])
  const formTotal = useMemo(() => formSubtotal + formTax, [formSubtotal, formTax])

  // Weekly time summary
  const weeklyTimeSummary = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEntries = timeEntries.filter((e) => new Date(e.date) >= weekStart)
    const totalHours = weekEntries.reduce((sum, e) => sum + e.hours, 0)
    const billableHours = weekEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
    const byUser: Record<string, { name: string; hours: number }> = {}
    weekEntries.forEach((e) => {
      if (!byUser[e.userId]) byUser[e.userId] = { name: e.user.name, hours: 0 }
      byUser[e.userId].hours += e.hours
    })
    return { totalHours, billableHours, byUser: Object.values(byUser) }
  }, [timeEntries])

  // ── Handlers ───────────────────────────────────────────────────────
  const updateLineItem = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    setFormLineItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === "quantity" || field === "rate") {
        updated[index].amount = Number(updated[index].quantity) * Number(updated[index].rate)
      }
      return updated
    })
  }, [])

  const addLineItem = useCallback(() => {
    setFormLineItems((prev) => [...prev, { description: "", quantity: 1, rate: 0, amount: 0 }])
  }, [])

  const removeLineItem = useCallback((index: number) => {
    setFormLineItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const resetForm = useCallback(() => {
    setFormClientId("")
    setFormCampaignId("")
    setFormLineItems([{ description: "", quantity: 1, rate: 0, amount: 0 }])
    setFormTaxRate(10)
    setFormDueDate("")
    setFormNotes("")
  }, [])

  const resetTimeForm = useCallback(() => {
    setTimeFormDescription("")
    setTimeFormHours(1)
    setTimeFormClientId("")
    setTimeFormDate(new Date().toISOString().split("T")[0])
    setTimeFormBillable(true)
  }, [])

  const handleCreateInvoice = useCallback(async (status: string) => {
    if (!formClientId) return

    const nextNumber = `INV-${String(invoices.length + 1).padStart(4, "0")}`
    const body = {
      number: nextNumber,
      clientId: formClientId,
      campaignId: formCampaignId || null,
      status,
      items: JSON.stringify(formLineItems),
      subtotal: formSubtotal,
      tax: formTax,
      total: formTotal,
      dueDate: formDueDate || null,
      notes: formNotes || null,
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices([data.invoice, ...invoices])
        resetForm()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error("Failed to create invoice:", error)
    }
  }, [formClientId, formCampaignId, formLineItems, formSubtotal, formTax, formTotal, formDueDate, formNotes, invoices, setInvoices, resetForm])

  const handleUpdateInvoiceStatus = useCallback(async (invoiceId: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(invoices.map((inv) => (inv.id === invoiceId ? data.invoice : inv)))
      }
    } catch (error) {
      console.error("Failed to update invoice:", error)
    }
  }, [invoices, setInvoices])

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" })
      if (res.ok) {
        setInvoices(invoices.filter((inv) => inv.id !== invoiceId))
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error)
    }
  }, [invoices, setInvoices])

  const handleAddTimeEntry = useCallback(async () => {
    if (!timeFormDescription) return
    const body = {
      description: timeFormDescription,
      hours: timeFormHours,
      billable: timeFormBillable,
      date: timeFormDate,
      userId: "user-admin",
      clientId: timeFormClientId || null,
    }
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setTimeEntries([data.timeEntry, ...timeEntries])
        resetTimeForm()
        setShowAddTimeDialog(false)
      }
    } catch (error) {
      console.error("Failed to add time entry:", error)
    }
  }, [timeFormDescription, timeFormHours, timeFormBillable, timeFormDate, timeFormClientId, timeEntries, setTimeEntries, resetTimeForm])

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoicing & Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage invoices, track payments, and monitor revenue</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowCreateDialog(true) }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </motion.div>

        {/* ── KPI Row ─────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(paidRevenue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(outstandingRevenue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(overdueRevenue)}</p>
                  {overdueCount > 0 && (
                    <p className="text-xs text-rose-600 mt-0.5">{overdueCount} invoice{overdueCount !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Revenue Chart ───────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="invoices" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="invoices" className="gap-2">
                <Receipt className="h-4 w-4" /> Invoices
              </TabsTrigger>
              <TabsTrigger value="time-tracking" className="gap-2">
                <Timer className="h-4 w-4" /> Time Tracking
              </TabsTrigger>
            </TabsList>

            {/* ── Invoices Tab ──────────────────────────────────────────── */}
            <TabsContent value="invoices" className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Briefcase className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Invoice List */}
              {filteredInvoices.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground mt-4 font-medium">No invoices found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      {invoices.length === 0 ? "Create your first invoice to get started" : "Try adjusting your filters"}
                    </p>
                    {invoices.length === 0 && (
                      <Button
                        onClick={() => { resetForm(); setShowCreateDialog(true) }}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      >
                        <Plus className="h-4 w-4" /> Create Invoice
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_44px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Invoice</span>
                    <span>Client</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Due Date</span>
                    <span>Campaign</span>
                    <span></span>
                  </div>

                  <AnimatePresence>
                    {filteredInvoices.map((invoice) => {
                      const isExpanded = expandedInvoiceId === invoice.id
                      const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft
                      const parsedItems: LineItem[] = (() => {
                        try {
                          return typeof invoice.items === "string" ? JSON.parse(invoice.items) : []
                        } catch { return [] }
                      })()

                      return (
                        <motion.div
                          key={invoice.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}>
                            <CardContent className="p-4">
                              {/* Desktop Row */}
                              <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.8fr_0.7fr_0.7fr_0.8fr_44px] gap-4 items-center">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span className="font-medium text-sm">{invoice.number}</span>
                                </div>
                                <span className="text-sm">{invoice.client.name}</span>
                                <span className="text-sm font-semibold">{formatCurrency(invoice.total)}</span>
                                <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} w-fit text-xs`}>
                                  {statusCfg.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</span>
                                <span className="text-sm text-muted-foreground truncate">{invoice.campaign?.name || "—"}</span>
                                <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                                      <DropdownMenuItem><Edit3 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                      {invoice.status === "draft" && (
                                        <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(invoice.id, "sent")}>
                                          <Send className="h-4 w-4 mr-2" />Mark Sent
                                        </DropdownMenuItem>
                                      )}
                                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                                        <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(invoice.id, "paid")}>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />Mark Paid
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteInvoice(invoice.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Mobile Card */}
                              <div className="md:hidden space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-600" />
                                    <span className="font-medium text-sm">{invoice.number}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} text-xs`}>
                                      {statusCfg.label}
                                    </Badge>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">{invoice.client.name}</span>
                                  <span className="text-sm font-semibold">{formatCurrency(invoice.total)}</span>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <Separator className="my-3" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                      <div className="space-y-1 text-sm">
                                        <p><span className="text-muted-foreground">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                                        <p><span className="text-muted-foreground">Campaign:</span> {invoice.campaign?.name || "—"}</p>
                                        {invoice.paidAt && <p><span className="text-muted-foreground">Paid At:</span> {formatDate(invoice.paidAt)}</p>}
                                        {invoice.notes && <p><span className="text-muted-foreground">Notes:</span> {invoice.notes}</p>}
                                      </div>
                                      <div className="space-y-1 text-sm">
                                        <p><span className="text-muted-foreground">Subtotal:</span> {formatCurrency(invoice.subtotal)}</p>
                                        <p><span className="text-muted-foreground">Tax:</span> {formatCurrency(invoice.tax)}</p>
                                        <p className="font-semibold"><span className="text-muted-foreground font-normal">Total:</span> {formatCurrency(invoice.total)}</p>
                                      </div>
                                    </div>

                                    {parsedItems.length > 0 && (
                                      <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-muted/50">
                                              <th className="text-left p-2 font-medium">Description</th>
                                              <th className="text-right p-2 font-medium">Qty</th>
                                              <th className="text-right p-2 font-medium">Rate</th>
                                              <th className="text-right p-2 font-medium">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {parsedItems.map((item, i) => (
                                              <tr key={i} className="border-t">
                                                <td className="p-2">{item.description || "—"}</td>
                                                <td className="p-2 text-right">{item.quantity}</td>
                                                <td className="p-2 text-right">{formatCurrency(item.rate)}</td>
                                                <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}

                                    {/* Mobile Actions */}
                                    <div className="md:hidden flex gap-2 mt-3">
                                      {invoice.status === "draft" && (
                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleUpdateInvoiceStatus(invoice.id, "sent") }} className="gap-1">
                                          <Send className="h-3.5 w-3.5" /> Mark Sent
                                        </Button>
                                      )}
                                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={(e) => { e.stopPropagation(); handleUpdateInvoiceStatus(invoice.id, "paid") }}>
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                                        </Button>
                                      )}
                                      <Button size="sm" variant="ghost" className="text-rose-600 gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id) }}>
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* ── Time Tracking Tab ─────────────────────────────────────── */}
            <TabsContent value="time-tracking" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{weeklyTimeSummary.totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{weeklyTimeSummary.billableHours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Billable</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{(weeklyTimeSummary.totalHours - weeklyTimeSummary.billableHours).toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">Non-Billable</p>
                  </div>
                </div>
                <Button onClick={() => { resetTimeForm(); setShowAddTimeDialog(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <Plus className="h-4 w-4" /> Add Time Entry
                </Button>
              </div>

              {/* Weekly Summary by User */}
              {weeklyTimeSummary.byUser.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Weekly Summary by Team Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {weeklyTimeSummary.byUser.map((u) => (
                        <div key={u.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.hours.toFixed(1)}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Entries Table */}
              {timeEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Timer className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground mt-4 font-medium">No time entries yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Start tracking your work hours</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[480px]">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-right p-3 font-medium">Hours</th>
                            <th className="text-left p-3 font-medium hidden sm:table-cell">Client</th>
                            <th className="text-left p-3 font-medium hidden md:table-cell">Date</th>
                            <th className="text-center p-3 font-medium">Billable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeEntries.slice(0, 20).map((entry) => (
                            <tr key={entry.id} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="h-3 w-3 text-emerald-600" />
                                  </div>
                                  <span className="text-sm">{entry.user.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{entry.description}</td>
                              <td className="p-3 text-right font-medium">{entry.hours.toFixed(1)}h</td>
                              <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{entry.client?.name || "—"}</td>
                              <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(entry.date)}</td>
                              <td className="p-3 text-center">
                                {entry.billable ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Billable</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Non-Billable</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* ── Create Invoice Dialog ──────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" /> Create Invoice
            </DialogTitle>
            <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Client & Campaign */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campaign (optional)</Label>
                <Select value={formCampaignId} onValueChange={setFormCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns
                      .filter((c) => !formClientId || c.clientId === formClientId || !c.clientId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-right p-2 font-medium w-20">Qty</th>
                      <th className="text-right p-2 font-medium w-28">Rate</th>
                      <th className="text-right p-2 font-medium w-28">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formLineItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, "description", e.target.value)}
                            placeholder="Service description"
                            className="h-8 text-sm border-0 shadow-none focus-visible:ring-0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                            className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 w-16"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.rate}
                            onChange={(e) => updateLineItem(index, "rate", Number(e.target.value))}
                            className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 w-24"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                        <td className="p-1">
                          {formLineItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(index)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(formSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tax Rate</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(Number(e.target.value))}
                    className="h-7 w-16 text-sm text-right"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="font-medium">{formatCurrency(formTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{formatCurrency(formTotal)}</span>
              </div>
            </div>

            {/* Due Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="h-20 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleCreateInvoice("draft")} disabled={!formClientId} className="gap-1">
              <FileText className="h-4 w-4" /> Save as Draft
            </Button>
            <Button onClick={() => handleCreateInvoice("sent")} disabled={!formClientId} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Send className="h-4 w-4" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Time Entry Dialog ──────────────────────────────────────── */}
      <Dialog open={showAddTimeDialog} onOpenChange={setShowAddTimeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-emerald-600" /> Add Time Entry
            </DialogTitle>
            <DialogDescription>Log time spent on client work</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={timeFormDescription}
                onChange={(e) => setTimeFormDescription(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={timeFormHours}
                  onChange={(e) => setTimeFormHours(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={timeFormDate}
                  onChange={(e) => setTimeFormDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client (optional)</Label>
              <Select value={timeFormClientId} onValueChange={setTimeFormClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="billable-toggle">Billable</Label>
              <Switch id="billable-toggle" checked={timeFormBillable} onCheckedChange={setTimeFormBillable} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTimeDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTimeEntry} disabled={!timeFormDescription} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper class for month end calculation
class MonthEnd {
  year: number
  month: number
  constructor(year: number, month: number) {
    this.year = year
    this.month = month
  }
  valueOf() {
    return new Date(this.year, this.month + 1, 0, 23, 59, 59, 999).getTime()
  }
}
