"use client";

import React from "react";
import { useERPStore, type ContentStage, type ActivityLog } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  FileText,
  Send,
  Clock,
  Rocket,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  MessageSquare,
  UserPlus,
  CalendarCheck,
  Share2,
  Workflow,
  Users,
  ShieldCheck,
  Scissors,
  Lightbulb,
  Palette,
  Zap,
  ClipboardCheck,
  ArrowRight,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  AlertCircle,
} from "lucide-react";
import { AnimatedCounter } from "@/components/erp/animated-counter";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ── Pipeline stage configuration ────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "idea" as ContentStage, label: "Idea", icon: Lightbulb, color: "#10b981" },
  { key: "design" as ContentStage, label: "Design", icon: Palette, color: "#14b8a6" },
  { key: "edit" as ContentStage, label: "Edit", icon: Scissors, color: "#06b6d4" },
  { key: "review" as ContentStage, label: "Review", icon: Eye, color: "#f59e0b" },
  { key: "approve" as ContentStage, label: "Approve", icon: CheckCircle2, color: "#22c55e" },
  { key: "disseminate" as ContentStage, label: "Disseminate", icon: Send, color: "#0d9488" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  snapchat: "#FFFC00",
};

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Globe,
  youtube: Globe,
  pinterest: Globe,
  snapchat: Globe,
};

// ── Activity icon helper ────────────────────────────────────────────
function getActivityIcon(action: string, entity?: string) {
  const lower = action.toLowerCase();
  const entityLower = (entity ?? "").toLowerCase();

  if (lower.includes("approve") || lower.includes("accept") || lower.includes("complete"))
    return { icon: CheckCircle2, color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40" };
  if (lower.includes("reject") || lower.includes("deny"))
    return { icon: ShieldCheck, color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (lower.includes("review"))
    return { icon: Eye, color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40" };

  if (lower.includes("create") || lower.includes("add") || lower.includes("new"))
    return { icon: Plus, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40" };
  if (lower.includes("edit") || lower.includes("update") || lower.includes("modify"))
    return { icon: Edit3, color: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40" };
  if (lower.includes("delete") || lower.includes("remove"))
    return { icon: Trash2, color: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40" };
  if (lower.includes("comment") || lower.includes("reply"))
    return { icon: MessageSquare, color: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40" };
  if (lower.includes("assign") || lower.includes("member") || lower.includes("join"))
    return { icon: UserPlus, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/40" };
  if (lower.includes("schedule") || lower.includes("calendar"))
    return { icon: CalendarCheck, color: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40" };
  if (lower.includes("publish") || lower.includes("share") || lower.includes("send"))
    return { icon: Share2, color: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40" };
  return { icon: Activity, color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/40" };
}

// ── Entity type badge helper ────────────────────────────────────────
function getEntityTypeBadge(entity: string | null | undefined): { label: string; color: string } | null {
  if (!entity) return null;
  const lower = entity.toLowerCase();
  if (lower.includes("content")) return { label: "Content", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
  if (lower.includes("post")) return { label: "Post", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" };
  if (lower.includes("campaign")) return { label: "Campaign", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" };
  if (lower.includes("approval")) return { label: "Approval", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  if (lower.includes("team")) return { label: "Team", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" };
  if (lower.includes("client")) return { label: "Client", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };
  if (lower.includes("asset")) return { label: "Asset", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" };
  if (lower.includes("disseminat")) return { label: "Dissemination", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" };
  return null;
}

// ── Time formatting ─────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ── Priority color helper ───────────────────────────────────────────
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300";
    case "medium": return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "low": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300";
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "in_progress":
    case "in-progress": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300";
    case "completed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "failed": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300";
  }
}

// ── KPI Card Component ──────────────────────────────────────────────
interface KPICardData {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}

function KPICard({ data }: { data: KPICardData }) {
  const Icon = data.icon;

  // ── 3D tilt on hover (subtle, springy) ──
  const xMotion = useMotionValue(0);
  const yMotion = useMotionValue(0);
  const rotateX = useSpring(useTransform(yMotion, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(xMotion, [-0.5, 0.5], [-6, 6]), {
    stiffness: 200,
    damping: 18,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    xMotion.set(px - 0.5);
    yMotion.set(py - 0.5);
  };

  const handleMouseLeave = () => {
    xMotion.set(0);
    yMotion.set(0);
  };

  const isNumeric = typeof data.value === "number";

  return (
    <motion.div variants={itemVariants}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <Card className="relative overflow-hidden bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#86868b] dark:text-[#aeaeb2] uppercase tracking-wide">
                    {data.title}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white tabular-nums">
                      {isNumeric ? (
                        <AnimatedCounter value={data.value as number} duration={1000} />
                      ) : (
                        data.value
                      )}
                    </h3>
                    {data.badge && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-md leading-none ${data.badgeColor}`}>
                        {data.badge}
                      </span>
                    )}
                  </div>
                  {data.change !== undefined && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className={`text-xs font-medium ${data.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {Math.abs(data.change)}%
                      </span>
                      {data.changeLabel && (
                        <span className="text-[10px] text-[#86868b] dark:text-[#aeaeb2]">{data.changeLabel}</span>
                      )}
                    </div>
                  )}
                </div>
                <motion.div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${data.gradient} flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0`}
                  style={{ transform: "translateZ(40px)" }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Icon className={`h-5 w-5 ${data.iconColor}`} />
                </motion.div>
              </div>
            </CardContent>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ── Pipeline Stage Node ─────────────────────────────────────────────
function PipelineStageNode({
  stage,
  count,
  totalContent,
  onClick,
}: {
  stage: typeof PIPELINE_STAGES[number];
  count: number;
  totalContent: number;
  onClick: () => void;
}) {
  const StageIcon = stage.icon;
  const pct = totalContent > 0 ? Math.round((count / totalContent) * 100) : 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-2 cursor-pointer group"
      whileHover={{ scale: 1.05, y: -4 }}
      onClick={onClick}
    >
      {/* Circle with icon and count */}
      <div className="relative">
        <motion.div
          className="h-16 w-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: stage.color + "15" }}
          animate={
            count > 0
              ? {
                  boxShadow: [
                    `0 0 0 0 ${stage.color}00`,
                    `0 0 0 8px ${stage.color}10`,
                    `0 0 0 0 ${stage.color}00`,
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <StageIcon className="h-7 w-7" style={{ color: stage.color }} />
        </motion.div>
        {/* Count badge */}
        <motion.div
          className="absolute -top-1 -right-1 h-6 min-w-[24px] px-1 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: stage.color }}
          animate={count > 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {count}
        </motion.div>
      </div>
      <span className="text-xs font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {stage.label}
      </span>
      {/* Mini progress bar */}
      <div className="w-full max-w-[64px] h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: stage.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
    </motion.div>
  );
}

// ── Pipeline Connector with animated dots ────────────────────────────
function PipelineConnector({ fromColor, toColor, hasItems }: { fromColor: string; toColor: string; hasItems: boolean }) {
  return (
    <div className="flex-1 relative h-1 min-w-[24px] sm:min-w-[40px] lg:min-w-[60px] rounded-full overflow-hidden mx-1 sm:mx-2 self-center mt-[-20px]">
      {/* Base line */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `linear-gradient(to right, ${fromColor}, ${toColor})`,
        }}
      />
      {/* Animated flowing dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full w-2 sm:w-3 rounded-full"
          style={{ backgroundColor: toColor }}
          animate={{ left: ["-10%", "110%"] }}
          transition={{
            duration: hasItems ? 1.5 : 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ── Team Productivity Bar (Enhanced) ────────────────────────────────
function TeamProductivityBar({ team, completed, pending, index = 0 }: { team: string; completed: number; pending: number; index?: number }) {
  const total = completed + pending;
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <motion.div
      className="space-y-2 group"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20 transition-shadow group-hover:shadow-md group-hover:shadow-emerald-500/40">
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{team}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{completedPct}%</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {completed}<span className="text-muted-foreground/60">/{total}</span>
          </span>
        </div>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        <motion.div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full relative"
          initial={{ width: 0 }}
          whileInView={{ width: `${completedPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: "easeOut" }}
        >
          {/* Subtle glow on hover */}
          <span className="absolute inset-0 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_2px_rgba(16,185,129,0.6)]" />
        </motion.div>
        <motion.div
          className="bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${pendingPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.08 + 0.35, ease: "easeOut" }}
        />
      </div>
      {/* Mini sparkline-style indicator */}
      <div className="flex gap-[2px]">
        {Array.from({ length: 8 }).map((_, i) => {
          // Deterministic sine-wave pattern for decorative sparkline
          const height = Math.round((Math.sin(i * 0.8 + completed * 0.3) * 0.5 + 0.5) * 12 + 4);
          const isCompleted = i < Math.round((completedPct / 100) * 8);
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 + i * 0.04 + 0.5, ease: "easeOut" }}
              style={{
                height: `${height}px`,
                backgroundColor: isCompleted ? "#10b981" : "#f59e0b30",
                transformOrigin: "bottom",
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main Dashboard View ─────────────────────────────────────────────
export function DashboardView() {
  const {
    dashboard,
    isLoading,
    setShowCreateContent,
    setShowCreatePost,
    contents,
    posts,
    teams,
    socialAccounts,
    disseminators,
    disseminationTasks,
    setActiveView,
    currentUser,
  } = useERPStore();

  // Loading state
  if (isLoading || !dashboard) {
    return <DashboardSkeleton />;
  }

  // Count active dissemination tasks
  const activeDisseminationTasks = disseminationTasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;

  // ── Compute real KPI change percentages from data ────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const contentThisMonth = contents.filter((c) => new Date(c.createdAt) >= thisMonthStart).length;
  const contentLastMonth = contents.filter((c) => {
    const d = new Date(c.createdAt);
    return d >= lastMonthStart && d < thisMonthStart;
  }).length;
  const contentChange = contentLastMonth > 0
    ? Math.round(((contentThisMonth - contentLastMonth) / contentLastMonth) * 1000) / 10
    : (contentThisMonth > 0 ? 100 : 0);

  const postsThisMonthCalc = posts.filter((p) => {
    const d = new Date(p.publishedAt || p.createdAt);
    return d >= thisMonthStart;
  }).length;
  const postsLastMonth = posts.filter((p) => {
    const d = new Date(p.publishedAt || p.createdAt);
    return d >= lastMonthStart && d < thisMonthStart;
  }).length;
  const postsChange = postsLastMonth > 0
    ? Math.round(((postsThisMonthCalc - postsLastMonth) / postsLastMonth) * 1000) / 10
    : (postsThisMonthCalc > 0 ? 100 : 0);

  // Build KPI cards (work-related only, 6 cards)
  const kpiCards: KPICardData[] = [
    {
      title: "Total Content",
      value: dashboard.totalContent,
      change: contentChange,
      changeLabel: "vs last month",
      icon: FileText,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-white",
    },
    {
      title: "Posts This Month",
      value: dashboard.postsThisMonth,
      change: postsChange,
      changeLabel: "vs last month",
      icon: Send,
      gradient: "from-teal-500 to-teal-600",
      iconColor: "text-white",
    },
    {
      title: "Scheduled Posts",
      value: dashboard.scheduledPosts,
      icon: Clock,
      gradient: "from-cyan-500 to-cyan-600",
      iconColor: "text-white",
      badge: "Upcoming",
      badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    },
    {
      title: "Active Campaigns",
      value: dashboard.activeCampaigns,
      icon: Rocket,
      gradient: "from-green-500 to-green-600",
      iconColor: "text-white",
      badge: dashboard.activeCampaigns > 0 ? "Live" : undefined,
      badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    },
    {
      title: "Pending Approvals",
      value: dashboard.pendingApprovals,
      icon: ShieldCheck,
      gradient: "from-amber-500 to-amber-600",
      iconColor: "text-white",
      badge: dashboard.pendingApprovals > 0 ? "Action needed" : undefined,
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      title: "Dissemination Tasks",
      value: activeDisseminationTasks,
      icon: Share2,
      gradient: "from-emerald-500 to-teal-600",
      iconColor: "text-white",
      badge: activeDisseminationTasks > 0 ? "Active" : undefined,
      badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    },
  ];

  // Pipeline data
  const totalContent = dashboard.totalContent || 1; // avoid div by zero

  // Platform activity data
  const platformData = dashboard.platformBreakdown.map((p) => ({
    platform: p.platform,
    label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    posts: p.posts,
    engagement: p.engagement,
    color: PLATFORM_COLORS[p.platform.toLowerCase()] || "#10b981",
  }));
  const maxPosts = Math.max(...platformData.map((p) => p.posts), 1);

  // Activity items (last 15)
  const activityItems = dashboard.recentActivity.slice(0, 15);

  // Team productivity
  const teamData = dashboard.teamProductivity;

  // Pending/in-progress dissemination tasks for queue display
  const taskQueue = disseminationTasks
    .filter((t) => t.status === "pending" || t.status === "in_progress")
    .slice(0, 5);

  // Quick actions (work-related only)
  const quickActions = [
    {
      label: "Create Content",
      icon: FileText,
      onClick: () => setShowCreateContent(true),
      color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
    },
    {
      label: "Schedule Post",
      icon: CalendarCheck,
      onClick: () => setShowCreatePost(true),
      color: "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60",
    },
    {
      label: "Assign Dissemination",
      icon: Share2,
      onClick: () => setActiveView("dissemination"),
      color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:hover:bg-cyan-900/60",
    },
    {
      label: "Request Approval",
      icon: ClipboardCheck,
      onClick: () => setActiveView("approvals"),
      color: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60",
    },
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Section Header ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white gradient-underline">
            Welcome back, {currentUser?.name?.split(" ")[0] || "Sarah"}
          </h2>
          <p className="text-sm text-[#86868b] dark:text-[#aeaeb2] mt-2">
            Here's your agency overview &amp; pipeline performance
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-semibold gap-1.5 rounded-full bg-black/5 dark:bg-white/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      </motion.div>

      {/* ── Row 1: KPI Cards (6 cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.title} data={card} />
        ))}
      </div>

      {/* ── Row 2: Animated Pipeline Workflow (HERO SECTION) ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover overflow-hidden rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Content Pipeline</CardTitle>
                <CardDescription className="text-xs mt-0.5 text-[#86868b] dark:text-[#aeaeb2]">
                  Workflow stages &mdash; click any stage to view details
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 dark:border-emerald-800 rounded-full">
                  <Workflow className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  {dashboard.totalContent} items
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            {/* Desktop horizontal pipeline */}
            <div className="hidden md:flex items-start justify-between px-4 py-4">
              {PIPELINE_STAGES.map((stage, index) => {
                const count = dashboard.contentByStage[stage.key] || 0;
                return (
                  <React.Fragment key={stage.key}>
                    <PipelineStageNode
                      stage={stage}
                      count={count}
                      totalContent={totalContent}
                      onClick={() => setActiveView("pipeline")}
                    />
                    {index < PIPELINE_STAGES.length - 1 && (
                      <PipelineConnector
                        fromColor={stage.color}
                        toColor={PIPELINE_STAGES[index + 1].color}
                        hasItems={count > 0}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Mobile vertical pipeline */}
            <div className="md:hidden flex flex-col items-center gap-0 py-4">
              {PIPELINE_STAGES.map((stage, index) => {
                const count = dashboard.contentByStage[stage.key] || 0;
                const pct = totalContent > 0 ? Math.round((count / totalContent) * 100) : 0;
                const StageIcon = stage.icon;
                return (
                  <React.Fragment key={stage.key}>
                    <motion.button
                      className="flex items-center gap-3 w-full max-w-[260px] py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveView("pipeline")}
                    >
                      <div className="relative shrink-0">
                        <motion.div
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: stage.color + "15" }}
                          animate={
                            count > 0
                              ? {
                                  boxShadow: [
                                    `0 0 0 0 ${stage.color}00`,
                                    `0 0 0 6px ${stage.color}10`,
                                    `0 0 0 0 ${stage.color}00`,
                                  ],
                                }
                              : {}
                          }
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <StageIcon className="h-5 w-5" style={{ color: stage.color }} />
                        </motion.div>
                        <motion.div
                          className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-0.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: stage.color }}
                          animate={count > 0 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {count}
                        </motion.div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground">{stage.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: stage.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
                        </div>
                      </div>
                    </motion.button>
                    {index < PIPELINE_STAGES.length - 1 && (
                      <div className="w-px h-6 relative flex items-center justify-center">
                        <div className="w-px h-full" style={{ backgroundColor: stage.color + "30" }} />
                        <motion.div
                          className="absolute w-2 h-2 rounded-full"
                          style={{ backgroundColor: PIPELINE_STAGES[index + 1].color }}
                          animate={{ y: [-4, 4, -4] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Row 3: Tasks & Team Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Tasks & Dissemination Queue */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover h-full rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Tasks &amp; Dissemination Queue</CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-[#86868b] dark:text-[#aeaeb2]">
                    Active tasks requiring attention
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {taskQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <span>All tasks completed!</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {taskQueue.map((task) => {
                    const platforms = task.targetPlatforms
                      ? (() => {
                          if (Array.isArray(task.targetPlatforms)) return task.targetPlatforms;
                          try {
                            return JSON.parse(task.targetPlatforms);
                          } catch {
                            return [task.targetPlatforms];
                          }
                        })()
                      : [];
                    const PlatformIcon = PLATFORM_ICONS[(platforms[0] || "").toLowerCase()] || Globe;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors group"
                      >
                        {/* Status indicator */}
                        <div className="mt-1 shrink-0">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              task.status === "in_progress"
                                ? "bg-cyan-500 animate-pulse"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </p>
                            <span className={`inline-flex items-center px-1.5 py-0 text-[9px] font-semibold rounded shrink-0 ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Assignee */}
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                    {task.assignee.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] text-muted-foreground">{task.assignee.name}</span>
                              </div>
                            )}

                            {/* Due date */}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            )}

                            {/* Platform icons */}
                            {platforms.slice(0, 3).map((p: string) => {
                              const PIcon = PLATFORM_ICONS[p.toLowerCase()] || Globe;
                              return (
                                <div
                                  key={p}
                                  className="h-4 w-4 rounded flex items-center justify-center"
                                  style={{ backgroundColor: (PLATFORM_COLORS[p.toLowerCase()] || "#10b981") + "20" }}
                                >
                                  <PIcon className="h-2.5 w-2.5" style={{ color: PLATFORM_COLORS[p.toLowerCase()] || "#10b981" }} />
                                </div>
                              );
                            })}
                            {platforms.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{platforms.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {taskQueue.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    onClick={() => setActiveView("dissemination")}
                  >
                    View All Tasks
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Team Performance (Enhanced) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover h-full rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Team Performance</CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-[#86868b] dark:text-[#aeaeb2]">
                    Completed vs pending tasks
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-gradient-to-r from-emerald-500 to-emerald-400" />
                    <span className="text-[#86868b] dark:text-[#aeaeb2]">Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-gradient-to-r from-amber-400 to-amber-300" />
                    <span className="text-[#86868b] dark:text-[#aeaeb2]">Pending</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {teamData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No team data available
                </div>
              ) : (
                <div className="space-y-5">
                  {teamData.map((t, idx) => (
                    <TeamProductivityBar
                      key={t.team}
                      team={t.team}
                      completed={t.completed}
                      pending={t.pending}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 4: Platform Activity & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Platform Activity (CSS-based) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover h-full rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Platform Activity</CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-[#86868b] dark:text-[#aeaeb2]">
                    Posts &amp; engagement by platform
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {platformData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No platform data available
                </div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {platformData.map((p, pIdx) => {
                    const PIcon = PLATFORM_ICONS[p.platform.toLowerCase()] || Globe;
                    const barWidth = Math.round((p.posts / maxPosts) * 100);
                    return (
                      <motion.div
                        key={p.platform}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors border-l-2 group relative overflow-hidden"
                        style={{ borderLeftColor: p.color }}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ duration: 0.5, delay: pIdx * 0.08, ease: "easeOut" }}
                        whileHover={{ scale: 1.015 }}
                      >
                        {/* Hover glow */}
                        <span
                          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(120px 60px at 10% 50%, ${p.color}20, transparent 70%)`,
                          }}
                        />
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: p.color + "15" }}
                        >
                          <PIcon className="h-4 w-4" style={{ color: p.color }} />
                        </div>
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{p.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                <AnimatedCounter value={p.posts} duration={900} /> posts
                              </span>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {p.engagement.toLocaleString()} eng
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full relative"
                              style={{ backgroundColor: p.color }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${barWidth}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: pIdx * 0.08 + 0.2, ease: "easeOut" }}
                            >
                              <span
                                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ boxShadow: `0 0 10px 2px ${p.color}99` }}
                              />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Recent Activity Feed (Enhanced) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover h-full rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-[#86868b] dark:text-[#aeaeb2]">
                    Latest actions across the platform
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activityItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <ScrollArea className="h-[340px] pr-3">
                  <div className="space-y-0.5">
                    {activityItems.map((item, idx) => {
                      const { icon: ActivityIcon, color: iconColorClasses } = getActivityIcon(item.action, item.entity);
                      const entityBadge = getEntityTypeBadge(item.entity);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${iconColorClasses}`}>
                            <ActivityIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-snug">
                              <span className="font-semibold">{item.actor?.name ?? "Unknown"}</span>
                              {" "}
                              <span className="text-muted-foreground">{item.action.toLowerCase()}</span>
                              {item.entity && (
                                <>
                                  {" "}
                                  <span className="font-medium text-foreground">{item.entity}</span>
                                </>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.details && (
                                <p className="text-[10px] text-muted-foreground/70 truncate">
                                  {item.details}
                                </p>
                              )}
                              {entityBadge && (
                                <span className={`inline-flex items-center px-1.5 py-0 text-[9px] font-semibold rounded leading-tight shrink-0 ${entityBadge.color}`}>
                                  {entityBadge.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap shrink-0 pt-0.5">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 5: Quick Actions Bar ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Quick Actions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    className={`h-9 gap-2 text-xs font-medium rounded-lg ${action.color} border-0`}
                    onClick={action.onClick}
                  >
                    <ActionIcon className="h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>

      {/* KPI cards skeleton (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline skeleton */}
      <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <div className="hidden md:flex items-center justify-between px-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-1.5 w-16 rounded-full" />
                </div>
                {i < 5 && <Skeleton className="h-1 flex-1 min-w-[40px] rounded-full mx-2" />}
              </React.Fragment>
            ))}
          </div>
          <div className="md:hidden flex flex-col items-center gap-2 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <Skeleton className="h-12 w-full max-w-[260px] rounded-xl" />
                {i < 5 && <Skeleton className="w-px h-6" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Row 3 skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 4 skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions skeleton */}
      <Card className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-sm card-hover rounded-2xl">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-36 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
