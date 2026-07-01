"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useERPStore, type Platform } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  User,
  Bell,
  LayoutDashboard,
  Plug,
  AlertTriangle,
  Save,
  Upload,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Clock,
  Globe,
  Palette,
  Shield,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Camera,
  Loader2,
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

// ── Platform data ──────────────────────────────────────────────────
const PLATFORM_INTEGRATIONS: {
  platform: Platform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}[] = [
  { platform: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", description: "Connect your Instagram business account" },
  { platform: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", description: "Connect your Facebook pages" },
  { platform: "twitter", name: "Twitter / X", icon: Twitter, color: "#1DA1F2", description: "Connect your Twitter account" },
  { platform: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", description: "Connect your LinkedIn pages" },
  { platform: "tiktok", name: "TikTok", icon: Shield, color: "#000000", description: "Connect your TikTok business account" },
  { platform: "youtube", name: "YouTube", icon: Shield, color: "#FF0000", description: "Connect your YouTube channel" },
  { platform: "pinterest", name: "Pinterest", icon: Shield, color: "#E60023", description: "Connect your Pinterest business account" },
  { platform: "snapchat", name: "Snapchat", icon: Shield, color: "#FFFC00", description: "Connect your Snapchat account" },
];

// ── Types ──────────────────────────────────────────────────────────
interface OrgData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  maxUsers: number;
  maxAccounts: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface UsageData {
  userCount: number;
  accountCount: number;
}

// Plan display mapping
const PLAN_DISPLAY: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export function SettingsView() {
  const { currentUser, socialAccounts } = useERPStore();

  // ── Organization Settings state ────────────────────────────────
  const [orgName, setOrgName] = useState("CreativeFlow Digital");
  const [orgPlan, setOrgPlan] = useState("Professional");
  const [orgUsage, setOrgUsage] = useState<UsageData>({ userCount: 0, accountCount: 0 });
  const [orgMaxUsers, setOrgMaxUsers] = useState(50);
  const [orgMaxAccounts, setOrgMaxAccounts] = useState(20);

  // ── User Profile state ─────────────────────────────────────────
  const [userName, setUserName] = useState(currentUser?.name || "Sarah Chen");
  const [userEmail, setUserEmail] = useState(currentUser?.email || "sarah@creativeflowdigital.com");
  const [userRole, setUserRole] = useState(currentUser?.role || "admin");

  // ── Notification Preferences ───────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  const [contentApprovalAlerts, setContentApprovalAlerts] = useState(true);
  const [scheduleReminders, setScheduleReminders] = useState(true);

  // ── Workspace Settings ─────────────────────────────────────────
  const [defaultTeam, setDefaultTeam] = useState("social");
  const [defaultView, setDefaultView] = useState("dashboard");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("en");

  // ── Connected platforms ────────────────────────────────────────
  const connectedPlatforms = new Set(socialAccounts.map((sa) => sa.platform));
  const [localConnected, setLocalConnected] = useState<Set<string>>(connectedPlatforms);

  // ── Danger zone ────────────────────────────────────────────────
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showResetData, setShowResetData] = useState(false);

  // ── Loading & saving states ────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  // ── Load settings from API on mount ────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();

      if (data.organization) {
        const org = data.organization as OrgData;
        setOrgName(org.name);
        setOrgPlan(PLAN_DISPLAY[org.plan] || org.plan || "Starter");
        setOrgMaxUsers(org.maxUsers);
        setOrgMaxAccounts(org.maxAccounts);
      }

      if (data.user) {
        const user = data.user as UserProfile;
        setUserName(user.name);
        setUserEmail(user.email);
        setUserRole(user.role);
      }

      if (data.usage) {
        setOrgUsage(data.usage);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to load settings", {
        description: "Using default values. Please refresh to try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Toggle platform connection ─────────────────────────────────
  function togglePlatform(platform: string) {
    setLocalConnected((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  // ── Save handler — calls the API ───────────────────────────────
  async function handleSave(section: string) {
    setSavingSection(section);
    setSavedSection(null);

    try {
      let body: Record<string, unknown> = {};

      switch (section) {
        case "organization":
          body = {
            organization: { name: orgName },
          };
          break;
        case "profile":
          body = {
            user: { name: userName, email: userEmail },
          };
          break;
        case "notifications":
          body = {
            notifications: {
              emailNotifications,
              inAppNotifications,
              weeklyDigest,
              mentionAlerts,
              contentApprovalAlerts,
              scheduleReminders,
            },
          };
          break;
        case "workspace":
          body = {
            notifications: {
              defaultTeam,
              defaultView,
              timezone,
              language,
            },
          };
          break;
        default:
          return;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save settings");
      }

      // Show success feedback
      setSavedSection(section);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`, {
        description: "Your changes have been saved successfully.",
      });

      // Reset "Saved!" indicator after 2 seconds
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err) {
      console.error(`Failed to save ${section} settings:`, err);
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSavingSection(null);
    }
  }

  // ── Save button with loading/saved states ──────────────────────
  function SaveButton({ section, label }: { section: string; label: string }) {
    const isSaving = savingSection === section;
    const isSaved = savedSection === section;

    return (
      <Button
        onClick={() => handleSave(section)}
        disabled={isSaving || isLoading}
        className={cn(
          "bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]",
          isSaved && "bg-emerald-500 hover:bg-emerald-500 cursor-default"
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Saving...
          </>
        ) : isSaved ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-1.5" />
            {label}
          </>
        )}
      </Button>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-emerald-500" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organization, profile, and preferences
            </p>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="flex justify-end">
                  <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-emerald-500" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization, profile, and preferences
          </p>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* ── Organization Settings ──────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Organization Settings
              </CardTitle>
              <CardDescription>Manage your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-sm font-medium">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Logo</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50">
                      <Camera className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Plan</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                      {orgPlan}
                    </Badge>
                    <Button variant="link" size="sm" className="text-emerald-600 p-0 h-auto">
                      Upgrade
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User Limit</Label>
                  <p className="text-sm text-muted-foreground">{orgUsage.userCount} / {orgMaxUsers} users</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Limit</Label>
                  <p className="text-sm text-muted-foreground">{orgUsage.accountCount} / {orgMaxAccounts} accounts</p>
                </div>
              </div>
              <div className="flex justify-end">
                <SaveButton section="organization" label="Save Changes" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── User Profile ──────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                User Profile
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                    {userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Change Avatar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="user-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="user-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge className="capitalize bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                    {userRole}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <SaveButton section="profile" label="Save Profile" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Notification Preferences ──────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "Email Notifications", desc: "Receive email updates about activity", checked: emailNotifications, onChange: setEmailNotifications },
                { label: "In-App Notifications", desc: "Show notifications inside the app", checked: inAppNotifications, onChange: setInAppNotifications },
                { label: "Weekly Digest", desc: "Receive a weekly summary email", checked: weeklyDigest, onChange: setWeeklyDigest },
                { label: "Mention Alerts", desc: "Get notified when you're mentioned", checked: mentionAlerts, onChange: setMentionAlerts },
                { label: "Content Approval Alerts", desc: "Notify when content needs approval", checked: contentApprovalAlerts, onChange: setContentApprovalAlerts },
                { label: "Schedule Reminders", desc: "Remind before scheduled posts go live", checked: scheduleReminders, onChange: setScheduleReminders },
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
                  </div>
                  {i < 5 && <Separator />}
                </React.Fragment>
              ))}
              <div className="flex justify-end pt-3">
                <SaveButton section="notifications" label="Save Preferences" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Workspace Settings ────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                Workspace
              </CardTitle>
              <CardDescription>Configure your workspace defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Default Team
                  </Label>
                  <Select value={defaultTeam} onValueChange={setDefaultTeam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Default View
                  </Label>
                  <Select value={defaultView} onValueChange={setDefaultView}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="pipeline">Pipeline</SelectItem>
                      <SelectItem value="dissemination">Dissemination</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <SaveButton section="workspace" label="Save Workspace" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Integrations ──────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plug className="h-4 w-4 text-emerald-500" />
                Integrations
              </CardTitle>
              <CardDescription>Connect your social media platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLATFORM_INTEGRATIONS.map((integration) => {
                  const Icon = integration.icon;
                  const isConnected = localConnected.has(integration.platform);
                  return (
                    <div
                      key={integration.platform}
                      className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                        style={{ backgroundColor: `${integration.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: integration.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{integration.name}</h4>
                          {isConnected && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{integration.description}</p>
                      </div>
                      <Button
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          "shrink-0",
                          isConnected
                            ? "text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white",
                        )}
                        onClick={() => togglePlatform(integration.platform)}
                      >
                        {isConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <div>
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Reset All Data</h4>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">
                    Permanently delete all content, posts, and configurations
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950 shrink-0"
                  onClick={() => setShowResetData(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset Data
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <div>
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</h4>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950 shrink-0"
                  onClick={() => setShowDeleteAccount(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Delete account confirmation */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone. All teams, content, campaigns, and configurations will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
              Delete Account Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset data confirmation */}
      <AlertDialog open={showResetData} onOpenChange={setShowResetData}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all content, posts, automations, and configurations. Your account will remain but all data will be erased. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
