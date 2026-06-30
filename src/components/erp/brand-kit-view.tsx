"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useERPStore, type BrandKit, type Client } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import {
  Palette,
  Type,
  ImageIcon,
  MessageSquare,
  FileText,
  Plus,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  Edit3,
  Search,
  ChevronDown,
  SwatchBook,
  Bold,
  Italic,
  Underline,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  Globe,
  Hash,
  GripVertical,
  FolderOpen,
  Lightbulb,
} from "lucide-react"
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

// ── Color group helpers ──
type ColorGroup = "primary" | "secondary" | "accent" | "neutral"

interface ColorItem {
  name: string
  hex: string
  group: ColorGroup
}

function parseColorValue(value: string): ColorItem | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed.hex && parsed.name) return parsed as ColorItem
    return null
  } catch {
    return null
  }
}

interface FontItem {
  name: string
  category: "heading" | "body" | "accent"
  weights: number[]
  sample: string
}

function parseFontValue(value: string): FontItem | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed.name) return parsed as FontItem
    return null
  } catch {
    return null
  }
}

interface LogoItem {
  name: string
  variant: "primary" | "secondary" | "icon" | "monochrome"
  url: string
  background: "light" | "dark"
}

function parseLogoValue(value: string): LogoItem | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed.name) return parsed as LogoItem
    return null
  } catch {
    return null
  }
}

interface VoiceItem {
  description: string
  dos: string[]
  donts: string[]
  taglines: string[]
}

function parseVoiceValue(value: string): VoiceItem | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed.description) return parsed as VoiceItem
    return null
  } catch {
    return null
  }
}

interface GuidelineItem {
  title: string
  description: string
  documentType: string
  url: string
}

function parseGuidelineValue(value: string): GuidelineItem | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed.title) return parsed as GuidelineItem
    return null
  } catch {
    return null
  }
}

// ── Main Component ──
export function BrandKitView() {
  const { brandKits, clients, setBrandKits } = useERPStore()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("colors")
  const [selectedClientId, setSelectedClientId] = useState<string>("organization")
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [showAddColor, setShowAddColor] = useState(false)
  const [showAddFont, setShowAddFont] = useState(false)
  const [showAddLogo, setShowAddLogo] = useState(false)
  const [showAddVoice, setShowAddVoice] = useState(false)
  const [showAddGuideline, setShowAddGuideline] = useState(false)
  const [showEditItem, setShowEditItem] = useState<BrandKit | null>(null)

  // Filter brand kits by client
  const filteredKits = useMemo(() => {
    if (selectedClientId === "organization") {
      return brandKits.filter(bk => !bk.clientId)
    }
    return brandKits.filter(bk => bk.clientId === selectedClientId)
  }, [brandKits, selectedClientId])

  // Group by type
  const colorItems = useMemo(() =>
    filteredKits.filter(bk => bk.type === "color").map(bk => ({ ...bk, parsed: parseColorValue(bk.value) })),
    [filteredKits]
  )
  const fontItems = useMemo(() =>
    filteredKits.filter(bk => bk.type === "typography").map(bk => ({ ...bk, parsed: parseFontValue(bk.value) })),
    [filteredKits]
  )
  const logoItems = useMemo(() =>
    filteredKits.filter(bk => bk.type === "logo").map(bk => ({ ...bk, parsed: parseLogoValue(bk.value) })),
    [filteredKits]
  )
  const voiceItems = useMemo(() =>
    filteredKits.filter(bk => bk.type === "voice").map(bk => ({ ...bk, parsed: parseVoiceValue(bk.value) })),
    [filteredKits]
  )
  const guidelineItems = useMemo(() =>
    filteredKits.filter(bk => bk.type === "guidelines").map(bk => ({ ...bk, parsed: parseGuidelineValue(bk.value) })),
    [filteredKits]
  )

  // Group colors by category
  const colorsByGroup = useMemo(() => {
    const groups: Record<ColorGroup, typeof colorItems> = { primary: [], secondary: [], accent: [], neutral: [] }
    colorItems.forEach(item => {
      if (item.parsed?.group && groups[item.parsed.group]) {
        groups[item.parsed.group].push(item)
      } else {
        groups.primary.push(item)
      }
    })
    return groups
  }, [colorItems])

  // API helpers
  const createBrandKit = useCallback(async (data: { name: string; type: string; value: string; clientId?: string }) => {
    try {
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          clientId: selectedClientId === "organization" ? null : selectedClientId,
        }),
      })
      const json = await res.json()
      if (json.brandKit) {
        setBrandKits([...brandKits, json.brandKit])
        toast({ title: "Brand kit item added", description: `${data.name} has been added successfully.` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add brand kit item.", variant: "destructive" })
    }
  }, [brandKits, selectedClientId, setBrandKits, toast])

  const deleteBrandKit = useCallback(async (id: string) => {
    try {
      await fetch(`/api/brand-kit/${id}`, { method: "DELETE" })
      setBrandKits(brandKits.filter(bk => bk.id !== id))
      toast({ title: "Item removed", description: "Brand kit item has been deleted." })
    } catch {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" })
    }
  }, [brandKits, setBrandKits, toast])

  const updateBrandKit = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/brand-kit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.brandKit) {
        setBrandKits(brandKits.map(bk => bk.id === id ? json.brandKit : bk))
        toast({ title: "Item updated", description: "Brand kit item has been updated." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update item.", variant: "destructive" })
    }
  }, [brandKits, setBrandKits, toast])

  const selectedClient = useMemo(() =>
    selectedClientId === "organization" ? null : clients.find(c => c.id === selectedClientId),
    [selectedClientId, clients]
  )

  return (
    <motion.div className="p-4 lg:p-6 space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Brand Kit</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage brand guidelines, colors, typography, and assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="organization">
                <span className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> Organization
                </span>
              </SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Client Banner */}
      {selectedClient && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                {selectedClient.name.split(/[\s-&]+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedClient.name} Brand Kit</p>
                <p className="text-xs text-muted-foreground">
                  {selectedClient.industry || "Custom brand guidelines for this client"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Brand Sections Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="h-10 w-full justify-start gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
            <TabsTrigger value="colors" className="gap-1.5 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <SwatchBook className="h-3.5 w-3.5" /> Colors
              {colorItems.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[9px] px-1">{colorItems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-1.5 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Type className="h-3.5 w-3.5" /> Typography
              {fontItems.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[9px] px-1">{fontItems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="logos" className="gap-1.5 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <ImageIcon className="h-3.5 w-3.5" /> Logos
              {logoItems.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[9px] px-1">{logoItems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1.5 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <MessageSquare className="h-3.5 w-3.5" /> Voice & Tone
              {voiceItems.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[9px] px-1">{voiceItems.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="gap-1.5 text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <FileText className="h-3.5 w-3.5" /> Guidelines
              {guidelineItems.length > 0 && <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[9px] px-1">{guidelineItems.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ─── COLORS SECTION ─── */}
          <TabsContent value="colors" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Brand color palette with primary, secondary, accent, and neutral tones</p>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddColor(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Color
              </Button>
            </div>

            {(["primary", "secondary", "accent", "neutral"] as ColorGroup[]).map(group => (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    group === "primary" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                    group === "secondary" && "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                    group === "accent" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    group === "neutral" && "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
                  )}>
                    {group}
                  </Badge>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {colorsByGroup[group].map(item => (
                    <ColorSwatchCard
                      key={item.id}
                      item={item}
                      parsed={item.parsed}
                      onDelete={() => deleteBrandKit(item.id)}
                      onEdit={() => setShowEditItem(item)}
                    />
                  ))}
                  {colorsByGroup[group].length === 0 && (
                    <div className="col-span-full py-6 text-center">
                      <p className="text-xs text-muted-foreground">No {group} colors defined</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {colorItems.length === 0 && (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-12 text-center">
                  <SwatchBook className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No colors defined yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add your brand colors to get started</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddColor(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add First Color
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── TYPOGRAPHY SECTION ─── */}
          <TabsContent value="typography" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Brand typography system with heading, body, and accent fonts</p>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddFont(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Font
              </Button>
            </div>

            {(["heading", "body", "accent"] as const).map(category => {
              const categoryFonts = fontItems.filter(f => f.parsed?.category === category)
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      category === "heading" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                      category === "body" && "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                      category === "accent" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    )}>
                      {category} Font
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryFonts.map(item => (
                      <FontCard
                        key={item.id}
                        item={item}
                        parsed={item.parsed}
                        onDelete={() => deleteBrandKit(item.id)}
                        onEdit={() => setShowEditItem(item)}
                      />
                    ))}
                  </div>
                  {categoryFonts.length === 0 && (
                    <Card className="shadow-sm border-dashed">
                      <CardContent className="py-6 text-center">
                        <p className="text-xs text-muted-foreground">No {category} font defined</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}

            {fontItems.length === 0 && (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-12 text-center">
                  <Type className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No typography defined yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add your brand fonts to get started</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddFont(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add First Font
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── LOGOS SECTION ─── */}
          <TabsContent value="logos" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Logo variants and usage guidelines</p>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddLogo(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload Logo
              </Button>
            </div>

            {(["primary", "secondary", "icon", "monochrome"] as const).map(variant => {
              const variantLogos = logoItems.filter(l => l.parsed?.variant === variant)
              return (
                <div key={variant}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      variant === "primary" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                      variant === "secondary" && "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                      variant === "icon" && "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
                      variant === "monochrome" && "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
                    )}>
                      {variant}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {variantLogos.map(item => (
                      <LogoCard
                        key={item.id}
                        item={item}
                        parsed={item.parsed}
                        onDelete={() => deleteBrandKit(item.id)}
                      />
                    ))}
                  </div>
                  {variantLogos.length === 0 && (
                    <Card className="shadow-sm border-dashed">
                      <CardContent className="py-6 text-center">
                        <p className="text-xs text-muted-foreground">No {variant} logo uploaded</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}

            {logoItems.length === 0 && (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No logos uploaded yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Upload your brand logos and variants</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddLogo(true)}>
                    <Upload className="h-3.5 w-3.5" /> Upload Logo
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── VOICE & TONE SECTION ─── */}
          <TabsContent value="voice" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Brand voice guidelines, do&apos;s &amp; don&apos;ts, and key phrases</p>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddVoice(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Voice Guide
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {voiceItems.map(item => (
                <VoiceCard
                  key={item.id}
                  item={item}
                  parsed={item.parsed}
                  onDelete={() => deleteBrandKit(item.id)}
                  onEdit={() => setShowEditItem(item)}
                />
              ))}
            </div>

            {voiceItems.length === 0 && (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No voice guidelines defined yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Define your brand voice, tone, and key phrases</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddVoice(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Voice Guide
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── GUIDELINES SECTION ─── */}
          <TabsContent value="guidelines" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Brand guidelines documents and resources</p>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddGuideline(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload Document
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guidelineItems.map(item => (
                <GuidelineCard
                  key={item.id}
                  item={item}
                  parsed={item.parsed}
                  onDelete={() => deleteBrandKit(item.id)}
                />
              ))}
            </div>

            {guidelineItems.length === 0 && (
              <Card className="shadow-sm border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No guidelines documents uploaded yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Upload brand guidelines, social media guides, and more</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setShowAddGuideline(true)}>
                    <Upload className="h-3.5 w-3.5" /> Upload Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ─── DIALOGS ─── */}
      <AddColorDialog open={showAddColor} onOpenChange={setShowAddColor} onSubmit={createBrandKit} />
      <AddFontDialog open={showAddFont} onOpenChange={setShowAddFont} onSubmit={createBrandKit} />
      <AddLogoDialog open={showAddLogo} onOpenChange={setShowAddLogo} onSubmit={createBrandKit} />
      <AddVoiceDialog open={showAddVoice} onOpenChange={setShowAddVoice} onSubmit={createBrandKit} />
      <AddGuidelineDialog open={showAddGuideline} onOpenChange={setShowAddGuideline} onSubmit={createBrandKit} />
      <EditBrandKitDialog item={showEditItem} onClose={() => setShowEditItem(null)} onUpdate={updateBrandKit} />
    </motion.div>
  )
}

// ── Color Swatch Card ──
function ColorSwatchCard({ item, parsed, onDelete, onEdit }: {
  item: BrandKit
  parsed: ColorItem | null
  onDelete: () => void
  onEdit: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyHex = () => {
    if (parsed?.hex) {
      navigator.clipboard.writeText(parsed.hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (!parsed) return null

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm border-border/60 group overflow-hidden hover:shadow-md transition-all">
        <div
          className="h-20 w-full cursor-pointer relative transition-transform group-hover:scale-[1.02]"
          style={{ backgroundColor: parsed.hex }}
          onClick={copyHex}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            {copied ? (
              <Check className="h-5 w-5 text-white" />
            ) : (
              <Copy className="h-4 w-4 text-white" />
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{parsed.name}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 cursor-pointer" onClick={copyHex}>
                      {parsed.hex}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:text-rose-600" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Font Card ──
function FontCard({ item, parsed, onDelete, onEdit }: {
  item: BrandKit
  parsed: FontItem | null
  onDelete: () => void
  onEdit: () => void
}) {
  if (!parsed) return null

  const weightLabels: Record<number, string> = {
    100: "Thin", 200: "Extra Light", 300: "Light", 400: "Regular",
    500: "Medium", 600: "Semi Bold", 700: "Bold", 800: "Extra Bold", 900: "Black",
  }

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm border-border/60 group hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold">{parsed.name}</h4>
              <Badge className={cn(
                "mt-1 text-[9px]",
                parsed.category === "heading" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                parsed.category === "body" && "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                parsed.category === "accent" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
              )}>
                {parsed.category}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:text-rose-600" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Font preview */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 mb-3">
            <p className="text-xl" style={{ fontWeight: 700 }}>{parsed.sample || "The quick brown fox"}</p>
            <p className="text-sm text-muted-foreground" style={{ fontWeight: 400 }}>{parsed.sample || "jumps over the lazy dog"}</p>
          </div>

          {/* Weight chips */}
          <div className="flex flex-wrap gap-1">
            {parsed.weights.map(w => (
              <span key={w} className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-medium">
                {weightLabels[w] || w}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Logo Card ──
function LogoCard({ item, parsed, onDelete }: {
  item: BrandKit
  parsed: LogoItem | null
  onDelete: () => void
}) {
  if (!parsed) return null

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm border-border/60 group overflow-hidden hover:shadow-md transition-all">
        {/* Preview area with light/dark backgrounds */}
        <div className="relative">
          <div className={cn(
            "h-32 flex items-center justify-center border-b",
            parsed.background === "dark" ? "bg-slate-900" : "bg-white dark:bg-[#1c1c1e]"
          )}>
            <div className={cn(
              "h-16 w-auto flex items-center justify-center rounded-lg",
              parsed.background === "dark" ? "text-white" : "text-slate-900 dark:text-white"
            )}>
              {parsed.url ? (
                <img src={parsed.url} alt={parsed.name} className="max-h-16 max-w-[80%] object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="h-8 w-8" />
                  <span className="text-[10px] opacity-50">{parsed.name}</span>
                </div>
              )}
            </div>
          </div>
          <Badge className="absolute top-2 left-2 text-[9px] bg-black/50 text-white hover:bg-black/60">
            {parsed.variant}
          </Badge>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold truncate">{parsed.name}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Download className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:text-rose-600" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Voice Card ──
function VoiceCard({ item, parsed, onDelete, onEdit }: {
  item: BrandKit
  parsed: VoiceItem | null
  onDelete: () => void
  onEdit: () => void
}) {
  if (!parsed) return null

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm border-border/60 group hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-sm">{item.name}</CardTitle>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:text-rose-600" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">{parsed.description}</p>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Do&apos;s
              </p>
              <ul className="space-y-1">
                {parsed.dos.map((d, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Don&apos;ts
              </p>
              <ul className="space-y-1">
                {parsed.donts.map((d, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Taglines */}
          {parsed.taglines.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Key Phrases
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.taglines.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Guideline Card ──
function GuidelineCard({ item, parsed, onDelete }: {
  item: BrandKit
  parsed: GuidelineItem | null
  onDelete: () => void
}) {
  if (!parsed) return null

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    "brand-guidelines": FileText,
    "social-media": MessageSquare,
    "style-guide": SwatchBook,
  }
  const Icon = typeIcons[parsed.documentType] || FileText

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm border-border/60 group hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">{parsed.title}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{parsed.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[9px]">{parsed.documentType}</Badge>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700">
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Add Color Dialog ──
function AddColorDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; type: string; value: string }) => void
}) {
  const [name, setName] = useState("")
  const [hex, setHex] = useState("#")
  const [group, setGroup] = useState<ColorGroup>("primary")

  const handleSubmit = () => {
    if (!name || !hex || hex === "#") return
    onSubmit({
      name,
      type: "color",
      value: JSON.stringify({ name, hex, group }),
    })
    setName("")
    setHex("#")
    setGroup("primary")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SwatchBook className="h-5 w-5 text-emerald-600" /> Add Brand Color
          </DialogTitle>
          <DialogDescription>Add a new color to your brand palette</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl border-2 border-border shadow-inner" style={{ backgroundColor: hex }} />
            <div className="flex-1 space-y-2">
              <div>
                <Label className="text-xs">Color Name</Label>
                <Input placeholder="e.g., Brand Green" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Hex Value</Label>
              <div className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="00A86B" value={hex.replace("#", "")} onChange={e => setHex("#" + e.target.value.replace("#", ""))} className="h-8 text-sm font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Group</Label>
              <Select value={group} onValueChange={v => setGroup(v as ColorGroup)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="accent">Accent</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Add Color</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Font Dialog ──
function AddFontDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; type: string; value: string }) => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<"heading" | "body" | "accent">("heading")
  const [sample, setSample] = useState("")

  const handleSubmit = () => {
    if (!name) return
    onSubmit({
      name,
      type: "typography",
      value: JSON.stringify({ name, category, weights: [400, 500, 600, 700], sample: sample || "The quick brown fox" }),
    })
    setName("")
    setCategory("heading")
    setSample("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-emerald-600" /> Add Brand Font
          </DialogTitle>
          <DialogDescription>Add a new font to your typography system</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Font Name</Label>
            <Input placeholder="e.g., Inter, Playfair Display" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as "heading" | "body" | "accent")}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="heading">Heading Font</SelectItem>
                <SelectItem value="body">Body Font</SelectItem>
                <SelectItem value="accent">Accent Font</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Sample Text (optional)</Label>
            <Input placeholder="The quick brown fox jumps over the lazy dog" value={sample} onChange={e => setSample(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Add Font</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Logo Dialog ──
function AddLogoDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; type: string; value: string }) => void
}) {
  const [name, setName] = useState("")
  const [variant, setVariant] = useState<"primary" | "secondary" | "icon" | "monochrome">("primary")
  const [background, setBackground] = useState<"light" | "dark">("light")

  const handleSubmit = () => {
    if (!name) return
    onSubmit({
      name,
      type: "logo",
      value: JSON.stringify({ name, variant, background, url: "" }),
    })
    setName("")
    setVariant("primary")
    setBackground("light")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-600" /> Upload Logo
          </DialogTitle>
          <DialogDescription>Add a new logo variant to your brand kit</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Logo Name</Label>
            <Input placeholder="e.g., Logo - Full Color" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Variant</Label>
              <Select value={variant} onValueChange={v => setVariant(v as "primary" | "secondary" | "icon" | "monochrome")}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="icon">Icon</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Background</Label>
              <Select value={background} onValueChange={v => setBackground(v as "light" | "dark")}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Background</SelectItem>
                  <SelectItem value="dark">Dark Background</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">SVG, PNG, or JPG (max 5MB)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Upload Logo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Voice Dialog ──
function AddVoiceDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; type: string; value: string }) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dos, setDos] = useState("")
  const [donts, setDonts] = useState("")
  const [taglines, setTaglines] = useState("")

  const handleSubmit = () => {
    if (!name || !description) return
    onSubmit({
      name,
      type: "voice",
      value: JSON.stringify({
        description,
        dos: dos.split("\n").filter(s => s.trim()),
        donts: donts.split("\n").filter(s => s.trim()),
        taglines: taglines.split("\n").filter(s => s.trim()),
      }),
    })
    setName("")
    setDescription("")
    setDos("")
    setDonts("")
    setTaglines("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" /> Add Voice Guidelines
          </DialogTitle>
          <DialogDescription>Define brand voice, tone, and key phrases</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <Label className="text-xs">Guide Name</Label>
            <Input placeholder="e.g., Social Media Voice" value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Voice Description</Label>
            <Textarea placeholder="Describe the brand voice and tone..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[80px] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-emerald-600">Do&apos;s (one per line)</Label>
              <Textarea placeholder="Be conversational&#10;Use active voice" value={dos} onChange={e => setDos(e.target.value)} className="min-h-[100px] text-sm" />
            </div>
            <div>
              <Label className="text-xs text-rose-600">Don&apos;ts (one per line)</Label>
              <Textarea placeholder="Don't use jargon&#10;Avoid passive voice" value={donts} onChange={e => setDonts(e.target.value)} className="min-h-[100px] text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Key Phrases / Taglines (one per line)</Label>
            <Textarea placeholder="Empowering creativity&#10;Design without limits" value={taglines} onChange={e => setTaglines(e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Add Voice Guide</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Guideline Dialog ──
function AddGuidelineDialog({ open, onOpenChange, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; type: string; value: string }) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [docType, setDocType] = useState("brand-guidelines")

  const handleSubmit = () => {
    if (!title) return
    onSubmit({
      name: title,
      type: "guidelines",
      value: JSON.stringify({ title, description, documentType: docType, url: "" }),
    })
    setTitle("")
    setDescription("")
    setDocType("brand-guidelines")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" /> Upload Document
          </DialogTitle>
          <DialogDescription>Add a brand guideline document or resource</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Document Title</Label>
            <Input placeholder="e.g., Brand Guidelines 2024" value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea placeholder="Brief description of the document..." value={description} onChange={e => setDescription(e.target.value)} className="min-h-[60px] text-sm" />
          </div>
          <div>
            <Label className="text-xs">Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brand-guidelines">Brand Guidelines</SelectItem>
                <SelectItem value="social-media">Social Media Guidelines</SelectItem>
                <SelectItem value="style-guide">Style Guide</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Click to upload PDF, DOCX, or PNG</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Upload Document</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Brand Kit Item Dialog ──
function EditBrandKitDialog({ item, onClose, onUpdate }: {
  item: BrandKit | null
  onClose: () => void
  onUpdate: (id: string, data: Record<string, unknown>) => void
}) {
  const [name, setName] = useState("")

  React.useEffect(() => {
    if (item) setName(item.name)
  }, [item])

  if (!item) return null

  const handleSubmit = () => {
    if (!name) return
    onUpdate(item.id, { name })
    onClose()
  }

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Brand Kit Item</DialogTitle>
          <DialogDescription>Update the name of this brand kit item</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
