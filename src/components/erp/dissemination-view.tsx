"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  useERPStore,
  type Disseminator,
  type DisseminationTask,
  type Post,
  type Platform,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Clock,
  FileEdit,
  AlertCircle,
  CheckCircle2,
  CalendarIcon,
  ImagePlus,
  MoreHorizontal,
  XCircle,
  Zap,
  Globe,
  Camera,
  MessageCircle,
  Briefcase,
  Music,
  Play,
  Heart,
  MessageSquare,
  Share2,
  Eye,
  Bookmark,
  Sparkles,
  Rocket,
  CalendarClock,
  AlertTriangle,
  Trash2,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ArrowRight,
  ChevronDown,
  Loader2,
  UserPlus,
  Timer,
  Target,
  Award,
  CircleDot,
  ListChecks,
  LayoutGrid,
  Search,
  Filter,
  Plus,
  ChevronUp,
  ExternalLink,
  Repeat,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  isThisWeek,
  differenceInMinutes,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";

// ─── Platform Configuration ──────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    charLimit: number;
  }
> = {
  instagram: {
    label: "Instagram",
    icon: Camera,
    color: "#E4405F",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    charLimit: 2200,
  },
  facebook: {
    label: "Facebook",
    icon: Globe,
    color: "#1877F2",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    charLimit: 63206,
  },
  twitter: {
    label: "Twitter",
    icon: MessageCircle,
    color: "#1DA1F2",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    charLimit: 280,
  },
  linkedin: {
    label: "LinkedIn",
    icon: Briefcase,
    color: "#0A66C2",
    bgColor: "bg-blue-600/10",
    borderColor: "border-blue-600/30",
    charLimit: 3000,
  },
  tiktok: {
    label: "TikTok",
    icon: Music,
    color: "#000000",
    bgColor: "bg-neutral-500/10",
    borderColor: "border-neutral-500/30",
    charLimit: 2200,
  },
  youtube: {
    label: "YouTube",
    icon: Play,
    color: "#FF0000",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    charLimit: 5000,
  },
  pinterest: {
    label: "Pinterest",
    icon: Bookmark,
    color: "#E60023",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-600/30",
    charLimit: 500,
  },
  snapchat: {
    label: "Snapchat",
    icon: Zap,
    color: "#FFFC00",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    charLimit: 250,
  },
};

// ─── Priority / Status Configs ──────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  low: {
    label: "Low",
    color: "text-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    borderColor: "border-slate-200 dark:border-slate-700",
    icon: CircleDot,
  },
  medium: {
    label: "Medium",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    icon: Target,
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    icon: AlertCircle,
  },
};

const TASK_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    icon: XCircle,
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/20",
    icon: XCircle,
  },
};

const DISSEMINATOR_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    dotColor: string;
  }
> = {
  active: {
    label: "Active",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    dotColor: "bg-emerald-500",
  },
  on_leave: {
    label: "On Leave",
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    dotColor: "bg-amber-500",
  },
  inactive: {
    label: "Inactive",
    color: "text-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-900/20",
    dotColor: "bg-slate-400",
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function parseJsonField<T>(field: string | null, fallback: T): T {
  if (!field) return fallback;
  try {
    return JSON.parse(field) as T;
  } catch {
    return fallback;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatScheduleTime(dateStr: string | null): string {
  if (!dateStr) return "No time set";
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
    return format(date, "MMM d 'at' h:mm a");
  } catch {
    return "Invalid date";
  }
}

function isOverdue(task: DisseminationTask): boolean {
  if (!task.dueDate) return false;
  if (task.status === "completed" || task.status === "cancelled") return false;
  return isPast(new Date(task.dueDate));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPlatformIcon(
  platform: string,
  className?: string
) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return <Globe className={className} />;
  const Icon = config.icon;
  return <Icon className={className} />;
}

// ─── Performance Data Types ──────────────────────────────────────────────────

interface PerformanceOverview {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  onTimeRate: number;
  avgCompletionHours: number;
  totalPublished: number;
}

interface PerformanceByDisseminator {
  id: string;
  name: string;
  tasks: number;
  completed: number;
  onTimeRate: number;
  avgHours: number;
  rating: number;
}

interface PerformanceByPlatform {
  platform: string;
  tasks: number;
  completed: number;
  completionRate: number;
}

interface WeeklyTrendItem {
  week: string;
  tasks: number;
  completed: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DisseminationView() {
  const {
    disseminators,
    disseminationTasks,
    posts,
    socialAccounts,
    setSocialAccounts,
    clients,
    campaigns,
    setDisseminationTasks,
    setPosts,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState<string | null>(null);
  const [taskViewDialog, setTaskViewDialog] =
    useState<DisseminationTask | null>(null);
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const [publishDialogTask, setPublishDialogTask] =
    useState<DisseminationTask | null>(null);
  const [completionNotesDialog, setCompletionNotesDialog] =
    useState<DisseminationTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [expandedDisseminator, setExpandedDisseminator] = useState<string | null>(null);

  // Task board filters
  const [boardPriorityFilter, setBoardPriorityFilter] = useState("all");
  const [boardAssigneeFilter, setBoardAssigneeFilter] = useState("all");
  const [boardClientFilter, setBoardClientFilter] = useState("all");

  // Publishing queue filters
  const [queuePlatformFilter, setQueuePlatformFilter] = useState("all");
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");

  // Quick compose state
  const [composeContent, setComposeContent] = useState("");
  const [composePlatforms, setComposePlatforms] = useState<string[]>([]);
  const [composeScheduledAt, setComposeScheduledAt] = useState<Date | undefined>(undefined);
  const [composeHashtags, setComposeHashtags] = useState("");
  const [composeClientId, setComposeClientId] = useState("");
  const [composeCampaignId, setComposeCampaignId] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    targetPlatforms: [] as string[],
    dueDate: "",
    assigneeId: "",
    clientId: "",
    campaignId: "",
    postContent: "",
    hashtags: "",
  });

  // Performance data
  const [performanceData, setPerformanceData] = useState<{
    overview: PerformanceOverview | null;
    byDisseminator: PerformanceByDisseminator[];
    byPlatform: PerformanceByPlatform[];
    weeklyTrend: WeeklyTrendItem[];
  }>({
    overview: null,
    byDisseminator: [],
    byPlatform: [],
    weeklyTrend: [],
  });

  // ─── Computed Data ─────────────────────────────────────────────────────────

  const activeDisseminators = useMemo(
    () => disseminators.filter((d) => d.status === "active"),
    [disseminators]
  );

  const pendingTasks = useMemo(
    () => disseminationTasks.filter((t) => t.status === "pending"),
    [disseminationTasks]
  );

  const inProgressTasks = useMemo(
    () => disseminationTasks.filter((t) => t.status === "in_progress"),
    [disseminationTasks]
  );

  const completedTasksWeek = useMemo(
    () =>
      disseminationTasks.filter((t) => {
        if (t.status !== "completed" || !t.completedAt) return false;
        return isThisWeek(new Date(t.completedAt));
      }),
    [disseminationTasks]
  );

  const overdueTasks = useMemo(
    () =>
      disseminationTasks.filter(
        (t) => t.status === "overdue" || isOverdue(t)
      ),
    [disseminationTasks]
  );

  const completedTasks = useMemo(
    () => disseminationTasks.filter((t) => t.status === "completed"),
    [disseminationTasks]
  );

  const publishRate = useMemo(() => {
    if (disseminationTasks.length === 0) return 0;
    return Math.round(
      (completedTasks.length / disseminationTasks.length) * 100
    );
  }, [disseminationTasks, completedTasks]);

  const recentCompleted = useMemo(
    () =>
      [...disseminationTasks]
        .filter((t) => t.status === "completed" && t.completedAt)
        .sort(
          (a, b) =>
            new Date(b.completedAt!).getTime() -
            new Date(a.completedAt!).getTime()
        )
        .slice(0, 5),
    [disseminationTasks]
  );

  // Filtered tasks for board
  const filteredBoardTasks = useMemo(() => {
    return disseminationTasks.filter((t) => {
      if (
        boardPriorityFilter !== "all" &&
        t.priority !== boardPriorityFilter
      )
        return false;
      if (
        boardAssigneeFilter !== "all" &&
        t.assigneeId !== boardAssigneeFilter
      )
        return false;
      if (boardClientFilter !== "all" && t.clientId !== boardClientFilter)
        return false;
      return true;
    });
  }, [disseminationTasks, boardPriorityFilter, boardAssigneeFilter, boardClientFilter]);

  const boardColumns = useMemo(() => {
    const cols = [
      { key: "pending", label: "Pending", tasks: filteredBoardTasks.filter((t) => t.status === "pending") },
      { key: "in_progress", label: "In Progress", tasks: filteredBoardTasks.filter((t) => t.status === "in_progress") },
      { key: "completed", label: "Completed", tasks: filteredBoardTasks.filter((t) => t.status === "completed") },
      { key: "failed_overdue", label: "Failed / Overdue", tasks: filteredBoardTasks.filter((t) => t.status === "failed" || t.status === "overdue" || (isOverdue(t) && t.status !== "cancelled")) },
    ];
    return cols;
  }, [filteredBoardTasks]);

  // Filtered posts for queue
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (queuePlatformFilter !== "all" && p.platform !== queuePlatformFilter)
        return false;
      if (queueStatusFilter !== "all" && p.status !== queueStatusFilter)
        return false;
      return true;
    });
  }, [posts, queuePlatformFilter, queueStatusFilter]);

  // ─── API Actions ───────────────────────────────────────────────────────────

  const refreshTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/dissemination-tasks");
      const data = await res.json();
      if (data.tasks) setDisseminationTasks(data.tasks);
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
    }
  }, [setDisseminationTasks]);

  const refreshPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.error("Failed to refresh posts:", err);
    }
  }, [setPosts]);

  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: string, extra?: Record<string, unknown>) => {
      setLoading(taskId);
      try {
        const res = await fetch(`/api/dissemination-tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, ...extra }),
        });
        if (res.ok) {
          await refreshTasks();
        }
      } catch (err) {
        console.error("Failed to update task:", err);
      } finally {
        setLoading(null);
      }
    },
    [refreshTasks]
  );

  const handleStartTask = useCallback(
    (task: DisseminationTask) => {
      updateTaskStatus(task.id, "in_progress", {
        startedAt: new Date().toISOString(),
      });
    },
    [updateTaskStatus]
  );

  const handleCompleteTask = useCallback(
    (task: DisseminationTask) => {
      setCompletionNotesDialog(task);
      setCompletionNotes("");
    },
    []
  );

  const submitCompletion = useCallback(async () => {
    if (!completionNotesDialog) return;
    await updateTaskStatus(completionNotesDialog.id, "completed", {
      completedAt: new Date().toISOString(),
      completionNotes,
    });
    setCompletionNotesDialog(null);
    setCompletionNotes("");
  }, [completionNotesDialog, completionNotes, updateTaskStatus]);

  const handlePublishTask = useCallback(
    async (task: DisseminationTask) => {
      setLoading(`publish-${task.id}`);
      try {
        const res = await fetch(`/api/dissemination-tasks/${task.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          await refreshTasks();
          await refreshPosts();
        }
      } catch (err) {
        console.error("Failed to publish task:", err);
      } finally {
        setLoading(null);
      }
    },
    [refreshTasks, refreshPosts]
  );

  const handleCreateTask = useCallback(async () => {
    try {
      const res = await fetch("/api/dissemination-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          targetPlatforms: JSON.stringify(newTask.targetPlatforms),
          dueDate: newTask.dueDate || null,
          assigneeId: newTask.assigneeId || null,
          clientId: newTask.clientId || null,
          campaignId: newTask.campaignId || null,
          postContent: newTask.postContent || null,
          hashtags: newTask.hashtags || null,
        }),
      });
      if (res.ok) {
        await refreshTasks();
        setCreateTaskDialog(false);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          targetPlatforms: [],
          dueDate: "",
          assigneeId: "",
          clientId: "",
          campaignId: "",
          postContent: "",
          hashtags: "",
        });
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  }, [newTask, refreshTasks]);

  const handleQuickCompose = useCallback(async () => {
    if (!composeContent || composePlatforms.length === 0) return;
    try {
      for (const platform of composePlatforms) {
        await fetch("/api/dissemination-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Post to ${PLATFORM_CONFIG[platform]?.label || platform}`,
            postContent: composeContent,
            targetPlatforms: JSON.stringify([platform]),
            priority: "medium",
            status: composeScheduledAt ? "pending" : "pending",
            scheduledAt: composeScheduledAt?.toISOString() || null,
            hashtags: composeHashtags || null,
            clientId: composeClientId || null,
            campaignId: composeCampaignId || null,
          }),
        });
      }
      await refreshTasks();
      setComposeContent("");
      setComposePlatforms([]);
      setComposeScheduledAt(undefined);
      setComposeHashtags("");
    } catch (err) {
      console.error("Failed to create posts:", err);
    }
  }, [composeContent, composePlatforms, composeScheduledAt, composeHashtags, composeClientId, composeCampaignId, refreshTasks]);

  // Fetch performance data
  useEffect(() => {
    if (activeTab !== "performance") return;
    const fetchPerformance = async () => {
      setLoading("performance");
      try {
        const res = await fetch("/api/dissemination/performance");
        const data = await res.json();
        setPerformanceData({
          overview: data.overview || null,
          byDisseminator: data.byDisseminator || [],
          byPlatform: data.byPlatform || [],
          weeklyTrend: data.weeklyTrend || [],
        });
      } catch (err) {
        console.error("Failed to fetch performance:", err);
      } finally {
        setLoading(null);
      }
    };
    fetchPerformance();
  }, [activeTab]);

  // ─── KPI Card Component ────────────────────────────────────────────────────

  function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendUp,
    accent,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    trendUp?: boolean;
    accent: string;
  }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <div
            className={`absolute top-0 left-0 w-1 h-full ${accent}`}
          />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {(subtitle || trend) && (
                  <div className="flex items-center gap-1.5">
                    {trend && (
                      <span
                        className={`inline-flex items-center text-xs font-medium ${
                          trendUp ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {trendUp ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {trend}
                      </span>
                    )}
                    {subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {subtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-lg ${accent.replace("bg-", "bg-").replace("-500", "-500/10")}`}>
                <Icon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Star Rating Component ─────────────────────────────────────────────────

  function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200 dark:fill-slate-600 dark:text-slate-600"
            }`}
          />
        ))}
      </div>
    );
  }

  // ─── Platform Badges Component ─────────────────────────────────────────────

  function PlatformBadges({
    platforms,
    size = "sm",
  }: {
    platforms: string[];
    size?: "sm" | "md";
  }) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {platforms.slice(0, 4).map((p) => {
          const config = PLATFORM_CONFIG[p];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <TooltipProvider key={p}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex items-center justify-center rounded-md ${config.bgColor} ${config.borderColor} border ${
                      size === "sm" ? "h-5 w-5" : "h-6 w-6"
                    }`}
                  >
                    <Icon
                      className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}`}
                      style={{ color: config.color }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{config.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {platforms.length > 4 && (
          <span className="text-xs text-muted-foreground">
            +{platforms.length - 4}
          </span>
        )}
      </div>
    );
  }

  // ─── Task Card Component ───────────────────────────────────────────────────

  function TaskCard({ task }: { task: DisseminationTask }) {
    const priorityConf = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const PriorityIcon = priorityConf.icon;
    const isTaskOverdue = isOverdue(task);
    const platforms = parseJsonField<string[]>(task.targetPlatforms, []);
    const assigneeName = task.assignee?.name || "Unassigned";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`group cursor-pointer hover:shadow-md transition-all border ${
            isTaskOverdue ? "border-red-200 dark:border-red-800" : "border-border"
          }`}
          onClick={() => setTaskViewDialog(task)}
        >
          <CardContent className="p-3 space-y-2.5">
            {/* Header: Priority + Title */}
            <div className="flex items-start gap-2">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${priorityConf.bgColor} ${priorityConf.color} shrink-0 mt-0.5`}
              >
                <PriorityIcon className="h-2.5 w-2.5" />
                {priorityConf.label}
              </span>
              <h4 className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                {task.title}
              </h4>
            </div>

            {/* Client */}
            {task.client && (
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-emerald-700">
                    {task.client.name[0]}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {task.client.name}
                </span>
              </div>
            )}

            {/* Platforms */}
            {platforms.length > 0 && (
              <PlatformBadges platforms={platforms} size="sm" />
            )}

            {/* Assignee + Due */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-700">
                    {getInitials(assigneeName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {assigneeName}
                </span>
              </div>
              {task.dueDate && (
                <span
                  className={`text-[10px] font-medium ${
                    isTaskOverdue
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {isTaskOverdue && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
              {task.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => handleStartTask(task)}
                  disabled={loading === task.id}
                >
                  {loading === task.id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Play className="h-2.5 w-2.5" />
                  )}
                  Start
                </Button>
              )}
              {task.status === "in_progress" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleCompleteTask(task)}
                    disabled={loading === task.id}
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2 gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => handlePublishTask(task)}
                    disabled={loading === `publish-${task.id}`}
                  >
                    {loading === `publish-${task.id}` ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Send className="h-2.5 w-2.5" />
                    )}
                    Publish
                  </Button>
                </>
              )}
              {(task.status === "failed" || task.status === "overdue") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 gap-1"
                  onClick={() => handleStartTask(task)}
                  disabled={loading === task.id}
                >
                  <Repeat className="h-2.5 w-2.5" />
                  Retry
                </Button>
              )}
              {task.content && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-1.5"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Linked: {task.content.title}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Disseminator Social Accounts Manager ─────────────────────────────────

  function DisseminatorSocialAccounts({ d }: { d: Disseminator }) {
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [addPlatform, setAddPlatform] = useState("facebook")
    const [addUsername, setAddUsername] = useState("")
    const [addFollowers, setAddFollowers] = useState("0")
    const [connecting, setConnecting] = useState(false)

    // Get social accounts for this disseminator (by userId)
    const myAccounts = socialAccounts.filter((sa) => sa.userId === d.userId)

    // Group by platform
    const accountsByPlatform = useMemo(() => {
      const map: Record<string, typeof socialAccounts> = {}
      for (const sa of myAccounts) {
        if (!map[sa.platform]) map[sa.platform] = []
        map[sa.platform].push(sa)
      }
      return map
    }, [myAccounts])

    const handleConnect = async () => {
      if (!addUsername.trim()) {
        toast.error("Please enter a username")
        return
      }
      setConnecting(true)
      try {
        const res = await fetch("/api/social-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: addPlatform,
            username: addUsername.trim(),
            displayName: addUsername.trim(),
            followers: parseInt(addFollowers) || 0,
            isVerified: false,
            isActive: true,
            userId: d.userId,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setSocialAccounts([...socialAccounts, { ...data, user: d.user }])
          toast.success(`${addPlatform} account connected for ${d.user.name}`)
          setAddUsername("")
          setAddFollowers("0")
          setShowAddDialog(false)
        } else {
          toast.error("Failed to connect account")
        }
      } catch {
        toast.error("Failed to connect account")
      }
      setConnecting(false)
    }

    const handleDisconnect = async (accountId: string, platform: string) => {
      try {
        await fetch(`/api/social-accounts/${accountId}`, { method: "DELETE" })
        setSocialAccounts(socialAccounts.filter((sa) => sa.id !== accountId))
        toast.success(`${platform} account disconnected`)
      } catch {
        toast.error("Failed to disconnect account")
      }
    }

    const PLATFORM_COLORS: Record<string, string> = {
      instagram: "#E4405F", facebook: "#1877F2", twitter: "#1DA1F2",
      linkedin: "#0A66C2", tiktok: "#000000", youtube: "#FF0000",
      pinterest: "#E60023", snapchat: "#FFFC00",
    }

    return (
      <>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Connected Accounts ({myAccounts.length})
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1 rounded-md"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3 w-3" /> Add Account
            </Button>
          </div>

          {myAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No social accounts connected. Click "Add Account" to connect.
            </p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(accountsByPlatform).map(([platform, accounts]) => {
                const color = PLATFORM_COLORS[platform] || "#6b7280"
                return (
                  <div key={platform} className="rounded-md border border-border/40 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {platform} ({accounts.length})
                      </span>
                    </div>
                    {accounts.map((sa) => (
                      <div key={sa.id} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                        <span className="font-medium truncate flex-1">{sa.username}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {sa.followers.toLocaleString()} followers
                        </span>
                        {sa.isVerified && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 gap-0.5">
                            ✓ Verified
                          </Badge>
                        )}
                        <button
                          onClick={() => handleDisconnect(sa.id, platform)}
                          className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Account Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
              <DialogDescription>
                Connect a social account for {d.user.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Platform</Label>
                <Select value={addPlatform} onValueChange={setAddPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                    <SelectItem value="snapchat">Snapchat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Username / Handle</Label>
                <Input
                  placeholder="@username"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Followers</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={addFollowers}
                  onChange={(e) => setAddFollowers(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button
                onClick={handleConnect}
                disabled={connecting || !addUsername.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {connecting ? "Connecting..." : "Connect Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ─── Disseminator Card Component ───────────────────────────────────────────

  function DisseminatorCard({ d }: { d: Disseminator }) {
    const platforms = parseJsonField<string[]>(d.platforms, []);
    const statusConf = DISSEMINATOR_STATUS_CONFIG[d.status] || DISSEMINATOR_STATUS_CONFIG.active;
    const activeTasks = disseminationTasks.filter(
      (t) =>
        (t.disseminatorId === d.id || t.assigneeId === d.userId) &&
        (t.status === "pending" || t.status === "in_progress")
    );
    const workloadPct =
      d.workloadCapacity > 0
        ? Math.min(
            100,
            Math.round((activeTasks.length / d.workloadCapacity) * 100)
          )
        : 0;
    const isExpanded = expandedDisseminator === d.id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={d.user.avatar || undefined} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  {getInitials(d.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold truncate">
                      {d.user.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {d.speciality || "General"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${statusConf.bgColor} ${statusConf.color} shrink-0`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusConf.dotColor} mr-1`}
                    />
                    {statusConf.label}
                  </Badge>
                </div>

                {/* Rating */}
                <StarRating rating={d.rating} size="sm" />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{d.totalTasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-medium">{d.totalPostsPublished}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">On-time</span>
                    <span className="font-medium">{(d.onTimeRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Time</span>
                    <span className="font-medium">{d.avgCompletionHours.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Workload</span>
                    <span className="font-medium">
                      {activeTasks.length}/{d.workloadCapacity}
                    </span>
                  </div>
                  <Progress
                    value={workloadPct}
                    className={`h-1.5 ${
                      workloadPct >= 90
                        ? "[&>div]:bg-red-500"
                        : workloadPct >= 70
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-emerald-500"
                    }`}
                  />
                </div>

                {/* Platforms */}
                {platforms.length > 0 && (
                  <PlatformBadges platforms={platforms} size="sm" />
                )}

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs w-full gap-1 mt-1"
                  onClick={() =>
                    setExpandedDisseminator(isExpanded ? null : d.id)
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {isExpanded ? "Hide Tasks" : "View Tasks"}
                </Button>
              </div>
            </div>

            {/* Expanded: Current Tasks */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Current Tasks ({activeTasks.length})
                    </p>
                    {activeTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No active tasks
                      </p>
                    ) : (
                      activeTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              t.status === "in_progress"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="flex-1 truncate font-medium">
                            {t.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              PRIORITY_CONFIG[t.priority]?.color || ""
                            }`}
                          >
                            {t.priority}
                          </Badge>
                        </div>
                      ))
                    )}

                    {/* Recent completions */}
                    {(() => {
                      const recentComp = disseminationTasks
                        .filter(
                          (t) =>
                            (t.disseminatorId === d.id ||
                              t.assigneeId === d.userId) &&
                            t.status === "completed" &&
                            t.completedAt
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.completedAt!).getTime() -
                            new Date(a.completedAt!).getTime()
                        )
                        .slice(0, 3);
                      if (recentComp.length === 0) return null;
                      return (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
                            Recent Completions
                          </p>
                          {recentComp.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-2 p-2 rounded-md text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span className="flex-1 truncate">
                                {t.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {t.completedAt
                                  ? formatDistanceToNow(
                                      new Date(t.completedAt),
                                      { addSuffix: true }
                                    )
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </>
                      );
                    })()}

                    {/* ── Connected Social Accounts ── */}
                    <DisseminatorSocialAccounts d={d} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dissemination
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage content publishing workflow across all platforms
            </p>
          </div>
          <Button
            onClick={() => setCreateTaskDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col px-6"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          {[
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "board", label: "Task Board", icon: ListChecks },
            { value: "team", label: "Disseminators", icon: Users },
            { value: "queue", label: "Publishing Queue", icon: Send },
            { value: "performance", label: "Performance", icon: TrendingUp },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-emerald-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <tab.icon className="h-4 w-4 mr-1.5 inline" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Tab 1: Overview ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex-1 mt-4 space-y-6 pb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
              title="Active Team"
              value={activeDisseminators.length}
              subtitle={`of ${disseminators.length} total`}
              icon={Users}
              accent="bg-emerald-500"
            />
            <KpiCard
              title="Pending"
              value={pendingTasks.length}
              subtitle="tasks waiting"
              icon={Clock}
              accent="bg-slate-400"
            />
            <KpiCard
              title="In Progress"
              value={inProgressTasks.length}
              subtitle="active now"
              icon={Activity}
              accent="bg-amber-500"
            />
            <KpiCard
              title="Completed"
              value={completedTasksWeek.length}
              subtitle="this week"
              icon={CheckCircle2}
              accent="bg-emerald-500"
            />
            <KpiCard
              title="Overdue"
              value={overdueTasks.length}
              subtitle="need attention"
              icon={AlertTriangle}
              trend={overdueTasks.length > 0 ? "Action needed" : undefined}
              trendUp={false}
              accent="bg-red-500"
            />
            <KpiCard
              title="Publish Rate"
              value={`${publishRate}%`}
              subtitle={`${completedTasks.length} of ${disseminationTasks.length}`}
              icon={TrendingUp}
              trend={publishRate >= 70 ? "On track" : "Below target"}
              trendUp={publishRate >= 70}
              accent="bg-emerald-500"
            />
          </div>

          {/* Disseminator Performance Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Team Performance</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600"
                onClick={() => setActiveTab("team")}
              >
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {disseminators.slice(0, 6).map((d) => (
                <DisseminatorCard key={d.id} d={d} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Card>
              <CardContent className="p-0">
                {recentCompleted.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No completed tasks yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentCompleted.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.assignee?.name || "Unassigned"}
                            {task.client && ` · ${task.client.name}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {task.completedAt
                            ? formatDistanceToNow(new Date(task.completedAt), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Tab 2: Task Board ────────────────────────────────────────── */}
        <TabsContent value="board" className="flex-1 mt-4 space-y-4 pb-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select
              value={boardPriorityFilter}
              onValueChange={setBoardPriorityFilter}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={boardAssigneeFilter}
              onValueChange={setBoardAssigneeFilter}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {disseminators.map((d) => (
                  <SelectItem key={d.id} value={d.userId}>
                    {d.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={boardClientFilter}
              onValueChange={setBoardClientFilter}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(boardPriorityFilter !== "all" ||
              boardAssigneeFilter !== "all" ||
              boardClientFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setBoardPriorityFilter("all");
                  setBoardAssigneeFilter("all");
                  setBoardClientFilter("all");
                }}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {boardColumns.map((col) => {
              const ColIcon =
                col.key === "pending"
                  ? Clock
                  : col.key === "in_progress"
                  ? Activity
                  : col.key === "completed"
                  ? CheckCircle2
                  : AlertTriangle;
              const colColor =
                col.key === "pending"
                  ? "bg-slate-500"
                  : col.key === "in_progress"
                  ? "bg-amber-500"
                  : col.key === "completed"
                  ? "bg-emerald-500"
                  : "bg-red-500";

              return (
                <div key={col.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span
                      className={`h-2 w-2 rounded-full ${colColor}`}
                    />
                    <h4 className="text-sm font-semibold">{col.label}</h4>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5"
                    >
                      {col.tasks.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-2 pr-2">
                      <AnimatePresence mode="popLayout">
                        {col.tasks.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                            No tasks
                          </div>
                        ) : (
                          col.tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Tab 3: Disseminators ─────────────────────────────────────── */}
        <TabsContent value="team" className="flex-1 mt-4 space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Dissemination Team</h3>
              <Badge variant="secondary">{disseminators.length} members</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disseminators.map((d) => (
              <DisseminatorCard key={d.id} d={d} />
            ))}
          </div>

          {disseminators.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  No Disseminators
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add team members to the dissemination team to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 4: Publishing Queue ──────────────────────────────────── */}
        <TabsContent value="queue" className="flex-1 mt-4 space-y-6 pb-6">
          {/* Quick Compose */}
          <Card className="border-emerald-200 dark:border-emerald-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Quick Compose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your post content..."
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{composeContent.length} characters</span>
                  <span>
                    {composePlatforms.length > 0 &&
                      `Limit: ${PLATFORM_CONFIG[composePlatforms[0]]?.charLimit || "N/A"}`}
                  </span>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                    const isSelected = composePlatforms.includes(key);
                    const Icon = config.icon;
                    return (
                      <Button
                        key={key}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`h-8 gap-1.5 text-xs ${
                          isSelected
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : ""
                        }`}
                        onClick={() =>
                          setComposePlatforms((prev) =>
                            prev.includes(key)
                              ? prev.filter((p) => p !== key)
                              : [...prev, key]
                          )
                        }
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Hashtags</Label>
                <Input
                  placeholder="#trending #brand"
                  value={composeHashtags}
                  onChange={(e) => setComposeHashtags(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Client/Campaign */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Client</Label>
                  <Select
                    value={composeClientId}
                    onValueChange={setComposeClientId}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Campaign</Label>
                  <Select
                    value={composeCampaignId}
                    onValueChange={setComposeCampaignId}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No campaign</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedule + Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {composeScheduledAt
                          ? format(composeScheduledAt, "MMM d, h:mm a")
                          : "Schedule"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={composeScheduledAt}
                        onSelect={(d) => {
                          setComposeScheduledAt(d || undefined);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {composeScheduledAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => setComposeScheduledAt(undefined)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleQuickCompose}
                    disabled={!composeContent || composePlatforms.length === 0}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleQuickCompose}
                    disabled={!composeContent || composePlatforms.length === 0}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {composeScheduledAt ? "Schedule" : "Create Task"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={queuePlatformFilter}
              onValueChange={setQueuePlatformFilter}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={queueStatusFilter}
              onValueChange={setQueueStatusFilter}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="publishing">Publishing</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts List */}
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    No Posts in Queue
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use the quick compose above to create new posts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredPosts.map((post) => {
                  const platformConf = PLATFORM_CONFIG[post.platform];
                  const engagement = parseJsonField<Record<string, number>>(
                    post.engagement,
                    {}
                  );
                  const statusColors: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
                    draft: { color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-900/30", icon: FileEdit },
                    scheduled: { color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
                    publishing: { color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20", icon: Send },
                    published: { color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
                    failed: { color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20", icon: AlertCircle },
                  };
                  const sConf = statusColors[post.status] || statusColors.draft;
                  const StatusIcon = sConf.icon;

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Platform Icon */}
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                platformConf?.bgColor || "bg-slate-100 dark:bg-[#2c2c2e]"
                              }`}
                            >
                              {getPlatformIcon(post.platform, "h-4 w-4")}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm line-clamp-2">
                                  {post.content}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 shrink-0 ${sConf.bgColor} ${sConf.color}`}
                                >
                                  <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                                  {post.status}
                                </Badge>
                              </div>

                              {/* Meta */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {platformConf?.label || post.platform}
                                </span>
                                {post.scheduledAt && (
                                  <span className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    {formatScheduleTime(post.scheduledAt)}
                                  </span>
                                )}
                                {post.publishedAt && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    {formatDistanceToNow(
                                      new Date(post.publishedAt),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Engagement */}
                              {post.status === "published" &&
                                engagement &&
                                Object.keys(engagement).length > 0 && (
                                  <div className="flex items-center gap-3 text-xs pt-1">
                                    {engagement.likes !== undefined && (
                                      <span className="flex items-center gap-1 text-rose-500">
                                        <Heart className="h-3 w-3" />
                                        {formatNumber(engagement.likes)}
                                      </span>
                                    )}
                                    {engagement.comments !== undefined && (
                                      <span className="flex items-center gap-1 text-sky-500">
                                        <MessageSquare className="h-3 w-3" />
                                        {formatNumber(engagement.comments)}
                                      </span>
                                    )}
                                    {engagement.shares !== undefined && (
                                      <span className="flex items-center gap-1 text-emerald-500">
                                        <Share2 className="h-3 w-3" />
                                        {formatNumber(engagement.shares)}
                                      </span>
                                    )}
                                    {engagement.views !== undefined && (
                                      <span className="flex items-center gap-1 text-purple-500">
                                        <Eye className="h-3 w-3" />
                                        {formatNumber(engagement.views)}
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 shrink-0"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {post.status === "draft" && (
                                  <DropdownMenuItem>
                                    <Send className="h-3.5 w-3.5 mr-2" />
                                    Publish Now
                                  </DropdownMenuItem>
                                )}
                                {post.status === "scheduled" && (
                                  <DropdownMenuItem>
                                    <Clock className="h-3.5 w-3.5 mr-2" />
                                    Reschedule
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <FileEdit className="h-3.5 w-3.5 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab 5: Performance ───────────────────────────────────────── */}
        <TabsContent
          value="performance"
          className="flex-1 mt-4 space-y-6 pb-6"
        >
          {loading === "performance" ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {performanceData.overview ? (
                  <>
                    <KpiCard
                      title="Total Tasks"
                      value={performanceData.overview.totalTasks}
                      icon={ListChecks}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="Completed"
                      value={performanceData.overview.completedTasks}
                      icon={CheckCircle2}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="Completion Rate"
                      value={`${(performanceData.overview.completionRate * 100).toFixed(0)}%`}
                      icon={Target}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="On-Time Rate"
                      value={`${(performanceData.overview.onTimeRate * 100).toFixed(0)}%`}
                      icon={Timer}
                      accent="bg-amber-500"
                    />
                    <KpiCard
                      title="Avg Completion"
                      value={`${performanceData.overview.avgCompletionHours.toFixed(1)}h`}
                      icon={Clock}
                      accent="bg-slate-400"
                    />
                  </>
                ) : (
                  <>
                    <KpiCard
                      title="Total Tasks"
                      value={disseminationTasks.length}
                      icon={ListChecks}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="Completed"
                      value={completedTasks.length}
                      icon={CheckCircle2}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="Completion Rate"
                      value={`${publishRate}%`}
                      icon={Target}
                      accent="bg-emerald-500"
                    />
                    <KpiCard
                      title="On-Time Rate"
                      value={`${disseminators.length > 0 ? ((disseminators.reduce((a, d) => a + d.onTimeRate, 0) / disseminators.length) * 100).toFixed(0) : 0}%`}
                      icon={Timer}
                      accent="bg-amber-500"
                    />
                    <KpiCard
                      title="Avg Completion"
                      value={`${disseminators.length > 0 ? (disseminators.reduce((a, d) => a + d.avgCompletionHours, 0) / disseminators.length).toFixed(1) : 0}h`}
                      icon={Clock}
                      accent="bg-slate-400"
                    />
                  </>
                )}
              </div>

              {/* Performance by Disseminator */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Performance by Disseminator
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              Tasks
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              Completed
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              On-Time
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              Avg Hours
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                              Rating
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(performanceData.byDisseminator.length > 0
                            ? performanceData.byDisseminator
                            : disseminators.map((d) => ({
                                id: d.id,
                                name: d.user.name,
                                tasks:
                                  disseminationTasks.filter(
                                    (t) =>
                                      t.disseminatorId === d.id ||
                                      t.assigneeId === d.userId
                                  ).length,
                                completed: d.totalTasksCompleted,
                                onTimeRate: d.onTimeRate,
                                avgHours: d.avgCompletionHours,
                                rating: d.rating,
                              }))
                          ).map((row, idx) => (
                            <tr
                              key={row.id || idx}
                              className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                                      {getInitials(row.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {row.name}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4">
                                {row.tasks}
                              </td>
                              <td className="text-center py-3 px-4">
                                {row.completed}
                              </td>
                              <td className="text-center py-3 px-4">
                                <span
                                  className={`font-medium ${
                                    row.onTimeRate >= 0.9
                                      ? "text-emerald-600"
                                      : row.onTimeRate >= 0.7
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {(row.onTimeRate * 100).toFixed(0)}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                {row.avgHours.toFixed(1)}h
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="font-medium">
                                    {row.rating.toFixed(1)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Breakdown */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Platform Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(performanceData.byPlatform.length > 0
                    ? performanceData.byPlatform
                    : (() => {
                        const platformCounts: Record<string, number> = {};
                        disseminationTasks.forEach((t) => {
                          const platforms = parseJsonField<string[]>(
                            t.targetPlatforms,
                            []
                          );
                          platforms.forEach((p) => {
                            platformCounts[p] =
                              (platformCounts[p] || 0) + 1;
                          });
                        });
                        return Object.entries(platformCounts).map(
                          ([platform, tasks]) => ({
                            platform,
                            tasks,
                            completed: disseminationTasks.filter(
                              (t) =>
                                t.status === "completed" &&
                                parseJsonField<string[]>(
                                  t.targetPlatforms,
                                  []
                                ).includes(platform)
                            ).length,
                            completionRate:
                              tasks > 0
                                ? disseminationTasks.filter(
                                    (t) =>
                                      t.status === "completed" &&
                                      parseJsonField<string[]>(
                                        t.targetPlatforms,
                                        []
                                      ).includes(platform)
                                  ).length / tasks
                                : 0,
                          })
                        );
                      })()
                  ).map((item) => {
                    const config = PLATFORM_CONFIG[item.platform];
                    const Icon = config?.icon || Globe;
                    const pct = Math.round(item.completionRate * 100);

                    return (
                      <Card key={item.platform} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                config?.bgColor || "bg-slate-100 dark:bg-[#2c2c2e]"
                              }`}
                            >
                              <Icon
                                className="h-4 w-4"
                                style={{ color: config?.color }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {config?.label || item.platform}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.tasks} tasks
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Completion
                              </span>
                              <span className="font-medium">{pct}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {item.completed} of {item.tasks} completed
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Weekly Trend</h3>
                <Card>
                  <CardContent className="p-6">
                    {performanceData.weeklyTrend.length > 0 ? (
                      <div className="space-y-3">
                        {performanceData.weeklyTrend.map((week, idx) => {
                          const maxTasks = Math.max(
                            ...performanceData.weeklyTrend.map((w) => w.tasks),
                            1
                          );
                          const tasksPct = (week.tasks / maxTasks) * 100;
                          const completedPct =
                            week.tasks > 0
                              ? (week.completed / week.tasks) * 100
                              : 0;

                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">
                                  {week.week}
                                </span>
                                <span className="text-muted-foreground">
                                  {week.completed}/{week.tasks} completed
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                                  <div
                                    className="h-full bg-emerald-500/20 rounded transition-all"
                                    style={{ width: `${tasksPct}%` }}
                                  />
                                  <div
                                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded transition-all"
                                    style={{
                                      width: `${(completedPct / 100) * tasksPct}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fallback: show last 8 weeks from task data */
                      (() => {
                        const weeks: { label: string; created: number; completed: number }[] = [];
                        const now = new Date();
                        for (let i = 7; i >= 0; i--) {
                          const weekStart = startOfWeek(
                            new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
                          );
                          const weekEnd = endOfWeek(weekStart);
                          const label = format(weekStart, "MMM d");
                          const created = disseminationTasks.filter(
                            (t) => {
                              const d = new Date(t.createdAt);
                              return d >= weekStart && d <= weekEnd;
                            }
                          ).length;
                          const completed = disseminationTasks.filter(
                            (t) => {
                              if (!t.completedAt) return false;
                              const d = new Date(t.completedAt);
                              return d >= weekStart && d <= weekEnd;
                            }
                          ).length;
                          weeks.push({ label, created, completed });
                        }
                        const maxVal = Math.max(...weeks.map((w) => w.created), 1);

                        return (
                          <div className="space-y-3">
                            {weeks.map((week, idx) => {
                              const barPct = (week.created / maxVal) * 100;
                              const completedPct =
                                week.created > 0
                                  ? (week.completed / week.created) * 100
                                  : 0;

                              return (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium w-16">
                                      {week.label}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {week.completed}/{week.created} completed
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                                      <div
                                        className="h-full bg-emerald-500/20 rounded transition-all"
                                        style={{ width: `${barPct}%` }}
                                      />
                                      <div
                                        className="absolute top-0 left-0 h-full bg-emerald-500 rounded transition-all"
                                        style={{
                                          width: `${(completedPct / 100) * barPct}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Task View Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!taskViewDialog}
        onOpenChange={(open) => !open && setTaskViewDialog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {taskViewDialog?.title}
              {taskViewDialog && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    PRIORITY_CONFIG[taskViewDialog.priority]?.color || ""
                  }`}
                >
                  {taskViewDialog.priority}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {taskViewDialog && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  className={`${
                    TASK_STATUS_CONFIG[taskViewDialog.status]?.bgColor || ""
                  } ${
                    TASK_STATUS_CONFIG[taskViewDialog.status]?.color || ""
                  }`}
                >
                  {TASK_STATUS_CONFIG[taskViewDialog.status]?.label ||
                    taskViewDialog.status}
                </Badge>
              </div>

              {/* Description */}
              {taskViewDialog.description && (
                <p className="text-sm text-muted-foreground">
                  {taskViewDialog.description}
                </p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {taskViewDialog.assignee && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Assignee
                    </p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-700">
                          {getInitials(taskViewDialog.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{taskViewDialog.assignee.name}</span>
                    </div>
                  </div>
                )}
                {taskViewDialog.client && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Client
                    </p>
                    <span className="font-medium">
                      {taskViewDialog.client.name}
                    </span>
                  </div>
                )}
                {taskViewDialog.campaign && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Campaign
                    </p>
                    <span className="font-medium">
                      {taskViewDialog.campaign.name}
                    </span>
                  </div>
                )}
                {taskViewDialog.dueDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Due Date
                    </p>
                    <span
                      className={`font-medium ${
                        isOverdue(taskViewDialog) ? "text-red-600" : ""
                      }`}
                    >
                      {format(new Date(taskViewDialog.dueDate), "MMM d, yyyy")}
                      {isOverdue(taskViewDialog) && " (Overdue)"}
                    </span>
                  </div>
                )}
                {taskViewDialog.scheduledAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Scheduled
                    </p>
                    <span className="font-medium">
                      {formatScheduleTime(taskViewDialog.scheduledAt)}
                    </span>
                  </div>
                )}
                {taskViewDialog.content && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Linked Content
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <FileEdit className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium">
                        {taskViewDialog.content.title}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1">
                        {taskViewDialog.content.type}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Platforms */}
              {taskViewDialog.targetPlatforms && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Target Platforms
                  </p>
                  <PlatformBadges
                    platforms={parseJsonField<string[]>(
                      taskViewDialog.targetPlatforms,
                      []
                    )}
                    size="md"
                  />
                </div>
              )}

              {/* Post Content */}
              {taskViewDialog.postContent && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Post Content
                  </p>
                  <div className="p-3 rounded-md bg-muted/50 text-sm">
                    {taskViewDialog.postContent}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {taskViewDialog.hashtags && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Hashtags
                  </p>
                  <p className="text-sm text-emerald-600">
                    {taskViewDialog.hashtags}
                  </p>
                </div>
              )}

              {/* Failure Reason */}
              {taskViewDialog.failureReason && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Failure Reason
                  </p>
                  <p className="text-sm text-red-600">
                    {taskViewDialog.failureReason}
                  </p>
                </div>
              )}

              {/* Completion Notes */}
              {taskViewDialog.completionNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Completion Notes
                  </p>
                  <p className="text-sm">{taskViewDialog.completionNotes}</p>
                </div>
              )}

              {/* Engagement */}
              {taskViewDialog.engagement && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Engagement
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    {(() => {
                      const eng = parseJsonField<Record<string, number>>(
                        taskViewDialog.engagement,
                        {}
                      );
                      return Object.entries(eng).map(([key, val]) => (
                        <span key={key} className="flex items-center gap-1">
                          {key === "likes" && (
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                          )}
                          {key === "comments" && (
                            <MessageSquare className="h-3.5 w-3.5 text-sky-500" />
                          )}
                          {key === "shares" && (
                            <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {key === "views" && (
                            <Eye className="h-3.5 w-3.5 text-purple-500" />
                          )}
                          <span className="font-medium">
                            {formatNumber(val)}
                          </span>
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <Separator />
              <div className="flex items-center gap-2 justify-end">
                {taskViewDialog.status === "pending" && (
                  <Button
                    onClick={() => {
                      handleStartTask(taskViewDialog);
                      setTaskViewDialog(null);
                    }}
                    className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Play className="h-4 w-4" />
                    Start Task
                  </Button>
                )}
                {taskViewDialog.status === "in_progress" && (
                  <>
                    <Button
                      onClick={() => {
                        handleCompleteTask(taskViewDialog);
                        setTaskViewDialog(null);
                      }}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </Button>
                    <Button
                      onClick={() => {
                        handlePublishTask(taskViewDialog);
                        setTaskViewDialog(null);
                      }}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                      Publish
                    </Button>
                  </>
                )}
                {(taskViewDialog.status === "failed" ||
                  taskViewDialog.status === "overdue") && (
                  <Button
                    onClick={() => {
                      handleStartTask(taskViewDialog);
                      setTaskViewDialog(null);
                    }}
                    className="gap-1.5"
                  >
                    <Repeat className="h-4 w-4" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Create Task Dialog ──────────────────────────────────────────── */}
      <Dialog open={createTaskDialog} onOpenChange={setCreateTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Dissemination Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Title *</Label>
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="Task description..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) =>
                    setNewTask({ ...newTask, priority: v })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Target Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                  const isSelected = newTask.targetPlatforms.includes(key);
                  const Icon = config.icon;
                  return (
                    <Button
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-7 gap-1 text-xs ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : ""
                      }`}
                      onClick={() =>
                        setNewTask({
                          ...newTask,
                          targetPlatforms: newTask.targetPlatforms.includes(key)
                            ? newTask.targetPlatforms.filter((p) => p !== key)
                            : [...newTask.targetPlatforms, key],
                        })
                      }
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Assignee</Label>
                <Select
                  value={newTask.assigneeId}
                  onValueChange={(v) =>
                    setNewTask({ ...newTask, assigneeId: v })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {disseminators.map((d) => (
                      <SelectItem key={d.id} value={d.userId}>
                        {d.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Client</Label>
                <Select
                  value={newTask.clientId}
                  onValueChange={(v) =>
                    setNewTask({ ...newTask, clientId: v })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Post Content</Label>
              <Textarea
                placeholder="Content to publish..."
                value={newTask.postContent}
                onChange={(e) =>
                  setNewTask({ ...newTask, postContent: e.target.value })
                }
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Hashtags</Label>
              <Input
                placeholder="#trending #brand"
                value={newTask.hashtags}
                onChange={(e) =>
                  setNewTask({ ...newTask, hashtags: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateTaskDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTask.title}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Completion Notes Dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!completionNotesDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCompletionNotesDialog(null);
            setCompletionNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark &quot;{completionNotesDialog?.title}&quot; as completed.
              Optionally add completion notes.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Completion Notes</Label>
              <Textarea
                placeholder="Add any notes about the completion..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompletionNotesDialog(null);
                setCompletionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCompletion}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
