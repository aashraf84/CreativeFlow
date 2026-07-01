"use client"
import { AnimatedKPI } from "@/components/erp/animated-kpi"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Attendance } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Clock, Plus, Search, Edit3, Trash2, LogIn, LogOut, Calendar, Users, AlertCircle, UserCheck, Fingerprint, RefreshCw, Download, CheckCircle2, Cpu } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "Present", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/40", dot: "bg-emerald-500" },
  late: { label: "Late", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/40", dot: "bg-amber-500" },
  absent: { label: "Absent", color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700/40", dot: "bg-red-500" },
  "half-day": { label: "Half Day", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/40 border-orange-200 dark:border-orange-700/40", dot: "bg-orange-500" },
  leave: { label: "On Leave", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700/40", dot: "bg-teal-500" },
}

export function AttendanceView() {
  const { attendance, employees, setAttendance } = useERPStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formClockIn, setFormClockIn] = useState("")
  const [formClockOut, setFormClockOut] = useState("")
  const [formStatus, setFormStatus] = useState("present")
  const [formNotes, setFormNotes] = useState("")

  // ── Attendance Machine Sync state ──
  const [showMachineDialog, setShowMachineDialog] = useState(false)
  const [machineSyncing, setMachineSyncing] = useState(false)
  const [machineRecords, setMachineRecords] = useState<Array<{
    employeeId: string
    employeeName: string
    clockIn: string
    clockOut: string | null
    status: string
    workHours: number | null
    selected: boolean
  }>>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // KPIs for selected date
  const dayRecords = useMemo(() => {
    return attendance.filter(a => {
      const aDate = new Date(a.date).toISOString().split("T")[0]
      return aDate === selectedDate
    })
  }, [attendance, selectedDate])

  const kpis = useMemo(() => {
    return {
      present: dayRecords.filter(a => a.status === "present").length,
      late: dayRecords.filter(a => a.status === "late").length,
      absent: dayRecords.filter(a => a.status === "absent").length,
      leave: dayRecords.filter(a => a.status === "leave").length,
    }
  }, [dayRecords])

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = attendance
    // Date filter
    result = result.filter(a => {
      try {
        const aDate = new Date(a.date).toISOString().split("T")[0]
        return aDate === selectedDate
      } catch {
        return false
      }
    })
    // Status filter
    if (statusFilter !== "all") result = result.filter(a => a.status === statusFilter)
    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.employee?.firstName?.toLowerCase().includes(q) ||
        a.employee?.lastName?.toLowerCase().includes(q) ||
        a.employee?.email?.toLowerCase().includes(q)
      )
    }
    return result
  }, [attendance, selectedDate, statusFilter, search])

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance")
      const json = await res.json()
      if (json.data) setAttendance(json.data)
    } catch { /* ignore */ }
  }, [setAttendance])

  const openAdd = () => {
    setEditingRecord(null)
    setFormEmployeeId(employees[0]?.id || "")
    setFormDate(selectedDate)
    setFormClockIn("")
    setFormClockOut("")
    setFormStatus("present")
    setFormNotes("")
    setShowAddDialog(true)
  }

  const openEdit = (record: Attendance) => {
    setEditingRecord(record)
    setFormEmployeeId(record.employeeId)
    setFormDate(new Date(record.date).toISOString().split("T")[0])
    setFormClockIn(record.clockIn ? new Date(record.clockIn).toTimeString().substring(0, 5) : "")
    setFormClockOut(record.clockOut ? new Date(record.clockOut).toTimeString().substring(0, 5) : "")
    setFormStatus(record.status)
    setFormNotes(record.notes || "")
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!formEmployeeId) {
      toast.error("Please select an employee")
      return
    }
    setLoading(true)
    try {
      const dateStr = `${formDate}T00:00:00.000Z`
      const clockInStr = formClockIn ? `${formDate}T${formClockIn}:00.000Z` : null
      const clockOutStr = formClockOut ? `${formDate}T${formClockOut}:00.000Z` : null

      const payload = {
        employeeId: formEmployeeId,
        date: dateStr,
        clockIn: clockInStr,
        clockOut: clockOutStr,
        status: formStatus,
        notes: formNotes,
      }

      if (editingRecord) {
        await fetch(`/api/attendance/${editingRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Attendance updated")
      } else {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Attendance recorded")
      }
      setShowAddDialog(false)
      refreshData()
    } catch {
      toast.error("Failed to save attendance")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/attendance/${id}`, { method: "DELETE" })
      toast.success("Attendance deleted")
      refreshData()
    } catch {
      toast.error("Failed to delete")
    }
  }

  // ── Attendance Machine: Fetch records from device ──
  const handleMachineSync = async () => {
    setMachineSyncing(true)
    setShowMachineDialog(true)
    setMachineRecords([])
    try {
      const res = await fetch(`/api/attendance-machine/sync?date=${selectedDate}`)
      const data = await res.json()
      if (data.records) {
        // Mark which records already exist in the system
        const existingIds = new Set(attendance.map(a => a.employeeId))
        const records = data.records.map((r: Record<string, unknown>) => ({
          employeeId: r.employeeId as string,
          employeeName: r.employeeName as string,
          clockIn: r.clockIn as string,
          clockOut: r.clockOut as string | null,
          status: r.status as string,
          workHours: r.workHours as number | null,
          selected: !existingIds.has(r.employeeId as string), // auto-select new records
        }))
        setMachineRecords(records)
        setLastSyncTime(new Date())
        toast.success(`Fetched ${records.length} records from attendance machine`)
      } else {
        toast.error("No records found on device")
      }
    } catch {
      toast.error("Failed to connect to attendance machine")
    }
    setMachineSyncing(false)
  }

  // ── Import selected machine records ──
  const handleImportMachineRecords = async () => {
    const selected = machineRecords.filter(r => r.selected)
    if (selected.length === 0) {
      toast.error("Select at least one record to import")
      return
    }
    setLoading(true)
    let imported = 0
    for (const record of selected) {
      try {
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: record.employeeId,
            date: `${selectedDate}T00:00:00.000Z`,
            clockIn: record.clockIn,
            clockOut: record.clockOut,
            status: record.status,
            workHours: record.workHours,
            notes: "Synced from attendance machine",
          }),
        })
        imported++
      } catch { /* skip failed */ }
    }
    setLoading(false)
    setShowMachineDialog(false)
    setMachineRecords([])
    refreshData()
    toast.success(`${imported} record(s) imported from attendance machine`)
  }

  const toggleMachineRecord = (idx: number) => {
    setMachineRecords(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  const toggleAllMachineRecords = (select: boolean) => {
    setMachineRecords(prev => prev.map(r => ({ ...r, selected: select })))
  }

  const handleClockIn = async () => {
    if (!formEmployeeId) {
      toast.error("Select an employee first")
      return
    }
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const existing = attendance.find(a => {
      try {
        const aDate = new Date(a.date).toISOString().split("T")[0]
        return aDate === todayStr && a.employeeId === formEmployeeId
      } catch {
        return false
      }
    })
    if (existing) {
      toast.info("Already clocked in today")
      return
    }
    setLoading(true)
    try {
      const status = now.getHours() >= 9 && now.getMinutes() > 30 ? "late" : "present"
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: formEmployeeId,
          date: `${todayStr}T00:00:00.000Z`,
          clockIn: now.toISOString(),
          status,
          notes: status === "late" ? "Late arrival" : null,
        }),
      })
      toast.success(`Clocked in at ${format(now, "HH:mm")}`)
      refreshData()
    } catch {
      toast.error("Failed to clock in")
    }
    setLoading(false)
  }

  const handleClockOut = async () => {
    if (!formEmployeeId) {
      toast.error("Select an employee first")
      return
    }
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const existing = attendance.find(a => {
      try {
        const aDate = new Date(a.date).toISOString().split("T")[0]
        return aDate === todayStr && a.employeeId === formEmployeeId && a.clockIn && !a.clockOut
      } catch {
        return false
      }
    })
    if (!existing) {
      toast.error("No active clock-in found for today")
      return
    }
    setLoading(true)
    try {
      await fetch(`/api/attendance/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clockOut: now.toISOString() }),
      })
      toast.success(`Clocked out at ${format(now, "HH:mm")}`)
      refreshData()
    } catch {
      toast.error("Failed to clock out")
    }
    setLoading(false)
  }

  const getInitials = (first: string, last: string) => `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-600" /> Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track employee attendance, clock in/out, and time worked</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleMachineSync}
            disabled={machineSyncing}
            variant="outline"
            className="rounded-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 gap-2"
          >
            {machineSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            Sync from Machine
          </Button>
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>
      </motion.div>

      {/* Machine status indicator */}
      {lastSyncTime && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-emerald-500" />
          <span>Last machine sync: {format(lastSyncTime, "MMM d, HH:mm:ss")}</span>
          <Badge variant="outline" className="text-[9px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Device Online
          </Badge>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Present", value: kpis.present, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Late", value: kpis.late, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Absent", value: kpis.absent, icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/40" },
          { label: "On Leave", value: kpis.leave, icon: Users, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/40" },
        ].map((kpi, i) => (
          <AnimatedKPI key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} colorClass={kpi.color} bgClass={kpi.bg} index={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40 h-9 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger className="flex-1 h-9 rounded-lg"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleClockIn} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              <LogIn className="h-4 w-4 mr-1" /> Clock In
            </Button>
            <Button onClick={handleClockOut} disabled={loading} variant="outline" className="rounded-full border-emerald-200">
              <LogOut className="h-4 w-4 mr-1" /> Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Table */}
      <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half-day">Half Day</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">{filteredRecords.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.02] dark:bg-white/[0.02]">
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Clock In</TableHead>
                  <TableHead className="text-xs">Clock Out</TableHead>
                  <TableHead className="text-xs text-right">Hours</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.map((record) => {
                  const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.present
                  return (
                    <TableRow key={record.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              {getInitials(record.employee?.firstName || "", record.employee?.lastName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{record.employee?.firstName} {record.employee?.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{record.employee?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{record.employee?.department?.name || "-"}</TableCell>
                      <TableCell className="text-xs tabular-nums">{record.clockIn ? ((() => { try { return format(new Date(record.clockIn), "HH:mm") } catch { return "-" } })()) : "-"}</TableCell>
                      <TableCell className="text-xs tabular-nums">{record.clockOut ? ((() => { try { return format(new Date(record.clockOut), "HH:mm") } catch { return "-" } })()) : "-"}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums font-medium">{record.workHours !== null ? `${record.workHours}h` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${cfg.color} ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} mr-1`} />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{record.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(record)}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-red-500" onClick={() => handleDelete(record.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Clock In</Label>
                <Input type="time" value={formClockIn} onChange={(e) => setFormClockIn(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Clock Out</Label>
                <Input type="time" value={formClockOut} onChange={(e) => setFormClockOut(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Optional notes..." className="rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-full">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
              {loading ? "Saving..." : editingRecord ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Attendance Machine Sync Dialog ── */}
      <Dialog open={showMachineDialog} onOpenChange={setShowMachineDialog}>
        <DialogContent className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-emerald-600" />
              Attendance Machine Sync
            </DialogTitle>
            <DialogDescription>
              Fetch check-in/check-out records from the biometric attendance device for {selectedDate}
            </DialogDescription>
          </DialogHeader>

          {machineSyncing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-[flowBounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0s" }} />
                <div className="h-3 w-3 rounded-full bg-teal-500 animate-[flowBounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.2s" }} />
                <div className="h-3 w-3 rounded-full bg-cyan-500 animate-[flowBounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0.4s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 animate-[flowPulse_1.4s_ease-out_infinite]" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Connecting to attendance device...</p>
            </div>
          ) : machineRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Fingerprint className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No records found on device for this date</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  {machineRecords.length} records found · {machineRecords.filter(r => r.selected).length} selected
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAllMachineRecords(true)}>
                    Select All
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleAllMachineRecords(false)}>
                    Deselect All
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[400px] rounded-lg border border-black/5 dark:border-white/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="text-xs">Employee</TableHead>
                      <TableHead className="text-xs">Clock In</TableHead>
                      <TableHead className="text-xs">Clock Out</TableHead>
                      <TableHead className="text-xs">Hours</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machineRecords.map((record, idx) => {
                      const alreadyExists = attendance.some(a => a.employeeId === record.employeeId)
                      return (
                        <TableRow key={idx} className={record.selected ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={record.selected}
                              onChange={() => toggleMachineRecord(idx)}
                              className="h-4 w-4 rounded accent-emerald-600"
                            />
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {record.employeeName}
                            {alreadyExists && (
                              <Badge variant="outline" className="ml-1.5 text-[8px] text-amber-600 border-amber-200">
                                Exists
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {(() => { try { return format(new Date(record.clockIn), "HH:mm") } catch { return "—" } })()}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {record.clockOut ? (() => { try { return format(new Date(record.clockOut), "HH:mm") } catch { return "—" } })() : "—"}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">{record.workHours ? `${record.workHours}h` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[9px] ${STATUS_CONFIG[record.status]?.color || ""} ${STATUS_CONFIG[record.status]?.bg || ""}`}>
                              {STATUS_CONFIG[record.status]?.label || record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMachineDialog(false)} className="rounded-full">
              Close
            </Button>
            {machineRecords.length > 0 && (
              <Button
                onClick={handleImportMachineRecords}
                disabled={loading || machineRecords.filter(r => r.selected).length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-full gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Import {machineRecords.filter(r => r.selected).length} Record(s)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
