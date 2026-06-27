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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pipeline", label: "Content Pipeline", icon: Workflow },
  { id: "dissemination", label: "Dissemination", icon: Send, badge: "Live" },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox, badge: "New" },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
];

const manageNav: NavItem[] = [
  { id: "teams", label: "Teams", icon: Users },
  { id: "accounts", label: "Social Accounts", icon: Share2 },
  { id: "clients", label: "Clients & Campaigns", icon: Briefcase },
  { id: "influencers", label: "Influencers", icon: Star },
  { id: "assets", label: "Assets", icon: FolderOpen },
  { id: "brandKit", label: "Brand Kit", icon: Palette },
];

const hrNav: NavItem[] = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "payroll", label: "Payroll", icon: Banknote },
  { id: "recruitment", label: "Recruitment", icon: UserPlus },
];

const financeNav: NavItem[] = [
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "financeAccounts", label: "Accounts", icon: Landmark },
];

const inventoryNav: NavItem[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "purchaseOrders", label: "Purchase Orders", icon: ShoppingCart },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "itAssets", label: "IT Assets", icon: Monitor },
];

const insightNav: NavItem[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "automation", label: "Automation", icon: Zap, badge: "Pro" },
  { id: "invoicing", label: "Invoicing", icon: Receipt },
  { id: "archive", label: "Archive", icon: Archive },
];

const bottomNav: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen, notifications, inboxMessages, approvals } = useERPStore();

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
          "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out h-screen sticky top-0",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">VortexERP</h1>
                <p className="text-[10px] text-muted-foreground leading-none">Agency Platform</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {/* Main Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Main
              </p>
            )}
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

          <Separator className="my-2" />

          {/* Manage Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Manage
              </p>
            )}
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

          <Separator className="my-2" />

          {/* HR Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                HR
              </p>
            )}
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

          <Separator className="my-2" />

          {/* Finance Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Finance
              </p>
            )}
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

          <Separator className="my-2" />

          {/* Inventory Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Inventory
              </p>
            )}
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

          <Separator className="my-2" />

          {/* Insights Section */}
          <div className="space-y-0.5">
            {sidebarOpen && (
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Insights
              </p>
            )}
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

        {/* Bottom */}
        <div className="border-t border-border py-2 px-2 space-y-0.5">
          {bottomNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id)}
              collapsed={!sidebarOpen}
            />
          ))}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-sm hover:bg-accent z-10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
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
    if (!isNaN(num) && num > 0) return "bg-red-500/15 text-red-600 dark:text-red-400";
    return "bg-muted text-muted-foreground";
  };

  const button = (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge && (
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded-md leading-none",
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
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.badge && ` (${item.badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
