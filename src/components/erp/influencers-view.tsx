"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type Influencer, type Platform } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  Plus,
  Search,
  Mail,
  Phone,
  MoreVertical,
  Grid3X3,
  List,
  Users,
  TrendingUp,
  Eye,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  ArrowUpRight,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Target,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Handshake,
  XCircle,
  Sparkles,
  BarChart3,
  UserPlus,
  Activity,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

// ── Status config ──
const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  prospect: { label: "Prospect", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Eye },
  contacted: { label: "Contacted", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Send },
  negotiating: { label: "Negotiating", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", icon: Handshake },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: UserCheck },
  completed: { label: "Completed", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", icon: XCircle },
}

// ── Platform config ──
const platformConfig: Record<Platform, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  instagram: { label: "Instagram", color: "bg-gradient-to-br from-purple-500 to-pink-500 text-white", icon: Instagram },
  facebook: { label: "Facebook", color: "bg-blue-600 text-white", icon: MessageCircle },
  twitter: { label: "Twitter", color: "bg-sky-500 text-white", icon: Twitter },
  linkedin: { label: "LinkedIn", color: "bg-blue-700 text-white", icon: Linkedin },
  tiktok: { label: "TikTok", color: "bg-slate-900 text-white", icon: Sparkles },
  youtube: { label: "YouTube", color: "bg-red-600 text-white", icon: Youtube },
  pinterest: { label: "Pinterest", color: "bg-red-500 text-white", icon: Target },
  snapchat: { label: "Snapchat", color: "bg-yellow-400 text-black", icon: MessageCircle },
}

// ── Status timeline ──
const statusFlow = ["prospect", "contacted", "negotiating", "active", "completed"]

// ── Helper: format follower count ──
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

// ── Helper: initials ──
function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

// ── Main Component ──
export function InfluencersView() {
  const { influencers, clients, campaigns, setInfluencers } = useERPStore()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Filter influencers
  const filteredInfluencers = useMemo(() => {
    return influencers.filter(inf => {
      const matchesSearch = !search ||
        inf.name.toLowerCase().includes(search.toLowerCase()) ||
        inf.username.toLowerCase().includes(search.toLowerCase()) ||
        inf.niche?.toLowerCase().includes(search.toLowerCase())
      const matchesPlatform = platformFilter === "all" || inf.platform === platformFilter
      const matchesStatus = statusFilter === "all" || inf.status === statusFilter
      return matchesSearch && matchesPlatform && matchesStatus
    })
  }, [influencers, search, platformFilter, statusFilter])

  // KPIs
  const totalInfluencers = influencers.length
  const activeCollaborations = influencers.filter(i => i.status === "active").length
  const avgEngagement = influencers.length > 0
    ? influencers.reduce((sum, i) => sum + i.engagementRate, 0) / influencers.length
    : 0
  const totalReach = influencers.reduce((sum, i) => sum + i.followers, 0)

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.keys(statusConfig).forEach(s => { counts[s] = influencers.filter(i => i.status === s).length })
    return counts
  }, [influencers])

  // API helpers
  const createInfluencer = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.influencer) {
        setInfluencers([json.influencer, ...influencers])
        toast({ title: "Influencer added", description: `${data.name} has been added to your roster.` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add influencer.", variant: "destructive" })
    }
  }, [influencers, setInfluencers, toast])

  const deleteInfluencer = useCallback(async (id: string) => {
    try {
      await fetch(`/api/influencers/${id}`, { method: "DELETE" })
      setInfluencers(influencers.filter(i => i.id !== id))
      if (selectedInfluencer?.id === id) setSelectedInfluencer(null)
      toast({ title: "Influencer removed", description: "The influencer has been deleted." })
    } catch {
      toast({ title: "Error", description: "Failed to delete influencer.", variant: "destructive" })
    }
  }, [influencers, setInfluencers, toast, selectedInfluencer])

  const updateInfluencer = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.influencer) {
        setInfluencers(influencers.map(i => i.id === id ? json.influencer : i))
        if (selectedInfluencer?.id === id) setSelectedInfluencer(json.influencer)
        toast({ title: "Influencer updated", description: "Changes have been saved." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update influencer.", variant: "destructive" })
    }
  }, [influencers, setInfluencers, toast, selectedInfluencer])

  return (
    <motion.div className="p-4 lg:p-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Influencer CRM</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage influencers, collaborations, and partnerships</p>
        </div>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4" /> Add Influencer
        </Button>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Influencers", value: totalInfluencers, icon: Users, gradient: "from-emerald-500 to-emerald-600" },
          { label: "Active Collaborations", value: activeCollaborations, icon: UserCheck, gradient: "from-teal-500 to-teal-600" },
          { label: "Avg Engagement", value: `${avgEngagement.toFixed(1)}%`, icon: TrendingUp, gradient: "from-cyan-500 to-cyan-600" },
          { label: "Total Reach", value: formatFollowers(totalReach), icon: BarChart3, gradient: "from-emerald-600 to-teal-600" },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.label} variants={itemVariants}>
              <Card className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", kpi.gradient)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Filters Row */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search influencers..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("list")}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={platformFilter === "all" ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs gap-1 shrink-0", platformFilter === "all" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
            onClick={() => setPlatformFilter("all")}
          >
            All Platforms
          </Button>
          {(Object.keys(platformConfig) as Platform[]).map(platform => {
            const cfg = platformConfig[platform]
            const Icon = cfg.icon
            return (
              <Button
                key={platform}
                variant={platformFilter === platform ? "default" : "outline"}
                size="sm"
                className={cn("h-7 text-xs gap-1 shrink-0", platformFilter === platform && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                onClick={() => setPlatformFilter(platform)}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
              </Button>
            )
          })}
        </div>

        {/* Status filter tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="h-8 flex-wrap">
            <TabsTrigger value="all" className="text-xs">All ({influencers.length})</TabsTrigger>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {cfg.label} ({statusCounts[key] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Influencer Cards */}
        <div className={cn(selectedInfluencer ? "lg:col-span-2" : "lg:col-span-3")}>
          <AnimatePresence mode="popLayout">
            {viewMode === "grid" ? (
              <motion.div key="grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3" layout>
                {filteredInfluencers.map(inf => (
                  <InfluencerCard
                    key={inf.id}
                    influencer={inf}
                    isSelected={selectedInfluencer?.id === inf.id}
                    onSelect={() => setSelectedInfluencer(inf)}
                    onDelete={() => deleteInfluencer(inf.id)}
                    onUpdateStatus={(status) => updateInfluencer(inf.id, { status })}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" className="space-y-2" layout>
                {filteredInfluencers.map(inf => (
                  <InfluencerListItem
                    key={inf.id}
                    influencer={inf}
                    isSelected={selectedInfluencer?.id === inf.id}
                    onSelect={() => setSelectedInfluencer(inf)}
                    onDelete={() => deleteInfluencer(inf.id)}
                    onUpdateStatus={(status) => updateInfluencer(inf.id, { status })}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredInfluencers.length === 0 && (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center">
                <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No influencers found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {search || platformFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first influencer to get started"}
                </p>
                {!search && platformFilter === "all" && statusFilter === "all" && (
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> Add Influencer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detail Panel */}
        {selectedInfluencer && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <InfluencerDetailPanel
              influencer={selectedInfluencer}
              onUpdateStatus={(status) => updateInfluencer(selectedInfluencer.id, { status })}
              onDelete={() => deleteInfluencer(selectedInfluencer.id)}
              onClose={() => setSelectedInfluencer(null)}
            />
          </motion.div>
        )}
      </div>

      {/* Add Influencer Dialog */}
      <AddInfluencerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={createInfluencer}
        clients={clients}
        campaigns={campaigns}
      />
    </motion.div>
  )
}

// ── Influencer Card (Grid View) ──
function InfluencerCard({ influencer, isSelected, onSelect, onDelete, onUpdateStatus }: {
  influencer: Influencer
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
}) {
  const platCfg = platformConfig[influencer.platform]
  const statCfg = statusConfig[influencer.status] || statusConfig.prospect
  const StatusIcon = statCfg.icon
  const PlatformIcon = platCfg.icon

  return (
    <motion.div variants={itemVariants} layout>
      <Card
        className={cn(
          "shadow-sm cursor-pointer transition-all hover:shadow-md group",
          isSelected ? "border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30" : "border-border/60"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-11 w-11 rounded-xl shrink-0">
              <AvatarFallback className={cn("font-bold text-sm", platCfg.color)}>
                {getInitials(influencer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold truncate">{influencer.name}</h4>
                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", platCfg.color)}>
                  <PlatformIcon className="h-2.5 w-2.5" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">@{influencer.username}</p>
            </div>
            <Badge className={cn("text-[9px] shrink-0", statCfg.color)}>
              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
              {statCfg.label}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-sm font-bold">{formatFollowers(influencer.followers)}</p>
              <p className="text-[9px] text-muted-foreground">Followers</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-sm font-bold">{influencer.engagementRate.toFixed(1)}%</p>
              <p className="text-[9px] text-muted-foreground">Engagement</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-sm font-bold">{influencer.rate ? `$${influencer.rate.toLocaleString()}` : "—"}</p>
              <p className="text-[9px] text-muted-foreground">Rate</p>
            </div>
          </div>

          {/* Engagement bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-muted-foreground">Engagement Rate</span>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{influencer.engagementRate.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(influencer.engagementRate * 10, 100)} className="h-1.5" />
          </div>

          {/* Niche & Assignments */}
          <div className="flex flex-wrap items-center gap-1.5">
            {influencer.niche && (
              <Badge variant="secondary" className="text-[9px]">{influencer.niche}</Badge>
            )}
            {influencer.client && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <Briefcase className="h-2.5 w-2.5" /> {influencer.client.name}
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              {influencer.email && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); window.open(`mailto:${influencer.email}`) }}>
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSelect}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <DropdownMenuItem key={key} onClick={() => onUpdateStatus(key)} className="text-xs gap-2">
                    <cfg.icon className="h-3 w-3" /> Mark as {cfg.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-rose-600 gap-2" onClick={() => onDelete()}>
                  <Trash2 className="h-3 w-3" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Influencer List Item ──
function InfluencerListItem({ influencer, isSelected, onSelect, onDelete, onUpdateStatus }: {
  influencer: Influencer
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
}) {
  const platCfg = platformConfig[influencer.platform]
  const statCfg = statusConfig[influencer.status] || statusConfig.prospect
  const StatusIcon = statCfg.icon
  const PlatformIcon = platCfg.icon

  return (
    <motion.div variants={itemVariants} layout>
      <Card
        className={cn(
          "shadow-sm cursor-pointer transition-all hover:shadow-md",
          isSelected ? "border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30" : "border-border/60"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-lg shrink-0">
            <AvatarFallback className={cn("font-bold text-xs", platCfg.color)}>
              {getInitials(influencer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold truncate">{influencer.name}</h4>
              <div className={cn("h-4 w-4 rounded-full flex items-center justify-center shrink-0", platCfg.color)}>
                <PlatformIcon className="h-2 w-2" />
              </div>
              <span className="text-[11px] text-muted-foreground">@{influencer.username}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{formatFollowers(influencer.followers)}</span>
            <span>{influencer.engagementRate.toFixed(1)}%</span>
            {influencer.rate && <span>${influencer.rate.toLocaleString()}</span>}
          </div>
          <Badge className={cn("text-[9px] shrink-0", statCfg.color)}>
            <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
            {statCfg.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Influencer Detail Panel ──
function InfluencerDetailPanel({ influencer, onUpdateStatus, onDelete, onClose }: {
  influencer: Influencer
  onUpdateStatus: (status: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const platCfg = platformConfig[influencer.platform]
  const statCfg = statusConfig[influencer.status] || statusConfig.prospect
  const PlatformIcon = platCfg.icon
  const [notesValue, setNotesValue] = useState(influencer.notes || "")

  const currentStatusIndex = statusFlow.indexOf(influencer.status)

  return (
    <>
      {/* Profile Card */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 rounded-xl shrink-0">
              <AvatarFallback className={cn("font-bold text-lg", platCfg.color)}>
                {getInitials(influencer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{influencer.name}</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">@{influencer.username}</span>
                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", platCfg.color)}>
                  <PlatformIcon className="h-2.5 w-2.5" />
                </div>
                <Badge className={cn("text-[9px]", statCfg.color)}>
                  {statCfg.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-bold">{formatFollowers(influencer.followers)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Followers</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{influencer.engagementRate.toFixed(1)}%</p>
              <p className="text-[9px] text-muted-foreground uppercase">Engagement</p>
            </div>
          </div>

          {/* Engagement visualization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground">Engagement Rate</span>
              <span className="text-[10px] font-semibold">{influencer.engagementRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  influencer.engagementRate >= 5 ? "bg-emerald-500" :
                  influencer.engagementRate >= 3 ? "bg-teal-500" :
                  influencer.engagementRate >= 1 ? "bg-amber-500" : "bg-rose-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(influencer.engagementRate * 10, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-muted-foreground">Low</span>
              <span className="text-[8px] text-muted-foreground">High</span>
            </div>
          </div>

          {/* Niche */}
          {influencer.niche && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Niche</p>
              <Badge variant="secondary" className="text-xs">{influencer.niche}</Badge>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Contact</p>
            <div className="space-y-1.5">
              {influencer.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <a href={`mailto:${influencer.email}`} className="text-emerald-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
                    {influencer.email}
                  </a>
                </div>
              )}
              {influencer.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{influencer.phone}</span>
                </div>
              )}
              {!influencer.email && !influencer.phone && (
                <p className="text-[11px] text-muted-foreground/50">No contact info</p>
              )}
            </div>
          </div>

          {/* Contract Info */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Contract</p>
            <div className="space-y-1.5">
              {influencer.rate && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span>${influencer.rate.toLocaleString()} / post</span>
                </div>
              )}
              {influencer.contractStart && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{new Date(influencer.contractStart).toLocaleDateString()} — {influencer.contractEnd ? new Date(influencer.contractEnd).toLocaleDateString() : "Ongoing"}</span>
                </div>
              )}
              {!influencer.rate && !influencer.contractStart && (
                <p className="text-[11px] text-muted-foreground/50">No contract info</p>
              )}
            </div>
          </div>

          {/* Client/Campaign */}
          {(influencer.client || influencer.campaign) && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Assignments</p>
              <div className="space-y-1.5">
                {influencer.client && (
                  <div className="flex items-center gap-2 text-xs">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span>{influencer.client.name}</span>
                  </div>
                )}
                {influencer.campaign && (
                  <div className="flex items-center gap-2 text-xs">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span>{influencer.campaign.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-600" /> Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0">
            {statusFlow.map((status, index) => {
              const cfg = statusConfig[status]
              const Icon = cfg.icon
              const isCompleted = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              const isLast = index === statusFlow.length - 1

              return (
                <div key={status} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                      isCompleted ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/20 bg-background",
                      isCurrent && "ring-2 ring-emerald-500/30"
                    )}>
                      <Icon className={cn("h-3 w-3", isCompleted ? "text-white" : "text-muted-foreground/40")} />
                    </div>
                    {!isLast && (
                      <div className={cn(
                        "w-0.5 h-6",
                        isCompleted && index < currentStatusIndex ? "bg-emerald-500" : "bg-muted-foreground/20"
                      )} />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className={cn("text-xs font-medium", isCompleted ? "text-foreground" : "text-muted-foreground/50")}>
                      {cfg.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Current</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Status update dropdown */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground mb-1.5">Update Status</p>
            <Select value={influencer.status} onValueChange={onUpdateStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <cfg.icon className="h-3 w-3" /> {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-emerald-600" /> Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            placeholder="Add notes about this influencer..."
            className="min-h-[80px] text-xs"
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
          />
          <div className="flex items-center justify-end mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => {
                fetch(`/api/influencers/${influencer.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes: notesValue }),
                })
              }}
            >
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {influencer.email && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => window.open(`mailto:${influencer.email}`)}>
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-rose-600 hover:text-rose-700" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </>
  )
}

// ── Add Influencer Dialog ──
function AddInfluencerDialog({ open, onOpenChange, onSubmit, clients, campaigns }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
  clients: { id: string; name: string }[]
  campaigns: { id: string; name: string; status: string }[]
}) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    platform: "instagram" as Platform,
    followers: "",
    engagementRate: "",
    niche: "",
    email: "",
    phone: "",
    status: "prospect",
    rate: "",
    clientId: "",
    campaignId: "",
    notes: "",
  })

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!form.name || !form.username) return
    onSubmit({
      name: form.name,
      username: form.username,
      platform: form.platform,
      followers: parseInt(form.followers) || 0,
      engagementRate: parseFloat(form.engagementRate) || 0,
      niche: form.niche || null,
      email: form.email || null,
      phone: form.phone || null,
      status: form.status,
      rate: form.rate ? parseFloat(form.rate) : null,
      clientId: form.clientId || null,
      campaignId: form.campaignId || null,
      notes: form.notes || null,
    })
    setForm({
      name: "", username: "", platform: "instagram", followers: "", engagementRate: "",
      niche: "", email: "", phone: "", status: "prospect", rate: "", clientId: "", campaignId: "", notes: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" /> Add Influencer
          </DialogTitle>
          <DialogDescription>Add a new influencer to your CRM</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="Jane Smith" value={form.name} onChange={e => updateField("name", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Username *</Label>
                <Input placeholder="@janesmith" value={form.username} onChange={e => updateField("username", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={v => updateField("platform", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(platformConfig) as Platform[]).map(p => (
                      <SelectItem key={p} value={p}>{platformConfig[p].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => updateField("status", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Followers</Label>
                <Input type="number" placeholder="10000" value={form.followers} onChange={e => updateField("followers", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Engagement %</Label>
                <Input type="number" step="0.1" placeholder="3.5" value={form.engagementRate} onChange={e => updateField("engagementRate", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Rate / Post ($)</Label>
                <Input type="number" placeholder="500" value={form.rate} onChange={e => updateField("rate", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Niche</Label>
              <Input placeholder="e.g., Fashion, Tech, Fitness" value={form.niche} onChange={e => updateField("niche", e.target.value)} className="h-8 text-sm" />
            </div>

            <Separator />

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" placeholder="jane@example.com" value={form.email} onChange={e => updateField("email", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input placeholder="+1 555-0100" value={form.phone} onChange={e => updateField("phone", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <Separator />

            {/* Assignments */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Client</Label>
                <Select value={form.clientId} onValueChange={v => updateField("clientId", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Campaign</Label>
                <Select value={form.campaignId} onValueChange={v => updateField("campaignId", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional notes about this influencer..." value={form.notes} onChange={e => updateField("notes", e.target.value)} className="min-h-[60px] text-sm" />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Add Influencer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
