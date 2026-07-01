"use client";

import React, { useState, useMemo } from "react";
import { useERPStore, type SocialAccount, type Platform } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Power,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  Globe,
  Link2,
  ShieldCheck,
  ExternalLink,
  Music,
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

const cardHover = {
  hover: {
    y: -2,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

// ── Platform config ─────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  instagram: { label: "Instagram", color: "#E4405F", icon: Instagram },
  facebook: { label: "Facebook", color: "#1877F2", icon: Facebook },
  twitter: { label: "Twitter", color: "#1DA1F2", icon: Twitter },
  linkedin: { label: "LinkedIn", color: "#0A66C2", icon: Linkedin },
  tiktok: { label: "TikTok", color: "#000000", icon: Music },
  youtube: { label: "YouTube", color: "#FF0000", icon: Youtube },
  pinterest: { label: "Pinterest", color: "#E60023", icon: Globe },
  snapchat: { label: "Snapchat", color: "#FFFC00", icon: Share2 },
};

const PLATFORMS: Platform[] = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
];

// ── Helpers ─────────────────────────────────────────────────────────
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("default", { month: "short", day: "numeric" });
}

// ── Main Component ──────────────────────────────────────────────────
export function AccountsView() {
  const { socialAccounts, posts, setSocialAccounts } = useERPStore();
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [accountStates, setAccountStates] = useState<Record<string, boolean>>({});
  const [showConnect, setShowConnect] = useState(false);

  // Toggle account active state (local only)
  const toggleAccountActive = (accountId: string) => {
    setAccountStates((prev) => ({
      ...prev,
      [accountId]: !(prev[accountId] ?? socialAccounts.find((a) => a.id === accountId)?.isActive),
    }));
  };

  // Get effective active state
  const getIsActive = (account: SocialAccount): boolean => {
    return accountStates[account.id] ?? account.isActive;
  };

  const handleAccountSaved = (account: SocialAccount) => {
    const defaultUser = account.user || {
      id: "u-current",
      email: "you@vortex.com",
      name: "You",
      avatar: null,
      role: "admin",
      organizationId: "org-1",
    };
    const newAccount: SocialAccount = {
      id: account.id,
      platform: account.platform,
      accountId: account.accountId || account.id,
      username: account.username || "",
      displayName: account.displayName || null,
      avatar: account.avatar || null,
      followers: Number(account.followers) || 0,
      isVerified: account.isVerified ?? false,
      isActive: account.isActive ?? true,
      userId: account.userId || defaultUser.id,
      user: defaultUser,
    };
    setSocialAccounts([...socialAccounts, newAccount]);
  };

  // Filter accounts by platform
  const filteredAccounts = useMemo(() => {
    if (activePlatform === "all") return socialAccounts;
    return socialAccounts.filter((a) => a.platform === activePlatform);
  }, [socialAccounts, activePlatform]);

  // Post counts per account
  const postCountsByAccount = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      counts[post.socialAccountId] = (counts[post.socialAccountId] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Platform summary
  const platformSummary = useMemo(() => {
    const summary: Record<string, { count: number; followers: number; active: number }> = {};
    socialAccounts.forEach((account) => {
      if (!summary[account.platform]) {
        summary[account.platform] = { count: 0, followers: 0, active: 0 };
      }
      summary[account.platform].count++;
      summary[account.platform].followers += account.followers;
      const isActive = accountStates[account.id] ?? account.isActive;
      if (isActive) summary[account.platform].active++;
    });
    return summary;
  }, [socialAccounts, accountStates]);

  const totalFollowers = socialAccounts.reduce((sum, a) => sum + a.followers, 0);
  const activeAccounts = socialAccounts.filter((a) => accountStates[a.id] ?? a.isActive).length;
  const totalPlatforms = Object.keys(platformSummary).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Social Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage connected social media accounts</p>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
          size="sm"
          onClick={() => setShowConnect(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Connect Account
        </Button>
      </motion.div>

      {/* Platform Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Accounts</span>
            </div>
            <p className="text-2xl font-bold">{socialAccounts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs text-muted-foreground">Total Reach</span>
            </div>
            <p className="text-2xl font-bold">{formatFollowers(totalFollowers)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs text-muted-foreground">Active Accounts</span>
            </div>
            <p className="text-2xl font-bold">{activeAccounts}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs text-muted-foreground">Platforms</span>
            </div>
            <p className="text-2xl font-bold">{totalPlatforms}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Breakdown */}
      {Object.keys(platformSummary).length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Platform Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(platformSummary).map(([platform, data]) => {
                  const config = PLATFORM_CONFIG[platform];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <div
                      key={platform}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:shadow-sm transition-shadow cursor-default"
                      style={{ borderLeftWidth: "3px", borderLeftColor: config.color }}
                    >
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: config.color === "#000000" ? "#374151" : config.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">{data.count}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{formatFollowers(data.followers)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Platform Filter Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activePlatform} onValueChange={setActivePlatform}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
            {PLATFORMS.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              if (!config) return null;
              const Icon = config.icon;
              const count = platformSummary[platform]?.count || 0;
              return (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-1"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                  {count > 0 && (
                    <span className="ml-0.5 text-[10px] opacity-70">({count})</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Account Cards Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAccounts.map((account, idx) => {
            const config = PLATFORM_CONFIG[account.platform];
            const isActive = getIsActive(account);
            const postCount = postCountsByAccount[account.id] || 0;
            const PlatformIcon = config?.icon || Globe;
            const platformColor = config?.color || "#6b7280";

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                whileHover="hover"
              >
                <motion.div variants={cardHover}>
                  <Card className={`overflow-hidden transition-colors ${!isActive ? "opacity-60" : ""}`}>
                    {/* Platform color bar */}
                    <div className="h-1" style={{ backgroundColor: platformColor }} />

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Platform Avatar */}
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2" style={{ borderColor: `${platformColor}30` }}>
                            <AvatarImage src={account.avatar || undefined} />
                            <AvatarFallback
                              className="text-sm font-bold"
                              style={{ backgroundColor: `${platformColor}15`, color: platformColor === "#000000" ? "#374151" : platformColor }}
                            >
                              {account.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-card"
                            style={{ backgroundColor: platformColor }}
                          >
                            <PlatformIcon className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold truncate">@{account.username}</p>
                            {account.isVerified && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>Verified Account</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {account.displayName && (
                            <p className="text-xs text-muted-foreground truncate">{account.displayName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 px-1.5 capitalize"
                              style={{
                                backgroundColor: `${platformColor}15`,
                                color: platformColor === "#000000" ? "#374151" : platformColor,
                              }}
                            >
                              {account.platform}
                            </Badge>
                            <Badge
                              variant={isActive ? "default" : "secondary"}
                              className={`text-[10px] h-5 px-1.5 ${
                                isActive
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-gray-500/15 text-gray-500"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="text-xs gap-2">
                              <RefreshCw className="h-3.5 w-3.5" />
                              Reconnect
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2">
                              <Eye className="h-3.5 w-3.5" />
                              View Posts
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => toggleAccountActive(account.id)}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Separator className="my-3" />

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold">{formatFollowers(account.followers)}</p>
                          <p className="text-[10px] text-muted-foreground">Followers</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{postCount}</p>
                          <p className="text-[10px] text-muted-foreground">Posts</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground flex items-center justify-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Synced
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {getRelativeTime(account.updatedAt || new Date().toISOString())}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      {/* Connected User & Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={account.user.avatar || undefined} />
                            <AvatarFallback className="text-[8px] font-bold bg-muted">
                              {getInitials(account.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground truncate">Connected by</p>
                            <p className="text-[11px] font-medium truncate">{account.user.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {isActive ? "On" : "Off"}
                          </span>
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleAccountActive(account.id)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Empty state */}
      {filteredAccounts.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {activePlatform === "all"
                  ? "No social accounts connected"
                  : `No ${PLATFORM_CONFIG[activePlatform]?.label || activePlatform} accounts`}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {activePlatform === "all"
                  ? "Connect your first social media account to get started"
                  : `Try connecting a ${PLATFORM_CONFIG[activePlatform]?.label || activePlatform} account`}
              </p>
              <Button
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                size="sm"
                onClick={() => setShowConnect(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Connect Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Connect Account Dialog */}
      <ConnectAccountDialog
        open={showConnect}
        onOpenChange={setShowConnect}
        onSaved={handleAccountSaved}
      />
    </motion.div>
  );
}

// ── Connect Account Dialog ──────────────────────────────────────────
function ConnectAccountDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (account: SocialAccount) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.get("platform"),
          username: form.get("username"),
          displayName: form.get("displayName"),
          followers: Number(form.get("followers")) || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data);
        toast.success("Account connected!");
        onOpenChange(false);
      } else {
        toast.error("Failed to connect account");
      }
    } catch {
      toast.error("Failed to connect account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Social Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acc-platform">Platform</Label>
            <Select name="platform" defaultValue="instagram">
              <SelectTrigger id="acc-platform" className="w-full">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_CONFIG[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-username">Username</Label>
            <Input
              id="acc-username"
              name="username"
              placeholder="e.g. @yourbrand"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-display-name">Display Name</Label>
            <Input
              id="acc-display-name"
              name="displayName"
              placeholder="e.g. Your Brand"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-followers">Followers</Label>
            <Input
              id="acc-followers"
              name="followers"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="e.g. 12500"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
