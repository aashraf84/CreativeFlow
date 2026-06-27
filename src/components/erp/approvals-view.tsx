"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Approval } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Send,
  ArrowLeft,
  Search,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Rocket,
  DollarSign,
  PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, differenceInHours, format } from "date-fns"

// ── Approval Type Configuration ─────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  content_review: { label: "Content Review", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/40" },
  post_publish: { label: "Post Publish", icon: Send, color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/40" },
  campaign_launch: { label: "Campaign Launch", icon: Rocket, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/40" },
  budget_approval: { label: "Budget Approval", icon: DollarSign, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/40" },
}

// ── Status Configuration ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badgeColor: string
  dotColor: string
}> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 dark:text-amber-400", badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", dotColor: "bg-amber-500" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", dotColor: "bg-emerald-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-rose-600 dark:text-rose-400", badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800", dotColor: "bg-rose-500" },
  changes_requested: { label: "Changes Requested", icon: RotateCcw, color: "text-cyan-600 dark:text-cyan-400", badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800", dotColor: "bg-cyan-500" },
}

// ── Platform Icons ──────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
}

// ── Animation Variants ──────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

const detailVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
}

// ── Filter Options ──────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "changes_requested", label: "Changes Requested" },
]

// ── Helper Functions ────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

function getRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return "Unknown"
  }
}

function getFormattedDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a")
  } catch {
    return "Unknown"
  }
}

function getAvgReviewTime(approvals: Approval[]): string {
  const reviewed = approvals.filter(a => a.reviewedAt && a.createdAt)
  if (reviewed.length === 0) return "N/A"
  const totalHours = reviewed.reduce((sum, a) => {
    return sum + differenceInHours(new Date(a.reviewedAt!), new Date(a.createdAt))
  }, 0)
  const avg = totalHours / reviewed.length
  if (avg < 1) return "< 1h"
  if (avg < 24) return `${Math.round(avg)}h`
  return `${(avg / 24).toFixed(1)}d`
}

// ── Main Component ──────────────────────────────────────────────────────
export function ApprovalsView() {
  const { approvals, setApprovals, currentUser } = useERPStore()
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [actionMode, setActionMode] = useState<"none" | "approve" | "reject" | "changes">("none")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Computed
  const stats = useMemo(() => {
    const pending = approvals.filter(a => a.status === "pending").length
    const today = new Date()
    const approvedToday = approvals.filter(a => {
      if (a.status !== "approved" || !a.reviewedAt) return false
      return new Date(a.reviewedAt).toDateString() === today.toDateString()
    }).length
    const rejected = approvals.filter(a => a.status === "rejected").length
    const totalReviewed = approvals.filter(a => a.status === "approved" || a.status === "rejected").length
    const rejectionRate = totalReviewed > 0 ? Math.round((rejected / totalReviewed) * 100) : 0
    const avgTime = getAvgReviewTime(approvals)
    return { pending, approvedToday, rejectionRate, avgTime }
  }, [approvals])

  const filteredApprovals = useMemo(() => {
    return approvals.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          (a.content?.title || "").toLowerCase().includes(q) ||
          (a.post?.content || "").toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.requestedBy.name.toLowerCase().includes(q) ||
          (a.comment || "").toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [approvals, statusFilter, searchQuery])

  const selectedApproval = useMemo(() => {
    return approvals.find(a => a.id === selectedApprovalId) || null
  }, [approvals, selectedApprovalId])

  // Actions
  const handleApprovalAction = useCallback(async (approvalId: string, status: string, commentText?: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comment: commentText || null,
          reviewedById: currentUser?.id || "user-admin",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setApprovals(
          approvals.map(a => a.id === approvalId ? { ...a, ...data.approval, status, comment: commentText || a.comment, reviewedById: currentUser?.id || "user-admin", reviewedAt: new Date().toISOString() } : a)
        )
        setActionMode("none")
        setComment("")
      }
    } catch (err) {
      console.error("Failed to update approval:", err)
    } finally {
      setIsSubmitting(false)
    }
  }, [approvals, setApprovals, currentUser])

  const handleApprovalSelect = useCallback((approval: Approval) => {
    setSelectedApprovalId(approval.id)
    setShowMobileDetail(true)
    setActionMode("none")
    setComment("")
  }, [])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Approvals</h1>
              <p className="text-sm text-muted-foreground">Review and manage content & post approvals</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Pending", value: stats.pending, icon: Clock, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { label: "Approved Today", value: stats.approvedToday, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Rejection Rate", value: `${stats.rejectionRate}%`, icon: XCircle, color: "from-rose-500 to-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
            { label: "Avg Review Time", value: stats.avgTime, icon: Clock, color: "from-teal-500 to-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", stat.bg)}>
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                    </div>
                    <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm", stat.color)}>
                      <stat.icon className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-4">
        {/* Left: Approval List */}
        <div className={cn(
          "flex flex-col min-h-0 transition-all duration-300",
          selectedApproval ? "w-full lg:w-1/2 xl:w-3/5" : "w-full"
        )}>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
              {STATUS_FILTERS.map(sf => {
                const count = sf.key === "all" ? approvals.length : approvals.filter(a => a.status === sf.key).length
                const isActive = statusFilter === sf.key
                const statusCfg = STATUS_CONFIG[sf.key]
                return (
                  <button
                    key={sf.key}
                    onClick={() => setStatusFilter(sf.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {statusCfg && <statusCfg.icon className="h-3.5 w-3.5" />}
                    {sf.label}
                    <span className="text-[10px] opacity-60">{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="relative flex-1 w-full sm:w-auto sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Approval Cards */}
          <Card className="flex-1 min-h-0 border-0 shadow-sm">
            <ScrollArea className="h-full">
              {filteredApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <ShieldCheck className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium">No approvals found</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  <AnimatePresence>
                    {filteredApprovals.map((approval, index) => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        isSelected={selectedApprovalId === approval.id}
                        onSelect={handleApprovalSelect}
                        onAction={handleApprovalAction}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Right: Detail Panel */}
        <AnimatePresence>
          {selectedApproval && (
            <motion.div
              className={cn(
                "w-full lg:w-1/2 xl:w-2/5 flex-shrink-0",
                showMobileDetail ? "block" : "hidden lg:block"
              )}
              variants={detailVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="h-full border-0 shadow-sm flex flex-col">
                {/* Panel Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden -ml-2"
                      onClick={() => { setShowMobileDetail(false); setSelectedApprovalId(null) }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Badge className={cn("text-[11px] ml-auto", STATUS_CONFIG[selectedApproval.status]?.badgeColor)} variant="outline">
                      {(() => {
                        const StatusIcon = STATUS_CONFIG[selectedApproval.status]?.icon
                        return StatusIcon ? <StatusIcon className="h-3 w-3 mr-1" /> : null
                      })()}
                      {STATUS_CONFIG[selectedApproval.status]?.label || selectedApproval.status}
                    </Badge>
                  </div>

                  {/* Type */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const tConfig = TYPE_CONFIG[selectedApproval.type]
                      const TIcon = tConfig?.icon || FileText
                      return (
                        <>
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", tConfig?.bgColor || "bg-muted")}>
                            <TIcon className={cn("h-4 w-4", tConfig?.color || "text-muted-foreground")} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{tConfig?.label || selectedApproval.type}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Requested {getRelativeTime(selectedApproval.createdAt)}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Content/Post Preview */}
                  {selectedApproval.content && (
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PenLine className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</span>
                      </div>
                      <p className="font-medium text-sm">{selectedApproval.content.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] capitalize">{selectedApproval.content.type}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{selectedApproval.content.stage}</Badge>
                      </div>
                    </div>
                  )}

                  {selectedApproval.post && (
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post</span>
                      </div>
                      <p className="text-sm leading-relaxed">{selectedApproval.post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {(() => {
                          const PIcon = PLATFORM_ICONS[selectedApproval.post.platform]
                          return PIcon ? (
                            <Badge variant="secondary" className="text-[10px]">
                              <PIcon className="h-3 w-3 mr-1" />
                              {selectedApproval.post.platform}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] capitalize">{selectedApproval.post.platform}</Badge>
                          )
                        })()}
                        <Badge variant="outline" className="text-[10px] capitalize">{selectedApproval.post.status}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Approval Timeline */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline</p>
                    <div className="space-y-0">
                      {/* Requested */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="w-px h-full bg-border my-1" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">Approval Requested</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-5 w-5">
                              {selectedApproval.requestedBy.avatar && <AvatarImage src={selectedApproval.requestedBy.avatar} />}
                              <AvatarFallback className="text-[8px]">{getInitials(selectedApproval.requestedBy.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{selectedApproval.requestedBy.name}</span>
                            <span className="text-[11px] text-muted-foreground">• {getFormattedDate(selectedApproval.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reviewed */}
                      {selectedApproval.reviewedAt && selectedApproval.reviewedBy && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center",
                              selectedApproval.status === "approved" && "bg-emerald-100 dark:bg-emerald-900/40",
                              selectedApproval.status === "rejected" && "bg-rose-100 dark:bg-rose-900/40",
                              selectedApproval.status === "changes_requested" && "bg-cyan-100 dark:bg-cyan-900/40",
                            )}>
                              {selectedApproval.status === "approved" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                              {selectedApproval.status === "rejected" && <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
                              {selectedApproval.status === "changes_requested" && <RotateCcw className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {selectedApproval.status === "approved" && "Approved"}
                              {selectedApproval.status === "rejected" && "Rejected"}
                              {selectedApproval.status === "changes_requested" && "Changes Requested"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-5 w-5">
                                {selectedApproval.reviewedBy.avatar && <AvatarImage src={selectedApproval.reviewedBy.avatar} />}
                                <AvatarFallback className="text-[8px]">{getInitials(selectedApproval.reviewedBy.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{selectedApproval.reviewedBy.name}</span>
                              <span className="text-[11px] text-muted-foreground">• {getFormattedDate(selectedApproval.reviewedAt)}</span>
                            </div>
                            {selectedApproval.comment && (
                              <div className="mt-2 rounded-lg bg-muted/50 p-3">
                                <p className="text-sm text-muted-foreground">{selectedApproval.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pending indicator */}
                      {selectedApproval.status === "pending" && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center animate-pulse">
                              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Awaiting Review</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {differenceInHours(new Date(), new Date(selectedApproval.createdAt))}h since request
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedApproval.status === "pending" && (
                  <div className="p-4 border-t border-border/50">
                    {actionMode === "none" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                          onClick={() => handleApprovalAction(selectedApproval.id, "approved")}
                          disabled={isSubmitting}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          onClick={() => setActionMode("reject")}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                          onClick={() => setActionMode("changes")}
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Changes
                        </Button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-medium">
                          {actionMode === "reject" ? "Reject with reason:" : "Request changes with feedback:"}
                        </p>
                        <Textarea
                          placeholder={actionMode === "reject" ? "Provide rejection reason..." : "Describe required changes..."}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[80px] resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setActionMode("none"); setComment("") }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className={cn(
                              actionMode === "reject"
                                ? "bg-rose-500 hover:bg-rose-600 text-white"
                                : "bg-cyan-500 hover:bg-cyan-600 text-white"
                            )}
                            onClick={() => handleApprovalAction(
                              selectedApproval.id,
                              actionMode === "reject" ? "rejected" : "changes_requested",
                              comment
                            )}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Submitting..." : actionMode === "reject" ? "Reject" : "Request Changes"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Already reviewed indicator */}
                {selectedApproval.status !== "pending" && (
                  <div className="p-4 border-t border-border/50">
                    <div className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium",
                      selectedApproval.status === "approved" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                      selectedApproval.status === "rejected" && "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
                      selectedApproval.status === "changes_requested" && "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400",
                    )}>
                      {selectedApproval.status === "approved" && <CheckCircle2 className="h-4 w-4" />}
                      {selectedApproval.status === "rejected" && <XCircle className="h-4 w-4" />}
                      {selectedApproval.status === "changes_requested" && <RotateCcw className="h-4 w-4" />}
                      {STATUS_CONFIG[selectedApproval.status]?.label}
                      {selectedApproval.reviewedBy && ` by ${selectedApproval.reviewedBy.name}`}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Approval Card Component ─────────────────────────────────────────────
function ApprovalCard({
  approval,
  isSelected,
  onSelect,
  onAction,
  index,
}: {
  approval: Approval
  isSelected: boolean
  onSelect: (approval: Approval) => void
  onAction: (id: string, status: string, comment?: string) => void
  index: number
}) {
  const typeConfig = TYPE_CONFIG[approval.type]
  const statusConfig = STATUS_CONFIG[approval.status]
  const TIcon = typeConfig?.icon || FileText

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-150 hover:shadow-md",
          isSelected
            ? "ring-2 ring-emerald-500/30 border-emerald-500/30 shadow-md"
            : "border-border/50 hover:border-border",
          approval.status === "pending" && !isSelected && "border-l-4 border-l-amber-400",
        )}
        onClick={() => onSelect(approval)}
      >
        <CardContent className="p-4">
          {/* Top Row: Type & Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", typeConfig?.bgColor || "bg-muted")}>
                <TIcon className={cn("h-3.5 w-3.5", typeConfig?.color || "text-muted-foreground")} />
              </div>
              <span className="text-sm font-semibold">{typeConfig?.label || approval.type}</span>
            </div>
            <Badge className={cn("text-[11px]", statusConfig?.badgeColor)} variant="outline">
              {(() => {
                const StatusIcon = statusConfig?.icon
                return StatusIcon ? <StatusIcon className="h-3 w-3 mr-1" /> : null
              })()}
              {statusConfig?.label || approval.status}
            </Badge>
          </div>

          {/* Content/Post Preview */}
          {approval.content && (
            <div className="rounded-lg bg-muted/40 p-3 mb-3">
              <p className="text-sm font-medium truncate">{approval.content.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="secondary" className="text-[10px] capitalize">{approval.content.type}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{approval.content.stage}</Badge>
              </div>
            </div>
          )}

          {approval.post && (
            <div className="rounded-lg bg-muted/40 p-3 mb-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{approval.post.content}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge variant="secondary" className="text-[10px] capitalize">{approval.post.platform}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{approval.post.status}</Badge>
              </div>
            </div>
          )}

          {/* Requested By */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {approval.requestedBy.avatar && <AvatarImage src={approval.requestedBy.avatar} />}
                <AvatarFallback className="text-[9px]">{getInitials(approval.requestedBy.name)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs text-muted-foreground">by </span>
                <span className="text-xs font-medium">{approval.requestedBy.name}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">• {getRelativeTime(approval.createdAt)}</span>
            </div>

            {/* Quick Actions for Pending */}
            {approval.status === "pending" && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onAction(approval.id, "approved")}
                      className="h-7 w-7 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center transition-colors"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Approve</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onAction(approval.id, "rejected")}
                      className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                    >
                      <ThumbsDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Reject</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Reviewed By (if exists) */}
          {approval.reviewedBy && approval.reviewedAt && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  {approval.reviewedBy.avatar && <AvatarImage src={approval.reviewedBy.avatar} />}
                  <AvatarFallback className="text-[8px]">{getInitials(approval.reviewedBy.name)}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground">
                  Reviewed by <span className="font-medium">{approval.reviewedBy.name}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">• {getRelativeTime(approval.reviewedAt)}</span>
              </div>
              {approval.comment && (
                <div className="mt-1.5 pl-7">
                  <p className="text-xs text-muted-foreground italic line-clamp-2">&quot;{approval.comment}&quot;</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
