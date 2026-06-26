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
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{viewLabels[activeView]}</h2>
        {(activeView === "pipeline" || activeView === "dissemination") && (
          <Badge variant="secondary" className="text-[10px] font-medium">
            {activeView === "pipeline" ? "6 Stages" : "Multi-Platform"}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-52 pl-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
          />
          <kbd className="absolute right-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowCreateContent(true)}>
              <Workflow className="mr-2 h-4 w-4" />
              New Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreatePost(true)}>
              <Send className="mr-2 h-4 w-4" />
              New Post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Briefcase className="mr-2 h-4 w-4" />
              New Campaign
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              New Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {currentUser?.name?.split(" ").map(n => n[0]).join("") || "SC"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-medium leading-none">{currentUser?.name || "Sarah Chen"}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Admin</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
