"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Plus,
  Mail,
  Phone,
  MoreVertical,
  Grid3X3,
  List,
  Table2,
  Users,
  TrendingUp,
  Eye,
  UserCheck,
  ChevronRight,
  Calendar,
  DollarSign,
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Filter,
  ChevronDown,
  AlertTriangle,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Briefcase,
  GitCompareArrows,
  Funnel,
  UsersRound,
  CircleDot,
  Zap,
  Crown,
  Star,
  ExternalLink,
  Minus,
  PlusCircle,
  RotateCcw,
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toString()
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatCurrency(n: number | null): string {
  if (n === null || n === undefined) return "—"
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Platform / Status configs ───────────────────────────────────────────────

const platformConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  instagram: { icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
  facebook: { icon: Facebook, color: "text-blue-600", bg: "bg-blue-50" },
  twitter: { icon: Twitter, color: "text-sky-500", bg: "bg-sky-50" },
  linkedin: { icon: Linkedin, color: "text-sky-700", bg: "bg-sky-50" },
  tiktok: { icon: CircleDot, color: "text-gray-900", bg: "bg-gray-50" },
  youtube: { icon: Youtube, color: "text-red-600", bg: "bg-red-50" },
  pinterest: { icon: Star, color: "text-red-500", bg: "bg-red-50" },
  snapchat: { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50" },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string; icon: React.ElementType }> = {
  prospect: { label: "Prospect", color: "text-gray-700", bg: "bg-gray-100", dotColor: "bg-gray-400", icon: Eye },
  contacted: { label: "Contacted", color: "text-sky-700", bg: "bg-sky-100", dotColor: "bg-sky-400", icon: Send },
  negotiating: { label: "Negotiating", color: "text-amber-700", bg: "bg-amber-100", dotColor: "bg-amber-400", icon: Handshake },
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100", dotColor: "bg-emerald-400", icon: UserCheck },
  completed: { label: "Completed", color: "text-teal-700", bg: "bg-teal-100", dotColor: "bg-teal-400", icon: CheckCircle2 },
  declined: { label: "Declined", color: "text-red-700", bg: "bg-red-100", dotColor: "bg-red-400", icon: XCircle },
}

const pipelineStages = ["prospect", "contacted", "negotiating", "active", "completed"] as const

const followerTiers = [
  { key: "nano", label: "Nano", min: 1000, max: 10000, desc: "1K–10K", color: "bg-emerald-200" },
  { key: "micro", label: "Micro", min: 10000, max: 100000, desc: "10K–100K", color: "bg-emerald-300" },
  { key: "midTier", label: "Mid-Tier", min: 100000, max: 500000, desc: "100K–500K", color: "bg-emerald-400" },
  { key: "macro", label: "Macro", min: 500000, max: 1000000, desc: "500K–1M", color: "bg-emerald-500" },
  { key: "mega", label: "Mega", min: 1000000, max: Infinity, desc: "1M+", color: "bg-emerald-600" },
]

type ViewMode = "grid" | "list" | "table"
type SortField = "name" | "followers" | "engagement" | "rate" | "createdAt" | "contractEnd"
type SortOrder = "asc" | "desc"

// Helper: format username with @ prefix (avoid double @@)
function formatUsername(username: string): string {
  return username.startsWith("@") ? username : `@${username}`
}

interface AnalyticsData {
  overview: { totalInfluencers: number; activeCollaborations: number; avgEngagement: number; totalReach: number; avgRate: number }
  byPlatform: { platform: string; count: number; avgEngagement: number; avgRate: number }[]
  topPerformers: Influencer[]
  byNiche: { niche: string; count: number }[]
  contractExpiring: Influencer[]
  statusDistribution: { status: string; count: number }[]
  followerTiers: Record<string, { label: string; count: number }>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InfluencersView() {
  const { influencers, clients, campaigns, setInfluencers } = useERPStore()
  const { toast } = useToast()

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState("overview")

  // ── Analytics ──
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // ── Search ──
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Filters ──
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [nicheFilter, setNicheFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [minFollowers, setMinFollowers] = useState("")
  const [maxFollowers, setMaxFollowers] = useState("")
  const [minEngagement, setMinEngagement] = useState("")
  const [maxEngagement, setMaxEngagement] = useState("")
  const [minRate, setMinRate] = useState("")
  const [maxRate, setMaxRate] = useState("")

  // ── Sort ──
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // ── View mode ──
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // ── Detail panel ──
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)

  // ── Table selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── Compare tab ──
  const [compareIds, setCompareIds] = useState<string[]>([])

  // ── Create / Edit dialog ──
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editInfluencer, setEditInfluencer] = useState<Influencer | null>(null)
  const [formData, setFormData] = useState({
    name: "", username: "", platform: "instagram" as Platform, followers: 0,
    engagementRate: 0, niche: "", email: "", phone: "", notes: "",
    status: "prospect", rate: null as number | null,
    contractStart: "", contractEnd: "", clientId: "", campaignId: "",
  })

  // ── Delete confirm ──
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // ── Bulk status dialog ──
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false)
  const [bulkNewStatus, setBulkNewStatus] = useState("")

  // ── Ctrl+K shortcut ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setActiveTab("directory")
        setTimeout(() => {
          const el = document.getElementById("influencer-search-input")
          el?.focus()
        }, 100)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // ── Click outside suggestions ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Debounced search ──
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  // ── Fetch analytics ──
  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true)
      try {
        const res = await fetch("/api/influencers/analytics")
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data)
        } else {
          // Fallback: compute from store data
          setAnalytics(computeAnalyticsFallback(influencers))
        }
      } catch {
        setAnalytics(computeAnalyticsFallback(influencers))
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [influencers])

  // ── Computed: unique niches ──
  const uniqueNiches = useMemo(() => {
    const set = new Set<string>()
    influencers.forEach(i => {
      if (i.niche) i.niche.split(",").forEach(n => { const t = n.trim(); if (t) set.add(t) })
    })
    return Array.from(set).sort()
  }, [influencers])

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (platformFilter !== "all") count++
    if (statusFilter !== "all") count++
    if (nicheFilter !== "all") count++
    if (clientFilter !== "all") count++
    if (campaignFilter !== "all") count++
    if (minFollowers) count++
    if (maxFollowers) count++
    if (minEngagement) count++
    if (maxEngagement) count++
    if (minRate) count++
    if (maxRate) count++
    return count
  }, [platformFilter, statusFilter, nicheFilter, clientFilter, campaignFilter, minFollowers, maxFollowers, minEngagement, maxEngagement, minRate, maxRate])

  // ── Filtered & sorted influencers ──
  const filteredInfluencers = useMemo(() => {
    let result = [...influencers]

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q) ||
        (i.niche && i.niche.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.notes && i.notes.toLowerCase().includes(q))
      )
    }

    // Platform
    if (platformFilter !== "all") result = result.filter(i => i.platform === platformFilter)
    // Status
    if (statusFilter !== "all") result = result.filter(i => i.status === statusFilter)
    // Niche
    if (nicheFilter !== "all") result = result.filter(i => i.niche && i.niche.includes(nicheFilter))
    // Client
    if (clientFilter !== "all") result = result.filter(i => i.clientId === clientFilter)
    // Campaign
    if (campaignFilter !== "all") result = result.filter(i => i.campaignId === campaignFilter)
    // Followers range
    if (minFollowers) result = result.filter(i => i.followers >= parseInt(minFollowers))
    if (maxFollowers) result = result.filter(i => i.followers <= parseInt(maxFollowers))
    // Engagement range
    if (minEngagement) result = result.filter(i => i.engagementRate >= parseFloat(minEngagement))
    if (maxEngagement) result = result.filter(i => i.engagementRate <= parseFloat(maxEngagement))
    // Rate range
    if (minRate) result = result.filter(i => i.rate !== null && i.rate >= parseFloat(minRate))
    if (maxRate) result = result.filter(i => i.rate !== null && i.rate <= parseFloat(maxRate))

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break
        case "followers": cmp = a.followers - b.followers; break
        case "engagement": cmp = a.engagementRate - b.engagementRate; break
        case "rate": cmp = (a.rate || 0) - (b.rate || 0); break
        case "contractEnd":
          const aEnd = a.contractEnd ? new Date(a.contractEnd).getTime() : Infinity
          const bEnd = b.contractEnd ? new Date(b.contractEnd).getTime() : Infinity
          cmp = aEnd - bEnd; break
        default: cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === "asc" ? cmp : -cmp
    })

    return result
  }, [influencers, debouncedSearch, platformFilter, statusFilter, nicheFilter, clientFilter, campaignFilter, minFollowers, maxFollowers, minEngagement, maxEngagement, minRate, maxRate, sortField, sortOrder])

  // ── Search suggestions ──
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return []
    const q = search.toLowerCase()
    return influencers
      .filter(i => i.name.toLowerCase().includes(q) || i.username.toLowerCase().includes(q))
      .slice(0, 6)
  }, [search, influencers])

  // ── Platform counts ──
  const platformCounts = useMemo(() => {
    const m: Record<string, number> = {}
    influencers.forEach(i => { m[i.platform] = (m[i.platform] || 0) + 1 })
    return m
  }, [influencers])

  // ── Status counts ──
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {}
    influencers.forEach(i => { m[i.status] = (m[i.status] || 0) + 1 })
    return m
  }, [influencers])

  // ── Handlers ──
  const clearAllFilters = useCallback(() => {
    setPlatformFilter("all")
    setStatusFilter("all")
    setNicheFilter("all")
    setClientFilter("all")
    setCampaignFilter("all")
    setMinFollowers("")
    setMaxFollowers("")
    setMinEngagement("")
    setMaxEngagement("")
    setMinRate("")
    setMaxRate("")
    setSearch("")
  }, [])

  const handleCreateInfluencer = useCallback(async () => {
    try {
      const res = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          followers: Number(formData.followers),
          engagementRate: Number(formData.engagementRate),
          rate: formData.rate ? Number(formData.rate) : null,
          clientId: formData.clientId || null,
          campaignId: formData.campaignId || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInfluencers([...influencers, data.influencer])
        setShowCreateDialog(false)
        resetFormData()
        toast({ title: "Influencer created", description: `${data.influencer.name} has been added.` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to create influencer", variant: "destructive" })
    }
  }, [formData, influencers, setInfluencers, toast])

  const handleUpdateInfluencer = useCallback(async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setInfluencers(influencers.map(i => i.id === id ? data.influencer : i))
        if (selectedInfluencer?.id === id) setSelectedInfluencer(data.influencer)
        toast({ title: "Updated", description: "Influencer updated successfully." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update influencer", variant: "destructive" })
    }
  }, [influencers, setInfluencers, selectedInfluencer, toast])

  const handleDeleteInfluencer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/influencers/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInfluencers(influencers.filter(i => i.id !== id))
        setSelectedInfluencer(null)
        setDeleteConfirm(null)
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
        toast({ title: "Deleted", description: "Influencer removed." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete influencer", variant: "destructive" })
    }
  }, [influencers, setInfluencers, toast])

  const handleBulkStatusChange = useCallback(async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      await handleUpdateInfluencer(id, { status: bulkNewStatus })
    }
    setSelectedIds(new Set())
    setBulkStatusDialog(false)
    setBulkNewStatus("")
  }, [selectedIds, bulkNewStatus, handleUpdateInfluencer])

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      await fetch(`/api/influencers/${id}`, { method: "DELETE" })
    }
    setInfluencers(influencers.filter(i => !selectedIds.has(i.id)))
    setSelectedIds(new Set())
    toast({ title: "Deleted", description: `${ids.length} influencers removed.` })
  }, [selectedIds, influencers, setInfluencers, toast])

  const resetFormData = useCallback(() => {
    setFormData({
      name: "", username: "", platform: "instagram", followers: 0,
      engagementRate: 0, niche: "", email: "", phone: "", notes: "",
      status: "prospect", rate: null, contractStart: "", contractEnd: "",
      clientId: "", campaignId: "",
    })
    setEditInfluencer(null)
  }, [])

  const openEditDialog = useCallback((inf: Influencer) => {
    setEditInfluencer(inf)
    setFormData({
      name: inf.name, username: inf.username, platform: inf.platform as Platform,
      followers: inf.followers, engagementRate: inf.engagementRate,
      niche: inf.niche || "", email: inf.email || "", phone: inf.phone || "",
      notes: inf.notes || "", status: inf.status, rate: inf.rate,
      contractStart: inf.contractStart ? inf.contractStart.split("T")[0] : "",
      contractEnd: inf.contractEnd ? inf.contractEnd.split("T")[0] : "",
      clientId: inf.clientId || "", campaignId: inf.campaignId || "",
    })
    setShowCreateDialog(true)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editInfluencer) return
    await handleUpdateInfluencer(editInfluencer.id, {
      name: formData.name, username: formData.username, platform: formData.platform,
      followers: Number(formData.followers), engagementRate: Number(formData.engagementRate),
      niche: formData.niche || null, email: formData.email || null, phone: formData.phone || null,
      notes: formData.notes || null, status: formData.status, rate: formData.rate ? Number(formData.rate) : null,
      contractStart: formData.contractStart || null, contractEnd: formData.contractEnd || null,
      clientId: formData.clientId || null, campaignId: formData.campaignId || null,
    })
    setShowCreateDialog(false)
    resetFormData()
  }, [editInfluencer, formData, handleUpdateInfluencer, resetFormData])

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }, [sortField])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredInfluencers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredInfluencers.map(i => i.id)))
    }
  }, [selectedIds.size, filteredInfluencers])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) {
        toast({ title: "Max 4", description: "You can compare up to 4 influencers at a time." })
        return prev
      }
      return [...prev, id]
    })
  }, [toast])

  const setFollowerPreset = useCallback((preset: string) => {
    switch (preset) {
      case "nano": setMinFollowers("1000"); setMaxFollowers("10000"); break
      case "micro": setMinFollowers("10000"); setMaxFollowers("100000"); break
      case "midTier": setMinFollowers("100000"); setMaxFollowers("500000"); break
      case "macro": setMinFollowers("500000"); setMaxFollowers("1000000"); break
      case "mega": setMinFollowers("1000000"); setMaxFollowers(""); break
      default: setMinFollowers(""); setMaxFollowers("")
    }
  }, [])

  const setEngagementPreset = useCallback((preset: string) => {
    switch (preset) {
      case "low": setMinEngagement(""); setMaxEngagement("2"); break
      case "medium": setMinEngagement("2"); setMaxEngagement("5"); break
      case "high": setMinEngagement("5"); setMaxEngagement(""); break
      default: setMinEngagement(""); setMaxEngagement("")
    }
  }, [])

  // ── Fallback analytics computation ──
  function computeAnalyticsFallback(infs: Influencer[]): AnalyticsData {
    const total = infs.length
    const active = infs.filter(i => i.status === "active").length
    const avgEng = total > 0 ? infs.reduce((s, i) => s + i.engagementRate, 0) / total : 0
    const totalReach = infs.reduce((s, i) => s + i.followers, 0)
    const rates = infs.filter(i => i.rate !== null)
    const avgRate = rates.length > 0 ? rates.reduce((s, i) => s + (i.rate || 0), 0) / rates.length : 0

    const tiers: Record<string, { label: string; count: number }> = {
      nano: { label: "Nano", count: 0 },
      micro: { label: "Micro", count: 0 },
      midTier: { label: "Mid-Tier", count: 0 },
      macro: { label: "Macro", count: 0 },
      mega: { label: "Mega", count: 0 },
    }
    infs.forEach(i => {
      if (i.followers >= 1000000) tiers.mega.count++
      else if (i.followers >= 500000) tiers.macro.count++
      else if (i.followers >= 100000) tiers.midTier.count++
      else if (i.followers >= 10000) tiers.micro.count++
      else tiers.nano.count++
    })

    const platMap = new Map<string, { count: number; totalEng: number; totalRate: number; rateCount: number }>()
    infs.forEach(i => {
      const e = platMap.get(i.platform) || { count: 0, totalEng: 0, totalRate: 0, rateCount: 0 }
      e.count++; e.totalEng += i.engagementRate
      if (i.rate) { e.totalRate += i.rate; e.rateCount++ }
      platMap.set(i.platform, e)
    })

    const nicheMap = new Map<string, number>()
    infs.forEach(i => { if (i.niche) i.niche.split(",").forEach(n => { const t = n.trim(); if (t) nicheMap.set(t, (nicheMap.get(t) || 0) + 1) }) })

    const statusMap = new Map<string, number>()
    infs.forEach(i => { statusMap.set(i.status, (statusMap.get(i.status) || 0) + 1) })

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiring = infs.filter(i => i.contractEnd && new Date(i.contractEnd) >= now && new Date(i.contractEnd) <= thirtyDays)

    return {
      overview: { totalInfluencers: total, activeCollaborations: active, avgEngagement: Math.round(avgEng * 100) / 100, totalReach, avgRate: Math.round(avgRate * 100) / 100 },
      byPlatform: Array.from(platMap.entries()).map(([p, d]) => ({ platform: p, count: d.count, avgEngagement: d.count > 0 ? d.totalEng / d.count : 0, avgRate: d.rateCount > 0 ? d.totalRate / d.rateCount : 0 })),
      topPerformers: [...infs].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5),
      byNiche: Array.from(nicheMap.entries()).map(([niche, count]) => ({ niche, count })).sort((a, b) => b.count - a.count),
      contractExpiring: expiring,
      statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
      followerTiers: tiers,
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Influencer CRM</h1>
            <p className="text-xs text-muted-foreground">{influencers.length} influencers tracked</p>
          </div>
        </div>
        <Button
          onClick={() => { resetFormData(); setShowCreateDialog(true) }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <UserPlus className="h-4 w-4" /> Add Influencer
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-3 border-b bg-white">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="directory" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Directory
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Funnel className="h-3.5 w-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <GitCompareArrows className="h-3.5 w-3.5" /> Compare
              {compareIds.length > 0 && (
                <Badge className="h-4 min-w-[1rem] px-1 text-[10px] bg-emerald-600 text-white">{compareIds.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-6 m-0">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : analytics ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Influencers", value: analytics.overview.totalInfluencers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Active Collabs", value: analytics.overview.activeCollaborations, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
                  { label: "Avg Engagement", value: `${analytics.overview.avgEngagement}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Total Reach", value: formatFollowers(analytics.overview.totalReach), icon: Eye, color: "text-sky-600", bg: "bg-sky-50" },
                  { label: "Avg Rate/Post", value: formatCurrency(analytics.overview.avgRate), icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((kpi, idx) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", kpi.bg)}>
                            <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="text-lg font-bold">{kpi.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Follower Tiers & Platform Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Follower Tiers */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Follower Tier Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {followerTiers.map(tier => {
                      const count = analytics.followerTiers[tier.key]?.count || 0
                      const pct = analytics.overview.totalInfluencers > 0 ? Math.round((count / analytics.overview.totalInfluencers) * 100) : 0
                      return (
                        <div key={tier.key} className="flex items-center gap-3">
                          <div className="w-20 text-xs font-medium text-muted-foreground">{tier.label}</div>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", tier.color)}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                            />
                          </div>
                          <div className="w-16 text-right text-xs">
                            <span className="font-semibold">{count}</span>
                            <span className="text-muted-foreground ml-1">({pct}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Platform Breakdown */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Platform Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {analytics.byPlatform.map(p => {
                        const cfg = platformConfig[p.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
                        return (
                          <div key={p.platform} className="rounded-lg border p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", cfg.bg)}>
                                <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                              </div>
                              <span className="text-xs font-medium capitalize">{p.platform}</span>
                            </div>
                            <div className="text-lg font-bold">{p.count}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground">Eng: {p.avgEngagement.toFixed(1)}%</span>
                              <span className="text-[10px] text-muted-foreground">Rate: {formatCurrency(p.avgRate)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers & Niche Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" /> Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.topPerformers.map((inf, idx) => {
                      const cfg = platformConfig[inf.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
                      return (
                        <div key={inf.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedInfluencer(inf); setActiveTab("directory") }}>
                          <span className="w-5 text-xs font-bold text-muted-foreground text-center">{idx + 1}</span>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={cn("text-xs", cfg.bg, cfg.color)}>{getInitials(inf.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{inf.name}</p>
                            <p className="text-xs text-muted-foreground">{formatUsername(inf.username)}</p>
                          </div>
                          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                            {inf.engagementRate.toFixed(1)}%
                          </Badge>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Niche Distribution */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Niche Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                    {analytics.byNiche.slice(0, 10).map(item => {
                      const maxCount = analytics.byNiche[0]?.count || 1
                      const pct = Math.round((item.count / maxCount) * 100)
                      return (
                        <div key={item.niche} className="flex items-center gap-3">
                          <span className="w-24 text-xs truncate font-medium">{item.niche}</span>
                          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold w-6 text-right">{item.count}</span>
                        </div>
                      )
                    })}
                    {analytics.byNiche.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No niche data</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Contract Expiring */}
              {analytics.contractExpiring.length > 0 && (
                <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Contracts Expiring Soon
                    </CardTitle>
                    <CardDescription className="text-xs">Within the next 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {analytics.contractExpiring.map(inf => (
                        <div key={inf.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedInfluencer(inf); setActiveTab("directory") }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{inf.name}</span>
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">{statusConfig[inf.status]?.label || inf.status}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Ends {inf.contractEnd ? format(new Date(inf.contractEnd), "MMM d, yyyy") : "N/A"}
                          </div>
                          {inf.client && <div className="text-xs text-muted-foreground mt-1">Client: {inf.client.name}</div>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: DIRECTORY
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="directory" className="flex-1 overflow-hidden flex m-0">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="px-6 pt-4 pb-2 bg-white">
              <div ref={searchRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="influencer-search-input"
                  placeholder="Search by name, username, niche, email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 pr-20 h-10"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {search && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSearch(""); setShowSuggestions(false) }}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                </div>
                {/* Search suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden"
                    >
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                          onClick={() => { setSearch(s.name); setShowSuggestions(false); setSelectedInfluencer(s) }}
                        >
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground">{formatUsername(s.username)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="px-6 pb-2 bg-white">
              <button
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-1"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="h-4 min-w-[1.25rem] px-1 text-[10px] bg-emerald-600 text-white">{activeFilterCount}</Badge>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="py-3 space-y-4">
                      {/* Platform pills */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</Label>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant={platformFilter === "all" ? "default" : "outline"} className={cn("h-7 text-xs", platformFilter === "all" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setPlatformFilter("all")}>All</Button>
                          {Object.entries(platformConfig).map(([key, cfg]) => (
                            <Button key={key} size="sm" variant={platformFilter === key ? "default" : "outline"} className={cn("h-7 text-xs gap-1", platformFilter === key && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setPlatformFilter(key)}>
                              <cfg.icon className="h-3 w-3" />
                              {key}
                              <span className="text-[10px] opacity-70">{platformCounts[key] || 0}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Status pills */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</Label>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} className={cn("h-7 text-xs", statusFilter === "all" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setStatusFilter("all")}>All</Button>
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <Button key={key} size="sm" variant={statusFilter === key ? "default" : "outline"} className={cn("h-7 text-xs gap-1", statusFilter === key && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setStatusFilter(key)}>
                              <cfg.icon className="h-3 w-3" />
                              {cfg.label}
                              <span className="text-[10px] opacity-70">{statusCounts[key] || 0}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Range filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Follower Range */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Follower Range</Label>
                          <div className="flex gap-1.5 items-center mb-1.5">
                            <Input placeholder="Min" value={minFollowers} onChange={e => setMinFollowers(e.target.value)} className="h-7 text-xs" />
                            <span className="text-xs text-muted-foreground">–</span>
                            <Input placeholder="Max" value={maxFollowers} onChange={e => setMaxFollowers(e.target.value)} className="h-7 text-xs" />
                          </div>
                          <div className="flex gap-1">
                            {followerTiers.slice(0, 4).map(t => (
                              <Button key={t.key} variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setFollowerPreset(t.key)}>{t.label}</Button>
                            ))}
                          </div>
                        </div>
                        {/* Engagement Range */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Engagement %</Label>
                          <div className="flex gap-1.5 items-center mb-1.5">
                            <Input placeholder="Min" value={minEngagement} onChange={e => setMinEngagement(e.target.value)} className="h-7 text-xs" />
                            <span className="text-xs text-muted-foreground">–</span>
                            <Input placeholder="Max" value={maxEngagement} onChange={e => setMaxEngagement(e.target.value)} className="h-7 text-xs" />
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setEngagementPreset("low")}>Low &lt;2%</Button>
                            <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setEngagementPreset("medium")}>Med 2-5%</Button>
                            <Button variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setEngagementPreset("high")}>High &gt;5%</Button>
                          </div>
                        </div>
                        {/* Rate Range */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Rate Range</Label>
                          <div className="flex gap-1.5 items-center">
                            <Input placeholder="Min" value={minRate} onChange={e => setMinRate(e.target.value)} className="h-7 text-xs" />
                            <span className="text-xs text-muted-foreground">–</span>
                            <Input placeholder="Max" value={maxRate} onChange={e => setMaxRate(e.target.value)} className="h-7 text-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Dropdown filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Niche</Label>
                          <Select value={nicheFilter} onValueChange={setNicheFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Niches" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Niches</SelectItem>
                              {uniqueNiches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</Label>
                          <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Clients" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Clients</SelectItem>
                              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Campaign</Label>
                          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Campaigns</SelectItem>
                              {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Clear All */}
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={clearAllFilters}>
                          <RotateCcw className="h-3 w-3" /> Clear All Filters ({activeFilterCount})
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort & View Controls */}
            <div className="px-6 py-2 border-b bg-white flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Sort:</Label>
                <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="rate">Rate</SelectItem>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                    <SelectItem value="contractEnd">Contract End</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                </Button>
                <span className="text-xs text-muted-foreground">{filteredInfluencers.length} results</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" className={cn("h-7 w-7 p-0", viewMode === "grid" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setViewMode("grid")}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className={cn("h-7 w-7 p-0", viewMode === "list" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setViewMode("list")}>
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" className={cn("h-7 w-7 p-0", viewMode === "table" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setViewMode("table")}>
                  <Table2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredInfluencers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Users className="h-12 w-12 text-muted-foreground/30" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No influencers found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAllFilters}>Clear Filters</Button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredInfluencers.map(inf => (
                    <InfluencerCard
                      key={inf.id}
                      influencer={inf}
                      onSelect={() => setSelectedInfluencer(inf)}
                      onEdit={() => openEditDialog(inf)}
                      onDelete={() => setDeleteConfirm(inf.id)}
                      onUpdateStatus={s => handleUpdateInfluencer(inf.id, { status: s })}
                      onCompare={() => toggleCompare(inf.id)}
                      isCompared={compareIds.includes(inf.id)}
                    />
                  ))}
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-2">
                  {filteredInfluencers.map(inf => (
                    <InfluencerListItem
                      key={inf.id}
                      influencer={inf}
                      onSelect={() => setSelectedInfluencer(inf)}
                      onEdit={() => openEditDialog(inf)}
                      onDelete={() => setDeleteConfirm(inf.id)}
                      onUpdateStatus={s => handleUpdateInfluencer(inf.id, { status: s })}
                      onCompare={() => toggleCompare(inf.id)}
                      isCompared={compareIds.includes(inf.id)}
                    />
                  ))}
                </div>
              ) : (
                /* Table View */
                <div>
                  {/* Bulk actions */}
                  {selectedIds.size > 0 && (
                    <div className="mb-3 flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-xs font-medium text-emerald-700">{selectedIds.size} selected</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBulkStatusDialog(true)}>Change Status</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkDelete}>Delete</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
                    </div>
                  )}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-2 text-left w-8">
                              <Checkbox checked={selectedIds.size === filteredInfluencers.length && filteredInfluencers.length > 0} onCheckedChange={toggleSelectAll} />
                            </th>
                            {[
                              { key: "name", label: "Name" },
                              { key: "platform", label: "Platform" },
                              { key: "followers", label: "Followers" },
                              { key: "engagement", label: "Engagement" },
                              { key: "rate", label: "Rate" },
                              { key: "status", label: "Status" },
                              { key: "niche", label: "Niche" },
                              { key: "client", label: "Client" },
                            ].map(col => (
                              <th key={col.key} className="p-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => { if (["name", "followers", "engagement", "rate"].includes(col.key)) toggleSort(col.key as SortField) }}>
                                <span className="flex items-center gap-1">
                                  {col.label}
                                  {sortField === col.key && (sortOrder === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />)}
                                </span>
                              </th>
                            ))}
                            <th className="p-2 text-right font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInfluencers.map(inf => {
                            const cfg = platformConfig[inf.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
                            const stCfg = statusConfig[inf.status] || statusConfig.prospect
                            return (
                              <tr key={inf.id} className={cn("border-t hover:bg-muted/30 cursor-pointer", selectedIds.has(inf.id) && "bg-emerald-50/50")} onClick={() => setSelectedInfluencer(inf)}>
                                <td className="p-2" onClick={e => e.stopPropagation()}>
                                  <Checkbox checked={selectedIds.has(inf.id)} onCheckedChange={() => toggleSelect(inf.id)} />
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className={cn("text-[10px]", cfg.bg, cfg.color)}>{getInitials(inf.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{inf.name}</div>
                                      <div className="text-muted-foreground">{formatUsername(inf.username)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2 capitalize">{inf.platform}</td>
                                <td className="p-2">{formatFollowers(inf.followers)}</td>
                                <td className="p-2">{inf.engagementRate.toFixed(1)}%</td>
                                <td className="p-2">{formatCurrency(inf.rate)}</td>
                                <td className="p-2"><Badge variant="outline" className={cn("text-[10px]", stCfg.bg, stCfg.color)}>{stCfg.label}</Badge></td>
                                <td className="p-2 max-w-[100px] truncate">{inf.niche || "—"}</td>
                                <td className="p-2">{inf.client?.name || "—"}</td>
                                <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setSelectedInfluencer(inf)}><Eye className="h-3 w-3 mr-2" /> View</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEditDialog(inf)}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toggleCompare(inf.id)}><GitCompareArrows className="h-3 w-3 mr-2" /> {compareIds.includes(inf.id) ? "Remove from Compare" : "Add to Compare"}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteConfirm(inf.id)}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel (Sheet) */}
          <Sheet open={!!selectedInfluencer} onOpenChange={open => { if (!open) setSelectedInfluencer(null) }}>
            <SheetContent className="w-full sm:w-[480px] p-0 overflow-y-auto">
              {selectedInfluencer && (
                <InfluencerDetailPanel
                  influencer={selectedInfluencer}
                  onClose={() => setSelectedInfluencer(null)}
                  onEdit={() => openEditDialog(selectedInfluencer)}
                  onDelete={() => { setDeleteConfirm(selectedInfluencer.id); setSelectedInfluencer(null) }}
                  onUpdateStatus={s => handleUpdateInfluencer(selectedInfluencer.id, { status: s })}
                  onUpdateNotes={n => handleUpdateInfluencer(selectedInfluencer.id, { notes: n })}
                />
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: PIPELINE
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="pipeline" className="flex-1 overflow-y-auto p-6 space-y-6 m-0">
          {/* Funnel Header */}
          <div className="flex items-center gap-4 flex-wrap">
            {pipelineStages.map((stage, idx) => {
              const cfg = statusConfig[stage]
              const count = influencers.filter(i => i.status === stage).length
              const total = influencers.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <React.Fragment key={stage}>
                  <button
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-all min-w-[100px]",
                      statusFilter === stage ? "border-emerald-500 bg-emerald-50" : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                    onClick={() => setStatusFilter(statusFilter === stage ? "all" : stage)}
                  >
                    <cfg.icon className={cn("h-5 w-5", cfg.color)} />
                    <span className="text-xs font-medium">{cfg.label}</span>
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  </button>
                  {idx < pipelineStages.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Conversion rates */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            {pipelineStages.slice(0, -1).map((stage, idx) => {
              const currentCount = influencers.filter(i => i.status === stage).length
              const nextStage = pipelineStages[idx + 1]
              const nextCount = influencers.filter(i => i.status === nextStage).length
              const convRate = currentCount > 0 ? Math.round((nextCount / currentCount) * 100) : 0
              return (
                <span key={stage} className="flex items-center gap-1">
                  {statusConfig[stage].label} → {statusConfig[nextStage].label}: <span className="font-semibold text-foreground">{convRate}%</span>
                </span>
              )
            })}
            {influencers.filter(i => i.status === "declined").length > 0 && (
              <span className="flex items-center gap-1 ml-auto text-red-600">
                <XCircle className="h-3 w-3" /> Declined: {influencers.filter(i => i.status === "declined").length}
              </span>
            )}
          </div>

          <Separator />

          {/* Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {pipelineStages.map(stage => {
              const cfg = statusConfig[stage]
              const stageInfluencers = influencers.filter(i => i.status === stage)
              const displayInfluencers = statusFilter !== "all" && statusFilter !== stage ? [] : stageInfluencers
              return (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", cfg.dotColor)} />
                    <span className="text-sm font-semibold">{cfg.label}</span>
                    <Badge variant="outline" className="text-[10px]">{stageInfluencers.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {displayInfluencers.map(inf => {
                      const pCfg = platformConfig[inf.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
                      return (
                        <Card key={inf.id} className="border shadow-none">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className={cn("text-[10px]", pCfg.bg, pCfg.color)}>{getInitials(inf.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{inf.name}</p>
                                <p className="text-[10px] text-muted-foreground">{formatUsername(inf.username)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                              <span>{formatFollowers(inf.followers)}</span>
                              <span>·</span>
                              <span>{inf.engagementRate.toFixed(1)}%</span>
                              {inf.rate && <><span>·</span><span>{formatCurrency(inf.rate)}</span></>}
                            </div>
                            {/* Move buttons */}
                            <div className="flex gap-1">
                              {stage !== "prospect" && (
                                <Button size="sm" variant="outline" className="h-5 text-[10px] px-1.5" onClick={() => handleUpdateInfluencer(inf.id, { status: pipelineStages[pipelineStages.indexOf(stage) - 1] })}>
                                  ← Back
                                </Button>
                              )}
                              {stage !== "completed" && (
                                <Button size="sm" variant="outline" className="h-5 text-[10px] px-1.5" onClick={() => handleUpdateInfluencer(inf.id, { status: pipelineStages[pipelineStages.indexOf(stage) + 1] })}>
                                  Next →
                                </Button>
                              )}
                              {stage !== "declined" && (
                                <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1.5 text-red-500 hover:text-red-700" onClick={() => handleUpdateInfluencer(inf.id, { status: "declined" })}>
                                  Decline
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    {displayInfluencers.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No influencers</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: COMPARE
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="compare" className="flex-1 overflow-y-auto p-6 space-y-6 m-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Influencer Comparison</h2>
              <p className="text-xs text-muted-foreground">Select up to 4 influencers to compare side by side</p>
            </div>
            {compareIds.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>Clear Comparison</Button>
            )}
          </div>

          {/* Influencer selector */}
          <div className="flex flex-wrap gap-2">
            {compareIds.map(id => {
              const inf = influencers.find(i => i.id === id)
              if (!inf) return null
              return (
                <Badge key={id} variant="secondary" className="gap-1 py-1 px-2">
                  {inf.name}
                  <button className="hover:text-red-500" onClick={() => toggleCompare(id)}><X className="h-3 w-3" /></button>
                </Badge>
              )
            })}
            {compareIds.length < 4 && (
              <Select onValueChange={v => { if (!compareIds.includes(v)) toggleCompare(v) }}>
                <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="+ Add influencer" /></SelectTrigger>
                <SelectContent>
                  {influencers.filter(i => !compareIds.includes(i.id)).map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name} ({formatUsername(i.username)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Comparison Table */}
          {compareIds.length >= 2 ? (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium text-muted-foreground w-36">Metric</th>
                      {compareIds.map(id => {
                        const inf = influencers.find(i => i.id === id)
                        if (!inf) return null
                        const cfg = platformConfig[inf.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
                        return (
                          <th key={id} className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={cn("text-xs", cfg.bg, cfg.color)}>{getInitials(inf.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{inf.name}</span>
                              <span className="text-xs text-muted-foreground">{formatUsername(inf.username)}</span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const comparedInfs = compareIds.map(id => influencers.find(i => i.id === id)).filter(Boolean) as Influencer[]
                      const maxFollowers = Math.max(...comparedInfs.map(i => i.followers))
                      const maxEngagement = Math.max(...comparedInfs.map(i => i.engagementRate))
                      const maxRate = Math.max(...comparedInfs.map(i => i.rate || 0))

                      const rows: { label: string; icon: React.ElementType; values: { display: string; barPct: number }[] }[] = [
                        {
                          label: "Platform", icon: CircleDot,
                          values: comparedInfs.map(i => ({ display: i.platform.charAt(0).toUpperCase() + i.platform.slice(1), barPct: 0 }))
                        },
                        {
                          label: "Followers", icon: Users,
                          values: comparedInfs.map(i => ({ display: formatFollowers(i.followers), barPct: maxFollowers > 0 ? (i.followers / maxFollowers) * 100 : 0 }))
                        },
                        {
                          label: "Engagement Rate", icon: TrendingUp,
                          values: comparedInfs.map(i => ({ display: `${i.engagementRate.toFixed(1)}%`, barPct: maxEngagement > 0 ? (i.engagementRate / maxEngagement) * 100 : 0 }))
                        },
                        {
                          label: "Rate per Post", icon: DollarSign,
                          values: comparedInfs.map(i => ({ display: formatCurrency(i.rate), barPct: maxRate > 0 ? ((i.rate || 0) / maxRate) * 100 : 0 }))
                        },
                        {
                          label: "Niche", icon: Target,
                          values: comparedInfs.map(i => ({ display: i.niche || "—", barPct: 0 }))
                        },
                        {
                          label: "Status", icon: Activity,
                          values: comparedInfs.map(i => ({ display: statusConfig[i.status]?.label || i.status, barPct: 0 }))
                        },
                        {
                          label: "Client", icon: Briefcase,
                          values: comparedInfs.map(i => ({ display: i.client?.name || "—", barPct: 0 }))
                        },
                        {
                          label: "Contract", icon: Calendar,
                          values: comparedInfs.map(i => ({
                            display: i.contractStart && i.contractEnd
                              ? `${format(new Date(i.contractStart), "MMM d")} – ${format(new Date(i.contractEnd), "MMM d, yyyy")}`
                              : "—",
                            barPct: 0
                          }))
                        },
                        {
                          label: "Cost per 1K Followers", icon: DollarSign,
                          values: comparedInfs.map(i => {
                            const cpk = i.rate && i.followers > 0 ? (i.rate / i.followers * 1000) : 0
                            const maxCpk = Math.max(...comparedInfs.map(ci => ci.rate && ci.followers > 0 ? ci.rate / ci.followers * 1000 : 0))
                            return { display: cpk > 0 ? `$${cpk.toFixed(2)}` : "—", barPct: maxCpk > 0 ? (cpk / maxCpk) * 100 : 0 }
                          })
                        },
                        {
                          label: "Engagement Score", icon: Sparkles,
                          values: comparedInfs.map(i => {
                            const score = i.followers * i.engagementRate / 100
                            const maxScore = Math.max(...comparedInfs.map(ci => ci.followers * ci.engagementRate / 100))
                            return { display: formatFollowers(Math.round(score)), barPct: maxScore > 0 ? (score / maxScore) * 100 : 0 }
                          })
                        },
                      ]

                      return rows.map(row => (
                        <tr key={row.label} className="border-t">
                          <td className="p-3 font-medium text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <row.icon className="h-3.5 w-3.5" />
                              {row.label}
                            </div>
                          </td>
                          {row.values.map((val, idx) => (
                            <td key={idx} className="p-3 text-center">
                              <div className="font-medium">{val.display}</div>
                              {val.barPct > 0 && (
                                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px] mx-auto">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${val.barPct}%` }} />
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <GitCompareArrows className="h-12 w-12 text-muted-foreground/30" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Select at least 2 influencers to compare</p>
                <p className="text-xs text-muted-foreground mt-1">Use the Directory tab to find and add influencers</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("directory")}>Go to Directory</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Create / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={open => { if (!open) { setShowCreateDialog(false); resetFormData() } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editInfluencer ? "Edit Influencer" : "Add Influencer"}</DialogTitle>
            <DialogDescription>{editInfluencer ? "Update influencer details" : "Add a new influencer to track"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Username *</Label>
                <Input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Platform</Label>
                <Select value={formData.platform} onValueChange={v => setFormData(p => ({ ...p, platform: v as Platform }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(platformConfig).map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Followers</Label>
                <Input type="number" value={formData.followers} onChange={e => setFormData(p => ({ ...p, followers: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Engagement %</Label>
                <Input type="number" step="0.1" value={formData.engagementRate} onChange={e => setFormData(p => ({ ...p, engagementRate: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rate/Post</Label>
                <Input type="number" value={formData.rate || ""} onChange={e => setFormData(p => ({ ...p, rate: e.target.value ? parseFloat(e.target.value) : null }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Niche</Label>
              <Input value={formData.niche} onChange={e => setFormData(p => ({ ...p, niche: e.target.value }))} placeholder="e.g. Fashion, Beauty, Tech" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Contract Start</Label>
                <Input type="date" value={formData.contractStart} onChange={e => setFormData(p => ({ ...p, contractStart: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Contract End</Label>
                <Input type="date" value={formData.contractEnd} onChange={e => setFormData(p => ({ ...p, contractEnd: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Client</Label>
                <Select value={formData.clientId || "none"} onValueChange={v => setFormData(p => ({ ...p, clientId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Campaign</Label>
                <Select value={formData.campaignId || "none"} onValueChange={v => setFormData(p => ({ ...p, campaignId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetFormData() }}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={editInfluencer ? handleSaveEdit : handleCreateInfluencer} disabled={!formData.name || !formData.username}>
              {editInfluencer ? "Save Changes" : "Add Influencer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Influencer</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteInfluencer(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Status Dialog ────────────────────────────────────────────── */}
      <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>Update status for {selectedIds.size} selected influencers</DialogDescription>
          </DialogHeader>
          <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select new status" /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkStatusChange} disabled={!bulkNewStatus}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function InfluencerCard({
  influencer,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onCompare,
  isCompared,
}: {
  influencer: Influencer
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
  onCompare: () => void
  isCompared: boolean
}) {
  const cfg = platformConfig[influencer.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
  const stCfg = statusConfig[influencer.status] || statusConfig.prospect

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={onSelect}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn("text-xs", cfg.bg, cfg.color)}>{getInitials(influencer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{influencer.name}</p>
                <p className="text-xs text-muted-foreground">{formatUsername(influencer.username)}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-3.5 w-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit() }}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onCompare() }}>
                  <GitCompareArrows className="h-3 w-3 mr-2" /> {isCompared ? "Remove from Compare" : "Add to Compare"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] gap-1", cfg.bg, cfg.color, "border-0")}>
              <cfg.icon className="h-2.5 w-2.5" /> {influencer.platform}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px]", stCfg.bg, stCfg.color)}>{stCfg.label}</Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Followers</p>
              <p className="text-sm font-bold">{formatFollowers(influencer.followers)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Engagement</p>
              <p className="text-sm font-bold">{influencer.engagementRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Rate</p>
              <p className="text-sm font-bold">{formatCurrency(influencer.rate)}</p>
            </div>
          </div>

          {/* Engagement bar */}
          <div className="mb-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", influencer.engagementRate > 5 ? "bg-emerald-500" : influencer.engagementRate > 2 ? "bg-amber-400" : "bg-gray-300")} style={{ width: `${Math.min(influencer.engagementRate * 10, 100)}%` }} />
            </div>
          </div>

          {/* Niche & Client */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {influencer.niche && <Badge variant="outline" className="text-[10px]">{influencer.niche.split(",")[0]}</Badge>}
            {influencer.client && <span className="truncate">{influencer.client.name}</span>}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t">
            {influencer.email && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); window.open(`mailto:${influencer.email}`) }}>
                <Mail className="h-3 w-3" />
              </Button>
            )}
            <Select onValueChange={s => { onUpdateStatus(s) }} onClick={e => e.stopPropagation()}>
              <SelectTrigger className="h-6 text-[10px] w-auto border-0 shadow-none p-0 px-1.5"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className={cn("h-6 px-1.5 text-[10px] ml-auto", isCompared && "text-emerald-600")} onClick={e => { e.stopPropagation(); onCompare() }}>
              <GitCompareArrows className="h-3 w-3 mr-1" /> {isCompared ? "Added" : "Compare"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function InfluencerListItem({
  influencer,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onCompare,
  isCompared,
}: {
  influencer: Influencer
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
  onCompare: () => void
  isCompared: boolean
}) {
  const cfg = platformConfig[influencer.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
  const stCfg = statusConfig[influencer.status] || statusConfig.prospect

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow cursor-pointer" onClick={onSelect}>
      <Avatar className="h-10 w-10">
        <AvatarFallback className={cn("text-xs", cfg.bg, cfg.color)}>{getInitials(influencer.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{influencer.name}</span>
          <Badge variant="outline" className={cn("text-[10px]", stCfg.bg, stCfg.color)}>{stCfg.label}</Badge>
          <Badge variant="outline" className={cn("text-[10px] gap-0.5", cfg.bg, cfg.color, "border-0")}>
            <cfg.icon className="h-2.5 w-2.5" /> {influencer.platform}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{formatUsername(influencer.username)}</span>
          <span>{formatFollowers(influencer.followers)} followers</span>
          <span>{influencer.engagementRate.toFixed(1)}% eng</span>
          {influencer.rate && <span>{formatCurrency(influencer.rate)}/post</span>}
          {influencer.niche && <span className="truncate">{influencer.niche.split(",")[0]}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" className={cn("h-7 text-xs", isCompared && "text-emerald-600")} onClick={e => { e.stopPropagation(); onCompare() }}>
          <GitCompareArrows className="h-3 w-3" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("active")}><UserCheck className="h-3 w-3 mr-2" /> Set Active</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onDelete}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function InfluencerDetailPanel({
  influencer,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateNotes,
}: {
  influencer: Influencer
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => void
  onUpdateNotes: (notes: string) => void
}) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [draftNotes, setDraftNotes] = useState("")
  const displayNotes = editingNotes ? draftNotes : (influencer.notes || "")
  const startEditing = useCallback(() => {
    setDraftNotes(influencer.notes || "")
    setEditingNotes(true)
  }, [influencer.notes])
  const saveNotes = useCallback(() => {
    onUpdateNotes(draftNotes)
    setEditingNotes(false)
  }, [draftNotes, onUpdateNotes])
  const cfg = platformConfig[influencer.platform] || { icon: CircleDot, color: "text-gray-500", bg: "bg-gray-50" }
  const stCfg = statusConfig[influencer.status] || statusConfig.prospect

  // Status timeline
  const currentIdx = pipelineStages.indexOf(influencer.status as typeof pipelineStages[number])
  const isDeclined = influencer.status === "declined"

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className={cn("text-lg", cfg.bg, cfg.color)}>{getInitials(influencer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold">{influencer.name}</h2>
            <p className="text-sm text-muted-foreground">{formatUsername(influencer.username)}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn("text-xs gap-1", cfg.bg, cfg.color, "border-0")}>
                <cfg.icon className="h-3 w-3" /> {influencer.platform}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", stCfg.bg, stCfg.color)}>{stCfg.label}</Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Followers", value: formatFollowers(influencer.followers), icon: Users },
          { label: "Engagement", value: `${influencer.engagementRate.toFixed(1)}%`, icon: TrendingUp },
          { label: "Rate/Post", value: formatCurrency(influencer.rate), icon: DollarSign },
          { label: "Niche", value: influencer.niche || "—", icon: Target },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <stat.icon className="h-3 w-3" /> {stat.label}
            </div>
            <p className="text-sm font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Engagement visualization */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Engagement Rate</span>
          <span className="font-semibold">{influencer.engagementRate.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", influencer.engagementRate > 5 ? "bg-emerald-500" : influencer.engagementRate > 2 ? "bg-amber-400" : "bg-gray-300")} style={{ width: `${Math.min(influencer.engagementRate * 10, 100)}%` }} />
        </div>
      </div>

      {/* Status Timeline */}
      {!isDeclined && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">Status Timeline</p>
          <div className="flex items-center gap-0">
            {pipelineStages.map((stage, idx) => {
              const sCfg = statusConfig[stage]
              const isCompleted = idx <= currentIdx
              const isCurrent = idx === currentIdx
              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center border-2",
                      isCompleted ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-200"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <span className="h-2 w-2 rounded-full bg-gray-200" />}
                    </div>
                    <span className={cn("text-[10px]", isCurrent ? "font-semibold text-emerald-700" : "text-muted-foreground")}>{sCfg.label}</span>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mb-4", idx < currentIdx ? "bg-emerald-400" : "bg-gray-200")} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      {isDeclined && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium text-red-700">This influencer has declined</span>
        </div>
      )}

      <Separator />

      {/* Contact Info */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Contact</p>
        <div className="space-y-2">
          {influencer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${influencer.email}`} className="text-emerald-600 hover:underline">{influencer.email}</a>
            </div>
          )}
          {influencer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{influencer.phone}</span>
            </div>
          )}
          {!influencer.email && !influencer.phone && <p className="text-xs text-muted-foreground">No contact info</p>}
        </div>
      </div>

      {/* Contract Info */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Contract</p>
        <div className="rounded-lg border p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-medium">{formatCurrency(influencer.rate)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Start</span>
            <span className="font-medium">{influencer.contractStart ? format(new Date(influencer.contractStart), "MMM d, yyyy") : "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">End</span>
            <span className="font-medium">{influencer.contractEnd ? format(new Date(influencer.contractEnd), "MMM d, yyyy") : "—"}</span>
          </div>
        </div>
      </div>

      {/* Client / Campaign */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Assignments</p>
        <div className="space-y-1.5">
          {influencer.client && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{influencer.client.name}</span>
              {influencer.client.industry && <Badge variant="outline" className="text-[10px]">{influencer.client.industry}</Badge>}
            </div>
          )}
          {influencer.campaign && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{influencer.campaign.name}</span>
            </div>
          )}
          {!influencer.client && !influencer.campaign && <p className="text-xs text-muted-foreground">No assignments</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Notes</p>
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1" onClick={editingNotes ? saveNotes : startEditing}>
            {editingNotes ? "Save" : "Edit"}
          </Button>
        </div>
        {editingNotes ? (
          <Textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)} rows={3} className="text-xs" autoFocus />
        ) : (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{displayNotes || "No notes"}</p>
        )}
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {influencer.email && (
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => window.open(`mailto:${influencer.email}`)}>
            <Mail className="h-3 w-3" /> Email
          </Button>
        )}
        {influencer.phone && (
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => window.open(`tel:${influencer.phone}`)}>
            <Phone className="h-3 w-3" /> Call
          </Button>
        )}
        <Select onValueChange={onUpdateStatus}>
          <SelectTrigger className="h-8 text-xs w-auto border shadow-none"><SelectValue placeholder="Update Status" /></SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onEdit}>
          <Edit3 className="h-3 w-3" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  )
}
