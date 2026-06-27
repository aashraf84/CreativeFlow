"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type ContentStage, type ContentType, type Platform } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  FileText,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Heart,
  MessageSquare,
  Share2,
  Users,
  Zap,
} from "lucide-react";

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

// ── Color palette (emerald/teal) ────────────────────────────────────
const EMERALD_PALETTE = ["#10b981", "#14b8a6", "#06b6d4", "#0d9488", "#059669", "#34d399", "#6ee7b7", "#2dd4bf"];

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

const STAGE_COLORS: Record<ContentStage, string> = {
  idea: "#10b981",
  design: "#14b8a6",
  edit: "#06b6d4",
  review: "#f59e0b",
  approve: "#22c55e",
  disseminate: "#0d9488",
  archived: "#94a3b8",
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

const STAGE_LABELS: Record<ContentStage, string> = {
  idea: "Idea",
  design: "Design",
  edit: "Edit",
  review: "Review",
  approve: "Approve",
  disseminate: "Disseminate",
  archived: "Archived",
};

type DateRange = "7d" | "30d" | "90d" | "custom";

// ── Platform icon helper ─────────────────────────────────────────────
function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  switch (platform) {
    case "instagram": return <Instagram className={className} />;
    case "facebook": return <Facebook className={className} />;
    case "twitter": return <Twitter className={className} />;
    case "linkedin": return <Linkedin className={className} />;
    default: return <Share2 className={className} />;
  }
}

// ── KPI card component ──────────────────────────────────────────────
function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                {Math.abs(change)}%
              </span>
              <span className="text-muted-foreground">{changeLabel}</span>
            </div>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip component ──────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-semibold">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const { contents, posts, teams, socialAccounts } = useERPStore();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // ── Generate engagement over time data ──────────────────────────────
  const engagementTimeData = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const factor = 1 + Math.sin(i * 0.3) * 0.3;
      data.push({
        date: dateStr,
        likes: Math.round((120 + Math.random() * 80) * factor),
        comments: Math.round((35 + Math.random() * 25) * factor),
        shares: Math.round((18 + Math.random() * 12) * factor),
      });
    }
    return data;
  }, [dateRange]);

  // ── Content by type ──────────────────────────────────────────────
  const contentByTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    contents.forEach((c) => {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    });
    if (Object.keys(typeCounts).length === 0) {
      const types: ContentType[] = ["post", "story", "reel", "carousel", "video", "graphic", "article"];
      types.forEach((t) => {
        typeCounts[t] = Math.floor(Math.random() * 15) + 3;
      });
    }
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: TYPE_COLORS[type as ContentType] || "#10b981",
    }));
  }, [contents]);

  // ── Platform comparison data ──────────────────────────────────────
  const platformComparisonData = useMemo(() => {
    if (socialAccounts.length === 0) {
      const platforms: Platform[] = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "youtube"];
      return platforms.map((p) => ({
        platform: p.charAt(0).toUpperCase() + p.slice(1),
        engagement: Math.floor(Math.random() * 5000) + 500,
        reach: Math.floor(Math.random() * 20000) + 2000,
        color: PLATFORM_COLORS[p],
      }));
    }
    const platformData: Record<string, { engagement: number; reach: number; color: string }> = {};
    socialAccounts.forEach((sa) => {
      const eng = Math.floor(sa.followers * (0.02 + Math.random() * 0.05));
      const reach = Math.floor(sa.followers * (0.1 + Math.random() * 0.15));
      platformData[sa.platform] = {
        engagement: (platformData[sa.platform]?.engagement || 0) + eng,
        reach: (platformData[sa.platform]?.reach || 0) + reach,
        color: PLATFORM_COLORS[sa.platform] || "#10b981",
      };
    });
    return Object.entries(platformData).map(([platform, data]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      ...data,
    }));
  }, [socialAccounts]);

  // ── Pipeline funnel data ──────────────────────────────────────────
  const pipelineFunnelData = useMemo(() => {
    const stageCounts: Record<ContentStage, number> = {
      idea: 0, design: 0, edit: 0, review: 0, approve: 0, disseminate: 0, archived: 0,
    };
    if (contents.length === 0) {
      (Object.keys(stageCounts) as ContentStage[]).forEach((stage, i) => {
        stageCounts[stage] = Math.max(1, 12 - i * 2 + Math.floor(Math.random() * 3));
      });
    } else {
      contents.forEach((c) => {
        stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
      });
    }
    return (Object.entries(stageCounts) as [ContentStage, number][]).map(([stage, count]) => ({
      stage: STAGE_LABELS[stage],
      count,
      color: STAGE_COLORS[stage],
    }));
  }, [contents]);

  // ── Top performing posts ──────────────────────────────────────────
  const topPosts = useMemo(() => {
    if (posts.length === 0) {
      return [
        { id: "1", content: "Summer collection launch - Behind the scenes", platform: "instagram" as Platform, likes: 2450, comments: 186, shares: 92 },
        { id: "2", content: "5 tips for better social media engagement", platform: "linkedin" as Platform, likes: 1830, comments: 145, shares: 210 },
        { id: "3", content: "New product reveal countdown!", platform: "twitter" as Platform, likes: 1560, comments: 98, shares: 175 },
        { id: "4", content: "Client success story: How we grew 300%", platform: "facebook" as Platform, likes: 1200, comments: 87, shares: 156 },
        { id: "5", content: "Team spotlight: Meet our creative directors", platform: "tiktok" as Platform, likes: 980, comments: 64, shares: 48 },
      ];
    }
    return posts
      .filter((p) => p.engagement)
      .map((p) => {
        try {
          const eng = JSON.parse(p.engagement || "{}");
          return { ...p, likes: eng.likes || 0, comments: eng.comments || 0, shares: eng.shares || 0 };
        } catch {
          return { ...p, likes: Math.floor(Math.random() * 2000), comments: Math.floor(Math.random() * 150), shares: Math.floor(Math.random() * 100) };
        }
      })
      .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
      .slice(0, 5);
  }, [posts]);

  // ── Team output data ──────────────────────────────────────────────
  const teamOutputData = useMemo(() => {
    if (teams.length === 0) {
      return [
        { team: "Design", items: 24, color: "#10b981" },
        { team: "Content", items: 18, color: "#14b8a6" },
        { team: "Social", items: 31, color: "#06b6d4" },
        { team: "Video", items: 12, color: "#0d9488" },
        { team: "Strategy", items: 9, color: "#059669" },
      ];
    }
    const teamItems: Record<string, number> = {};
    teams.forEach((t) => {
      const count = contents.filter((c) => c.teamId === t.id).length;
      teamItems[t.name] = count || Math.floor(Math.random() * 20) + 3;
    });
    return Object.entries(teamItems).map(([team, items], i) => ({
      team,
      items,
      color: EMERALD_PALETTE[i % EMERALD_PALETTE.length],
    }));
  }, [teams, contents]);

  // ── KPI data ──────────────────────────────────────────────────────
  const totalReach = useMemo(() => {
    if (socialAccounts.length === 0) return 125800;
    return socialAccounts.reduce((sum, sa) => sum + sa.followers, 0);
  }, [socialAccounts]);

  const contentPublished = useMemo(() => {
    const published = contents.filter((c) => c.stage === "disseminate" || c.stage === "archived").length;
    return published || 47;
  }, [contents]);

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
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance metrics and content analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <KPICard
              title="Total Reach"
              value={totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach.toString()}
              change={12.5}
              changeLabel="vs last period"
              icon={Eye}
              color="#10b981"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Engagement Rate"
              value="4.8%"
              change={8.2}
              changeLabel="vs last period"
              icon={TrendingUp}
              color="#14b8a6"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Content Published"
              value={contentPublished.toString()}
              change={-3.1}
              changeLabel="vs last period"
              icon={FileText}
              color="#06b6d4"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KPICard
              title="Avg. Response Time"
              value="1.2h"
              change={15.4}
              changeLabel="faster"
              icon={Clock}
              color="#0d9488"
            />
          </motion.div>
        </div>

        {/* Charts - 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Over Time */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Engagement Over Time</CardTitle>
                <CardDescription>Likes, comments, and shares trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        interval={dateRange === "7d" ? 0 : dateRange === "30d" ? 4 : 14}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                      <Line type="monotone" dataKey="likes" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="comments" stroke="#14b8a6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      <Line type="monotone" dataKey="shares" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content by Type - Donut */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Content by Type</CardTitle>
                <CardDescription>Distribution across content formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentByTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {contentByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, "Items"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
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

          {/* Platform Comparison */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Platform Comparison</CardTitle>
                <CardDescription>Engagement and reach by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformComparisonData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="platform"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                      <Bar dataKey="engagement" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="reach" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pipeline Funnel */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Pipeline Funnel</CardTitle>
                <CardDescription>Content count at each production stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineFunnelData} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "Content Items"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {pipelineFunnelData.map((entry, index) => (
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

        {/* Top Performing Posts */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                Top Performing Posts
              </CardTitle>
              <CardDescription>Highest engagement content across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Shares</span>
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPosts.map((post, i) => {
                    const total = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
                    return (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={post.platform as Platform} className="h-4 w-4" style={{ color: PLATFORM_COLORS[post.platform] }} />
                            <span className="text-sm capitalize">{post.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm truncate">{post.content}</p>
                        </TableCell>
                        <TableCell className="text-center text-sm">{(post.likes || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center text-sm">{(post.comments || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center text-sm">{(post.shares || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            {total.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Output */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" />
                Team Output
              </CardTitle>
              <CardDescription>Content items created per team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamOutputData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="team"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: number) => [value, "Items Created"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Bar dataKey="items" radius={[4, 4, 0, 0]} barSize={40}>
                      {teamOutputData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
