"use client"

import React, { useState, useMemo } from "react"
import { useERPStore, type JobPosting } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import {
  Briefcase, Users, Clock, UserCheck, Plus, MapPin, DollarSign,
  Calendar, MoreHorizontal, XCircle, CheckCircle2, Trash2,
  ChevronDown, ChevronUp, Building2, Globe,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "Open", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  filled: { label: "Filled", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", dot: "bg-teal-500" },
  closed: { label: "Closed", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", dot: "bg-gray-400" },
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  "full-time": { label: "Full-time", color: "bg-emerald-100 text-emerald-700" },
  "part-time": { label: "Part-time", color: "bg-cyan-100 text-cyan-700" },
  "contract": { label: "Contract", color: "bg-violet-100 text-violet-700" },
  "internship": { label: "Internship", color: "bg-amber-100 text-amber-700" },
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: "from-emerald-500 to-teal-600",
  Marketing: "from-amber-500 to-orange-600",
  Design: "from-pink-500 to-rose-600",
  "Human Resources": "from-violet-500 to-purple-600",
  Finance: "from-cyan-500 to-teal-600",
  Operations: "from-orange-500 to-red-600",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "N/A"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// ── Create Job Posting Dialog ───────────────────────────────────────
function CreateJobPostingDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { departments, jobPostings, setJobPostings } = useERPStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          departmentId: form.get("departmentId"),
          type: form.get("type"),
          location: form.get("location"),
          salary_min: form.get("salary_min") ? Number(form.get("salary_min")) : null,
          salary_max: form.get("salary_max") ? Number(form.get("salary_max")) : null,
          description: form.get("description"),
          requirements: form.get("requirements"),
          status: "open",
          postedDate: new Date().toISOString(),
          applicants: 0,
        }),
      })
      if (res.ok) {
        const job = await res.json()
        setJobPostings([job, ...jobPostings])
        setOpen(false)
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Create Posting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create Job Posting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" name="title" required placeholder="Senior Frontend Developer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="type">Employment Type</Label>
              <Select name="type" required>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="San Francisco, CA or Remote" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Min Salary (USD)</Label>
              <Input id="salary_min" name="salary_min" type="number" placeholder="80000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Max Salary (USD)</Label>
              <Input id="salary_max" name="salary_max" type="number" placeholder="120000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required rows={4} placeholder="Describe the role and responsibilities..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements (separate with |)</Label>
            <Textarea id="requirements" name="requirements" rows={3} placeholder="5+ years experience | React expertise | Strong communication" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Creating..." : "Create Posting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Job Posting Card ────────────────────────────────────────────────
function JobPostingCard({
  job,
  onUpdate,
  onDelete,
}: {
  job: JobPosting
  onUpdate: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft
  const typeBadge = TYPE_BADGES[job.type] || TYPE_BADGES["full-time"]
  const gradient = DEPT_COLORS[job.department?.name] || "from-emerald-500 to-teal-600"

  return (
    <motion.div variants={itemVariants} layout>
      <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{job.title}</h3>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.bg} ${statusCfg.color} border`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot} mr-1`} />
                  {statusCfg.label}
                </Badge>
                <Badge className={`text-[10px] px-1.5 py-0 ${typeBadge.color}`}>
                  {typeBadge.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {job.department?.name}
                </span>
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                {job.salary_min && job.salary_max && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <DollarSign className="h-3 w-3" /> {formatCurrency(job.salary_min)} – {formatCurrency(job.salary_max)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {job.applicants} applicant{job.applicants !== 1 ? "s" : ""}
                </span>
                {job.postedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Posted {formatDate(job.postedDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {job.status === "open" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdate(job.id, "filled")} className="text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Filled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdate(job.id, "closed")} className="text-amber-600">
                      <XCircle className="h-4 w-4 mr-2" /> Close Posting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(job.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {(job.status === "filled" || job.status === "closed" || job.status === "draft") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {job.status === "draft" && (
                      <DropdownMenuItem onClick={() => onUpdate(job.id, "open")} className="text-emerald-600">
                        <Globe className="h-4 w-4 mr-2" /> Publish
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(job.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
                  </div>
                  {job.requirements && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Requirements</h4>
                      <ul className="space-y-1">
                        {job.requirements.split("|").map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {req.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.closingDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Closing date: {formatDate(job.closingDate)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Recruitment View ───────────────────────────────────────────
export function RecruitmentView() {
  const { jobPostings, departments, setJobPostings } = useERPStore()
  const [statusFilter, setStatusFilter] = useState("all")

  // KPIs
  const openPositions = jobPostings.filter((j) => j.status === "open").length
  const totalApplicants = jobPostings.reduce((sum, j) => sum + j.applicants, 0)
  const filledThisMonth = jobPostings.filter((j) => j.status === "filled").length
  const filledWithDates = jobPostings.filter((j) => j.status === "filled" && j.closingDate)
  const avgTimeToFill = filledWithDates.length > 0
    ? Math.round(
        filledWithDates.reduce((sum, j) => {
          const start = new Date(j.postedDate || j.createdAt)
          const end = new Date(j.closingDate!)
          return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        }, 0) / filledWithDates.length
      )
    : 0

  // Filtered postings
  const filteredPostings = useMemo(() => {
    if (statusFilter === "all") return jobPostings
    return jobPostings.filter((j) => j.status === statusFilter)
  }, [jobPostings, statusFilter])

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/job-postings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setJobPostings(jobPostings.map((j) => (j.id === id ? { ...j, ...updated } : j)))
      }
    } catch {
      // handle error silently
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/job-postings/${id}`, { method: "DELETE" })
      if (res.ok) {
        setJobPostings(jobPostings.filter((j) => j.id !== id))
      }
    } catch {
      // handle error silently
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage job postings and hiring pipeline</p>
        </div>
        <CreateJobPostingDialog />
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Open Positions", value: openPositions, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Applicants", value: totalApplicants, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Avg Time to Fill", value: `${avgTimeToFill}d`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Hired This Month", value: filledThisMonth, icon: UserCheck, color: "text-cyan-600", bg: "bg-cyan-50" },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
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

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All Postings", count: jobPostings.length },
          { key: "open", label: "Open", count: jobPostings.filter((j) => j.status === "open").length },
          { key: "filled", label: "Filled", count: jobPostings.filter((j) => j.status === "filled").length },
          { key: "closed", label: "Closed", count: jobPostings.filter((j) => j.status === "closed").length },
          { key: "draft", label: "Draft", count: jobPostings.filter((j) => j.status === "draft").length },
        ].map((s) => (
          <Button
            key={s.key}
            variant={statusFilter === s.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s.key)}
            className={statusFilter === s.key ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            {s.label}
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 bg-white/20 text-inherit">
              {s.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Job Postings Grid */}
      {filteredPostings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {statusFilter === "all" ? "No job postings yet" : `No ${statusFilter} postings`}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {statusFilter === "all" ? "Click \"Create Posting\" to add your first job" : "Try a different filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredPostings.map((job) => (
              <JobPostingCard
                key={job.id}
                job={job}
                onUpdate={handleUpdateStatus}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
