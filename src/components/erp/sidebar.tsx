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

// Section color display name for hover tooltips
const SECTION_NAME_BY_COLOR: Record<string, string> = {
  [SECTION_MAIN]: "Main",
  [SECTION_MANAGE]: "Manage",
  [SECTION_HR]: "Human Resources",
  [SECTION_FINANCE]: "Finance",
  [SECTION_INVENTORY]: "Inventory",
  [SECTION_INSIGHTS]: "Insights",
};

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

/** Convert a raw role string (e.g. "creative_lead") into a human-readable label. */
function formatRoleLabel(role?: string): string {
  if (!role) return "Agency Platform";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SectionHeader({ label, color }: { label: string; color?: string }) {
  const tooltipText = color ? SECTION_NAME_BY_COLOR[color] || label : label;
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="group relative flex items-center gap-1.5 px-3 pt-4 pb-1.5 cursor-default">
          {color && (
            <span
              className="h-1.5 w-1.5 rounded-full transition-transform duration-200 group-hover:scale-150"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}66` }}
            />
          )}
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#86868b] dark:text-[#aeaeb2]">
            {label}
          </p>
          {/* Subtle divider line after each section header */}
          <span
            className="flex-1 h-px ml-2 rounded-full opacity-40"
            style={{ background: color ? `linear-gradient(to right, ${color}40, transparent)` : undefined }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-tahoe">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {tooltipText}
        </span>
      </TooltipContent>
    </Tooltip>
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

  // ── User profile derived values ──
  const userName = currentUser?.name || "Sarah Chen";
  const userRole = formatRoleLabel(currentUser?.role);
  const initials =
    currentUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "SC";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen sticky top-0 z-20",
          "glass-sidebar shadow-tahoe border-r border-black/5 dark:border-white/5",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-[68px]"
        )}
      >
        {/* macOS Traffic Light Dots + Branding */}
        <div
          className={cn(
            "flex items-center px-4 py-3 gap-3",
            sidebarOpen ? "justify-between" : "justify-start"
          )}
        >
          {/* macOS window controls */}
          <div className="traffic-lights">
            <div className="traffic-light traffic-light-close" />
            <div className="traffic-light traffic-light-minimize" />
            <div className="traffic-light traffic-light-maximize" />
          </div>

          {/* Branding — only shown when sidebar is expanded */}
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/25 breathe">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="leading-none">
                <h1 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">CreativeFlow ERP</h1>
                <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] mt-0.5">Agency Platform</p>
              </div>
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

        {/* Bottom: Settings + User Profile */}
        <div className="px-2 pb-3 pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
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
            <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer">
              <div className="relative">
                <Avatar className="h-7 w-7 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#f7f7f8] dark:border-[#1c1c1e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1d1d1f] dark:text-white truncate">{userName}</p>
                <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] truncate flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {userRole} · {unreadNotifications} new
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex justify-center">
              <div className="relative">
                <Avatar className="h-7 w-7 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#f7f7f8] dark:border-[#1c1c1e]" />
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle — macOS pill style with rotate-on-hover animation */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-tahoe hover:bg-black/5 dark:hover:bg-white/10 z-30 group"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:rotate-12" />
          ) : (
            <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-rotate-12" />
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
  // Section color is used for the left accent bar + active icon tint; falls back to emerald.
  const accentColor = item.color || "#34c759";

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
        "w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-200 relative group",
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
        isActive
          ? "vibrant-active font-medium"
          : "text-[#1d1d1f] dark:text-white/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1d1d1f] dark:hover:text-white"
      )}
    >
      {/* Left accent bar — visible only on the active item */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <Icon
        className={cn(
          "shrink-0 transition-colors h-[18px] w-[18px]",
          !isActive && "text-[#86868b] dark:text-[#aeaeb2]"
        )}
        style={isActive && item.color ? { color: item.color } : undefined}
      />
      {!collapsed && (
        <>
          <span
            className="flex-1 text-left truncate"
            style={isActive && item.color ? { color: item.color } : undefined}
          >
            {item.label}
          </span>
          {item.badge && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold rounded-md leading-none",
                badgeColor(item.badge)
              )}
            >
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
        <TooltipContent side="right" className="font-medium bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-tahoe">
          {item.label}
          {item.badge && ` (${item.badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
