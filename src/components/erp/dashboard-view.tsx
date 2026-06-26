"use client";

import React from "react";
import { useERPStore, type ContentStage, type ActivityLog } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  FileText,
  Send,
  Clock,
  Rocket,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
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
  Briefcase,
  Users,
  BarChart3,
  ShieldCheck,
  DollarSign,
  Mail,
  Timer,
  ImagePlus,
  Receipt,
  ClipboardCheck,
  Zap,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

// ── Color palette (emerald/teal) ────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  idea: "#10b981",
  design: "#14b8a6",
  edit: "#06b6d4",
  review: "#f59e0b",
  approve: "#22c55e",
  disseminate: "#0d9488",
  archived: "#94a3b8",
};

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  design: "Design",
  edit: "Edit",
  review: "Review",
  approve: "Approve",
  disseminate: "Disseminate",
  archived: "Archived",
};

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

// ── KPI card data builder ───────────────────────────────────────────
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

function buildKPICards(
  totalContent: number,
  postsThisMonth: number,
  scheduledPosts: number,
  activeCampaigns: number,
  pendingApprovals: number,
  totalRevenue: number,
  unreadInbox: number,
  timeTrackedThisWeek: number
): KPICardData[] {
  const formatRevenue = (val: number): string => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  return [
    {
      title: "Total Content",
      value: totalContent,
      change: 12.5,
      changeLabel: "vs last month",
      icon: FileText,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-white",
    },
    {
      title: "Posts This Month",
      value: postsThisMonth,
      change: 8.2,
      changeLabel: "vs last month",
      icon: Send,
      gradient: "from-teal-500 to-teal-600",
      iconColor: "text-white",
    },
    {
      title: "Scheduled Posts",
      value: scheduledPosts,
      icon: Clock,
      gradient: "from-cyan-500 to-cyan-600",
      iconColor: "text-white",
      badge: "Upcoming",
      badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      change: -2.1,
      changeLabel: "vs last month",
      icon: Rocket,
      gradient: "from-emerald-600 to-teal-600",
      iconColor: "text-white",
      badge: activeCampaigns > 0 ? "Live" : undefined,
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals,
      icon: ShieldCheck,
      gradient: "from-amber-500 to-amber-600",
      iconColor: "text-white",
      badge: pendingApprovals > 0 ? "Action needed" : undefined,
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      title: "Revenue",
      value: formatRevenue(totalRevenue),
      change: 15.3,
      changeLabel: "vs last month",
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-700",
      iconColor: "text-white",
    },
    {
      title: "Unread Inbox",
      value: unreadInbox,
      icon: Mail,
      gradient: "from-rose-500 to-rose-600",
      iconColor: "text-white",
      badge: unreadInbox > 0 ? "Needs attention" : undefined,
      badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    },
    {
      title: "Time Tracked",
      value: `${timeTrackedThisWeek}h`,
      icon: Timer,
      gradient: "from-teal-500 to-cyan-600",
      iconColor: "text-white",
      badge: "This week",
      badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    },
  ];
}

// ── Activity icon helper ────────────────────────────────────────────
function getActivityIcon(action: string, entity?: string) {
  const lower = action.toLowerCase();
  const entityLower = (entity ?? "").toLowerCase();

  // Approval-specific icons
  if (lower.includes("approve") || lower.includes("accept") || lower.includes("complete"))
    return { icon: CheckCircle2, color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40" };
  if (lower.includes("reject") || lower.includes("deny"))
    return { icon: ShieldCheck, color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" };
  if (lower.includes("review"))
    return { icon: Eye, color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40" };

  // Invoice-specific icons
  if (entityLower.includes("invoice") || lower.includes("invoice") || lower.includes("payment"))
    return { icon: Receipt, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40" };

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
    return { icon: CalendarCheck, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40" };
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
  if (lower.includes("invoice") || lower.includes("payment")) return { label: "Invoice", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
  if (lower.includes("team")) return { label: "Team", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" };
  if (lower.includes("client")) return { label: "Client", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };
  if (lower.includes("asset")) return { label: "Asset", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" };
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

// ── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-mono font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Custom Revenue Tooltip ──────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
          <span className="font-mono font-medium text-foreground">${(p.value / 1000).toFixed(1)}K</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card Component ──────────────────────────────────────────────
function KPICard({ data, index }: { data: KPICardData; index: number }) {
  const Icon = data.icon;
  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border-border/60">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {data.title}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {typeof data.value === "number" ? data.value.toLocaleString() : data.value}
                </h3>
                {data.badge && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-md leading-none ${data.badgeColor}`}>
                    {data.badge}
                  </span>
                )}
              </div>
              {data.change !== undefined && (
                <div className="mt-1.5 flex items-center gap-1">
                  {data.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className={`text-xs font-medium ${data.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {Math.abs(data.change)}%
                  </span>
                  {data.changeLabel && (
                    <span className="text-[10px] text-muted-foreground">{data.changeLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${data.gradient} flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0`}>
              <Icon className={`h-5 w-5 ${data.iconColor}`} />
            </div>
          </div>
        </CardContent>
        {/* Subtle decorative gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </Card>
    </motion.div>
  );
}

// ── Team Productivity Bar ───────────────────────────────────────────
function TeamProductivityBar({ team, completed, pending }: { team: string; completed: number; pending: number }) {
  const total = completed + pending;
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground truncate">{team}</span>
        <span className="text-muted-foreground tabular-nums">
          {completed}<span className="text-muted-foreground/60">/{total}</span>
        </span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-l-full"
          style={{ width: `${completedPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-400 transition-all duration-500"
          style={{ width: `${pendingPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Dashboard View ─────────────────────────────────────────────
export function DashboardView() {
  const { dashboard, isLoading, setShowCreateContent, setShowCreatePost } = useERPStore();

  // Loading state
  if (isLoading || !dashboard) {
    return <DashboardSkeleton />;
  }

  const kpiCards = buildKPICards(
    dashboard.totalContent,
    dashboard.postsThisMonth,
    dashboard.scheduledPosts,
    dashboard.activeCampaigns,
    dashboard?.pendingApprovals ?? 0,
    dashboard?.totalRevenue ?? 0,
    dashboard?.unreadInbox ?? 0,
    dashboard?.timeTrackedThisWeek ?? 0
  );

  // Build pipeline chart data
  const pipelineData = (["idea", "design", "edit", "review", "approve", "disseminate"] as ContentStage[]).map(
    (stage) => ({
      stage: STAGE_LABELS[stage],
      count: dashboard.contentByStage[stage] || 0,
      color: STAGE_COLORS[stage],
    })
  );

  // Build platform chart data
  const platformData = dashboard.platformBreakdown.map((p) => ({
    platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    posts: p.posts,
    engagement: p.engagement,
    color: PLATFORM_COLORS[p.platform.toLowerCase()] || "#10b981",
  }));

  // Build revenue chart data
  const revenueData = [
    {
      category: "Revenue",
      paid: dashboard?.paidRevenue ?? 0,
      outstanding: dashboard?.outstandingRevenue ?? 0,
    },
  ];

  // Build approval status chart data (simulated distribution from pendingApprovals)
  const pendingCount = dashboard?.pendingApprovals ?? 0;
  const approvalData = [
    { name: "Pending", value: pendingCount, fill: "#f59e0b" },
    { name: "Approved", value: Math.max(1, Math.floor(pendingCount * 2.5)), fill: "#10b981" },
    { name: "Rejected", value: Math.max(0, Math.floor(pendingCount * 0.3)), fill: "#ef4444" },
  ];

  // Activity items (last 15)
  const activityItems = dashboard.recentActivity.slice(0, 15);

  // Team productivity
  const teamData = dashboard.teamProductivity;

  // Quick actions
  const quickActions = [
    { label: "Create Content", icon: FileText, onClick: () => setShowCreateContent(true), color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60" },
    { label: "Schedule Post", icon: CalendarCheck, onClick: () => setShowCreatePost(true), color: "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/60" },
    { label: "Send Invoice", icon: Receipt, onClick: () => {}, color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:hover:bg-cyan-900/60" },
    { label: "Request Approval", icon: ClipboardCheck, onClick: () => {}, color: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60" },
    { label: "Add Asset", icon: ImagePlus, onClick: () => {}, color: "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60" },
  ];

  return (
    <motion.div
      className="p-4 lg:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Section Header ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time performance metrics for your agency
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      </motion.div>

      {/* ── KPI Cards (2 rows of 4) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <KPICard key={card.title} data={card} index={index} />
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
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

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Content Pipeline Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Content Pipeline</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Distribution by stage
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Workflow className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Performance */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Platform Performance</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Posts by platform
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformData}
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                    <Bar dataKey="posts" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Charts Row 2 (Revenue + Approval) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Overview */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Paid vs outstanding revenue
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-emerald-500" />
                  <span className="text-muted-foreground">Paid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-amber-400" />
                  <span className="text-muted-foreground">Outstanding</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                    <Bar dataKey="paid" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} name="Paid" />
                    <Bar dataKey="outstanding" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={60} name="Outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Approval Status */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Approval Status</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Pending / approved / rejected distribution
                  </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {approvalData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0];
                        return (
                          <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
                            <span className="text-muted-foreground">{data.name}:</span>
                            <span className="font-mono font-medium text-foreground ml-1">{data.value}</span>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Productivity */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Team Productivity</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Completed vs pending tasks
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-gradient-to-r from-emerald-500 to-emerald-400" />
                    <span className="text-muted-foreground">Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-gradient-to-r from-amber-400 to-amber-300" />
                    <span className="text-muted-foreground">Pending</span>
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
                <div className="space-y-4">
                  {teamData.map((t) => (
                    <TeamProductivityBar
                      key={t.team}
                      team={t.team}
                      completed={t.completed}
                      pending={t.pending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Activity Feed */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-border/60 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
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
                <ScrollArea className="h-[280px] pr-3">
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
    </motion.div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>

      {/* KPI cards skeleton (8 cards = 2 rows of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="shadow-sm border-border/60">
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

      {/* Quick Actions skeleton */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts row 1 skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[240px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 2 skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-[240px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
