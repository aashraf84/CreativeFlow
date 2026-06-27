"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type ITAsset, type AssetIssuance, type User } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Laptop, Monitor, Keyboard, Mouse, Headphones, Usb, Camera, Cable,
  Tablet, Smartphone, Printer, Wifi, Package, Search, Plus, LayoutGrid,
  List, ArrowRightLeft, RotateCcw, Wrench, Eye, ChevronRight,
  DollarSign, AlertTriangle, CheckCircle2, Clock, Shield, Tag,
  Calendar, Building2, FileText, User as UserIcon, Hash,
  CircleDot, ArrowLeftRight, X, MoreHorizontal, Pencil, Trash2,
  TrendingDown, Activity, Timer, AlertCircle, CircleCheck, CircleX,
  CirclePause, Circle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

// ── Constants ────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Headphone", "USB/Storage", "Other"] as const
const CATEGORY_MAP: Record<string, string> = {
  Laptop: "laptop", Desktop: "desktop", Monitor: "monitor", Keyboard: "keyboard",
  Mouse: "mouse", Headphone: "headphone", "USB/Storage": "usb", Other: "other",
}
const STATUS_FILTERS = ["All", "Available", "Issued", "Maintenance", "Retired"] as const
const STATUS_MAP: Record<string, string> = {
  All: "all", Available: "available", Issued: "issued", Maintenance: "maintenance", Retired: "retired",
}

// ── Category icon mapping ────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop, desktop: Monitor, monitor: Monitor, keyboard: Keyboard,
  mouse: Mouse, headphone: Headphones, usb: Usb, webcam: Camera,
  dock: Cable, tablet: Tablet, phone: Smartphone, printer: Printer,
  router: Wifi, other: Package,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  laptop: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-600" },
  desktop: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "bg-slate-100 text-slate-600" },
  monitor: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: "bg-cyan-100 text-cyan-600" },
  keyboard: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "bg-violet-100 text-violet-600" },
  mouse: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "bg-amber-100 text-amber-600" },
  headphone: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "bg-rose-100 text-rose-600" },
  usb: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: "bg-teal-100 text-teal-600" },
  other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: "bg-gray-100 text-gray-600" },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  issued: { label: "Issued", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  maintenance: { label: "Maintenance", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200", dot: "bg-cyan-500" },
  retired: { label: "Retired", color: "text-slate-700", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-500" },
  lost: { label: "Lost", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
}

const CONDITION_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new: { label: "New", color: "text-emerald-700", dot: "bg-emerald-500" },
  good: { label: "Good", color: "text-teal-700", dot: "bg-teal-500" },
  fair: { label: "Fair", color: "text-amber-700", dot: "bg-amber-500" },
  damaged: { label: "Damaged", color: "text-red-700", dot: "bg-red-500" },
  retired: { label: "Retired", color: "text-slate-700", dot: "bg-slate-400" },
}

const ISSUANCE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  issued: { label: "Issued", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  returned: { label: "Returned", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  overdue: { label: "Overdue", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
  lost: { label: "Lost", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatCurrency(amount: number | null) {
  if (amount == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function isWarrantyExpiringSoon(expiry: string | null, days = 30): boolean {
  if (!expiry) return false
  const exp = new Date(expiry)
  const now = new Date()
  const diff = exp.getTime() - now.getTime()
  const daysLeft = diff / (1000 * 60 * 60 * 24)
  return daysLeft > 0 && daysLeft <= days
}

function isWarrantyExpired(expiry: string | null): boolean {
  if (!expiry) return false
  return new Date(expiry) < new Date()
}

function getWarrantyDaysLeft(expiry: string | null): number | null {
  if (!expiry) return null
  const diff = new Date(expiry).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function isIssuanceOverdue(issuance: AssetIssuance): boolean {
  if (issuance.status !== "issued" || !issuance.expectedReturnDate) return false
  return new Date(issuance.expectedReturnDate) < new Date()
}

function getEffectiveIssuanceStatus(issuance: AssetIssuance): string {
  if (issuance.status === "returned") return "returned"
  if (issuance.status === "lost") return "lost"
  if (isIssuanceOverdue(issuance)) return "overdue"
  return "issued"
}

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other
}

function getCategoryIcon(category: string): React.ElementType {
  return CATEGORY_ICONS[category] || Package
}

function parseSpecifications(spec: string | null): Record<string, string> | null {
  if (!spec) return null
  try {
    const parsed = JSON.parse(spec)
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>
    return null
  } catch {
    return null
  }
}

function generateAssetTag(category: string, existingAssets: ITAsset[]): string {
  const prefixMap: Record<string, string> = {
    laptop: "IT-LAP", desktop: "IT-DST", monitor: "IT-MON", keyboard: "IT-KEY",
    mouse: "IT-MOU", headphone: "IT-HDP", usb: "IT-USB", webcam: "IT-WBC",
    dock: "IT-DCK", tablet: "IT-TAB", phone: "IT-PHN", printer: "IT-PRT",
    router: "IT-RTR", other: "IT-OTH",
  }
  const prefix = prefixMap[category] || "IT-OTH"
  const existing = existingAssets.filter(a => a.assetTag.startsWith(prefix))
  const nextNum = existing.length + 1
  return `${prefix}-${String(nextNum).padStart(3, "0")}`
}

// ── Sub-components ───────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, colorClass }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; colorClass: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colorClass}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function ConditionDots({ condition }: { condition: string }) {
  const config = CONDITION_CONFIG[condition] || CONDITION_CONFIG.fair
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
            <span className={`h-2 w-2 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>Condition: {config.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function WarrantyIndicator({ expiry }: { expiry: string | null }) {
  if (!expiry) return <span className="text-xs text-muted-foreground">No warranty</span>
  const daysLeft = getWarrantyDaysLeft(expiry)
  if (daysLeft === null) return <span className="text-xs text-muted-foreground">No warranty</span>
  if (daysLeft < 0) return (
    <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
      <AlertTriangle className="h-3 w-3" /> Expired
    </span>
  )
  if (daysLeft <= 30) return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
      <AlertTriangle className="h-3 w-3" /> {daysLeft}d left
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <Shield className="h-3 w-3" /> {daysLeft}d left
    </span>
  )
}

// ── Add Asset Dialog ─────────────────────────────────────────────────
function AddAssetDialog({ open, onOpenChange, users }: {
  open: boolean; onOpenChange: (v: boolean) => void; users: User[]
}) {
  const { itAssets, setItAssets } = useERPStore()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState("laptop")
  const [specType, setSpecType] = useState<"json" | "fields">("fields")
  const [specJson, setSpecJson] = useState("")
  const [specRam, setSpecRam] = useState("")
  const [specStorage, setSpecStorage] = useState("")
  const [specCpu, setSpecCpu] = useState("")

  const autoTag = useMemo(() => generateAssetTag(category, itAssets), [category, itAssets])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    let specifications: string | null = null
    if (specType === "json" && specJson.trim()) {
      specifications = specJson.trim()
    } else if (specType === "fields") {
      const specObj: Record<string, string> = {}
      if (specRam) specObj["RAM"] = specRam
      if (specStorage) specObj["Storage"] = specStorage
      if (specCpu) specObj["CPU"] = specCpu
      if (Object.keys(specObj).length > 0) specifications = JSON.stringify(specObj)
    }

    try {
      const res = await fetch("/api/it-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTag: form.get("assetTag") || autoTag,
          name: form.get("name"),
          category,
          brand: form.get("brand") || null,
          model: form.get("model") || null,
          serialNumber: form.get("serialNumber") || null,
          specifications,
          purchaseDate: form.get("purchaseDate") || null,
          purchaseCost: form.get("purchaseCost") ? Number(form.get("purchaseCost")) : null,
          warrantyExpiry: form.get("warrantyExpiry") || null,
          vendor: form.get("vendor") || null,
          invoiceNumber: form.get("invoiceNumber") || null,
          condition: form.get("condition") || "new",
          status: "available",
          location: form.get("location") || null,
          notes: form.get("notes") || null,
        }),
      })
      if (res.ok) {
        const asset = await res.json()
        setItAssets([...itAssets, asset])
        onOpenChange(false)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" /> Add New IT Asset
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Asset Tag & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Asset Tag</Label>
              <Input name="assetTag" defaultValue={autoTag} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input name="name" required placeholder="Asset name" className="h-9" />
            </div>
          </div>
          {/* Row 2: Category, Brand, Model */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="keyboard">Keyboard</SelectItem>
                  <SelectItem value="mouse">Mouse</SelectItem>
                  <SelectItem value="headphone">Headphone</SelectItem>
                  <SelectItem value="usb">USB / Storage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Brand</Label>
              <Input name="brand" placeholder="e.g. Dell" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Model</Label>
              <Input name="model" placeholder="e.g. Latitude 5540" className="h-9" />
            </div>
          </div>
          {/* Row 3: Serial Number, Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Serial Number</Label>
              <Input name="serialNumber" placeholder="SN..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Condition</Label>
              <Select name="condition" defaultValue="new">
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Specifications */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Specifications</Label>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant={specType === "fields" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => setSpecType("fields")}>Fields</Button>
                <Button type="button" size="sm" variant={specType === "json" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => setSpecType("json")}>JSON</Button>
              </div>
            </div>
            {specType === "fields" ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">RAM</Label>
                  <Input value={specRam} onChange={e => setSpecRam(e.target.value)} placeholder="16 GB" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Storage</Label>
                  <Input value={specStorage} onChange={e => setSpecStorage(e.target.value)} placeholder="512 GB SSD" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">CPU</Label>
                  <Input value={specCpu} onChange={e => setSpecCpu(e.target.value)} placeholder="i7-13700H" className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <Textarea value={specJson} onChange={e => setSpecJson(e.target.value)} placeholder='{"RAM":"16GB","Storage":"512GB SSD"}' className="h-20 text-sm font-mono" />
            )}
          </div>
          <Separator />
          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Purchase Date</Label>
              <Input name="purchaseDate" type="date" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Purchase Cost</Label>
              <Input name="purchaseCost" type="number" step="0.01" placeholder="0.00" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vendor</Label>
              <Input name="vendor" placeholder="Vendor name" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Invoice #</Label>
              <Input name="invoiceNumber" placeholder="INV-001" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Warranty Expiry</Label>
              <Input name="warrantyExpiry" type="date" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Location</Label>
              <Input name="location" placeholder="Office / Room" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Input name="notes" placeholder="Additional notes" className="h-9" />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
            <Button type="submit" disabled={loading} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Issue Asset Dialog ───────────────────────────────────────────────
function IssueAssetDialog({ asset, open, onOpenChange, users }: {
  asset: ITAsset; open: boolean; onOpenChange: (v: boolean) => void; users: User[]
}) {
  const { itAssets, setItAssets, currentUser } = useERPStore()
  const [loading, setLoading] = useState(false)
  const [issuedToId, setIssuedToId] = useState("")
  const [purpose, setPurpose] = useState("")
  const [expectedReturn, setExpectedReturn] = useState("")
  const [notes, setNotes] = useState("")

  const handleIssue = async () => {
    if (!issuedToId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/it-assets/${asset.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuedToId,
          issuedById: currentUser?.id || "user-admin",
          purpose: purpose || null,
          expectedReturnDate: expectedReturn || null,
          notes: notes || null,
        }),
      })
      if (res.ok) {
        const issuance = await res.json()
        // Refresh the assets list
        const assetsRes = await fetch("/api/it-assets")
        const assetsJson = await assetsRes.json()
        const assetsData = assetsJson?.data || []
        setItAssets(assetsData as ITAsset[])
        onOpenChange(false)
        setIssuedToId("")
        setPurpose("")
        setExpectedReturn("")
        setNotes("")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to issue asset")
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-amber-600" /> Issue Asset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            {React.createElement(getCategoryIcon(asset.category), { className: "h-5 w-5 text-emerald-600" })}
            <div>
              <p className="text-sm font-medium">{asset.name}</p>
              <p className="text-xs text-muted-foreground">{asset.assetTag}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Issue To *</Label>
            <Select value={issuedToId} onValueChange={setIssuedToId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select user..." /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Purpose</Label>
            <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Daily work / Project / Travel..." className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Expected Return Date</Label>
            <Input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Issue Condition</Label>
            <div className="h-9 px-3 rounded-md border bg-muted/30 flex items-center text-sm text-muted-foreground">
              Current: {CONDITION_CONFIG[asset.condition]?.label || asset.condition}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." className="h-20 text-sm" />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
          <Button onClick={handleIssue} disabled={loading || !issuedToId} className="h-9 bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? "Issuing..." : "Issue Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Return Asset Dialog ──────────────────────────────────────────────
function ReturnAssetDialog({ asset, open, onOpenChange }: {
  asset: ITAsset; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const { setItAssets } = useERPStore()
  const [loading, setLoading] = useState(false)
  const [returnCondition, setReturnCondition] = useState("good")
  const [notes, setNotes] = useState("")

  const handleReturn = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/it-assets/${asset.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnCondition, notes: notes || null }),
      })
      if (res.ok) {
        // Refresh assets
        const assetsRes = await fetch("/api/it-assets")
        const assetsJson = await assetsRes.json()
        const assetsData = assetsJson?.data || []
        setItAssets(assetsData as ITAsset[])
        onOpenChange(false)
        setReturnCondition("good")
        setNotes("")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to return asset")
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-emerald-600" /> Return Asset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            {React.createElement(getCategoryIcon(asset.category), { className: "h-5 w-5 text-emerald-600" })}
            <div>
              <p className="text-sm font-medium">{asset.name}</p>
              <p className="text-xs text-muted-foreground">{asset.assetTag}</p>
            </div>
          </div>
          {asset.assignedTo && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
              <UserIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Currently issued to <strong>{asset.assignedTo.name}</strong></span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Return Condition *</Label>
            <Select value={returnCondition} onValueChange={setReturnCondition}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations on return..." className="h-20 text-sm" />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">Cancel</Button>
          <Button onClick={handleReturn} disabled={loading} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? "Processing..." : "Return Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Asset Detail Sheet ───────────────────────────────────────────────
function AssetDetailSheet({ asset, open, onOpenChange, onIssue, onReturn }: {
  asset: ITAsset | null; open: boolean; onOpenChange: (v: boolean) => void
  onIssue: () => void; onReturn: () => void
}) {
  const { setItAssets } = useERPStore()
  const [actionLoading, setActionLoading] = useState(false)

  if (!asset) return null

  const specs = parseSpecifications(asset.specifications)
  const CatIcon = getCategoryIcon(asset.category)
  const catColor = getCategoryColor(asset.category)
  const activeIssuance = asset.issuances?.find(i => i.status === "issued")
  const warrantyDays = getWarrantyDaysLeft(asset.warrantyExpiry)

  const handleMarkMaintenance = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/it-assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "maintenance" }),
      })
      if (res.ok) {
        const updated = await res.json()
        const { itAssets } = useERPStore.getState()
        setItAssets(itAssets.map(a => a.id === updated.id ? updated : a))
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetire = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/it-assets/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "retired", condition: "retired" }),
      })
      if (res.ok) {
        const updated = await res.json()
        const { itAssets } = useERPStore.getState()
        setItAssets(itAssets.map(a => a.id === updated.id ? updated : a))
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${catColor.icon}`}>
                <CatIcon className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base">{asset.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{asset.assetTag}</p>
              </div>
            </div>
            <StatusBadge status={asset.status} />
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Category</p>
              <p className={`text-sm font-medium ${catColor.text}`}>{asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Condition</p>
              <ConditionDots condition={asset.condition} />
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Brand / Model</p>
              <p className="text-sm font-medium">{asset.brand || "—"} {asset.model || ""}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Serial Number</p>
              <p className="text-sm font-mono">{asset.serialNumber || "—"}</p>
            </div>
          </div>

          {/* Specifications */}
          {specs && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Specifications</h4>
              <div className="space-y-1.5">
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                    <span className="text-xs text-muted-foreground">{key}</span>
                    <span className="text-xs font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Purchase Information</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Purchase Date</span>
                <span className="text-xs font-medium">{formatDate(asset.purchaseDate)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Cost</span>
                <span className="text-xs font-medium">{formatCurrency(asset.purchaseCost)}</span>
              </div>
              {asset.vendor && (
                <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Vendor</span>
                  <span className="text-xs font-medium">{asset.vendor}</span>
                </div>
              )}
              {asset.invoiceNumber && (
                <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="h-3 w-3" /> Invoice</span>
                  <span className="text-xs font-medium font-mono">{asset.invoiceNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warranty */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Warranty Status</h4>
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Expiry Date</span>
                <span className="text-xs font-medium">{formatDate(asset.warrantyExpiry)}</span>
              </div>
              <div className="mt-2">
                <WarrantyIndicator expiry={asset.warrantyExpiry} />
              </div>
              {warrantyDays !== null && warrantyDays > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${warrantyDays <= 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, Math.max(0, (warrantyDays / 365) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {asset.location && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Location</h4>
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-sm">{asset.location}</span>
              </div>
            </div>
          )}

          {/* Current Assignment */}
          {activeIssuance && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Assignment</h4>
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                      {getInitials(activeIssuance.issuedTo?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activeIssuance.issuedTo?.name}</p>
                    <p className="text-xs text-muted-foreground">Issued {formatDate(activeIssuance.issueDate)}</p>
                  </div>
                </div>
                {activeIssuance.purpose && (
                  <p className="mt-2 text-xs text-muted-foreground">Purpose: {activeIssuance.purpose}</p>
                )}
                {activeIssuance.expectedReturnDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expected return: {formatDate(activeIssuance.expectedReturnDate)}
                    {isIssuanceOverdue(activeIssuance) && (
                      <span className="ml-1 text-rose-600 font-medium">(Overdue)</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Issuance History Timeline */}
          {asset.issuances && asset.issuances.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Issuance History</h4>
              <div className="relative space-y-0">
                {asset.issuances.map((issuance, idx) => {
                  const effectiveStatus = getEffectiveIssuanceStatus(issuance)
                  const issConfig = ISSUANCE_STATUS_CONFIG[effectiveStatus] || ISSUANCE_STATUS_CONFIG.issued
                  const isLast = idx === asset.issuances.length - 1
                  return (
                    <div key={issuance.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full border-2 mt-1 ${effectiveStatus === "returned" ? "border-emerald-400 bg-emerald-100" : effectiveStatus === "overdue" ? "border-rose-400 bg-rose-100" : "border-amber-400 bg-amber-100"}`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-muted my-1" />}
                      </div>
                      <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{issuance.issuedTo?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              Issued {formatDate(issuance.issueDate)} by {issuance.issuedBy?.name || "Unknown"}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${issConfig.bg} ${issConfig.color}`}>
                            {issConfig.label}
                          </span>
                        </div>
                        {issuance.actualReturnDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">Returned {formatDate(issuance.actualReturnDate)}</p>
                        )}
                        {issuance.purpose && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">{issuance.purpose}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">{asset.notes}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {asset.status === "available" && (
              <Button onClick={onIssue} className="h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs" disabled={actionLoading}>
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Issue Asset
              </Button>
            )}
            {asset.status === "issued" && (
              <Button onClick={onReturn} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" disabled={actionLoading}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Return Asset
              </Button>
            )}
            {asset.status !== "maintenance" && asset.status !== "retired" && (
              <Button variant="outline" onClick={handleMarkMaintenance} className="h-9 text-xs" disabled={actionLoading}>
                <Wrench className="h-3.5 w-3.5 mr-1.5" /> Mark Maintenance
              </Button>
            )}
            {asset.status !== "retired" && (
              <Button variant="outline" onClick={handleRetire} className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" disabled={actionLoading}>
                <CirclePause className="h-3.5 w-3.5 mr-1.5" /> Retire
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Asset Card ───────────────────────────────────────────────────────
function AssetCard({ asset, onClick, onIssue, onReturn }: {
  asset: ITAsset; onClick: () => void; onIssue: () => void; onReturn: () => void
}) {
  const catIcon = getCategoryIcon(asset.category)
  const catColor = getCategoryColor(asset.category)

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="group cursor-pointer border hover:shadow-lg transition-all duration-200 hover:border-emerald-200 relative overflow-hidden"
        onClick={onClick}
      >
        {/* Top color bar */}
        <div className={`h-1 ${catColor.dot || catColor.bg}`} style={{ background: asset.category === "laptop" ? "#10b981" : asset.category === "desktop" ? "#64748b" : asset.category === "monitor" ? "#06b6d4" : asset.category === "keyboard" ? "#8b5cf6" : asset.category === "mouse" ? "#f59e0b" : asset.category === "headphone" ? "#f43f5e" : asset.category === "usb" ? "#14b8a6" : "#9ca3af" }} />
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Category Icon */}
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${catColor.icon}`}>
              {React.createElement(catIcon, { className: "h-5 w-5" })}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{asset.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{asset.assetTag}</p>
                </div>
                <StatusBadge status={asset.status} />
              </div>

              {(asset.brand || asset.model) && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {asset.brand}{asset.brand && asset.model ? " • " : ""}{asset.model}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <ConditionDots condition={asset.condition} />
                {asset.purchaseCost != null && (
                  <span className="text-xs font-medium text-muted-foreground">{formatCurrency(asset.purchaseCost)}</span>
                )}
              </div>

              {/* Assigned user */}
              {asset.assignedTo && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-amber-100 text-amber-700">
                      {getInitials(asset.assignedTo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{asset.assignedTo.name}</span>
                </div>
              )}

              {/* Warranty indicator */}
              {(isWarrantyExpiringSoon(asset.warrantyExpiry) || isWarrantyExpired(asset.warrantyExpiry)) && (
                <div className="mt-2">
                  <WarrantyIndicator expiry={asset.warrantyExpiry} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
            {asset.status === "available" && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={e => { e.stopPropagation(); onIssue() }}>
                <ArrowRightLeft className="h-3 w-3" /> Issue
              </Button>
            )}
            {asset.status === "issued" && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={e => { e.stopPropagation(); onReturn() }}>
                <RotateCcw className="h-3 w-3" /> Return
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); onClick() }}>
              <Eye className="h-3 w-3" /> View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Asset Row (list view) ────────────────────────────────────────────
function AssetRow({ asset, onClick, onIssue, onReturn }: {
  asset: ITAsset; onClick: () => void; onIssue: () => void; onReturn: () => void
}) {
  const catIcon = getCategoryIcon(asset.category)
  const catColor = getCategoryColor(asset.category)

  return (
    <motion.div variants={itemVariants}>
      <div
        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 hover:border-emerald-200 cursor-pointer transition-all group"
        onClick={onClick}
      >
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${catColor.icon}`}>
          {React.createElement(catIcon, { className: "h-4 w-4" })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{asset.name}</p>
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{asset.assetTag}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {asset.brand}{asset.brand && asset.model ? " • " : ""}{asset.model}
            {asset.serialNumber ? ` • SN: ${asset.serialNumber}` : ""}
          </p>
        </div>
        <StatusBadge status={asset.status} />
        <ConditionDots condition={asset.condition} />
        {asset.assignedTo ? (
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-amber-100 text-amber-700">{getInitials(asset.assignedTo.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate">{asset.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground min-w-[100px]">Unassigned</span>
        )}
        <span className="text-xs font-medium min-w-[80px] text-right">{formatCurrency(asset.purchaseCost)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {asset.status === "available" && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600" onClick={e => { e.stopPropagation(); onIssue() }}>
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </Button>
          )}
          {asset.status === "issued" && (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={e => { e.stopPropagation(); onReturn() }}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); onClick() }}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export function ITAssetsView() {
  const { itAssets, assetIssuances, employees, setItAssets, setAssetIssuances } = useERPStore()

  // State
  const [categoryTab, setCategoryTab] = useState("All")
  const [mainTab, setMainTab] = useState("inventory")
  const [statusFilter, setStatusFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedAsset, setSelectedAsset] = useState<ITAsset | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [issueAsset, setIssueAsset] = useState<ITAsset | null>(null)
  const [returnAsset, setReturnAsset] = useState<ITAsset | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [issuanceStatusFilter, setIssuanceStatusFilter] = useState("all")

  // Merge users from both store sources
  const allUsers = useMemo(() => {
    const userMap = new Map<string, User>()
    employees.forEach(e => {
      if (e.user) userMap.set(e.user.id, e.user)
    })
    return Array.from(userMap.values())
  }, [employees])

  // KPI computations
  const kpis = useMemo(() => {
    const total = itAssets.length
    const available = itAssets.filter(a => a.status === "available").length
    const issued = itAssets.filter(a => a.status === "issued").length
    const maintenance = itAssets.filter(a => a.status === "maintenance").length
    const totalValue = itAssets.reduce((s, a) => s + (a.purchaseCost || 0), 0)
    const warrantyExpiring = itAssets.filter(a => isWarrantyExpiringSoon(a.warrantyExpiry)).length
    return { total, available, issued, maintenance, totalValue, warrantyExpiring }
  }, [itAssets])

  // Filter assets
  const filteredAssets = useMemo(() => {
    let result = itAssets
    if (categoryTab !== "All") {
      const catValue = CATEGORY_MAP[categoryTab]
      if (catValue) result = result.filter(a => a.category === catValue)
    }
    if (statusFilter !== "All") {
      const statusValue = STATUS_MAP[statusFilter]
      if (statusValue) result = result.filter(a => a.status === statusValue)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.assetTag.toLowerCase().includes(q) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
        (a.brand && a.brand.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q))
      )
    }
    return result
  }, [itAssets, categoryTab, statusFilter, search])

  // Filter issuances
  const filteredIssuances = useMemo(() => {
    let result = assetIssuances
    if (issuanceStatusFilter !== "all") {
      result = result.filter(i => getEffectiveIssuanceStatus(i) === issuanceStatusFilter)
    }
    return result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
  }, [assetIssuances, issuanceStatusFilter])

  // Handlers
  const openDetail = useCallback((asset: ITAsset) => {
    setSelectedAsset(asset)
    setDetailOpen(true)
  }, [])

  const openIssue = useCallback((asset: ITAsset) => {
    setIssueAsset(asset)
  }, [])

  const openReturn = useCallback((asset: ITAsset) => {
    setReturnAsset(asset)
  }, [])

  // Refresh data helper
  const refreshData = useCallback(async () => {
    try {
      const [assetsRes, issuancesRes] = await Promise.all([
        fetch("/api/it-assets"),
        fetch("/api/asset-issuances"),
      ])
      const [assetsJson, issuancesJson] = await Promise.all([assetsRes.json(), issuancesRes.json()])
      const assetsData = assetsJson?.data || []
      const issuancesData = issuancesJson?.data || []
      setItAssets(assetsData as ITAsset[])
      setAssetIssuances(issuancesData as AssetIssuance[])
    } catch {
      // silent
    }
  }, [setItAssets, setAssetIssuances])

  // Update selected asset when itAssets changes
  React.useEffect(() => {
    if (selectedAsset) {
      const updated = itAssets.find(a => a.id === selectedAsset.id)
      if (updated) setSelectedAsset(updated)
    }
  }, [itAssets, selectedAsset])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">IT Asset Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track, issue, and manage your organization&apos;s IT assets</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5">
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        </div>

        {/* KPI Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <KPICard icon={Package} label="Total Assets" value={kpis.total} colorClass="bg-emerald-100 text-emerald-600" />
          <KPICard icon={CheckCircle2} label="Available" value={kpis.available} sub="Ready to issue" colorClass="bg-teal-100 text-teal-600" />
          <KPICard icon={ArrowRightLeft} label="Issued" value={kpis.issued} sub="In use" colorClass="bg-amber-100 text-amber-600" />
          <KPICard icon={Wrench} label="In Maintenance" value={kpis.maintenance} colorClass="bg-cyan-100 text-cyan-600" />
          <KPICard icon={DollarSign} label="Total Value" value={formatCurrency(kpis.totalValue)} colorClass="bg-emerald-100 text-emerald-600" />
          <KPICard icon={AlertTriangle} label="Warranty Expiring" value={kpis.warrantyExpiring} sub="Within 30 days" colorClass="bg-rose-100 text-rose-600" />
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={categoryTab === cat ? "default" : "ghost"}
              className={`h-8 text-xs whitespace-nowrap shrink-0 ${categoryTab === cat ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              onClick={() => setCategoryTab(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="px-6 pb-2">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="h-9">
            <TabsTrigger value="inventory" className="text-xs px-4">Asset Inventory</TabsTrigger>
            <TabsTrigger value="issuances" className="text-xs px-4">Issuance Records</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {mainTab === "inventory" ? (
          <div className="space-y-4">
            {/* Search & Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, asset tag, serial number..."
                  className="pl-9 h-9"
                />
                {search && (
                  <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearch("")}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {STATUS_FILTERS.map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={statusFilter === s ? "default" : "outline"}
                      className={`h-8 text-xs ${statusFilter === s ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-1 border rounded-md p-0.5">
                  <Button size="sm" variant={viewMode === "grid" ? "default" : "ghost"} className={`h-7 w-7 p-0 ${viewMode === "grid" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`} onClick={() => setViewMode("grid")}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} className={`h-7 w-7 p-0 ${viewMode === "list" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`} onClick={() => setViewMode("list")}>
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {filteredAssets.length} of {itAssets.length} assets
                {categoryTab !== "All" && ` in ${categoryTab}`}
                {statusFilter !== "All" && ` • ${statusFilter}`}
              </p>
            </div>

            {/* Asset Grid / List */}
            {filteredAssets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No assets found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search ? "Try adjusting your search or filters" : "Add your first IT asset to get started"}
                  </p>
                  {!search && (
                    <Button onClick={() => setAddOpen(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Asset
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key="grid"
              >
                {filteredAssets.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => openDetail(asset)}
                    onIssue={() => openIssue(asset)}
                    onReturn={() => openReturn(asset)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="space-y-1.5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key="list"
              >
                {/* List Header */}
                <div className="flex items-center gap-4 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <div className="w-9" />
                  <div className="flex-1">Asset</div>
                  <div className="w-24">Status</div>
                  <div className="w-16">Condition</div>
                  <div className="w-28">Assigned To</div>
                  <div className="w-20 text-right">Value</div>
                  <div className="w-16" />
                </div>
                {filteredAssets.map(asset => (
                  <AssetRow
                    key={asset.id}
                    asset={asset}
                    onClick={() => openDetail(asset)}
                    onIssue={() => openIssue(asset)}
                    onReturn={() => openReturn(asset)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          /* Issuance Records Tab */
          <div className="space-y-4">
            {/* Issuance Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filter:</span>
              <div className="flex items-center gap-1">
                {[
                  { key: "all", label: "All" },
                  { key: "issued", label: "Issued" },
                  { key: "returned", label: "Returned" },
                  { key: "overdue", label: "Overdue" },
                ].map(f => (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={issuanceStatusFilter === f.key ? "default" : "outline"}
                    className={`h-7 text-xs ${issuanceStatusFilter === f.key ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                    onClick={() => setIssuanceStatusFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">{filteredIssuances.length} records</span>
            </div>

            {filteredIssuances.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No issuance records found</p>
                  <p className="text-xs text-muted-foreground mt-1">Issue an asset to create the first record</p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Asset</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Issued To</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Issued By</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Issue Date</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Expected Return</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Actual Return</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssuances.map((issuance, idx) => {
                        const effectiveStatus = getEffectiveIssuanceStatus(issuance)
                        const issConfig = ISSUANCE_STATUS_CONFIG[effectiveStatus] || ISSUANCE_STATUS_CONFIG.issued
                        const asset = issuance.asset
                        const CatIcon = asset ? getCategoryIcon(asset.category) : Package
                        return (
                          <tr
                            key={issuance.id}
                            className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${effectiveStatus === "overdue" ? "bg-rose-50/50" : ""}`}
                          >
                            <td className="py-3 px-4">
                              {asset ? (
                                <div className="flex items-center gap-2">
                                  <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${getCategoryColor(asset.category).icon}`}>
                                    <CatIcon className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium">{asset.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{asset.assetTag}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Unknown asset</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {issuance.issuedTo ? (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[8px]">{getInitials(issuance.issuedTo.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{issuance.issuedTo.name}</span>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-muted-foreground">{issuance.issuedBy?.name || "—"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs">{formatDate(issuance.issueDate)}</span>
                            </td>
                            <td className="py-3 px-4">
                              {issuance.expectedReturnDate ? (
                                <span className={`text-xs ${effectiveStatus === "overdue" ? "text-rose-600 font-medium" : ""}`}>
                                  {formatDate(issuance.expectedReturnDate)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs">{formatDate(issuance.actualReturnDate)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${issConfig.bg} ${issConfig.color}`}>
                                {issConfig.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {effectiveStatus === "issued" || effectiveStatus === "overdue" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    if (asset) {
                                      openReturn(asset)
                                    }
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" /> Return
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    if (asset) openDetail(asset)
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <AssetDetailSheet
        asset={selectedAsset}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onIssue={() => {
          setDetailOpen(false)
          if (selectedAsset) openIssue(selectedAsset)
        }}
        onReturn={() => {
          setDetailOpen(false)
          if (selectedAsset) openReturn(selectedAsset)
        }}
      />

      {/* Issue Dialog */}
      {issueAsset && (
        <IssueAssetDialog
          asset={issueAsset}
          open={!!issueAsset}
          onOpenChange={(v) => { if (!v) setIssueAsset(null) }}
          users={allUsers}
        />
      )}

      {/* Return Dialog */}
      {returnAsset && (
        <ReturnAssetDialog
          asset={returnAsset}
          open={!!returnAsset}
          onOpenChange={(v) => { if (!v) setReturnAsset(null) }}
        />
      )}

      {/* Add Asset Dialog */}
      <AddAssetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        users={allUsers}
      />
    </div>
  )
}
