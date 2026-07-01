"use client"

import React, { useState, useMemo } from "react"
import { useERPStore, type PayrollRun, type LeaveRequest } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import {
  Banknote, DollarSign, TrendingDown, Wallet, Play, CheckCircle2, XCircle,
  Clock, Calendar, ChevronDown, ChevronUp, UserPlus, AlertCircle, ArrowRight,
} from "lucide-react"

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  processing: { label: "Processing", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200" },
}

const LEAVE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

const CHART_COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6"]

// ── Payroll Run Detail ──────────────────────────────────────────────
function PayrollRunDetail({ run, onClose }: { run: PayrollRun; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Payroll Run: {run.period}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Run date: {formatDate(run.runDate)} &middot; {run.items?.length || 0} employees
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${STATUS_CONFIG[run.status]?.bg} ${STATUS_CONFIG[run.status]?.color} border`}>
                {STATUS_CONFIG[run.status]?.label}
              </Badge>
              <Button variant="outline" size="sm" onClick={onClose}>
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Gross Pay</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(run.totalGross)}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Deductions</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(run.totalDeductions)}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Net Pay</p>
              <p className="text-lg font-bold text-teal-600">{formatCurrency(run.totalNet)}</p>
            </div>
          </div>

          {/* Payroll items table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Base Salary</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Overtime</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Bonuses</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Tax</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {run.items?.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {item.employee?.firstName?.[0]}{item.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.employee?.firstName} {item.employee?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{item.employee?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">{formatCurrency(item.baseSalary)}</td>
                      <td className="p-3 text-right text-cyan-600">{item.overtime > 0 ? formatCurrency(item.overtime) : "-"}</td>
                      <td className="p-3 text-right text-emerald-600">{item.bonuses > 0 ? formatCurrency(item.bonuses) : "-"}</td>
                      <td className="p-3 text-right text-red-500">{item.deductions > 0 ? formatCurrency(item.deductions) : "-"}</td>
                      <td className="p-3 text-right text-amber-600">{formatCurrency(item.tax)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(item.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Add Leave Request Dialog ────────────────────────────────────────
function AddLeaveRequestDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { employees, leaveRequests, setLeaveRequests } = useERPStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const startDate = form.get("startDate") as string
    const endDate = form.get("endDate") as string
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.get("employeeId"),
          type: form.get("type"),
          startDate,
          endDate,
          days,
          reason: form.get("reason"),
          status: "pending",
        }),
      })
      if (res.ok) {
        const lr = await res.json()
        setLeaveRequests([...leaveRequests, lr])
        toast.success("Leave request submitted")
        setOpen(false)
      } else {
        toast.error("Failed to submit leave request")
      }
    } catch {
      toast.error("Failed to submit leave request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Leave Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee</Label>
            <Select name="employeeId" required>
              <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent>
                {employees.filter((e) => e.status === "active" || e.status === "probation").map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Leave Type</Label>
            <Select name="type" required>
              <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" placeholder="Optional reason..." rows={2} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Payroll View ───────────────────────────────────────────────
export function PayrollView() {
  const { payrollRuns, leaveRequests, employees, setLeaveRequests, setPayrollRuns } = useERPStore()
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [activeTab, setActiveTab] = useState("payroll")
  const [runningPayroll, setRunningPayroll] = useState(false)

  // KPIs
  const latestPayroll = payrollRuns[0]
  const monthlyPayroll = latestPayroll?.totalNet || 0
  const avgSalary = employees.length > 0
    ? Math.round(employees.filter((e) => e.status !== "terminated").reduce((s, e) => s + (e.salary || 0), 0) / employees.filter((e) => e.status !== "terminated").length)
    : 0
  const totalDeductions = latestPayroll?.totalDeductions || 0
  const netPay = latestPayroll?.totalNet || 0

  // Pending leave requests
  const pendingLeaves = leaveRequests.filter((lr) => lr.status === "pending")

  // Leave balance data for chart
  const leaveBalanceData = useMemo(() => {
    const activeEmps = employees.filter((e) => e.status === "active" || e.status === "on_leave" || e.status === "probation")
    return activeEmps.slice(0, 8).map((emp) => {
      const empLeaves = leaveRequests.filter((lr) => lr.employeeId === emp.id && lr.status === "approved")
      const used = empLeaves.reduce((sum, lr) => sum + lr.days, 0)
      return { name: emp.firstName, used: Math.round(used), remaining: Math.max(0, 20 - Math.round(used)) }
    })
  }, [employees, leaveRequests])

  const handleApproveLeave = async (lr: LeaveRequest) => {
    try {
      const res = await fetch(`/api/leave-requests/${lr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", approvedById: "admin", approvedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLeaveRequests(leaveRequests.map((l) => (l.id === lr.id ? { ...l, ...updated } : l)))
        toast.success("Leave request approved")
      } else {
        toast.error("Failed to approve leave request")
      }
    } catch {
      toast.error("Failed to approve leave request")
    }
  }

  const handleRejectLeave = async (lr: LeaveRequest, comment?: string) => {
    try {
      const res = await fetch(`/api/leave-requests/${lr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", approvedById: "admin", approvedAt: new Date().toISOString(), comment: comment || "Rejected" }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLeaveRequests(leaveRequests.map((l) => (l.id === lr.id ? { ...l, ...updated } : l)))
        toast.success("Leave request rejected")
      } else {
        toast.error("Failed to reject leave request")
      }
    } catch {
      toast.error("Failed to reject leave request")
    }
  }

  const handleRunPayroll = async () => {
    setRunningPayroll(true)
    try {
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const activeEmps = employees.filter((e) => e.status === "active" || e.status === "on_leave" || e.status === "probation")
      const items = activeEmps.map((emp) => {
        const baseSalary = Math.round((emp.salary || 0) / 12)
        const tax = Math.round(baseSalary * 0.28)
        const deductions = Math.round(baseSalary * 0.15)
        const netPay = baseSalary - tax - deductions
        return { employeeId: emp.id, baseSalary, overtime: 0, bonuses: 0, deductions, tax, netPay }
      })
      const totalGross = items.reduce((s, i) => s + i.baseSalary + i.overtime + i.bonuses, 0)
      const totalDed = items.reduce((s, i) => s + i.deductions + i.tax, 0)
      const totalNet = items.reduce((s, i) => s + i.netPay, 0)

      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, status: "draft", totalGross, totalDeductions: totalDed, totalNet, items }),
      })
      if (res.ok) {
        const newRun = await res.json()
        setPayrollRuns([newRun, ...payrollRuns])
        toast.success(`Payroll run for ${period} created`)
      } else {
        toast.error("Failed to run payroll")
      }
    } catch {
      toast.error("Failed to run payroll")
    } finally {
      setRunningPayroll(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage compensation, payroll runs, and leave requests</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          onClick={handleRunPayroll}
          disabled={runningPayroll}
        >
          <Play className="h-4 w-4" />
          {runningPayroll ? "Running..." : "Run Payroll"}
        </Button>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Monthly Payroll", value: formatCurrency(monthlyPayroll), icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Salary", value: formatCurrency(avgSalary), icon: DollarSign, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Total Deductions", value: formatCurrency(totalDeductions), icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Net Pay", value: formatCurrency(netPay), icon: Wallet, color: "text-cyan-600", bg: "bg-cyan-50" },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payroll" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Payroll Runs
          </TabsTrigger>
          <TabsTrigger value="leave" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white relative">
            Leave Requests
            {pendingLeaves.length > 0 && (
              <Badge className="ml-1.5 h-5 min-w-[20px] flex items-center justify-center text-[10px] bg-red-500 text-white px-1">
                {pendingLeaves.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Payroll Runs Tab */}
        <TabsContent value="payroll" className="mt-4">
          {selectedRun ? (
            <PayrollRunDetail run={selectedRun} onClose={() => setSelectedRun(null)} />
          ) : payrollRuns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Banknote className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No payroll runs</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Click &quot;Run Payroll&quot; to create your first run</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {payrollRuns.map((run) => {
                const statusCfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft
                return (
                  <motion.div key={run.id} variants={itemVariants}>
                    <Card
                      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => setSelectedRun(run)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                              {run.period.split("-")[1]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Period: {run.period}</h3>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.bg} ${statusCfg.color} border`}>
                                  {statusCfg.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(run.runDate)} &middot; {run.items?.length || 0} employees
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Gross</p>
                              <p className="text-sm font-semibold">{formatCurrency(run.totalGross)}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Deductions</p>
                              <p className="text-sm font-semibold text-red-500">{formatCurrency(run.totalDeductions)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Net Pay</p>
                              <p className="text-sm font-bold text-emerald-600">{formatCurrency(run.totalNet)}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Leave Requests</h2>
              <p className="text-sm text-muted-foreground">{pendingLeaves.length} pending approval</p>
            </div>
            <AddLeaveRequestDialog />
          </div>

          {/* Pending Requests */}
          {pendingLeaves.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Pending Approval
              </h3>
              {pendingLeaves.map((lr) => (
                <Card key={lr.id} className="border-l-4 border-l-amber-400 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {lr.employee?.firstName?.[0]}{lr.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{lr.employee?.firstName} {lr.employee?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{lr.employee?.position} &middot; {lr.employee?.department?.name}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                              {lr.type}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(lr.startDate)} — {formatDate(lr.endDate)}
                            </span>
                            <span className="font-medium">{lr.days} day{lr.days > 1 ? "s" : ""}</span>
                          </div>
                          {lr.reason && (
                            <p className="text-xs text-muted-foreground mt-1.5 italic">&quot;{lr.reason}&quot;</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => handleApproveLeave(lr)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                          onClick={() => handleRejectLeave(lr)}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* All leave requests */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Requests</h3>
            {leaveRequests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No leave requests yet</p>
                </CardContent>
              </Card>
            ) : (
              leaveRequests.map((lr) => {
                const statusCfg = LEAVE_STATUS_CONFIG[lr.status] || LEAVE_STATUS_CONFIG.pending
                return (
                  <Card key={lr.id} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {lr.employee?.firstName?.[0]}{lr.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lr.employee?.firstName} {lr.employee?.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="capitalize">{lr.type}</span> &middot; {lr.days} day{lr.days > 1 ? "s" : ""} &middot; {formatDate(lr.startDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.bg} ${statusCfg.color} border`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Leave Balance Chart */}
          {leaveBalanceData.length > 0 && (
            <div className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Leave Balance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leaveBalanceData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                          formatter={(value: number, name: string) => [`${value} days`, name === "used" ? "Used" : "Remaining"]}
                        />
                        <Bar dataKey="used" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Used" />
                        <Bar dataKey="remaining" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} name="Remaining" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
