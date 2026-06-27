"use client"

import React, { useState, useMemo } from "react"
import { useERPStore, type Asset } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image as ImageIcon,
  Video,
  FileText,
  Palette,
  Type,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  Filter,
  Upload,
  Download,
  Edit3,
  Trash2,
  MoreHorizontal,
  X,
  ChevronRight,
  ChevronDown,
  HardDrive,
  LayoutTemplate,
  BookOpen,
  Eye,
  Tag,
  User,
  Calendar,
  File,
  Link2,
  Folder,
  Plus,
  CheckCircle2,
} from "lucide-react"

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
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

// ── Type config ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  image: { label: "Image", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: ImageIcon },
  video: { label: "Video", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", icon: Video },
  document: { label: "Document", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: FileText },
  template: { label: "Template", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: LayoutTemplate },
  font: { label: "Font", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", icon: Type },
  "brand-guide": { label: "Brand Guide", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", icon: BookOpen },
}

const PLACEHOLDER_COLORS: Record<string, string[]> = {
  image: ["#10b981", "#059669", "#047857"],
  video: ["#f43f5e", "#e11d48", "#be123c"],
  document: ["#f59e0b", "#d97706", "#b45309"],
  template: ["#8b5cf6", "#7c3aed", "#6d28d9"],
  font: ["#06b6d4", "#0891b2", "#0e7490"],
  "brand-guide": ["#14b8a6", "#0d9488", "#0f766e"],
}

// ── Folder config ───────────────────────────────────────────────────
interface FolderItem {
  id: string
  label: string
  icon: React.ElementType
  type?: string
  isClientFolder?: boolean
}

const SYSTEM_FOLDERS: FolderItem[] = [
  { id: "all", label: "All Assets", icon: FolderOpen },
  { id: "image", label: "Images", icon: ImageIcon, type: "image" },
  { id: "video", label: "Videos", icon: Video, type: "video" },
  { id: "document", label: "Documents", icon: FileText, type: "document" },
  { id: "template", label: "Templates", icon: LayoutTemplate, type: "template" },
  { id: "brand-guide", label: "Brand Guides", icon: BookOpen, type: "brand-guide" },
  { id: "font", label: "Fonts", icon: Type, type: "font" },
]

// ── Format helpers ──────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Main Component ──────────────────────────────────────────────────
export function AssetsView() {
  const { assets, clients, setAssets } = useERPStore()

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFolder, setSelectedFolder] = useState("all")
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  // Upload dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadType, setUploadType] = useState("image")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadClientId, setUploadClientId] = useState("")

  // Edit tags dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editAssetId, setEditAssetId] = useState<string | null>(null)
  const [editTags, setEditTags] = useState("")
  const [editClientId, setEditClientId] = useState("")

  // Client folders expanded
  const [clientFoldersExpanded, setClientFoldersExpanded] = useState(true)

  // ── Computed ───────────────────────────────────────────────────────
  const selectedAsset = useMemo(() => assets.find((a) => a.id === selectedAssetId) || null, [assets, selectedAssetId])

  const clientFolders = useMemo(() => {
    const folders: { clientId: string; clientName: string; count: number }[] = []
    clients.forEach((c) => {
      const count = assets.filter((a) => a.clientId === c.id).length
      if (count > 0) folders.push({ clientId: c.id, clientName: c.name, count })
    })
    return folders
  }, [clients, assets])

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      // Folder filter
      if (selectedFolder !== "all" && selectedFolder.startsWith("client-")) {
        const clientId = selectedFolder.replace("client-", "")
        if (a.clientId !== clientId) return false
      } else if (selectedFolder !== "all") {
        if (a.type !== selectedFolder) return false
      }

      // Type filter
      if (typeFilter !== "all" && a.type !== typeFilter) return false

      // Client filter
      if (clientFilter !== "all" && a.clientId !== clientFilter) return false

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = a.name.toLowerCase().includes(q)
        const matchesTags = a.tags?.toLowerCase().includes(q) ?? false
        const matchesClient = a.client?.name.toLowerCase().includes(q) ?? false
        if (!matchesName && !matchesTags && !matchesClient) return false
      }

      return true
    })
  }, [assets, selectedFolder, typeFilter, clientFilter, searchQuery])

  // Stats
  const totalAssets = assets.length
  const imageCount = assets.filter((a) => a.type === "image").length
  const videoCount = assets.filter((a) => a.type === "video").length
  const templateCount = assets.filter((a) => a.type === "template").length
  const totalStorage = assets.reduce((sum, a) => sum + a.size, 0)

  // ── Handlers ───────────────────────────────────────────────────────
  const handleDeleteAsset = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" })
      if (res.ok) {
        setAssets(assets.filter((a) => a.id !== assetId))
        if (selectedAssetId === assetId) setSelectedAssetId(null)
      }
    } catch (error) {
      console.error("Failed to delete asset:", error)
    }
  }

  const handleUploadAsset = async () => {
    if (!uploadName) return
    const body = {
      name: uploadName,
      type: uploadType,
      url: `/uploads/${uploadName.toLowerCase().replace(/\s+/g, "-")}`,
      thumbnailUrl: null,
      size: Math.floor(Math.random() * 5000000) + 100000,
      mimeType: `${uploadType}/${uploadType === "image" ? "png" : uploadType === "video" ? "mp4" : "pdf"}`,
      tags: uploadTags || null,
      folder: uploadType,
      uploadedById: "user-admin",
      clientId: uploadClientId || null,
    }
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setAssets([data.asset, ...assets])
        resetUploadForm()
        setShowUploadDialog(false)
      }
    } catch (error) {
      console.error("Failed to upload asset:", error)
    }
  }

  const handleUpdateAsset = async () => {
    if (!editAssetId) return
    try {
      const res = await fetch(`/api/assets/${editAssetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: editTags || null,
          clientId: editClientId || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAssets(assets.map((a) => (a.id === editAssetId ? data.asset : a)))
        setShowEditDialog(false)
        setEditAssetId(null)
      }
    } catch (error) {
      console.error("Failed to update asset:", error)
    }
  }

  const resetUploadForm = () => {
    setUploadName("")
    setUploadType("image")
    setUploadTags("")
    setUploadClientId("")
  }

  const openEditDialog = (asset: Asset) => {
    setEditAssetId(asset.id)
    setEditTags(asset.tags || "")
    setEditClientId(asset.clientId || "")
    setShowEditDialog(true)
  }

  // ── Render Asset Placeholder ───────────────────────────────────────
  const renderPlaceholder = (asset: Asset) => {
    const colors = PLACEHOLDER_COLORS[asset.type] || PLACEHOLDER_COLORS.document
    const cfg = TYPE_CONFIG[asset.type] || TYPE_CONFIG.document
    const Icon = cfg.icon

    return (
      <div
        className="w-full aspect-square rounded-t-lg flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }}
      >
        <Icon className="h-10 w-10 text-white/80" />
        <div className="absolute bottom-2 right-2">
          <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} text-[10px] px-1.5 py-0`}>
            {cfg.label}
          </Badge>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1 flex flex-col">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="p-4 md:p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Digital Asset Library</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage, organize, and share your creative assets</p>
            </div>
            <Button
              onClick={() => { resetUploadForm(); setShowUploadDialog(true) }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Upload className="h-4 w-4" /> Upload Asset
            </Button>
          </div>
        </motion.div>

        {/* ── Top Stats ───────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="px-4 md:px-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Assets</p>
                <p className="text-xl font-bold mt-0.5">{totalAssets}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-400">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images</p>
                </div>
                <p className="text-xl font-bold mt-0.5">{imageCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-400">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-rose-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Videos</p>
                </div>
                <p className="text-xl font-bold mt-0.5">{videoCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-400">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5 text-violet-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates</p>
                </div>
                <p className="text-xl font-bold mt-0.5">{templateCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-400 col-span-2 sm:col-span-1">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-teal-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Storage</p>
                </div>
                <p className="text-xl font-bold mt-0.5">{formatFileSize(totalStorage)}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Main Content Area ───────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex-1 flex gap-0 mt-4 min-h-0">
          {/* ── Left Sidebar ────────────────────────────────────────────── */}
          <div className={`border-r bg-muted/20 transition-all duration-200 ${sidebarCollapsed ? "w-12" : "w-56"} shrink-0 hidden md:block`}>
            <div className="p-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
              </Button>
            </div>

            {!sidebarCollapsed && (
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="px-2 space-y-1">
                  {SYSTEM_FOLDERS.map((folder) => {
                    const Icon = folder.icon
                    const isActive = selectedFolder === folder.id
                    const count = folder.type
                      ? assets.filter((a) => a.type === folder.type).length
                      : totalAssets

                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{folder.label}</span>
                        <span className="text-xs opacity-60">{count}</span>
                      </button>
                    )
                  })}

                  {/* Client Folders */}
                  {clientFolders.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <button
                        onClick={() => setClientFoldersExpanded(!clientFoldersExpanded)}
                        className="w-full flex items-center gap-2 px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {clientFoldersExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        Client Folders
                      </button>

                      <AnimatePresence>
                        {clientFoldersExpanded && clientFolders.map((cf) => {
                          const isActive = selectedFolder === `client-${cf.clientId}`
                          return (
                            <motion.button
                              key={cf.clientId}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              onClick={() => setSelectedFolder(`client-${cf.clientId}`)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 font-medium"
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              }`}
                            >
                              <Folder className="h-4 w-4 shrink-0" />
                              <span className="flex-1 text-left truncate">{cf.clientName}</span>
                              <span className="text-xs opacity-60">{cf.count}</span>
                            </motion.button>
                          )
                        })}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* ── Center: Search + Assets ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col p-4 md:p-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="template">Templates</SelectItem>
                    <SelectItem value="font">Fonts</SelectItem>
                    <SelectItem value="brand-guide">Brand Guides</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Drop Zone (visual) */}
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 mb-4 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
              onClick={() => { resetUploadForm(); setShowUploadDialog(true) }}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mt-2">Drag & drop files here or <span className="text-emerald-600 font-medium">browse</span></p>
              <p className="text-xs text-muted-foreground/60 mt-1">Supports images, videos, documents, templates, fonts</p>
            </div>

            {/* Assets Grid/List */}
            {filteredAssets.length === 0 ? (
              <Card className="flex-1">
                <CardContent className="py-16 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p className="text-muted-foreground mt-4 font-medium">No assets found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {assets.length === 0 ? "Upload your first asset to get started" : "Try adjusting your filters"}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredAssets.map((asset, index) => {
                      const cfg = TYPE_CONFIG[asset.type] || TYPE_CONFIG.document
                      const tags = asset.tags ? asset.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
                      const isSelected = selectedAssetId === asset.id

                      return (
                        <motion.div
                          key={asset.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              isSelected ? "ring-2 ring-emerald-500 shadow-lg" : ""
                            }`}
                            onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                          >
                            {renderPlaceholder(asset)}
                            <CardContent className="p-3 space-y-1.5">
                              <p className="text-sm font-medium truncate">{asset.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</span>
                                <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-[10px] px-1.5 py-0`}>
                                  {cfg.label}
                                </Badge>
                              </div>
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                  {tags.length > 3 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      +{tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                              {asset.client && (
                                <p className="text-[10px] text-muted-foreground truncate">{asset.client.name}</p>
                              )}
                              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-muted-foreground">{formatDate(asset.createdAt)}</span>
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(asset)}>
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => handleDeleteAsset(asset.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            ) : (
              /* List View */
              <ScrollArea className="flex-1">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium hidden sm:table-cell">Type</th>
                        <th className="text-left p-3 font-medium hidden md:table-cell">Size</th>
                        <th className="text-left p-3 font-medium hidden lg:table-cell">Client</th>
                        <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => {
                        const cfg = TYPE_CONFIG[asset.type] || TYPE_CONFIG.document
                        const Icon = cfg.icon
                        const isSelected = selectedAssetId === asset.id

                        return (
                          <tr
                            key={asset.id}
                            className={`border-t hover:bg-muted/30 transition-colors cursor-pointer ${
                              isSelected ? "bg-emerald-50/50" : ""
                            }`}
                            onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded flex items-center justify-center ${cfg.bg}`}>
                                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                                </div>
                                <span className="font-medium truncate max-w-[200px]">{asset.name}</span>
                              </div>
                            </td>
                            <td className="p-3 hidden sm:table-cell">
                              <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-xs`}>
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground hidden md:table-cell">{formatFileSize(asset.size)}</td>
                            <td className="p-3 text-muted-foreground hidden lg:table-cell">{asset.client?.name || "—"}</td>
                            <td className="p-3 text-muted-foreground hidden lg:table-cell">{formatDate(asset.createdAt)}</td>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedAssetId(asset.id)}>
                                    <Eye className="h-4 w-4 mr-2" />View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(asset)}>
                                    <Edit3 className="h-4 w-4 mr-2" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteAsset(asset.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* ── Right Detail Panel ──────────────────────────────────────── */}
          <AnimatePresence>
            {selectedAsset && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l bg-muted/10 shrink-0 overflow-hidden hidden lg:block"
              >
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="p-4 space-y-4">
                    {/* Close button */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Asset Details</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedAssetId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Large Preview */}
                    <div className="rounded-lg overflow-hidden">
                      {renderPlaceholder(selectedAsset)}
                    </div>

                    {/* File Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm truncate">{selectedAsset.name}</h4>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline" className={`${TYPE_CONFIG[selectedAsset.type]?.bg || ""} ${TYPE_CONFIG[selectedAsset.type]?.color || ""} ${TYPE_CONFIG[selectedAsset.type]?.border || ""} text-xs`}>
                            {TYPE_CONFIG[selectedAsset.type]?.label || selectedAsset.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Size:</span>
                          <span>{formatFileSize(selectedAsset.size)}</span>
                        </div>

                        {selectedAsset.mimeType && (
                          <div className="flex items-center gap-2 text-sm">
                            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">MIME:</span>
                            <span className="truncate">{selectedAsset.mimeType}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Uploaded by:</span>
                          <span>{selectedAsset.uploadedBy.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">Date:</span>
                          <span>{formatDate(selectedAsset.createdAt)}</span>
                        </div>

                        {selectedAsset.client && (
                          <div className="flex items-center gap-2 text-sm">
                            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Client:</span>
                            <span>{selectedAsset.client.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
                        </div>
                        {selectedAsset.tags ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedAsset.tags.split(",").map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60">No tags</p>
                        )}
                      </div>

                      {/* Metadata */}
                      {selectedAsset.metadata && (() => {
                        try {
                          const meta = JSON.parse(selectedAsset.metadata)
                          return (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</span>
                              <div className="mt-1 space-y-1">
                                {meta.width && meta.height && (
                                  <p className="text-xs text-muted-foreground">
                                    Dimensions: {meta.width} × {meta.height}
                                  </p>
                                )}
                                {meta.duration && (
                                  <p className="text-xs text-muted-foreground">
                                    Duration: {meta.duration}s
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        } catch { return null }
                      })()}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => openEditDialog(selectedAsset)}
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                        onClick={() => handleDeleteAsset(selectedAsset.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Asset
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ── Upload Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" /> Upload Asset
            </DialogTitle>
            <DialogDescription>Add a new asset to your library</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Asset Name *</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g., Hero Banner Image"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="font">Font</SelectItem>
                  <SelectItem value="brand-guide">Brand Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="e.g., social, banner, summer"
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to Client (optional)</Label>
              <Select value={uploadClientId} onValueChange={setUploadClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="No client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual drop zone in dialog */}
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mt-2">Click to select files</p>
              <p className="text-xs text-muted-foreground/60 mt-1">or drag and drop</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadAsset} disabled={!uploadName} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Asset Dialog ──────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-600" /> Edit Asset
            </DialogTitle>
            <DialogDescription>Update tags and client assignment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="e.g., social, banner, summer"
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to Client</Label>
              <Select value={editClientId} onValueChange={setEditClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="No client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateAsset} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
