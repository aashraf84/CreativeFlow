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
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

export function Header() {
  const { activeView, setShowCreateContent, setShowCreatePost, currentUser } = useERPStore();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("vortex-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
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
    <header className="sticky top-0 z-30 h-14 glass-toolbar border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 lg:px-6 gap-4">
      {/* Left: Page title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white truncate">
            {viewLabels[activeView]}
          </h2>
          {(activeView === "pipeline" || activeView === "dissemination") && (
            <Badge variant="secondary" className="text-[10px] font-medium shrink-0 rounded-full bg-black/5 dark:bg-white/10">
              {activeView === "pipeline" ? "6 Stages" : "Multi-Platform"}
            </Badge>
          )}
        </div>
      </div>

      {/* Center: Pill search */}
      <div className="hidden md:flex flex-1 max-w-md items-center relative">
        <Search className="absolute left-3.5 h-3.5 w-3.5 text-[#86868b] dark:text-[#aeaeb2] pointer-events-none" />
        <Input
          placeholder="Search VortexERP…"
          className="h-9 w-full pl-9 pr-16 text-[13px] rounded-full bg-black/[0.04] dark:bg-white/[0.06] border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:bg-white dark:focus-visible:bg-white/10 placeholder:text-[#86868b] dark:placeholder:text-[#aeaeb2]"
        />
        <kbd className="absolute right-2.5 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/10 px-1.5 font-mono text-[10px] font-medium text-[#86868b] dark:text-[#aeaeb2]">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 border-0 px-4">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass border border-black/5 dark:border-white/10 shadow-macos-lg">
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

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08]" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-3.5 min-w-[14px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-[#1c1c1e]">
            3
          </span>
        </Button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors">
              <Avatar className="h-8 w-8 ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  {currentUser?.name?.split(" ").map(n => n[0]).join("") || "SC"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass border border-black/5 dark:border-white/10 shadow-macos-lg">
            <div className="px-2 py-2 border-b border-black/5 dark:border-white/10">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">{currentUser?.name || "Sarah Chen"}</p>
              <p className="text-[11px] text-[#86868b] dark:text-[#aeaeb2]">Admin</p>
            </div>
            <DropdownMenuItem className="rounded-lg mt-1">Profile</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg text-rose-600 dark:text-rose-400">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
