"use client"
import { AnimatedKPI } from "@/components/erp/animated-kpi"

import React, { useState, useMemo } from "react"
import { useERPStore, type Employee, type Department } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, UserCheck, UserX, Building2, Search, Download, Plus,
  Mail, Phone, MapPin, Calendar, DollarSign, Shield, Heart,
  Briefcase, Clock, ChevronRight, Pencil, Trash2, ShieldCheck,
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

// ── Status config (with dark mode variants) ────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/40" },
  on_leave: { label: "On Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700/40" },
  probation: { label: "Probation", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700/40" },
  terminated: { label: "Terminated", color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700/40" },
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: "from-emerald-500 to-teal-600",
  Marketing: "from-amber-500 to-orange-600",
  Design: "from-pink-500 to-rose-600",
  "Human Resources": "from-violet-500 to-purple-600",
  Finance: "from-cyan-500 to-teal-600",
  Operations: "from-orange-500 to-red-600",
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

// ── Add Employee Dialog ─────────────────────────────────────────────
function AddEmployeeDialog({ departments }: { departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setEmployees, employees } = useERPStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          phone: form.get("phone"),
          position: form.get("position"),
          departmentId: form.get("departmentId"),
          employmentType: form.get("employmentType"),
          salary: form.get("salary") ? Number(form.get("salary")) : null,
          status: "active",
          employeeId: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
          hireDate: new Date().toISOString(),
          // ── User account fields ──
          username: form.get("username"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      })
      if (res.ok) {
        const emp = await res.json()
        setEmployees([...employees, emp])
        setOpen(false)
        toast.success("Employee created with login access!")
      }
    } catch {
      toast.error("Failed to create employee")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 rounded-full shadow-md shadow-emerald-500/25">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Employee</DialogTitle>
          <p className="text-sm text-muted-foreground">Employee will receive login credentials with role-based access</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Personal Info ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="john.doe@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+1-555-0000" />
              </div>
            </div>
          </div>

          {/* ── Job Info ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" required placeholder="Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select name="departmentId" required>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Type</Label>
                <Select name="employmentType" defaultValue="full-time">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (USD)</Label>
                <Input id="salary" name="salary" type="number" placeholder="80000" />
              </div>
            </div>
          </div>

          {/* ── Login & Access ── */}
          <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Login & Access Control
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                <Input id="username" name="username" required placeholder="johndoe" className="bg-white dark:bg-[#1c1c1e]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                <Input id="password" name="password" required placeholder="Default@2024" className="bg-white dark:bg-[#1c1c1e]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role & Permissions</Label>
              <Select name="role" defaultValue="employee">
                <SelectTrigger className="bg-white dark:bg-[#1c1c1e]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                  <SelectItem value="manager">Manager (All modules + Finance)</SelectItem>
                  <SelectItem value="creative_lead">Creative Lead (Create, Edit, Assign, Approve)</SelectItem>
                  <SelectItem value="designer">Designer (Create, Edit, Idea→Design)</SelectItem>
                  <SelectItem value="editor">Video Editor (Edit, Review stages)</SelectItem>
                  <SelectItem value="reviewer">Reviewer (Review, Approve stages)</SelectItem>
                  <SelectItem value="approver">Approver (Approve stage only)</SelectItem>
                  <SelectItem value="disseminator">Disseminator (Publish, Disseminate)</SelectItem>
                  <SelectItem value="employee">Employee (Basic access)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Role determines which modules, stages, and actions the employee can access</p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" className="rounded-lg">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading} className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg">
              {loading ? "Creating..." : "Create Employee & Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Employee Detail Sheet ───────────────────────────────────────────
function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  leaveRequests,
}: {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  leaveRequests: { type: string; days: number; status: string }[]
}) {
  if (!employee) return null
  const statusCfg = STATUS_CONFIG[employee.status] || STATUS_CONFIG.active
  const gradient = DEPT_COLORS[employee.department?.name] || "from-emerald-500 to-teal-600"
  const empLeaves = leaveRequests.filter((lr) => lr.type)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto bg-white dark:bg-[#1c1c1e] border-l border-[#e5e5e7] dark:border-[#38383a]">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">Employee Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          {/* Profile header */}
          <div className="flex flex-col items-center text-center">
            <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-emerald-500/20 ring-4 ring-white/40 dark:ring-white/5`}>
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <h2 className="mt-3 text-xl font-bold text-[#1d1d1f] dark:text-white">{employee.firstName} {employee.lastName}</h2>
            <p className="text-sm text-[#86868b] dark:text-[#aeaeb2]">{employee.position}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs ${statusCfg.bg} ${statusCfg.color} border`}>
                {statusCfg.label}
              </Badge>
              <Badge variant="outline" className="text-xs bg-muted">
                {employee.employmentType}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-[0.08em]">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Employment info */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-[0.08em]">Employment Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-[#262628] p-3">
                <div className="flex items-center gap-2 text-xs text-[#86868b] dark:text-[#aeaeb2] mb-1">
                  <Briefcase className="h-3 w-3" /> Department
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{employee.department?.name}</p>
              </div>
              <div className="rounded-xl border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-[#262628] p-3">
                <div className="flex items-center gap-2 text-xs text-[#86868b] dark:text-[#aeaeb2] mb-1">
                  <Calendar className="h-3 w-3" /> Hire Date
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{formatDate(employee.hireDate)}</p>
              </div>
              <div className="rounded-xl border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-[#262628] p-3">
                <div className="flex items-center gap-2 text-xs text-[#86868b] dark:text-[#aeaeb2] mb-1">
                  <DollarSign className="h-3 w-3" /> Salary
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{employee.salary ? formatCurrency(employee.salary, employee.salaryCurrency) : "N/A"}</p>
              </div>
              <div className="rounded-xl border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-[#262628] p-3">
                <div className="flex items-center gap-2 text-xs text-[#86868b] dark:text-[#aeaeb2] mb-1">
                  <Shield className="h-3 w-3" /> Employee ID
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-white">{employee.employeeId}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Leave Balance */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-[0.08em]">Leave Balance</h3>
            <div className="grid grid-cols-3 gap-2">
              {["vacation", "sick", "personal"].map((type) => {
                const used = empLeaves
                  .filter((l) => l.type === type && l.status === "approved")
                  .reduce((sum, l) => sum + l.days, 0)
                const total = type === "vacation" ? 20 : type === "sick" ? 10 : 5
                return (
                  <div key={type} className="rounded-xl border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-[#262628] p-3 text-center">
                    <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] capitalize mb-1">{type}</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{total - used}</p>
                    <p className="text-xs text-[#86868b] dark:text-[#aeaeb2]">{used} used</p>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-[0.08em]">Emergency Contact</h3>
              <div className="flex items-center gap-3 text-sm">
                <Heart className="h-4 w-4 text-red-400" />
                <span>{employee.emergencyContact}</span>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {employee.bankAccount && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-[0.08em]">Bank Details</h3>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Account: {employee.bankAccount}</span>
              </div>
              {employee.taxId && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Tax ID: {employee.taxId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Department Add/Edit Dialog ─────────────────────────────────────
function DepartmentFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Department | null
  onSubmit: (values: { name: string; description: string; color: string }) => Promise<void>
  loading: boolean
}) {
  const [values, setValues] = useState({
    name: "",
    description: "",
    color: "#10b981",
  })

  React.useEffect(() => {
    if (open) {
      setValues({
        name: editing?.name || "",
        description: editing?.description || "",
        color: editing?.color || "#10b981",
      })
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.name.trim()) {
      toast.error("Department name is required")
      return
    }
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1d1d1f] dark:text-white">
            {editing ? "Edit Department" : "Add Department"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Engineering"
              value={values.name}
              onChange={(e) => setValues((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description</Label>
            <Textarea
              id="dept-desc"
              placeholder="Optional description..."
              rows={3}
              value={values.description}
              onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="dept-color"
                type="color"
                value={values.color}
                onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                className="h-10 w-14 rounded-lg border border-black/10 dark:border-white/10 bg-transparent cursor-pointer"
              />
              <Input
                value={values.color}
                onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg shadow-md shadow-emerald-500/25"
            >
              {loading ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Manage Departments Dialog ──────────────────────────────────────
function DepartmentsManagementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { departments, employees, setDepartments } = useERPStore()
  const { canEdit } = usePermissions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Build a map of headId -> employee name
  const employeeMap = useMemo(() => {
    const m = new Map<string, Employee>()
    employees.forEach((e) => m.set(e.id, e))
    return m
  }, [employees])

  const handleOpenAdd = () => {
    if (!canEdit) {
      toast.error("You don't have permission to perform this action in demo mode")
      return
    }
    setEditing(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (dept: Department) => {
    if (!canEdit) {
      toast.error("You don't have permission to perform this action in demo mode")
      return
    }
    setEditing(dept)
    setFormOpen(true)
  }

  const handleDelete = async (dept: Department) => {
    if (!canEdit) {
      toast.error("You don't have permission to perform this action in demo mode")
      return
    }
    setDeletingId(dept.id)
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" })
      if (res.ok) {
        setDepartments(departments.filter((d) => d.id !== dept.id))
        toast.success(`Department "${dept.name}" deleted`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to delete department")
      }
    } catch {
      toast.error("Failed to delete department")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (values: { name: string; description: string; color: string }) => {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/departments/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            color: values.color,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setDepartments(departments.map((d) => (d.id === editing.id ? { ...d, ...updated } : d)))
          toast.success("Department updated")
          setFormOpen(false)
        } else {
          toast.error("Failed to update department")
        }
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            color: values.color,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setDepartments([...departments, created])
          toast.success("Department created")
          setFormOpen(false)
        } else {
          toast.error("Failed to create department")
        }
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[680px] bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1d1d1f] dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Manage Departments
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#86868b] dark:text-[#aeaeb2]">
              {departments.length} {departments.length === 1 ? "department" : "departments"} total
            </p>
            <Button
              onClick={handleOpenAdd}
              disabled={!canEdit}
              size="sm"
              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-1.5 rounded-full shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Department
            </Button>
          </div>
          <ScrollArea className="max-h-[460px] rounded-xl border border-black/5 dark:border-white/10">
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {departments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Building2 className="h-10 w-10 text-[#86868b]/40 dark:text-[#aeaeb2]/40 mb-3" />
                  <p className="text-sm font-medium text-[#86868b] dark:text-[#aeaeb2]">No departments yet</p>
                  <p className="text-xs text-[#86868b]/70 dark:text-[#aeaeb2]/70 mt-1">Click &quot;Add Department&quot; to create one</p>
                </div>
              ) : (
                departments.map((dept) => {
                  const empCount = dept._count?.employees ?? 0
                  const head = dept.headId ? employeeMap.get(dept.headId) : null
                  const headName = head ? `${head.firstName} ${head.lastName}` : "—"
                  return (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${dept.color}1A`, color: dept.color }}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white truncate">{dept.name}</p>
                          <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] truncate">
                            {dept.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full">
                              {empCount} {empCount === 1 ? "employee" : "employees"}
                            </Badge>
                            <span className="text-[10px] text-[#86868b] dark:text-[#aeaeb2]">
                              Head: {headName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => handleOpenEdit(dept)}
                          disabled={!canEdit}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDelete(dept)}
                          disabled={!canEdit || deletingId === dept.id}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-lg">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </>
  )
}

// ── Main Employees View ─────────────────────────────────────────────
export function EmployeesView() {
  const { employees, departments, leaveRequests, currentUser } = useERPStore()
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)

  const isAdmin = currentUser?.role === "admin"

  // KPIs
  const totalEmployees = employees.length
  const activeCount = employees.filter((e) => e.status === "active").length
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length
  const deptCount = departments.length

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        search === "" ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      const matchesDept = deptFilter === "all" || emp.departmentId === deptFilter
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [employees, search, deptFilter, statusFilter])

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    setDetailOpen(true)
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Employee Directory</h1>
          <p className="text-sm text-[#86868b] dark:text-[#aeaeb2] mt-1">Manage your organization&apos;s workforce</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-[#424245] dark:text-[#aeaeb2] rounded-lg">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeptDialogOpen(true)}
            className="gap-2 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-800 dark:hover:text-emerald-200 rounded-lg"
          >
            <Building2 className="h-4 w-4" /> Manage Departments
          </Button>
          <AddEmployeeDialog departments={departments.map((d) => ({ id: d.id, name: d.name }))} />
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
          { label: "Active", value: activeCount, icon: UserCheck, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/40" },
          { label: "On Leave", value: onLeaveCount, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/40" },
          { label: "Departments", value: deptCount, icon: Building2, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/40" },
        ].map((kpi, i) => (
          <AnimatedKPI key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} colorClass={kpi.color} bgClass={kpi.bg} index={i} />
        ))}
      </motion.div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search + Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] dark:text-[#aeaeb2]" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "on_leave", label: "On Leave" },
              { key: "probation", label: "Probation" },
              { key: "terminated", label: "Terminated" },
            ].map((s) => (
              <Button
                key={s.key}
                variant={statusFilter === s.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s.key)}
                className={`rounded-full ${statusFilter === s.key ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0" : ""}`}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Department Tabs */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Button
              variant={deptFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDeptFilter("all")}
              className={`rounded-full ${deptFilter === "all" ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0" : ""}`}
            >
              All Departments
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept.id}
                variant={deptFilter === dept.id ? "default" : "outline"}
                size="sm"
                onClick={() => setDeptFilter(dept.id)}
                className={`rounded-full ${deptFilter === dept.id ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0" : ""}`}
              >
                {dept.name}
                {dept._count && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 rounded-full">
                    {dept._count.employees}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <Card className="border-dashed bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-[#86868b]/40 dark:text-[#aeaeb2]/40 mb-4" />
            <p className="text-lg font-medium text-[#86868b] dark:text-[#aeaeb2]">No employees found</p>
            <p className="text-sm text-[#86868b]/70 dark:text-[#aeaeb2]/70 mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredEmployees.map((emp) => {
              const statusCfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active
              const gradient = DEPT_COLORS[emp.department?.name] || "from-emerald-500 to-teal-600"

              return (
                <motion.div
                  key={emp.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cursor-pointer"
                  onClick={() => handleSelectEmployee(emp)}
                >
                  <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover hover-lift rounded-2xl group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm truncate group-hover:text-emerald-700 transition-colors text-[#1d1d1f] dark:text-white">
                              {emp.firstName} {emp.lastName}
                            </h3>
                            <ChevronRight className="h-4 w-4 text-[#86868b] dark:text-[#aeaeb2] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] truncate">{emp.position}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.bg} ${statusCfg.color} border rounded-full`}>
                              {statusCfg.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-black/5 dark:bg-white/10 rounded-full border-0">
                              {emp.department?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-[#86868b] dark:text-[#aeaeb2]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[160px]">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(emp.hireDate)}</span>
                        </div>
                      </div>
                      {isAdmin && emp.salary && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(emp.salary, emp.salaryCurrency)}/yr</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Employee Detail Sheet */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        leaveRequests={leaveRequests.filter((lr) => lr.employeeId === selectedEmployee?.id)}
      />

      {/* Departments Management Dialog */}
      <DepartmentsManagementDialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen} />
    </div>
  )
}
