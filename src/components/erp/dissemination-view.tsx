"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useERPStore, type Post, type SocialAccount, type Platform, type PostStatus } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Send,
  Clock,
  FileEdit,
  AlertCircle,
  CheckCircle2,
  CalendarIcon,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  XCircle,
  Zap,
  ChevronDown,
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
  Upload,
  Timer,
  ArrowUpRight,
  Users,
  Verified,
  Rocket,
  CalendarClock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInMinutes } from "date-fns";

// ─── Platform Configuration ──────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  charLimit: number;
}> = {
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

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Draft", color: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-800", icon: FileEdit },
  scheduled: { label: "Scheduled", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
  publishing: { label: "Publishing", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20", icon: Send },
  published: { label: "Published", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-900/20", icon: AlertCircle },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function parseEngagement(engagement: string | null): Record<string, number> | null {
  if (!engagement) return null;
  try {
    if (typeof engagement === "string") return JSON.parse(engagement);
    return engagement as unknown as Record<string, number>;
  } catch {
    return null;
  }
}

function getPlatformIcon(platform: Platform, className?: string) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return <Globe className={className} />;
  const Icon = config.icon;
  return <Icon className={className} />;
}

function getPlatformColor(platform: Platform): string {
  return PLATFORM_CONFIG[platform]?.color || "#6b7280";
}

function formatScheduleTime(dateStr: string | null): string {
  if (!dateStr) return "No time set";
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
  return format(date, "MMM d 'at' h:mm a");
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

// KPI Stat Card
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {subtitle}
                </p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Platform Badge
function PlatformBadge({ platform, count, isActive, onClick }: { platform: Platform; count: number; isActive: boolean; onClick: () => void }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
        isActive
          ? `${config.bgColor} border-current`
          : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
      }`}
      style={isActive ? { color: config.color, borderColor: config.color + "40" } : undefined}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 dark:bg-black/20" : "bg-muted"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Scheduled Post Card
function ScheduledPostCard({ post, onAction }: { post: Post; onAction: (action: string, post: Post) => void }) {
  const config = PLATFORM_CONFIG[post.platform as Platform];
  const statusConfig = STATUS_CONFIG[post.status];
  const StatusIcon = statusConfig?.icon || Clock;
  const PlatformIcon = config?.icon || Globe;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-all duration-200 border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (config?.color || "#6b7280") + "15" }}
              >
                <PlatformIcon className="h-4.5 w-4.5" style={{ color: config?.color }} />
              </div>
              <div className="w-px h-full bg-border/50 min-h-[20px]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold ${statusConfig?.bgColor} ${statusConfig?.color} border-0`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      @{post.socialAccount?.username || "unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                    {post.content}
                  </p>
                  {post.scheduledAt && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      <span>{formatScheduleTime(post.scheduledAt)}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{formatDistanceToNow(new Date(post.scheduledAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onAction("edit", post)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction("reschedule", post)}>
                      <CalendarClock className="mr-2 h-3.5 w-3.5" /> Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction("publish_now", post)}>
                      <Zap className="mr-2 h-3.5 w-3.5" /> Publish Now
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction("cancel", post)} className="text-rose-600">
                      <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Published Post Card with Engagement
function PublishedPostCard({ post }: { post: Post }) {
  const config = PLATFORM_CONFIG[post.platform as Platform];
  const PlatformIcon = config?.icon || Globe;
  const engagement = parseEngagement(post.engagement);

  const engagementMetrics = useMemo(() => {
    if (!engagement) return [];
    const metrics: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }[] = [];
    if (engagement.likes !== undefined) metrics.push({ label: "Likes", value: engagement.likes, icon: Heart });
    if (engagement.comments !== undefined) metrics.push({ label: "Comments", value: engagement.comments, icon: MessageSquare });
    if (engagement.shares !== undefined) metrics.push({ label: "Shares", value: engagement.shares, icon: Share2 });
    if (engagement.retweets !== undefined) metrics.push({ label: "Retweets", value: engagement.retweets, icon: Share2 });
    if (engagement.saves !== undefined) metrics.push({ label: "Saves", value: engagement.saves, icon: Bookmark });
    if (engagement.views !== undefined) metrics.push({ label: "Views", value: engagement.views, icon: Eye });
    if (engagement.impressions !== undefined) metrics.push({ label: "Impressions", value: engagement.impressions, icon: Eye });
    return metrics;
  }, [engagement]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-all duration-200 border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: (config?.color || "#6b7280") + "15" }}
            >
              <PlatformIcon className="h-4.5 w-4.5" style={{ color: config?.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-0"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Published
                </Badge>
                <span className="text-xs text-muted-foreground">
                  @{post.socialAccount?.username || "unknown"}
                </span>
                {post.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed line-clamp-2 mb-2">
                {post.content}
              </p>
              {engagementMetrics.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {engagementMetrics.map((metric) => {
                    const MetricIcon = metric.icon;
                    return (
                      <div key={metric.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MetricIcon className="h-3 w-3" />
                        <span className="font-medium text-foreground">{formatNumber(metric.value)}</span>
                        <span>{metric.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DisseminationView() {
  const { posts, socialAccounts, setPosts, currentUser } = useERPStore();

  // Local state
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [queueTab, setQueueTab] = useState<string>("scheduled");
  const [composerOpen, setComposerOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  // Composer state
  const [composerContent, setComposerContent] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ─── Computed Data ──────────────────────────────────────────────────────────

  const publishedPosts = useMemo(() =>
    posts.filter((p) => p.status === "published"),
    [posts]
  );

  const scheduledPosts = useMemo(() =>
    posts
      .filter((p) => p.status === "scheduled")
      .sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return aTime - bTime;
      }),
    [posts]
  );

  const draftPosts = useMemo(() =>
    posts.filter((p) => p.status === "draft"),
    [posts]
  );

  const failedPosts = useMemo(() =>
    posts.filter((p) => p.status === "failed"),
    [posts]
  );

  const publishedToday = useMemo(() =>
    posts.filter((p) => {
      if (p.status !== "published" || !p.publishedAt) return false;
      return isToday(new Date(p.publishedAt));
    }),
    [posts]
  );

  const nextScheduledPost = useMemo(() => {
    const now = new Date();
    const upcoming = scheduledPosts
      .filter((p) => p.scheduledAt && new Date(p.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    return upcoming[0] || null;
  }, [scheduledPosts]);

  const nextScheduledIn = useMemo(() => {
    if (!nextScheduledPost?.scheduledAt) return null;
    const minutes = differenceInMinutes(new Date(nextScheduledPost.scheduledAt), new Date());
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d`;
  }, [nextScheduledPost]);

  // Platform counts for filter tabs
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: posts.length };
    posts.forEach((post) => {
      counts[post.platform] = (counts[post.platform] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Filtered posts
  const filteredScheduledPosts = useMemo(() =>
    platformFilter === "all"
      ? scheduledPosts
      : scheduledPosts.filter((p) => p.platform === platformFilter),
    [scheduledPosts, platformFilter]
  );

  const filteredPublishedPosts = useMemo(() => {
    let filtered = publishedPosts;
    if (platformFilter !== "all") {
      filtered = filtered.filter((p) => p.platform === platformFilter);
    }
    return filtered.sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [publishedPosts, platformFilter]);

  // Group accounts by platform
  const accountsByPlatform = useMemo(() => {
    const groups: Record<string, SocialAccount[]> = {};
    socialAccounts
      .filter((a) => a.isActive)
      .forEach((account) => {
        if (!groups[account.platform]) groups[account.platform] = [];
        groups[account.platform].push(account);
      });
    return groups;
  }, [socialAccounts]);

  // Selected platforms from composer (derived from selected accounts)
  const selectedPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    selectedAccountIds.forEach((id) => {
      const account = socialAccounts.find((a) => a.id === id);
      if (account) platforms.add(account.platform);
    });
    return Array.from(platforms);
  }, [selectedAccountIds, socialAccounts]);

  // Character limits
  const charLimits = useMemo(() => {
    if (selectedPlatforms.length === 0) return null;
    return Math.min(...selectedPlatforms.map((p) => PLATFORM_CONFIG[p as Platform]?.charLimit || 2200));
  }, [selectedPlatforms]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handlePostAction = useCallback(async (action: string, post: Post) => {
    try {
      if (action === "publish_now") {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "published",
            publishedAt: new Date().toISOString(),
            actorId: currentUser?.id || "user-1",
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPosts(posts.map((p) => p.id === post.id ? { ...p, status: "published", publishedAt: updated.publishedAt } : p));
        }
      } else if (action === "cancel") {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "draft",
            scheduledAt: null,
            actorId: currentUser?.id || "user-1",
          }),
        });
        if (res.ok) {
          setPosts(posts.map((p) => p.id === post.id ? { ...p, status: "draft" as PostStatus, scheduledAt: null } : p));
        }
      } else if (action === "retry" || action === "reschedule") {
        // For retry, reset to draft; for reschedule, open composer pre-filled
        const res = await fetch(`/api/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "draft",
            failureReason: null,
            actorId: currentUser?.id || "user-1",
          }),
        });
        if (res.ok) {
          setPosts(posts.map((p) => p.id === post.id ? { ...p, status: "draft" as PostStatus, failureReason: null } : p));
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  }, [posts, setPosts, currentUser]);

  const handleToggleAccount = useCallback((accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }, []);

  const handleSelectPlatformAccounts = useCallback((platform: string, accounts: SocialAccount[]) => {
    const platformAccountIds = accounts.map((a) => a.id);
    const allSelected = platformAccountIds.every((id) => selectedAccountIds.includes(id));

    if (allSelected) {
      setSelectedAccountIds((prev) => prev.filter((id) => !platformAccountIds.includes(id)));
    } else {
      setSelectedAccountIds((prev) => {
        const newSet = new Set(prev);
        platformAccountIds.forEach((id) => newSet.add(id));
        return Array.from(newSet);
      });
    }
  }, [selectedAccountIds]);

  const handleSubmitPost = useCallback(async (status: "draft" | "scheduled") => {
    if (!composerContent.trim() || selectedAccountIds.length === 0) return;
    setIsSubmitting(true);

    try {
      // Create a post for each selected account
      const createdPosts = await Promise.all(
        selectedAccountIds.map(async (accountId) => {
          const account = socialAccounts.find((a) => a.id === accountId);
          if (!account) return null;

          let scheduledAt = null;
          if (status === "scheduled" && scheduledDate) {
            const [hours, minutes] = scheduledTime.split(":").map(Number);
            const date = new Date(scheduledDate);
            date.setHours(hours, minutes, 0, 0);
            scheduledAt = date.toISOString();
          }

          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: composerContent,
              platform: account.platform,
              status,
              socialAccountId: account.id,
              scheduledAt,
              userId: currentUser?.id || "user-1",
            }),
          });

          return res.ok ? await res.json() : null;
        })
      );

      // Reload posts
      const postsRes = await fetch("/api/posts");
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (postsData.posts) setPosts(postsData.posts);
      }

      // Reset composer
      setComposerContent("");
      setSelectedAccountIds([]);
      setScheduledDate(undefined);
      setScheduledTime("12:00");
      setComposerOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [composerContent, selectedAccountIds, scheduledDate, scheduledTime, socialAccounts, currentUser, setPosts]);

  const activePlatforms = Object.keys(accountsByPlatform) as Platform[];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ── Top Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          title="Published Today"
          value={publishedToday.length}
          icon={Rocket}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          subtitle={`${publishedPosts.length} total published`}
          trend={publishedToday.length > 0 ? `${publishedToday.length} new today` : undefined}
        />
        <KpiCard
          title="Scheduled"
          value={scheduledPosts.length}
          icon={CalendarClock}
          iconColor="text-amber-600"
          iconBg="bg-amber-500/10"
          subtitle={nextScheduledIn ? `Next in ${nextScheduledIn}` : "No upcoming"}
        />
        <KpiCard
          title="Draft Queue"
          value={draftPosts.length}
          icon={FileEdit}
          iconColor="text-slate-500"
          iconBg="bg-slate-500/10"
          subtitle="Ready to schedule"
        />
        <KpiCard
          title="Failed"
          value={failedPosts.length}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-500/10"
          subtitle={failedPosts.length > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      {/* ── Quick Post Composer ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold">Quick Compose</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setComposerOpen(!composerOpen)}
              >
                {composerOpen ? "Minimize" : "Expand"}
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${composerOpen ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {composerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0 space-y-4">
                  {/* Platform / Account Selector Row */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Select Accounts</Label>
                      <Dialog open={accountPickerOpen} onOpenChange={setAccountPickerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Users className="h-3 w-3" />
                            {selectedAccountIds.length > 0
                              ? `${selectedAccountIds.length} account${selectedAccountIds.length > 1 ? "s" : ""}`
                              : "Choose"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Select Accounts</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 py-2">
                              {Object.entries(accountsByPlatform).map(([platform, accounts]) => {
                                const config = PLATFORM_CONFIG[platform as Platform];
                                const Icon = config?.icon || Globe;
                                const allSelected = accounts.every((a) => selectedAccountIds.includes(a.id));

                                return (
                                  <div key={platform} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" style={{ color: config?.color }} />
                                        <span className="text-sm font-medium">{config?.label}</span>
                                        <Badge variant="secondary" className="text-[10px]">{accounts.length}</Badge>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={() => handleSelectPlatformAccounts(platform, accounts)}
                                      >
                                        {allSelected ? "Deselect All" : "Select All"}
                                      </Button>
                                    </div>
                                    <div className="space-y-1.5 pl-6">
                                      {accounts.map((account) => (
                                        <label
                                          key={account.id}
                                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                        >
                                          <Checkbox
                                            checked={selectedAccountIds.includes(account.id)}
                                            onCheckedChange={() => handleToggleAccount(account.id)}
                                          />
                                          <Avatar className="h-7 w-7">
                                            <AvatarFallback className="text-[10px]" style={{ backgroundColor: config?.color + "20", color: config?.color }}>
                                              {account.displayName?.[0] || account.username[0]}
                                            </AvatarFallback>
                                            {account.avatar && <AvatarImage src={account.avatar} />}
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-sm font-medium truncate">{account.displayName || account.username}</span>
                                              {account.isVerified && (
                                                <Verified className="h-3 w-3 text-blue-500 fill-blue-500" />
                                              )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {account.username} · {formatNumber(account.followers)} followers
                                            </span>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                    <Separator />
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Selected accounts chips */}
                    {selectedAccountIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAccountIds.map((id) => {
                          const account = socialAccounts.find((a) => a.id === id);
                          if (!account) return null;
                          const config = PLATFORM_CONFIG[account.platform as Platform];
                          const Icon = config?.icon || Globe;
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="gap-1 text-xs pr-1"
                              style={{ backgroundColor: config?.color + "10", color: config?.color }}
                            >
                              <Icon className="h-3 w-3" />
                              {account.username}
                              <button
                                onClick={() => handleToggleAccount(id)}
                                className="ml-0.5 h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 inline-flex items-center justify-center"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick platform toggle buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {activePlatforms.map((platform) => {
                        const config = PLATFORM_CONFIG[platform];
                        const Icon = config?.icon || Globe;
                        const platformAccounts = accountsByPlatform[platform] || [];
                        const allSelected = platformAccounts.every((a) => selectedAccountIds.includes(a.id));
                        return (
                          <TooltipProvider key={platform}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleSelectPlatformAccounts(platform, platformAccounts)}
                                  className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                                    allSelected
                                      ? `${config?.bgColor} border-current`
                                      : "bg-muted/30 border-border/50 hover:bg-muted/60"
                                  }`}
                                  style={allSelected ? { color: config?.color, borderColor: config?.color + "40" } : undefined}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {config?.label}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {allSelected ? `Deselect all ${config?.label} accounts` : `Select all ${config?.label} accounts`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content Text Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Content</Label>
                      {charLimits !== null && (
                        <span className={`text-xs font-mono ${
                          composerContent.length > charLimits ? "text-rose-500 font-bold" : "text-muted-foreground"
                        }`}>
                          {composerContent.length}/{charLimits}
                        </span>
                      )}
                    </div>
                    <Textarea
                      placeholder="What's on your mind? Write your post content here..."
                      className="min-h-[100px] resize-none bg-background/50"
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                    />
                    {selectedPlatforms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedPlatforms.map((platform) => {
                          const config = PLATFORM_CONFIG[platform as Platform];
                          const Icon = config?.icon || Globe;
                          const limit = config?.charLimit || 2200;
                          const over = composerContent.length > limit;
                          const percentage = Math.min((composerContent.length / limit) * 100, 100);
                          return (
                            <div key={platform} className="flex items-center gap-1.5 text-xs">
                              <Icon className="h-3 w-3" style={{ color: config?.color }} />
                              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: over ? "#ef4444" : config?.color,
                                  }}
                                />
                              </div>
                              <span className={over ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                                {composerContent.length}/{limit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Media Upload Area */}
                  <div className="border-2 border-dashed border-border/50 rounded-xl p-6 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Drop media here or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Images, videos, and GIFs · Max 50MB per file
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Actions Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Date Picker */}
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 gap-1.5 text-xs ${scheduledDate ? "border-emerald-500/30 text-emerald-600" : ""}`}
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {scheduledDate ? format(scheduledDate, "MMM d, yyyy") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={(date) => {
                              setScheduledDate(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Time Picker */}
                      {scheduledDate && (
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="h-8 w-28 text-xs"
                        />
                      )}

                      {scheduledDate && (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-0">
                          <Timer className="h-3 w-3 mr-1" />
                          {formatScheduleTime(new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`).toISOString())}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => handleSubmitPost("draft")}
                        disabled={isSubmitting || !composerContent.trim() || selectedAccountIds.length === 0}
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        Save Draft
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleSubmitPost("scheduled")}
                        disabled={isSubmitting || !composerContent.trim() || selectedAccountIds.length === 0 || !scheduledDate}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                        onClick={async () => {
                          // Post now = schedule for immediately
                          setScheduledDate(new Date());
                          setScheduledTime(format(new Date(), "HH:mm"));
                          // Directly publish
                          if (!composerContent.trim() || selectedAccountIds.length === 0) return;
                          setIsSubmitting(true);
                          try {
                            await Promise.all(
                              selectedAccountIds.map(async (accountId) => {
                                const account = socialAccounts.find((a) => a.id === accountId);
                                if (!account) return null;
                                const res = await fetch("/api/posts", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    content: composerContent,
                                    platform: account.platform,
                                    status: "scheduled",
                                    socialAccountId: account.id,
                                    scheduledAt: new Date().toISOString(),
                                    userId: currentUser?.id || "user-1",
                                  }),
                                });
                                return res.ok ? await res.json() : null;
                              })
                            );
                            const postsRes = await fetch("/api/posts");
                            if (postsRes.ok) {
                              const postsData = await postsRes.json();
                              if (postsData.posts) setPosts(postsData.posts);
                            }
                            setComposerContent("");
                            setSelectedAccountIds([]);
                            setScheduledDate(undefined);
                            setScheduledTime("12:00");
                            setComposerOpen(false);
                          } catch (error) {
                            console.error("Failed to post:", error);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting || !composerContent.trim() || selectedAccountIds.length === 0}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Post Now
                      </Button>
                    </div>
                  </div>

                  {/* Platform Previews */}
                  {selectedPlatforms.length > 0 && composerContent.trim() && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Platform Previews</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedPlatforms.map((platform) => {
                          const config = PLATFORM_CONFIG[platform as Platform];
                          const Icon = config?.icon || Globe;
                          const limit = config?.charLimit || 2200;
                          const over = composerContent.length > limit;
                          const accountsForPlatform = accountsByPlatform[platform] || [];
                          const selectedForPlatform = accountsForPlatform.filter((a) => selectedAccountIds.includes(a.id));

                          return (
                            <div
                              key={platform}
                              className={`rounded-xl border-2 p-3 space-y-2 ${
                                over ? "border-rose-500/30 bg-rose-500/5" : `${config?.borderColor} ${config?.bgColor}`
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Icon className="h-3.5 w-3.5" style={{ color: config?.color }} />
                                  <span className="text-xs font-semibold">{config?.label}</span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${over ? "bg-rose-100 text-rose-600 dark:bg-rose-900/20" : ""}`}
                                >
                                  {over ? "Over limit!" : `${composerContent.length}/${limit}`}
                                </Badge>
                              </div>
                              <div className="bg-background/50 rounded-lg p-2.5">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[8px]" style={{ backgroundColor: config?.color + "20", color: config?.color }}>
                                      {selectedForPlatform[0]?.displayName?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] font-medium">
                                    {selectedForPlatform[0]?.displayName || "Account"}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed line-clamp-4">
                                  {composerContent}
                                </p>
                              </div>
                              {selectedForPlatform.length > 1 && (
                                <p className="text-[10px] text-muted-foreground">
                                  +{selectedForPlatform.length - 1} more account{selectedForPlatform.length > 2 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed composer bar */}
          {!composerOpen && (
            <CardContent className="pt-0">
              <div
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setComposerOpen(true)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {currentUser?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground flex-1">
                  Compose a new post across your connected accounts...
                </span>
                <Button size="sm" className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="h-3 w-3" />
                  Create
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* ── Platform Filter Tabs ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setPlatformFilter("all")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
              platformFilter === "all"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            All Platforms
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
              {platformCounts.all || 0}
            </span>
          </button>
          {activePlatforms.map((platform) => (
            <PlatformBadge
              key={platform}
              platform={platform}
              count={platformCounts[platform] || 0}
              isActive={platformFilter === platform}
              onClick={() => setPlatformFilter(platformFilter === platform ? "all" : platform)}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Post Queue ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Post Queue</CardTitle>
              <div className="flex items-center gap-2">
                {failedPosts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={async () => {
                      // Retry all failed posts
                      await Promise.all(
                        failedPosts.map((post) => handlePostAction("retry", post))
                      );
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry All Failed ({failedPosts.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={queueTab} onValueChange={setQueueTab}>
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="scheduled" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Scheduled Queue
                  {scheduledPosts.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-1">
                      {scheduledPosts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published" className="text-xs gap-1.5 data-[state=active]:bg-background">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published History
                  {publishedPosts.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-1">
                      {publishedPosts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Scheduled Queue */}
              <TabsContent value="scheduled" className="mt-4">
                {/* Failed posts section */}
                {failedPosts.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                      Failed Posts ({failedPosts.length})
                    </div>
                    <div className="space-y-2">
                      {failedPosts.map((post) => (
                        <Card key={post.id} className="border-rose-500/20 bg-rose-500/5">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: getPlatformColor(post.platform as Platform) + "15" }}
                              >
                                {getPlatformIcon(post.platform as Platform, "h-4 w-4")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm line-clamp-1">{post.content}</p>
                                <p className="text-xs text-rose-500 mt-0.5">
                                  {post.failureReason || "Unknown error"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 shrink-0"
                                onClick={() => handlePostAction("retry", post)}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Retry
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                )}

                {filteredScheduledPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                      <CalendarClock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No scheduled posts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {platformFilter !== "all"
                        ? `No scheduled posts for ${PLATFORM_CONFIG[platformFilter as Platform]?.label}`
                        : "Create a new post to get started"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-1">
                      <AnimatePresence>
                        {filteredScheduledPosts.map((post) => (
                          <ScheduledPostCard
                            key={post.id}
                            post={post}
                            onAction={handlePostAction}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* Published History */}
              <TabsContent value="published" className="mt-4">
                {filteredPublishedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No published posts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Published posts will appear here with engagement metrics
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-1">
                      <AnimatePresence>
                        {filteredPublishedPosts.map((post) => (
                          <PublishedPostCard key={post.id} post={post} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

