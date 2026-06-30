"use client";

import React, { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useERPStore, type Content, type ContentStage, type ContentType, type ContentPriority } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  GripVertical,
  MessageSquare,
  LayoutGrid,
  List,
  Filter,
  Image,
  FileText,
  Film,
  Layers,
  Video,
  Palette,
  Type,
  Clock,
  ArrowRight,
  Sparkles,
  Lightbulb,
  PenTool,
  Pencil,
  Eye,
  CheckCircle2,
  Send,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Stage Configuration ──────────────────────────────────────────────────────

const STAGES: { key: ContentStage; label: string; color: string; bgColor: string; borderColor: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "idea", label: "Idea", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800/50", borderColor: "border-l-slate-400", icon: Lightbulb },
  { key: "design", label: "Design", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-50 dark:bg-violet-900/20", borderColor: "border-l-violet-400", icon: PenTool },
  { key: "edit", label: "Edit", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-l-amber-400", icon: Pencil },
  { key: "review", label: "Review", color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-50 dark:bg-cyan-900/20", borderColor: "border-l-cyan-400", icon: Eye },
  { key: "approve", label: "Approve", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", borderColor: "border-l-emerald-400", icon: CheckCircle2 },
  { key: "disseminate", label: "Disseminate", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-50 dark:bg-teal-900/20", borderColor: "border-l-teal-400", icon: Send },
];

const STAGE_ORDER: ContentStage[] = ["idea", "design", "edit", "review", "approve", "disseminate"];

// ─── Content Type Configuration ───────────────────────────────────────────────

const CONTENT_TYPES: { key: ContentType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: "post", label: "Post", icon: Type, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "story", label: "Story", icon: Image, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { key: "reel", label: "Reel", icon: Film, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { key: "carousel", label: "Carousel", icon: Layers, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { key: "video", label: "Video", icon: Video, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { key: "graphic", label: "Graphic", icon: Palette, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { key: "article", label: "Article", icon: FileText, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
];

const PRIORITY_CONFIG: Record<ContentPriority, { color: string; label: string }> = {
  low: { color: "bg-slate-400", label: "Low" },
  medium: { color: "bg-amber-400", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  urgent: { color: "bg-rose-500", label: "Urgent" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getTypeConfig(type: ContentType) {
  return CONTENT_TYPES.find((t) => t.key === type) || CONTENT_TYPES[0];
}

function getStageConfig(stage: ContentStage) {
  return STAGES.find((s) => s.key === stage) || STAGES[0];
}

function getNextStage(current: ContentStage): ContentStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}d left`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}d overdue`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Content Card Component ───────────────────────────────────────────────────

function ContentCard({
  content,
  index,
  onMoveNext,
  onClick,
}: {
  content: Content;
  index: number;
  onMoveNext: (id: string, nextStage: ContentStage) => void;
  onClick: (content: Content) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = getTypeConfig(content.type);
  const priorityConfig = PRIORITY_CONFIG[content.priority];
  const nextStage = getNextStage(content.stage);
  const nextStageConfig = nextStage ? getStageConfig(nextStage) : null;
  const overdue = isOverdue(content.dueDate);
  const tags = parseTags(content.tags);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      layout
      layoutId={content.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(content)}
      className={cn(
        "group relative bg-card rounded-lg border border-border/70 shadow-sm cursor-pointer",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:-translate-y-0.5 hover:border-border",
        isHovered && "ring-1 ring-emerald-500/20"
      )}
    >
      {/* Drag handle */}
      <div className="absolute top-2.5 left-1 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="p-3 pl-4">
        {/* Top row: type badge + priority */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", typeConfig.color)}>
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("h-2 w-2 rounded-full shrink-0", priorityConfig.color)} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {priorityConfig.label} priority
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium leading-snug text-foreground mb-2 line-clamp-2">
          {content.title}
        </h4>

        {/* Campaign name */}
        {content.campaign && (
          <div className="flex items-center gap-1 mb-2">
            <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
              {content.campaign.name}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: assignee + due date + actions */}
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/50">
          <div className="flex items-center gap-2 min-w-0">
            {/* Assignee avatar */}
            {content.assignee && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarFallback className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {getInitials(content.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {content.assignee.name}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Due date */}
            {content.dueDate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-medium",
                    overdue ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    {formatDate(content.dueDate)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Due: {new Date(content.dueDate).toLocaleDateString()}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-0.5">
            {/* Comment count */}
            {content.comments && content.comments.length > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mr-1">
                <MessageSquare className="h-3 w-3" />
                {content.comments.length}
              </div>
            )}

            {/* Move to next stage */}
            {nextStage && nextStageConfig && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveNext(content.id, nextStage);
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                        "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
                        "transition-colors"
                      )}
                    >
                      <ArrowRight className="h-3 w-3" />
                      {nextStageConfig.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Move to {nextStageConfig.label}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State Component ────────────────────────────────────────────────────

function EmptyColumn({ stage }: { stage: typeof STAGES[number] }) {
  const Icon = stage.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 px-4 text-center"
    >
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-2", stage.bgColor)}>
        <Icon className={cn("h-5 w-5", stage.color)} />
      </div>
      <p className="text-xs text-muted-foreground font-medium">No content here</p>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Drag items or create new</p>
    </motion.div>
  );
}

// ─── List View Row ────────────────────────────────────────────────────────────

function ContentListRow({
  content,
  index,
  onMoveNext,
  onClick,
}: {
  content: Content;
  index: number;
  onMoveNext: (id: string, nextStage: ContentStage) => void;
  onClick: (content: Content) => void;
}) {
  const typeConfig = getTypeConfig(content.type);
  const priorityConfig = PRIORITY_CONFIG[content.priority];
  const stageConfig = getStageConfig(content.stage);
  const nextStage = getNextStage(content.stage);
  const nextStageConfig = nextStage ? getStageConfig(nextStage) : null;
  const overdue = isOverdue(content.dueDate);
  const TypeIcon = typeConfig.icon;
  const StageIcon = stageConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => onClick(content)}
      className={cn(
        "grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3",
        "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
        "group"
      )}
    >
      {/* Stage badge */}
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium", stageConfig.bgColor, stageConfig.color)}>
        <StageIcon className="h-3 w-3" />
        {stageConfig.label}
      </div>

      {/* Title + type */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{content.title}</span>
          <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0", typeConfig.color)}>
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </div>
        </div>
        {content.campaign && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{content.campaign.name}</p>
        )}
      </div>

      {/* Priority */}
      <div className="flex items-center gap-1.5">
        <div className={cn("h-2 w-2 rounded-full", priorityConfig.color)} />
        <span className="text-[11px] text-muted-foreground">{priorityConfig.label}</span>
      </div>

      {/* Assignee */}
      {content.assignee ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                {getInitials(content.assignee.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent className="text-xs">{content.assignee.name}</TooltipContent>
        </Tooltip>
      ) : (
        <div className="h-6 w-6" />
      )}

      {/* Due date */}
      {content.dueDate ? (
        <span className={cn("text-[11px] font-medium", overdue ? "text-rose-500" : "text-muted-foreground")}>
          {formatDate(content.dueDate)}
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground/50">No date</span>
      )}

      {/* Move next */}
      {nextStage && nextStageConfig ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveNext(content.id, nextStage);
          }}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium",
            "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
            "transition-colors opacity-0 group-hover:opacity-100"
          )}
        >
          <ArrowRight className="h-3 w-3" />
          {nextStageConfig.label}
        </button>
      ) : (
        <div className="w-20" />
      )}
    </motion.div>
  );
}

// ─── Main Pipeline View ───────────────────────────────────────────────────────

export function PipelineView() {
  const { contents, teams, setSelectedContent, setShowCreateContent, setContents } = useERPStore();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterType, setFilterType] = useState<ContentType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<ContentPriority | "all">("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

  // Filter contents
  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      if (c.stage === "archived") return false;
      if (filterType !== "all" && c.type !== filterType) return false;
      if (filterPriority !== "all" && c.priority !== filterPriority) return false;
      if (filterTeam !== "all" && c.teamId !== filterTeam) return false;
      return true;
    });
  }, [contents, filterType, filterPriority, filterTeam]);

  // Group by stage
  const groupedByStage = useMemo(() => {
    const grouped: Record<ContentStage, Content[]> = {
      idea: [],
      design: [],
      edit: [],
      review: [],
      approve: [],
      disseminate: [],
    };
    filteredContents.forEach((c) => {
      if (grouped[c.stage]) {
        grouped[c.stage].push(c);
      }
    });
    return grouped;
  }, [filteredContents]);

  // Move to next stage
  const handleMoveNext = useCallback(
    async (id: string, nextStage: ContentStage) => {
      setMovingIds((prev) => new Set(prev).add(id));

      // Optimistic update
      const updatedContents = contents.map((c) =>
        c.id === id ? { ...c, stage: nextStage, updatedAt: new Date().toISOString() } : c
      );
      setContents(updatedContents);

      try {
        const res = await fetch(`/api/contents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: nextStage }),
        });
        if (!res.ok) {
          // Revert on failure
          setContents(contents);
          toast.error("Failed to move content");
        } else {
          toast.success(`Moved to ${nextStage}`);
        }
      } catch {
        // Revert on error
        setContents(contents);
        toast.error("Failed to move content");
      } finally {
        setMovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [contents, setContents]
  );

  // Handle card click
  const handleCardClick = useCallback(
    (content: Content) => {
      setSelectedContent(content);
    },
    [setSelectedContent]
  );

  const hasActiveFilters = filterType !== "all" || filterPriority !== "all" || filterTeam !== "all";

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-3 border-b border-border/50 bg-card/50">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterType !== "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 text-xs",
                  filterType !== "all" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {filterType !== "all" ? (
                  <>
                    {React.createElement(getTypeConfig(filterType).icon, { className: "h-3 w-3" })}
                    {getTypeConfig(filterType).label}
                  </>
                ) : (
                  <>
                    <Filter className="h-3 w-3" />
                    Type
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => setFilterType("all")} className="text-xs">
                All Types
              </DropdownMenuItem>
              {CONTENT_TYPES.map((type) => (
                <DropdownMenuItem
                  key={type.key}
                  onClick={() => setFilterType(type.key)}
                  className="text-xs"
                >
                  <type.icon className="h-3.5 w-3.5 mr-1.5" />
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterPriority !== "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 text-xs",
                  filterPriority !== "all" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {filterPriority !== "all" ? (
                  <>
                    <div className={cn("h-2 w-2 rounded-full", PRIORITY_CONFIG[filterPriority].color)} />
                    {PRIORITY_CONFIG[filterPriority].label}
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    Priority
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuItem onClick={() => setFilterPriority("all")} className="text-xs">
                All Priorities
              </DropdownMenuItem>
              {(Object.entries(PRIORITY_CONFIG) as [ContentPriority, typeof PRIORITY_CONFIG[ContentPriority]][]).map(
                ([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setFilterPriority(key)}
                    className="text-xs"
                  >
                    <div className={cn("h-2 w-2 rounded-full mr-2", config.color)} />
                    {config.label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Team filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filterTeam !== "all" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 text-xs",
                  filterTeam !== "all" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {filterTeam !== "all"
                  ? teams.find((t) => t.id === filterTeam)?.name || "Team"
                  : "Team"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => setFilterTeam("all")} className="text-xs">
                All Teams
              </DropdownMenuItem>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => setFilterTeam(team.id)}
                  className="text-xs"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: team.color || "#6b7280" }}
                  />
                  {team.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setFilterType("all");
                setFilterPriority("all");
                setFilterTeam("all");
              }}
            >
              Clear
            </Button>
          )}

          {/* Item count */}
          <span className="text-[11px] text-muted-foreground ml-1">
            {filteredContents.length} item{filteredContents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Right side: View toggle + Add */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "inline-flex items-center justify-center h-6 w-7 rounded-md transition-all",
                viewMode === "kanban"
                  ? "bg-card shadow-sm text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center justify-center h-6 w-7 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-card shadow-sm text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add content */}
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCreateContent(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Content
          </Button>
        </div>
      </div>

      {/* ─── Main Content Area ────────────────────────────────────────────── */}
      {viewMode === "kanban" ? (
        /* ─── Kanban View ────────────────────────────────────────────────── */
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 lg:p-6 min-h-0 h-full" style={{ minWidth: `${STAGES.length * 300}px` }}>
            {STAGES.map((stage, stageIdx) => {
              const stageItems = groupedByStage[stage.key];
              const StageIcon = stage.icon;

              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: stageIdx * 0.06 }}
                  className="flex flex-col w-[280px] lg:w-[300px] shrink-0"
                >
                  {/* Column header */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-t-lg border-l-[3px]",
                      stage.bgColor,
                      stage.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <StageIcon className={cn("h-4 w-4", stage.color)} />
                      <h3 className={cn("text-sm font-semibold", stage.color)}>
                        {stage.label}
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 min-w-[20px] flex items-center justify-center text-[10px] font-bold px-1.5",
                        stageItems.length > 0
                          ? cn(stage.bgColor, stage.color, "border border-current/20")
                          : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {stageItems.length}
                    </Badge>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 bg-muted/20 rounded-b-lg border border-border/40 border-t-0 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] p-2 space-y-2 scrollbar-thin">
                      <AnimatePresence mode="popLayout">
                        {stageItems.length > 0 ? (
                          stageItems.map((content, cardIdx) => (
                            <ContentCard
                              key={content.id}
                              content={content}
                              index={cardIdx}
                              onMoveNext={handleMoveNext}
                              onClick={handleCardClick}
                            />
                          ))
                        ) : (
                          <EmptyColumn stage={stage} />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── List View ──────────────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-6 py-2">
            {/* List header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Stage</span>
              <span>Content</span>
              <span>Priority</span>
              <span>Assignee</span>
              <span>Due</span>
              <span className="w-20"></span>
            </div>

            {/* List items */}
            <AnimatePresence mode="popLayout">
              {filteredContents.length > 0 ? (
                filteredContents.map((content, idx) => (
                  <ContentListRow
                    key={content.id}
                    content={content}
                    index={idx}
                    onMoveNext={handleMoveNext}
                    onClick={handleCardClick}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <LayoutGrid className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No content found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Try adjusting your filters or create new content
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
