"use client";

import React from "react";
import { useERPStore, type ActiveView } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Plus,
  Search,
  Moon,
  Sun,
  Command,
  Workflow,
  Send,
  Briefcase,
  Users,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const viewLabels: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  pipeline: "Content Pipeline",
  dissemination: "Dissemination Hub",
  calendar: "Content Calendar",
  teams: "Team Management",
  accounts: "Social Accounts",
  clients: "Clients & Campaigns",
  analytics: "Analytics & Insights",
  automation: "Automation Rules",
  archive: "Content Archive",
  settings: "Settings",
  inbox: "Inbox",
  approvals: "Approvals",
  invoicing: "Invoicing",
  assets: "Assets",
  brandKit: "Brand Kit",
  influencers: "Influencers",
  employees: "Employees",
  payroll: "Payroll",
  recruitment: "Recruitment",
  expenses: "Expenses",
  financeAccounts: "Finance & Accounts",
  products: "Products & Stock",
  purchaseOrders: "Purchase Orders",
  vendors: "Vendors",
  itAssets: "IT Assets",
};

// Map each view to its Tahoe section color (matches sidebar palette)
const SECTION_COLOR_BY_VIEW: Record<ActiveView, string> = {
  dashboard: "#34c759",
  pipeline: "#34c759",
  dissemination: "#34c759",
  calendar: "#34c759",
  inbox: "#34c759",
  approvals: "#34c759",
  teams: "#007aff",
  accounts: "#007aff",
  clients: "#007aff",
  influencers: "#007aff",
  assets: "#007aff",
  brandKit: "#007aff",
  employees: "#ff9500",
  attendance: "#ff9500",
  payroll: "#ff9500",
  recruitment: "#ff9500",
  financeAccounts: "#30d158",
  invoicing: "#30d158",
  expenses: "#30d158",
  products: "#ff3b30",
  purchaseOrders: "#ff3b30",
  vendors: "#ff3b30",
  itAssets: "#ff3b30",
  analytics: "#af52de",
  automation: "#af52de",
  reports: "#af52de",
  archive: "#af52de",
  settings: "#86868b",
};

export function Header() {
  const { activeView, setShowCreateContent, setShowCreatePost, currentUser, isViewOnly, logout, notifications, approvals } = useERPStore();
  const [isDark, setIsDark] = React.useState(false);
  const [searchFocused, setSearchFocused] = React.useState(false);

  // Unread notifications & pending approvals (drive the bounce / pulse-glow)
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingApprovals = approvals.filter(a => a.status === "pending").length;
  const hasUnread = unreadCount > 0;
  const hasPending = pendingApprovals > 0;

  // Refined page title — section color stays on the dot indicator,
  // title text now uses Tahoe's neutral text color for a cleaner look.
  const pageTitle = viewLabels[activeView];

  // User display helpers
  const fullName = currentUser?.name || "Sarah Chen";
  const initials = fullName
    .split(" ")
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "SC";
  const firstName = fullName.split(" ")[0];

  React.useEffect(() => {
    // Sync state with whatever the bootstrap script (or a prior session) set
    const currentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(currentlyDark);

    // If no preference is saved yet, fall back to system preference
    const savedTheme = localStorage.getItem("vortex-theme");
    if (!savedTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark && !currentlyDark) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else if (!prefersDark && currentlyDark) {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vortex-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vortex-theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 glass-toolbar border-b border-[#e5e5e7] dark:border-[#38383a] shadow-tahoe-sm flex items-center justify-between px-4 lg:px-6 gap-4">
      {/* Left: Page title (animated fade transition on view switch) */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-300"
            style={{ backgroundColor: SECTION_COLOR_BY_VIEW[activeView] || "#34c759" }}
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-center gap-3 min-w-0"
            >
              <h1 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white truncate">
                {pageTitle}
              </h1>
              {(activeView === "pipeline" || activeView === "dissemination") && (
                <Badge variant="secondary" className="text-[10px] font-medium shrink-0 rounded-full bg-black/5 dark:bg-white/10">
                  {activeView === "pipeline" ? "6 Stages" : "Multi-Platform"}
                </Badge>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Center: Refined search — rounded-lg, expands on focus (w-52 → w-72) */}
      <div className="relative hidden md:flex flex-1 max-w-md items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] dark:text-[#aeaeb2] pointer-events-none" />
        <Input
          placeholder="Search VortexERP…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={cn(
            "pl-9 pr-12 h-9 text-[13px] rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border-transparent",
            "placeholder:text-[#86868b] dark:placeholder:text-[#aeaeb2]",
            "focus-visible:bg-white dark:focus-visible:bg-[#1c1c1e] focus-visible:border-emerald-400/40",
            "focus-visible:ring-2 focus-visible:ring-emerald-400/30",
            "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            searchFocused ? "w-full sm:w-72" : "w-52"
          )}
        />
        <kbd
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-[#e5e5e7] dark:border-[#38383a] bg-[#f7f7f8] dark:bg-white/10 px-1.5 font-mono text-[10px] font-medium text-[#86868b] dark:text-[#aeaeb2] transition-opacity duration-200",
            searchFocused ? "opacity-0" : "opacity-100"
          )}
        >
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick Create — premium gradient button with Tahoe micro-interaction */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                "h-9 px-4 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-tahoe-sm hover:shadow-tahoe btn-tahoe gap-1.5 border-0",
                hasPending && "animate-[vortex-glow_2.4s_ease-in-out_infinite]"
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="text-[13px] font-semibold hidden sm:inline">Create</span>
              {hasPending && (
                <span className="ml-0.5 inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-white/25 text-[9px] font-bold text-white">
                  {pendingApprovals}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos-lg">
            <DropdownMenuItem onClick={() => setShowCreateContent(true)} className="rounded-lg">
              <Workflow className="mr-2 h-4 w-4" />
              New Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreatePost(true)} className="rounded-lg">
              <Send className="mr-2 h-4 w-4" />
              New Post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg">
              <Briefcase className="mr-2 h-4 w-4" />
              New Campaign
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">
              <Users className="mr-2 h-4 w-4" />
              New Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle — smooth rotation (Sun ↔ Moon) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-200 group"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.span
                key="sun"
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="inline-flex"
              >
                <Sun className="h-[18px] w-[18px] text-amber-500 dark:text-amber-300 transition-transform duration-300 group-hover:scale-110" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="inline-flex"
              >
                <Moon className="h-[18px] w-[18px] text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Demo mode indicator */}
        {isViewOnly && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30">
            <Eye className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">DEMO</span>
          </div>
        )}

        {/* Notifications — premium bell with badge, subtle bounce on unread */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-200 relative",
            hasUnread && "animate-[vortex-pulse_1.6s_ease-in-out_infinite]"
          )}
          aria-label="Notifications"
        >
          <Bell className={cn("h-[18px] w-[18px] transition-transform", hasUnread && "origin-top")} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-white dark:ring-[#1c1c1e]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {/* User — clean avatar dropdown with name on sm+ screens */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all duration-200 gap-2"
            >
              <Avatar className="h-7 w-7 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium hidden sm:block text-[#1d1d1f] dark:text-white">
                {firstName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos-lg">
            <div className="px-2 py-2 border-b border-[#e5e5e7] dark:border-[#38383a]">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">{fullName}</p>
              <p className="text-[11px] text-[#86868b] dark:text-[#aeaeb2]">{isViewOnly ? "Demo Viewer" : "Admin"}</p>
            </div>
            <DropdownMenuItem className="rounded-lg mt-1">Profile</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg text-rose-600 dark:text-rose-400" onClick={() => logout()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
