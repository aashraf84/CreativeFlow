"use client";

import React from "react";
import { useERPStore, type ActiveView } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Workflow,
  Send,
  CalendarDays,
  Users,
  Share2,
  Briefcase,
  BarChart3,
  Zap,
  Archive,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  ShieldCheck,
  Star,
  FolderOpen,
  Palette,
  Receipt,
  Banknote,
  UserPlus,
  Landmark,
  Package,
  ShoppingCart,
  Store,
  Monitor,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color?: string;
}

const SECTION_MAIN = "#34c759";
const SECTION_MANAGE = "#007aff";
const SECTION_HR = "#ff9500";
const SECTION_FINANCE = "#30d158";
const SECTION_INVENTORY = "#ff3b30";
const SECTION_INSIGHTS = "#af52de";

const SECTION_COLOR_BY_VIEW: Record<string, string> = {};

const mainNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: SECTION_MAIN },
  { id: "pipeline", label: "Content Pipeline", icon: Workflow, color: SECTION_MAIN },
  { id: "dissemination", label: "Dissemination", icon: Send, badge: "Live", color: SECTION_MAIN },
  { id: "calendar", label: "Calendar", icon: CalendarDays, color: SECTION_MAIN },
  { id: "inbox", label: "Inbox", icon: Inbox, badge: "New", color: SECTION_MAIN },
  { id: "approvals", label: "Approvals", icon: ShieldCheck, color: SECTION_MAIN },
];

const manageNav: NavItem[] = [
  { id: "teams", label: "Teams", icon: Users, color: SECTION_MANAGE },
  { id: "accounts", label: "Social Accounts", icon: Share2, color: SECTION_MANAGE },
  { id: "clients", label: "Clients & Campaigns", icon: Briefcase, color: SECTION_MANAGE },
  { id: "influencers", label: "Influencers", icon: Star, color: SECTION_MANAGE },
  { id: "assets", label: "Assets", icon: FolderOpen, color: SECTION_MANAGE },
  { id: "brandKit", label: "Brand Kit", icon: Palette, color: SECTION_MANAGE },
];

const hrNav: NavItem[] = [
  { id: "employees", label: "Employees", icon: Users, color: SECTION_HR },
  { id: "attendance", label: "Attendance", icon: Clock, color: SECTION_HR },
  { id: "payroll", label: "Payroll", icon: Banknote, color: SECTION_HR },
  { id: "recruitment", label: "Recruitment", icon: UserPlus, color: SECTION_HR },
];

const financeNav: NavItem[] = [
  { id: "financeAccounts", label: "Accounts", icon: Landmark, color: SECTION_FINANCE },
  { id: "invoicing", label: "Invoicing", icon: Receipt, color: SECTION_FINANCE },
  { id: "expenses", label: "Expenses", icon: Receipt, color: SECTION_FINANCE },
];

const inventoryNav: NavItem[] = [
  { id: "products", label: "Products", icon: Package, color: SECTION_INVENTORY },
  { id: "purchaseOrders", label: "Purchase Orders", icon: ShoppingCart, color: SECTION_INVENTORY },
  { id: "vendors", label: "Vendors", icon: Store, color: SECTION_INVENTORY },
  { id: "itAssets", label: "IT Assets", icon: Monitor, color: SECTION_INVENTORY },
];

const insightNav: NavItem[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3, color: SECTION_INSIGHTS },
  { id: "automation", label: "Automation", icon: Zap, badge: "Pro", color: SECTION_INSIGHTS },
  { id: "reports", label: "Reports", icon: FileText, color: SECTION_INSIGHTS },
  { id: "archive", label: "Archive", icon: Archive, color: SECTION_INSIGHTS },
];

const bottomNav: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings },
];

function SectionHeader({ label, color }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-4 pb-1.5">
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#86868b] dark:text-[#aeaeb2]/80">
        {label}
      </p>
    </div>
  );
}

export function Sidebar() {
  const {
    activeView,
    setActiveView,
    sidebarOpen,
    setSidebarOpen,
    notifications,
    inboxMessages,
    approvals,
    currentUser,
  } = useERPStore();

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadInbox = inboxMessages.filter(m => m.status === 'unread').length;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

  const getBadge = (id: ActiveView): string | undefined => {
    if (id === 'inbox' && unreadInbox > 0) return String(unreadInbox);
    if (id === 'approvals' && pendingApprovals > 0) return String(pendingApprovals);
    const item = [...mainNav, ...manageNav, ...hrNav, ...financeNav, ...inventoryNav, ...insightNav, ...bottomNav].find(n => n.id === id);
    return item?.badge;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen sticky top-0 z-20",
          "bg-[#f7f7f8] dark:bg-[#1c1c1e] border-r border-[#e5e5e7] dark:border-[#38383a]",
          "transition-[width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          sidebarOpen ? "w-64" : "w-[68px]"
        )}
      >
        {/* macOS Traffic Light Dots + Logo */}
        <div className={cn(
          "flex items-center h-14 px-4",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="leading-none">
                <h1 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">VortexERP</h1>
                <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] mt-0.5">Agency Platform</p>
              </div>
            </div>
          ) : (
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-1 macos-scroll">
          {/* Main */}
          {sidebarOpen && <SectionHeader label="Main" color={SECTION_MAIN} />}
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>

          {sidebarOpen && <SectionHeader label="Manage" color={SECTION_MANAGE} />}
          <div className="space-y-0.5">
            {manageNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>

          {sidebarOpen && <SectionHeader label="Human Resources" color={SECTION_HR} />}
          <div className="space-y-0.5">
            {hrNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>

          {sidebarOpen && <SectionHeader label="Finance" color={SECTION_FINANCE} />}
          <div className="space-y-0.5">
            {financeNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>

          {sidebarOpen && <SectionHeader label="Inventory" color={SECTION_INVENTORY} />}
          <div className="space-y-0.5">
            {inventoryNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>

          {sidebarOpen && <SectionHeader label="Insights" color={SECTION_INSIGHTS} />}
          <div className="space-y-0.5">
            {insightNav.map((item) => (
              <NavButton
                key={item.id}
                item={{ ...item, badge: getBadge(item.id) }}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                collapsed={!sidebarOpen}
              />
            ))}
          </div>
        </nav>

        {/* Bottom: Settings + User */}
        <div className="px-2 pb-3 pt-2 border-t border-[#e5e5e7] dark:border-[#38383a] space-y-1">
          {bottomNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id)}
              collapsed={!sidebarOpen}
            />
          ))}

          {/* User profile row */}
          {sidebarOpen ? (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8 ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  {currentUser?.name?.split(" ").map(n => n[0]).join("") || "SC"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-[#1d1d1f] dark:text-white">{currentUser?.name || "Sarah Chen"}</p>
                <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] truncate">Admin · {unreadNotifications} new</p>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex justify-center">
              <Avatar className="h-8 w-8 ring-1 ring-black/5 dark:ring-white/10">
                <AvatarFallback className="text-[11px] font-semibold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  {currentUser?.name?.split(" ").map(n => n[0]).join("") || "SC"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Collapse Toggle — macOS pill style */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos hover:bg-black/5 dark:hover:bg-white/10 z-30"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}

function NavButton({
  item,
  isActive,
  onClick,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const badgeColor = (badge: string) => {
    if (badge === "Live") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    if (badge === "Pro") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    if (badge === "New") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    // Numeric badges (unread counts)
    const num = parseInt(badge);
    if (!isNaN(num) && num > 0) return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
    return "bg-black/5 text-[#86868b] dark:bg-white/10 dark:text-[#aeaeb2]";
  };

  const button = (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2" : "px-2.5 py-1.5",
        isActive
          ? "bg-black/[0.07] dark:bg-white/10 text-[#1d1d1f] dark:text-white shadow-sm"
          : "text-[#424245] dark:text-[#aeaeb2] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1d1d1f] dark:hover:text-white"
      )}
      style={isActive && item.color ? { borderLeft: `2px solid ${item.color}` } : undefined}
    >
      <Icon className={cn(
        "shrink-0 transition-colors",
        collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
        isActive && item.color ? "" : isActive ? "text-emerald-600 dark:text-emerald-400" : "text-[#86868b] dark:text-[#aeaeb2]"
      )} style={isActive && item.color ? { color: item.color } : undefined} />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && (
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-semibold rounded-md leading-none",
              badgeColor(item.badge)
            )}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] shadow-macos">
          {item.label}
          {item.badge && ` (${item.badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
