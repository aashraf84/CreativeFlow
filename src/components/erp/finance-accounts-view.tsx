"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useERPStore, type Account, type TaxRate, type JournalEntry, type JournalEntryLine } from "@/lib/store"
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
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import {
  Landmark, DollarSign, TrendingUp, TrendingDown, Plus, Search, FileText,
  Percent, Wallet, CreditCard, PiggyBank, ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, BookOpen, BarChart3, ChevronRight, ChevronDown,
  Trash2, Edit3, Eye, Send, Ban, RefreshCw, Download, Minus, Calculator,
} from "lucide-react"
import { format } from "date-fns"

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
}

// ── Account type config (with dark mode variants) ──────────────────
const ACCOUNT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  asset: { label: "Asset", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/40", icon: Wallet },
  liability: { label: "Liability", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/40", icon: CreditCard },
  equity: { label: "Equity", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700/40", icon: PiggyBank },
  revenue: { label: "Revenue", color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700/40", icon: TrendingUp },
  expense: { label: "Expense", color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700/40", icon: TrendingDown },
}

const ACCOUNT_TYPES = ["All", "Asset", "Liability", "Equity", "Revenue", "Expense"]

// ── Helpers ─────────────────────────────────────────────────────────
function safeParse<T>(val: unknown, fallback: T): T {
  try { return val as T } catch { return fallback }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    posted: { variant: "default", icon: CheckCircle2 },
    draft: { variant: "secondary", icon: FileText },
    void: { variant: "destructive", icon: Ban },
  }
  const cfg = map[status] || map.draft
  const Icon = cfg.icon
  return <Badge variant={cfg.variant} className="gap-1"><Icon className="h-3 w-3" />{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

// ── Account Form State ──────────────────────────────────────────────
interface AccountFormData {
  code: string; name: string; type: string; description: string; normalBalance: string;
  parentId: string; category: string; isActive: boolean; balance: number;
}

const defaultAccountForm: AccountFormData = {
  code: "", name: "", type: "asset", description: "", normalBalance: "debit",
  parentId: "", category: "", isActive: true, balance: 0,
}

// ── Journal Entry Form State ────────────────────────────────────────
interface JLineForm { accountId: string; debit: number; credit: number; description: string }
interface JEntryFormData {
  date: string; description: string; reference: string; source: string; period: string;
  isAdjusting: boolean; lines: JLineForm[];
}

const defaultLine: JLineForm = { accountId: "", debit: 0, credit: 0, description: "" }
const defaultJEntryForm: JEntryFormData = {
  date: new Date().toISOString().split("T")[0], description: "", reference: "",
  source: "manual", period: new Date().toISOString().slice(0, 7), isAdjusting: false,
  lines: [{ ...defaultLine }, { ...defaultLine }],
}

// ── Tax Rate Form State ─────────────────────────────────────────────
interface TaxRateFormData { name: string; rate: number; type: string; isActive: boolean }
const defaultTaxForm: TaxRateFormData = { name: "", rate: 0, type: "sales", isActive: true }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function FinanceAccountsView() {
  const { financeAccounts, taxRates, journalEntries } = useERPStore()

  // ── Local state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("chart-of-accounts")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

  // Account dialogs
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState<AccountFormData>(defaultAccountForm)

  // General Ledger
  const [selectedGlAccount, setSelectedGlAccount] = useState<string>("")
  const [glLines, setGlLines] = useState<(JournalEntryLine & { jeNumber: string; jeDate: string; jeDescription: string; jeReference: string | null })[]>([])
  const [glLoading, setGlLoading] = useState(false)

  // Journal Entry dialogs
  const [showJEntryDialog, setShowJEntryDialog] = useState(false)
  const [jEntryForm, setJEntryForm] = useState<JEntryFormData>(defaultJEntryForm)
  const [expandedJEntries, setExpandedJEntries] = useState<Set<string>>(new Set())
  const [jeStatusFilter, setJeStatusFilter] = useState("all")
  const [jeSourceFilter, setJeSourceFilter] = useState("all")
  const [jePeriodFilter, setJePeriodFilter] = useState("")
  const [jeSearch, setJeSearch] = useState("")

  // Financial reports
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportPeriod, setReportPeriod] = useState("")

  // Tax Rate dialogs
  const [showTaxDialog, setShowTaxDialog] = useState(false)
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null)
  const [taxForm, setTaxForm] = useState<TaxRateFormData>(defaultTaxForm)

  // ── Fallback data fetching with retry ────────────────────────────────
  useEffect(() => {
    const fetchWithRetry = async (url: string, setter: (data: unknown[]) => void, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const res = await fetch(url)
          const json = await res.json()
          if (json.data) { setter(json.data); return }
        } catch { /* retry */ }
        if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)))
      }
    }
    if (financeAccounts.length === 0) {
      fetchWithRetry("/api/accounts", (d) => useERPStore.getState().setFinanceAccounts(d as Account[]))
    }
    if (journalEntries.length === 0) {
      fetchWithRetry("/api/journal-entries", (d) => useERPStore.getState().setJournalEntries(d as JournalEntry[]))
    }
    if (taxRates.length === 0) {
      fetchWithRetry("/api/tax-rates", (d) => useERPStore.getState().setTaxRates(d as TaxRate[]))
    }
    // Pre-fetch trial balance report so it's ready when the user clicks the tab
    fetchWithRetry("/api/financial-reports?type=trial-balance", (d) => setReportData(d as Record<string, unknown>))
  }, []) // only on mount

  // ── Computed ─────────────────────────────────────────────────────
  const parentAccounts = useMemo(() => financeAccounts.filter((a) => !a.parentId), [financeAccounts])
  const childAccountsMap = useMemo(() => {
    const map: Record<string, Account[]> = {}
    financeAccounts.forEach((a) => {
      if (a.parentId) {
        if (!map[a.parentId]) map[a.parentId] = []
        map[a.parentId].push(a)
      }
    })
    return map
  }, [financeAccounts])

  const filteredAccounts = useMemo(() => {
    let list = financeAccounts
    if (typeFilter !== "All") list = list.filter((a) => a.type === typeFilter.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
    }
    return list
  }, [financeAccounts, typeFilter, search])

  const kpis = useMemo(() => {
    const byType: Record<string, number> = {}
    financeAccounts.forEach((a) => {
      if (!a.parentId) return // only leaf/child accounts for totals
      byType[a.type] = (byType[a.type] || 0) + a.balance
    })
    return {
      totalAssets: byType["asset"] || 0,
      totalLiabilities: byType["liability"] || 0,
      totalEquity: byType["equity"] || 0,
      totalRevenue: byType["revenue"] || 0,
      totalExpenses: byType["expense"] || 0,
    }
  }, [financeAccounts])

  const filteredJournalEntries = useMemo(() => {
    let list = journalEntries
    if (jeStatusFilter !== "all") list = list.filter((e) => e.status === jeStatusFilter)
    if (jeSourceFilter !== "all") list = list.filter((e) => e.source === jeSourceFilter)
    if (jePeriodFilter) list = list.filter((e) => e.period === jePeriodFilter)
    if (jeSearch) {
      const q = jeSearch.toLowerCase()
      list = list.filter((e) => e.number.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    }
    return list
  }, [journalEntries, jeStatusFilter, jeSourceFilter, jePeriodFilter, jeSearch])

  const periods = useMemo(() => {
    const set = new Set(journalEntries.map((e) => e.period))
    return Array.from(set).sort().reverse()
  }, [journalEntries])

  // ── Handlers ─────────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleJEntryExpand = (id: string) => {
    setExpandedJEntries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const openAddAccount = () => {
    setEditingAccount(null)
    setAccountForm(defaultAccountForm)
    setShowAccountDialog(true)
  }

  const openEditAccount = (account: Account) => {
    setEditingAccount(account)
    setAccountForm({
      code: account.code, name: account.name, type: account.type,
      description: account.description || "", normalBalance: account.normalBalance,
      parentId: account.parentId || "", category: account.category || "",
      isActive: account.isActive, balance: account.balance,
    })
    setShowAccountDialog(true)
  }

  const saveAccount = async () => {
    const payload = {
      ...accountForm,
      parentId: accountForm.parentId || null,
      description: accountForm.description || null,
      category: accountForm.category || null,
    }
    try {
      if (editingAccount) {
        await fetch(`/api/accounts/${editingAccount.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      setShowAccountDialog(false)
      refreshAccounts()
    } catch (e) { console.error("Save account error:", e) }
  }

  const deleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      if (res.ok) refreshAccounts()
      else { const data = await res.json(); alert(data.error || "Cannot delete account") }
    } catch (e) { console.error("Delete error:", e) }
  }

  const refreshAccounts = async () => {
    try {
      const res = await fetch("/api/accounts")
      const json = await res.json()
      if (json.data) useERPStore.getState().setFinanceAccounts(json.data)
    } catch { /* ignore */ }
  }

  // GL
  const loadGeneralLedger = useCallback(async (accountId: string) => {
    if (!accountId) return
    setSelectedGlAccount(accountId)
    setGlLoading(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`)
      const json = await res.json()
      if (json.data?.recentTransactions) {
        setGlLines(json.data.recentTransactions.map((l: Record<string, unknown>) => ({
          ...l,
          jeNumber: (l.journalEntry as Record<string, string>)?.number || "",
          jeDate: (l.journalEntry as Record<string, string>)?.date || "",
          jeDescription: (l.journalEntry as Record<string, string>)?.description || "",
          jeReference: (l.journalEntry as Record<string, string>)?.reference || null,
        })))
      }
    } catch { /* ignore */ }
    setGlLoading(false)
  }, [])

  // Journal entries
  const openAddJEntry = () => {
    setJEntryForm({ ...defaultJEntryForm, lines: [{ ...defaultLine }, { ...defaultLine }] })
    setShowJEntryDialog(true)
  }

  const saveJEntry = async (postNow: boolean) => {
    const totalDebit = jEntryForm.lines.reduce((s, l) => s + (l.debit || 0), 0)
    const totalCredit = jEntryForm.lines.reduce((s, l) => s + (l.credit || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) { alert("Total debits must equal total credits"); return }
    if (!jEntryForm.description) { alert("Description is required"); return }
    if (!jEntryForm.period) { alert("Period is required"); return }
    try {
      const payload = {
        ...jEntryForm,
        status: postNow ? "posted" : "draft",
        lines: jEntryForm.lines.map((l) => ({ ...l, debit: l.debit || 0, credit: l.credit || 0 })),
      }
      await fetch("/api/journal-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      setShowJEntryDialog(false)
      refreshJournalEntries()
    } catch (e) { console.error("Save JE error:", e) }
  }

  const postJEntry = async (id: string) => {
    try {
      await fetch(`/api/journal-entries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "posted" }) })
      refreshJournalEntries()
    } catch { /* ignore */ }
  }

  const voidJEntry = async (id: string) => {
    try {
      await fetch(`/api/journal-entries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "void" }) })
      refreshJournalEntries()
    } catch { /* ignore */ }
  }

  const refreshJournalEntries = async () => {
    try {
      const res = await fetch("/api/journal-entries")
      const json = await res.json()
      if (json.data) useERPStore.getState().setJournalEntries(json.data)
    } catch { /* ignore */ }
  }

  // Financial reports
  const loadReport = async (type: string) => {
    setReportLoading(true)
    try {
      const params = new URLSearchParams({ type })
      if (reportPeriod) params.set("period", reportPeriod)
      const res = await fetch(`/api/financial-reports?${params}`)
      const json = await res.json()
      setReportData(json.data || null)
    } catch { /* ignore */ }
    setReportLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    const fetchReport = async () => {
      let type = ""
      if (activeTab === "trial-balance") type = "trial-balance"
      else if (activeTab === "balance-sheet") type = "balance-sheet"
      else if (activeTab === "pnl") type = "pnl"
      if (!type) return
      setReportLoading(true)
      // Retry up to 3 times with delay for transient server failures
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const params = new URLSearchParams({ type })
          if (reportPeriod) params.set("period", reportPeriod)
          const res = await fetch(`/api/financial-reports?${params}`)
          const json = await res.json()
          if (!cancelled) setReportData(json.data || null)
          break // success, stop retrying
        } catch {
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
        }
      }
      if (!cancelled) setReportLoading(false)
    }
    fetchReport()
    return () => { cancelled = true }
  }, [activeTab, reportPeriod])

  // Tax rates
  const openAddTax = () => { setEditingTax(null); setTaxForm(defaultTaxForm); setShowTaxDialog(true) }
  const openEditTax = (t: TaxRate) => { setEditingTax(t); setTaxForm({ name: t.name, rate: t.rate, type: t.type, isActive: t.isActive }); setShowTaxDialog(true) }

  const saveTaxRate = async () => {
    try {
      if (editingTax) {
        await fetch(`/api/tax-rates/${editingTax.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(taxForm) })
      } else {
        await fetch("/api/tax-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(taxForm) })
      }
      setShowTaxDialog(false)
      refreshTaxRates()
    } catch { /* ignore */ }
  }

  const deleteTaxRate = async (id: string) => {
    try { await fetch(`/api/tax-rates/${id}`, { method: "DELETE" }); refreshTaxRates() } catch { /* ignore */ }
  }

  const refreshTaxRates = async () => {
    try {
      const res = await fetch("/api/tax-rates")
      const json = await res.json()
      if (json.data) useERPStore.getState().setTaxRates(json.data)
    } catch { /* ignore */ }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-[#1d1d1f] dark:text-white"><Landmark className="h-6 w-6 text-emerald-600" />Finance & Accounts</h1>
            <p className="text-sm text-[#86868b] dark:text-[#aeaeb2] mt-1">Chart of accounts, journal entries, and financial reporting</p>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Total Assets", value: kpis.totalAssets, icon: Wallet, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
            { label: "Total Liabilities", value: kpis.totalLiabilities, icon: CreditCard, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40" },
            { label: "Total Equity", value: kpis.totalEquity, icon: PiggyBank, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/40" },
            { label: "Total Revenue", value: kpis.totalRevenue, icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/40" },
            { label: "Total Expenses", value: kpis.totalExpenses, icon: TrendingDown, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/40" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover hover-lift rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-lg font-bold text-[#1d1d1f] dark:text-white truncate">{formatCurrency(kpi.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
          <TabsTrigger value="chart-of-accounts" className="text-xs rounded-lg">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="general-ledger" className="text-xs rounded-lg">General Ledger</TabsTrigger>
          <TabsTrigger value="journal-entries" className="text-xs rounded-lg">Journal Entries</TabsTrigger>
          <TabsTrigger value="trial-balance" className="text-xs rounded-lg">Trial Balance</TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-xs rounded-lg">Balance Sheet</TabsTrigger>
          <TabsTrigger value="pnl" className="text-xs rounded-lg">P&L Statement</TabsTrigger>
          <TabsTrigger value="tax-rates" className="text-xs rounded-lg">Tax Rates</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Chart of Accounts ──────────────────────────── */}
        <TabsContent value="chart-of-accounts">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Chart of Accounts</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48 h-8 text-xs" />
                  </div>
                  <Button size="sm" onClick={openAddAccount} className="h-8 text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"><Plus className="h-3.5 w-3.5 mr-1" />Add Account</Button>
                </div>
              </div>
              {/* Type pills */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {ACCOUNT_TYPES.map((t) => (
                  <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)} className={`h-7 text-xs rounded-full ${typeFilter === t ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0" : ""}`}>
                    {t}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-black/[0.03] dark:bg-white/[0.04] sticky top-0">
                    <tr>
                      <th className="text-left p-2.5 font-medium">Code</th>
                      <th className="text-left p-2.5 font-medium">Name</th>
                      <th className="text-left p-2.5 font-medium">Type</th>
                      <th className="text-left p-2.5 font-medium">Normal Balance</th>
                      <th className="text-right p-2.5 font-medium">Balance</th>
                      <th className="text-center p-2.5 font-medium">Status</th>
                      <th className="text-center p-2.5 font-medium">Txns</th>
                      <th className="text-right p-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentAccounts.filter((a) => {
                      if (typeFilter !== "All" && a.type !== typeFilter.toLowerCase()) return false
                      if (search) {
                        const q = search.toLowerCase()
                        const children = childAccountsMap[a.id] || []
                        const matchesParent = a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
                        const matchesChild = children.some((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
                        return matchesParent || matchesChild
                      }
                      return true
                    }).map((parent) => {
                      const children = childAccountsMap[parent.id] || []
                      const isExpanded = expandedAccounts.has(parent.id)
                      const cfg = ACCOUNT_TYPE_CONFIG[parent.type]
                      return (
                        <React.Fragment key={parent.id}>
                          <tr className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleExpand(parent.id)}>
                            <td className="p-2.5 font-bold">{parent.code}</td>
                            <td className="p-2.5 font-bold flex items-center gap-1">
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              {parent.name}
                            </td>
                            <td className="p-2.5">
                              {cfg && <Badge variant="outline" className={`${cfg.color} text-[10px]`}><cfg.icon className="h-2.5 w-2.5 mr-1" />{cfg.label}</Badge>}
                            </td>
                            <td className="p-2.5 capitalize">{parent.normalBalance}</td>
                            <td className="p-2.5 text-right font-medium">{formatCurrency(parent.balance)}</td>
                            <td className="p-2.5 text-center"><Badge variant={parent.isActive ? "default" : "secondary"} className="text-[10px]">{parent.isActive ? "Active" : "Inactive"}</Badge></td>
                            <td className="p-2.5 text-center text-muted-foreground">{safeParse(parent._count?.journalLines, 0)}</td>
                            <td className="p-2.5 text-right">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEditAccount(parent) }}><Edit3 className="h-3 w-3" /></Button>
                            </td>
                          </tr>
                          <AnimatePresence>
                            {isExpanded && children.map((child) => {
                              const childCfg = ACCOUNT_TYPE_CONFIG[child.type]
                              return (
                                <motion.tr key={child.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b bg-muted/10 hover:bg-muted/20 cursor-pointer" onClick={() => { setSelectedGlAccount(child.id); setActiveTab("general-ledger"); loadGeneralLedger(child.id) }}>
                                  <td className="p-2.5 pl-8">{child.code}</td>
                                  <td className="p-2.5">{child.name}</td>
                                  <td className="p-2.5">
                                    {childCfg && <Badge variant="outline" className={`${childCfg.color} text-[10px]`}><childCfg.icon className="h-2.5 w-2.5 mr-1" />{childCfg.label}</Badge>}
                                  </td>
                                  <td className="p-2.5 capitalize">{child.normalBalance}</td>
                                  <td className="p-2.5 text-right font-medium">{formatCurrency(child.balance)}</td>
                                  <td className="p-2.5 text-center"><Badge variant={child.isActive ? "default" : "secondary"} className="text-[10px]">{child.isActive ? "Active" : "Inactive"}</Badge></td>
                                  <td className="p-2.5 text-center text-muted-foreground">{safeParse(child._count?.journalLines, 0)}</td>
                                  <td className="p-2.5 text-right flex gap-1 justify-end">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEditAccount(child) }}><Edit3 className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); deleteAccount(child.id) }}><Trash2 className="h-3 w-3" /></Button>
                                  </td>
                                </motion.tr>
                              )
                            })}
                          </AnimatePresence>
                        </React.Fragment>
                      )
                    })}
                    {financeAccounts.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No accounts found. Add your first account to get started.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: General Ledger ─────────────────────────────── */}
        <TabsContent value="general-ledger">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-600" />General Ledger</CardTitle>
                <Select value={selectedGlAccount} onValueChange={(v) => loadGeneralLedger(v)}>
                  <SelectTrigger className="w-64 h-8 text-xs"><SelectValue placeholder="Select account..." /></SelectTrigger>
                  <SelectContent>
                    {financeAccounts.filter((a) => a.parentId).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {glLoading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600" /></div>
              ) : !selectedGlAccount ? (
                <div className="text-center py-12 text-muted-foreground">Select an account to view its general ledger</div>
              ) : glLines.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No transactions found for this account</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                      <tr>
                        <th className="text-left p-2.5 font-medium">Date</th>
                        <th className="text-left p-2.5 font-medium">JE #</th>
                        <th className="text-left p-2.5 font-medium">Description</th>
                        <th className="text-left p-2.5 font-medium">Reference</th>
                        <th className="text-right p-2.5 font-medium">Debit</th>
                        <th className="text-right p-2.5 font-medium">Credit</th>
                        <th className="text-right p-2.5 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let runningBalance = 0
                        const acct = financeAccounts.find((a) => a.id === selectedGlAccount)
                        const isDebitNormal = acct?.normalBalance === "debit"
                        return glLines.map((line, i) => {
                          if (isDebitNormal) runningBalance += line.debit - line.credit
                          else runningBalance += line.credit - line.debit
                          return (
                            <tr key={line.id} className="border-b hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                              <td className="p-2.5">{line.jeDate ? format(new Date(line.jeDate), "MMM dd, yyyy") : ""}</td>
                              <td className="p-2.5 font-medium text-emerald-700">{line.jeNumber}</td>
                              <td className="p-2.5">{line.jeDescription}</td>
                              <td className="p-2.5 text-muted-foreground">{line.jeReference || "-"}</td>
                              <td className="p-2.5 text-right">{line.debit > 0 ? formatCurrency(line.debit) : "-"}</td>
                              <td className="p-2.5 text-right">{line.credit > 0 ? formatCurrency(line.credit) : "-"}</td>
                              <td className="p-2.5 text-right font-medium">{formatCurrency(runningBalance)}</td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Journal Entries ────────────────────────────── */}
        <TabsContent value="journal-entries">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" />Journal Entries</CardTitle>
                <Button size="sm" onClick={openAddJEntry} className="h-8 text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"><Plus className="h-3.5 w-3.5 mr-1" />New Entry</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Select value={jeStatusFilter} onValueChange={setJeStatusFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jeSourceFilter} onValueChange={setJeSourceFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
                {periods.length > 0 && (
                  <Select value={jePeriodFilter} onValueChange={setJePeriodFilter}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="All Periods" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Periods</SelectItem>
                      {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
                  <Input placeholder="Search entries..." value={jeSearch} onChange={(e) => setJeSearch(e.target.value)} className="pl-7 w-40 h-7 text-xs" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredJournalEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No journal entries found</div>
                ) : filteredJournalEntries.map((entry) => {
                  const isExpanded = expandedJEntries.has(entry.id)
                  return (
                    <motion.div key={entry.id} layout className="border-b">
                      <div className="flex items-center gap-3 p-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer" onClick={() => toggleJEntryExpand(entry.id)}>
                        <div className="flex-shrink-0">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                          <div><p className="font-medium text-xs text-emerald-700">{entry.number}</p><p className="text-[10px] text-muted-foreground">{format(new Date(entry.date), "MMM dd, yyyy")}</p></div>
                          <div className="md:col-span-2"><p className="text-xs truncate">{entry.description}</p><p className="text-[10px] text-muted-foreground">{entry.source}{entry.reference ? ` · ${entry.reference}` : ""}</p></div>
                          <div className="text-right"><p className="text-xs">Dr: {formatCurrency(entry.totalDebit)}</p><p className="text-xs">Cr: {formatCurrency(entry.totalCredit)}</p></div>
                          <div className="flex items-center gap-2 justify-end">{statusBadge(entry.status)}</div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {entry.status === "draft" && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); postJEntry(entry.id) }}><Send className="h-3 w-3 mr-1" />Post</Button>}
                          {entry.status === "posted" && <Button size="sm" variant="outline" className="h-6 text-[10px] text-red-500" onClick={(e) => { e.stopPropagation(); voidJEntry(entry.id) }}><Ban className="h-3 w-3 mr-1" />Void</Button>}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-3">
                              <table className="w-full text-xs">
                                <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                                  <tr><th className="text-left p-2 font-medium">Account</th><th className="text-left p-2 font-medium">Description</th><th className="text-right p-2 font-medium">Debit</th><th className="text-right p-2 font-medium">Credit</th></tr>
                                </thead>
                                <tbody>
                                  {entry.lines.map((line) => (
                                    <tr key={line.id} className="border-b border-muted/30">
                                      <td className="p-2">{line.account?.code} - {line.account?.name}</td>
                                      <td className="p-2 text-muted-foreground">{line.description || "-"}</td>
                                      <td className="p-2 text-right">{line.debit > 0 ? formatCurrency(line.debit) : "-"}</td>
                                      <td className="p-2 text-right">{line.credit > 0 ? formatCurrency(line.credit) : "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-muted/20 font-medium">
                                  <tr><td className="p-2" colSpan={2}>Total</td><td className="p-2 text-right">{formatCurrency(entry.totalDebit)}</td><td className="p-2 text-right">{formatCurrency(entry.totalCredit)}</td></tr>
                                </tfoot>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Trial Balance ──────────────────────────────── */}
        <TabsContent value="trial-balance">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" />Trial Balance</CardTitle>
                <div className="flex items-center gap-2">
                  {periods.length > 0 && (
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Periods" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Periods</SelectItem>{periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600" /></div>
              ) : reportData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                      <tr><th className="text-left p-2.5 font-medium">Account Code</th><th className="text-left p-2.5 font-medium">Account Name</th><th className="text-left p-2.5 font-medium">Type</th><th className="text-right p-2.5 font-medium">Debit Total</th><th className="text-right p-2.5 font-medium">Credit Total</th></tr>
                    </thead>
                    <tbody>
                      {(reportData.accounts as { code: string; name: string; type: string; debitTotal: number; creditTotal: number }[] || []).map((a) => (
                        <tr key={a.code} className="border-b hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                          <td className="p-2.5 font-medium">{a.code}</td>
                          <td className="p-2.5">{a.name}</td>
                          <td className="p-2.5"><Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge></td>
                          <td className="p-2.5 text-right">{a.debitTotal > 0 ? formatCurrency(a.debitTotal) : "-"}</td>
                          <td className="p-2.5 text-right">{a.creditTotal > 0 ? formatCurrency(a.creditTotal) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 font-bold">
                      <tr>
                        <td className="p-2.5" colSpan={3}>Total</td>
                        <td className="p-2.5 text-right">{formatCurrency(reportData.totalDebits as number || 0)}</td>
                        <td className="p-2.5 text-right">{formatCurrency(reportData.totalCredits as number || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="mt-4 flex items-center gap-2">
                    {reportData.isBalanced ? (
                      <Badge className="bg-emerald-100 text-emerald-800 gap-1"><CheckCircle2 className="h-3 w-3" />Books are balanced</Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Books are NOT balanced</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">Difference: {formatCurrency(Math.abs((reportData.totalDebits as number || 0) - (reportData.totalCredits as number || 0)))}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Balance Sheet ──────────────────────────────── */}
        <TabsContent value="balance-sheet">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4 text-emerald-600" />Balance Sheet</CardTitle>
                {periods.length > 0 && (
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Periods" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Periods</SelectItem>{periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600" /></div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* ASSETS */}
                  <div>
                    <h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1"><Wallet className="h-4 w-4" />ASSETS</h3>
                    <div className="space-y-1">
                      {(reportData.assets as { code: string; name: string; balance: number; parentId: string | null }[] || []).map((a) => (
                        <div key={a.code} className={`flex justify-between text-xs p-1.5 ${a.parentId ? "pl-6" : "font-medium bg-black/[0.04] dark:bg-white/[0.06] rounded-lg"}`}>
                          <span>{a.code} - {a.name}</span><span>{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded mt-1 text-emerald-800 dark:text-emerald-200">
                        <span>Total Assets</span><span className="text-emerald-700">{formatCurrency(reportData.totalAssets as number || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LIABILITIES */}
                  <div>
                    <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1"><CreditCard className="h-4 w-4" />LIABILITIES</h3>
                    <div className="space-y-1">
                      {(reportData.liabilities as { code: string; name: string; balance: number; parentId: string | null }[] || []).map((a) => (
                        <div key={a.code} className={`flex justify-between text-xs p-1.5 ${a.parentId ? "pl-6" : "font-medium bg-black/[0.04] dark:bg-white/[0.06] rounded-lg"}`}>
                          <span>{a.code} - {a.name}</span><span>{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold p-2 bg-amber-50 dark:bg-amber-900/30 rounded mt-1 text-amber-800 dark:text-amber-200">
                        <span>Total Liabilities</span><span className="text-amber-700">{formatCurrency(reportData.totalLiabilities as number || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* EQUITY */}
                  <div>
                    <h3 className="text-sm font-bold text-teal-700 mb-2 flex items-center gap-1"><PiggyBank className="h-4 w-4" />EQUITY</h3>
                    <div className="space-y-1">
                      {(reportData.equity as { code: string; name: string; balance: number; parentId: string | null }[] || []).map((a) => (
                        <div key={a.code} className={`flex justify-between text-xs p-1.5 ${a.parentId ? "pl-6" : "font-medium bg-black/[0.04] dark:bg-white/[0.06] rounded-lg"}`}>
                          <span>{a.code} - {a.name}</span><span>{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold p-2 bg-teal-50 dark:bg-teal-900/30 rounded mt-1 text-teal-800 dark:text-teal-200">
                        <span>Total Equity</span><span className="text-teal-700">{formatCurrency(reportData.totalEquity as number || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* VALIDATION */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm font-bold p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg">
                      <span>Total Liabilities + Equity</span><span>{formatCurrency(reportData.totalLiabilitiesAndEquity as number || 0)}</span>
                    </div>
                    {reportData.isBalanced ? (
                      <Badge className="bg-emerald-100 text-emerald-800 gap-1"><CheckCircle2 className="h-3 w-3" />Balance sheet is balanced</Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Balance sheet is NOT balanced</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 6: P&L Statement ──────────────────────────────── */}
        <TabsContent value="pnl">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4 text-emerald-600" />Profit & Loss Statement</CardTitle>
                {periods.length > 0 && (
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Periods" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Periods</SelectItem>{periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="flex items-center justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600" /></div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4" />REVENUE</h3>
                    <div className="space-y-1">
                      {(reportData.revenue as { code: string; name: string; balance: number; parentId: string | null }[] || []).map((a) => (
                        <div key={a.code} className={`flex justify-between text-xs p-1.5 ${a.parentId ? "pl-6" : "font-medium bg-black/[0.04] dark:bg-white/[0.06] rounded-lg"}`}>
                          <span>{a.code} - {a.name}</span><span>{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold p-2 bg-green-50 rounded mt-1">
                        <span>Total Revenue</span><span className="text-green-700">{formatCurrency(reportData.totalRevenue as number || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1"><TrendingDown className="h-4 w-4" />EXPENSES</h3>
                    <div className="space-y-1">
                      {(reportData.expenses as { code: string; name: string; balance: number; parentId: string | null }[] || []).map((a) => (
                        <div key={a.code} className={`flex justify-between text-xs p-1.5 ${a.parentId ? "pl-6" : "font-medium bg-black/[0.04] dark:bg-white/[0.06] rounded-lg"}`}>
                          <span>{a.code} - {a.name}</span><span>{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold p-2 bg-red-50 dark:bg-red-900/30 rounded mt-1 text-red-800 dark:text-red-200">
                        <span>Total Expenses</span><span className="text-red-700">{formatCurrency(reportData.totalExpenses as number || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="border-t pt-4">
                    <div className={`flex justify-between text-lg font-bold p-3 rounded ${((reportData.netIncome as number) || 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"}`}>
                      <span>Net Income</span>
                      <span>{formatCurrency(reportData.netIncome as number || 0)}</span>
                    </div>
                  </div>

                  {/* Visual bar chart */}
                  <div className="space-y-3 pt-4">
                    <h4 className="text-xs font-medium text-muted-foreground">Revenue vs Expenses</h4>
                    {(() => {
                      const rev = reportData.totalRevenue as number || 0
                      const exp = reportData.totalExpenses as number || 0
                      const max = Math.max(rev, exp, 1)
                      return (
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span>Revenue</span><span className="font-medium">{formatCurrency(rev)}</span></div>
                            <div className="h-6 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(rev / max) * 100}%` }} /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span>Expenses</span><span className="font-medium">{formatCurrency(exp)}</span></div>
                            <div className="h-6 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg-full overflow-hidden"><div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(exp / max) * 100}%` }} /></div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 7: Tax Rates ──────────────────────────────────── */}
        <TabsContent value="tax-rates">
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-emerald-600" />Tax Rates</CardTitle>
                <Button size="sm" onClick={openAddTax} className="h-8 text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"><Plus className="h-3.5 w-3.5 mr-1" />Add Tax Rate</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                    <tr>
                      <th className="text-left p-2.5 font-medium">Name</th>
                      <th className="text-left p-2.5 font-medium">Rate</th>
                      <th className="text-left p-2.5 font-medium">Type</th>
                      <th className="text-center p-2.5 font-medium">Status</th>
                      <th className="text-right p-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxRates.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                        <td className="p-2.5 font-medium">{t.name}</td>
                        <td className="p-2.5">{t.rate}%</td>
                        <td className="p-2.5"><Badge variant="outline" className="text-[10px] capitalize">{t.type}</Badge></td>
                        <td className="p-2.5 text-center"><Badge variant={t.isActive ? "default" : "secondary"} className="text-[10px]">{t.isActive ? "Active" : "Inactive"}</Badge></td>
                        <td className="p-2.5 text-right flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditTax(t)}><Edit3 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => deleteTaxRate(t.id)}><Trash2 className="h-3 w-3" /></Button>
                        </td>
                      </tr>
                    ))}
                    {taxRates.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No tax rates found. Add your first tax rate.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Account Dialog ─────────────────────────────────────── */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle><DialogDescription>{editingAccount ? "Update account details" : "Create a new account in the chart of accounts"}</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Code</Label><Input value={accountForm.code} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Name</Label><Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="h-8 text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label>
                <Select value={accountForm.type} onValueChange={(v) => setAccountForm({ ...accountForm, type: v, normalBalance: (v === "asset" || v === "expense") ? "debit" : "credit" })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem><SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Normal Balance</Label>
                <Select value={accountForm.normalBalance} onValueChange={(v) => setAccountForm({ ...accountForm, normalBalance: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><Input value={accountForm.description} onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })} className="h-8 text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Parent Account</Label>
                <Select value={accountForm.parentId} onValueChange={(v) => setAccountForm({ ...accountForm, parentId: v === "__none__" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None (Top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (Top-level)</SelectItem>
                    {parentAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Category</Label><Input value={accountForm.category} onChange={(e) => setAccountForm({ ...accountForm, category: e.target.value })} className="h-8 text-xs" /></div>
            </div>
            {!editingAccount && <div><Label className="text-xs">Opening Balance</Label><Input type="number" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>}
            <div className="flex items-center gap-2"><Switch checked={accountForm.isActive} onCheckedChange={(v) => setAccountForm({ ...accountForm, isActive: v })} /><Label className="text-xs">Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAccountDialog(false)} className="text-xs rounded-lg">Cancel</Button><Button onClick={saveAccount} className="text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0">{editingAccount ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Journal Entry Dialog ───────────────────────────────── */}
      <Dialog open={showJEntryDialog} onOpenChange={setShowJEntryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Journal Entry</DialogTitle><DialogDescription>Add a new journal entry with debit and credit lines</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={jEntryForm.date} onChange={(e) => setJEntryForm({ ...jEntryForm, date: e.target.value })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Period</Label><Input value={jEntryForm.period} onChange={(e) => setJEntryForm({ ...jEntryForm, period: e.target.value })} className="h-8 text-xs" placeholder="2026-01" /></div>
              <div><Label className="text-xs">Source</Label>
                <Select value={jEntryForm.source} onValueChange={(v) => setJEntryForm({ ...jEntryForm, source: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="invoice">Invoice</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="payroll">Payroll</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><Input value={jEntryForm.description} onChange={(e) => setJEntryForm({ ...jEntryForm, description: e.target.value })} className="h-8 text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Reference</Label><Input value={jEntryForm.reference} onChange={(e) => setJEntryForm({ ...jEntryForm, reference: e.target.value })} className="h-8 text-xs" /></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={jEntryForm.isAdjusting} onCheckedChange={(v) => setJEntryForm({ ...jEntryForm, isAdjusting: v })} /><Label className="text-xs">Adjusting Entry</Label></div>
            </div>

            {/* Lines */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between"><Label className="text-xs font-medium">Line Items</Label><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setJEntryForm({ ...jEntryForm, lines: [...jEntryForm.lines, { ...defaultLine }] })}><Plus className="h-3 w-3 mr-1" />Add Line</Button></div>
              {jEntryForm.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4"><Label className="text-[10px]">Account</Label>
                    <Select value={line.accountId} onValueChange={(v) => { const nl = [...jEntryForm.lines]; nl[i] = { ...nl[i], accountId: v }; setJEntryForm({ ...jEntryForm, lines: nl }) }}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{financeAccounts.filter((a) => a.parentId).map((a) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label className="text-[10px]">Debit</Label><Input type="number" value={line.debit || ""} onChange={(e) => { const nl = [...jEntryForm.lines]; nl[i] = { ...nl[i], debit: parseFloat(e.target.value) || 0 }; setJEntryForm({ ...jEntryForm, lines: nl }) }} className="h-7 text-[10px]" /></div>
                  <div className="col-span-2"><Label className="text-[10px]">Credit</Label><Input type="number" value={line.credit || ""} onChange={(e) => { const nl = [...jEntryForm.lines]; nl[i] = { ...nl[i], credit: parseFloat(e.target.value) || 0 }; setJEntryForm({ ...jEntryForm, lines: nl }) }} className="h-7 text-[10px]" /></div>
                  <div className="col-span-3"><Label className="text-[10px]">Description</Label><Input value={line.description} onChange={(e) => { const nl = [...jEntryForm.lines]; nl[i] = { ...nl[i], description: e.target.value }; setJEntryForm({ ...jEntryForm, lines: nl }) }} className="h-7 text-[10px]" /></div>
                  <div className="col-span-1">{jEntryForm.lines.length > 2 && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => { const nl = jEntryForm.lines.filter((_, j) => j !== i); setJEntryForm({ ...jEntryForm, lines: nl }) }}><Minus className="h-3 w-3" /></Button>}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.04] p-3 rounded-xl mt-2">
              <div className="flex gap-6">
                <div><span className="text-xs text-muted-foreground">Total Debit: </span><span className="text-xs font-bold">{formatCurrency(jEntryForm.lines.reduce((s, l) => s + (l.debit || 0), 0))}</span></div>
                <div><span className="text-xs text-muted-foreground">Total Credit: </span><span className="text-xs font-bold">{formatCurrency(jEntryForm.lines.reduce((s, l) => s + (l.credit || 0), 0))}</span></div>
              </div>
              {Math.abs(jEntryForm.lines.reduce((s, l) => s + (l.debit || 0), 0) - jEntryForm.lines.reduce((s, l) => s + (l.credit || 0), 0)) < 0.01 ? (
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Balanced</Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="h-3 w-3" />Not Balanced</Badge>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJEntryDialog(false)} className="text-xs">Cancel</Button>
            <Button onClick={() => saveJEntry(false)} variant="outline" className="text-xs">Save as Draft</Button>
            <Button onClick={() => saveJEntry(true)} className="text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0">Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tax Rate Dialog ────────────────────────────────────── */}
      <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editingTax ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle><DialogDescription>{editingTax ? "Update tax rate details" : "Create a new tax rate"}</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Name</Label><Input value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} className="h-8 text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Rate (%)</Label><Input type="number" step="0.01" value={taxForm.rate} onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={taxForm.type} onValueChange={(v) => setTaxForm({ ...taxForm, type: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="sales">Sales</SelectItem><SelectItem value="payroll">Payroll</SelectItem><SelectItem value="vat">VAT</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={taxForm.isActive} onCheckedChange={(v) => setTaxForm({ ...taxForm, isActive: v })} /><Label className="text-xs">Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowTaxDialog(false)} className="text-xs rounded-lg">Cancel</Button><Button onClick={saveTaxRate} className="text-xs rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0">{editingTax ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
