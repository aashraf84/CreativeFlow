"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type Content, type ContentType, type ContentStage } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Search,
  LayoutGrid,
  List,
  RotateCcw,
  Trash2,
  FileText,
  Image,
  Film,
  Layers,
  Video,
  Palette,
  Type,
  CalendarDays,
  Users,
  FolderOpen,
  Database,
  HardDrive,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ── Type icon mapping ──────────────────────────────────────────────
const TYPE_ICONS: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  post: FileText,
  story: Image,
  reel: Film,
  carousel: Layers,
  video: Video,
  graphic: Palette,
  article: Type,
};

const TYPE_COLORS: Record<ContentType, string> = {
  post: "#10b981",
  story: "#14b8a6",
  reel: "#06b6d4",
  carousel: "#0d9488",
  video: "#059669",
  graphic: "#34d399",
  article: "#2dd4bf",
};

// ── View mode ──────────────────────────────────────────────────────
type ViewMode = "grid" | "list";

export function ArchiveView() {
  const { contents, setContents, campaigns, teams } = useERPStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<"restore" | "delete" | null>(null);

  // ── Archived contents ──────────────────────────────────────────
  const archivedContents = useMemo(() => {
    return contents.filter((c) => c.stage === "archived");
  }, [contents]);

  // ── Filtered contents ──────────────────────────────────────────
  const filteredContents = useMemo(() => {
    let result = archivedContents;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (campaignFilter !== "all") {
      result = result.filter((c) => c.campaignId === campaignFilter);
    }

    if (teamFilter !== "all") {
      result = result.filter((c) => c.teamId === teamFilter);
    }

    return result;
  }, [archivedContents, search, typeFilter, campaignFilter, teamFilter]);

  // ── Stats ──────────────────────────────────────────────────────
  const archivedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return archivedContents.filter((c) => new Date(c.updatedAt) >= startOfMonth).length;
  }, [archivedContents]);

  const storageUsed = useMemo(() => {
    return `${(archivedContents.length * 2.4).toFixed(1)} MB`;
  }, [archivedContents]);

  // ── Toggle selection ───────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredContents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContents.map((c) => c.id)));
    }
  }

  // ── Restore content ────────────────────────────────────────────
  function handleRestore(id: string) {
    setContents(
      contents.map((c) =>
        c.id === id ? { ...c, stage: "idea" as ContentStage, updatedAt: new Date().toISOString() } : c
      )
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleBulkRestore() {
    setContents(
      contents.map((c) =>
        selectedIds.has(c.id) ? { ...c, stage: "idea" as ContentStage, updatedAt: new Date().toISOString() } : c
      )
    );
    setSelectedIds(new Set());
    setBulkAction(null);
  }

  // ── Delete content ─────────────────────────────────────────────
  function handleDelete() {
    if (deleteTarget) {
      setContents(contents.filter((c) => c.id !== deleteTarget));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget);
        return next;
      });
      setDeleteTarget(null);
    }
  }

  function handleBulkDelete() {
    setContents(contents.filter((c) => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setBulkAction(null);
  }

  // ── Format date ────────────────────────────────────────────────
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-6 w-6 text-emerald-500" />
            Content Archive
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage your archived content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className={cn("h-8 w-8", viewMode === "grid" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className={cn("h-8 w-8", viewMode === "list" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{archivedContents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Archived</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                  <CalendarDays className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{archivedThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Archived This Month</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950">
                  <HardDrive className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{storageUsed}</p>
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search & Filters */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search archived content..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="graphic">Graphic</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="Campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk actions bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"
            >
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {selectedIds.size} selected
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                onClick={() => setBulkAction("restore")}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restore Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800"
                onClick={() => setBulkAction("delete")}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                <XSquare className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content list */}
        {filteredContents.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-16 text-center">
                <Archive className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No archived content</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {archivedContents.length === 0
                    ? "Content that reaches the Archive stage will appear here"
                    : "No results match your filters"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredContents.map((content) => {
                const TypeIcon = TYPE_ICONS[content.type];
                const typeColor = TYPE_COLORS[content.type];
                const isSelected = selectedIds.has(content.id);

                return (
                  <motion.div
                    key={content.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card className={cn(
                      "transition-all duration-200 relative",
                      isSelected && "ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-700",
                    )}>
                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(content.id)}
                          className="bg-background"
                        />
                      </div>

                      <CardContent className="p-5 pt-10">
                        <div className="space-y-3">
                          {/* Type badge + Title */}
                          <div className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="gap-1 text-xs shrink-0 mt-0.5"
                              style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                            >
                              <TypeIcon className="h-3 w-3" />
                              {content.type}
                            </Badge>
                            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                              {content.title}
                            </h3>
                          </div>

                          {/* Description */}
                          {content.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {content.description}
                            </p>
                          )}

                          <Separator />

                          {/* Dates */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Created</span>
                              <span>{formatDate(content.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Published</span>
                              <span>{formatDate(content.publishedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Archived</span>
                              <span>{formatDate(content.updatedAt)}</span>
                            </div>
                          </div>

                          {/* Campaign & Team */}
                          <div className="flex flex-wrap gap-1.5">
                            {content.campaign && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {content.campaign.name}
                              </Badge>
                            )}
                            {content.team && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Users className="h-3 w-3" />
                                {content.team.name}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                              onClick={() => handleRestore(content.id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                              onClick={() => setDeleteTarget(content.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                {/* Select all row */}
                <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/30">
                  <Checkbox
                    checked={selectedIds.size === filteredContents.length && filteredContents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-xs font-medium text-muted-foreground flex-1">Select All</span>
                  <span className="text-xs text-muted-foreground">{filteredContents.length} items</span>
                </div>

                <div className="divide-y">
                  {filteredContents.map((content) => {
                    const TypeIcon = TYPE_ICONS[content.type];
                    const typeColor = TYPE_COLORS[content.type];
                    const isSelected = selectedIds.has(content.id);

                    return (
                      <div
                        key={content.id}
                        className={cn(
                          "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30",
                          isSelected && "bg-emerald-50/50 dark:bg-emerald-950/20",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(content.id)}
                        />
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${typeColor}15` }}>
                          <TypeIcon className="h-4 w-4" style={{ color: typeColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium truncate">{content.title}</h4>
                            <Badge variant="secondary" className="text-xs shrink-0 capitalize" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                              {content.type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Created: {formatDate(content.createdAt)}</span>
                            <span>Published: {formatDate(content.publishedAt)}</span>
                            <span>Archived: {formatDate(content.updatedAt)}</span>
                            {content.campaign && (
                              <span className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" /> {content.campaign.name}
                              </span>
                            )}
                            {content.team && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {content.team.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
                            onClick={() => handleRestore(content.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600"
                            onClick={() => setDeleteTarget(content.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Single delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk action confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={(open) => { if (!open) setBulkAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "restore" ? "Restore Selected" : "Delete Selected"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "restore"
                ? `This will restore ${selectedIds.size} item(s) back to the Idea stage.`
                : `This will permanently delete ${selectedIds.size} item(s). This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkAction === "restore" ? handleBulkRestore : handleBulkDelete}
              className={cn(bulkAction === "delete" && "bg-red-600 hover:bg-red-700 text-white")}
            >
              {bulkAction === "restore" ? "Restore" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
