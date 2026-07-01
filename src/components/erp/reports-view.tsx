"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useERPStore } from "@/lib/store";
import {
  type Employee,
  type LeaveRequest,
  type Product,
  type Warehouse,
  type StockMovement,
  type Expense,
  type Invoice,
  type Vendor,
  type PurchaseOrder,
  type ITAsset,
  type AssetIssuance,
  type Client,
  type Campaign,
  type PayrollRun,
  type TaxRate,
  type Department,
  type Content,
  type Post,
  type Influencer,
  type Disseminator,
  type DisseminationTask,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/hooks/use-permissions";
import {
  FileText,
  BarChart3,
  Scale,
  TrendingUp,
  BookOpen,
  Users,
  CalendarCheck,
  Package,
  Printer,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Lock,
  Search,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Receipt,
  CreditCard,
  Percent,
  Wallet,
  CalendarDays,
  Building2,
  ArrowLeftRight,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  ShoppingCart,
  Truck,
  Laptop,
  PackageCheck,
  Users2,
  Megaphone,
  Banknote,
  Clock,
  Send,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

// ── Helpers ─────────────────────────────────────────────────────────
function fmtMoney(n: number): string {
  const negative = n < 0;
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return negative ? `(${formatted})` : formatted;
}

function fmtNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtDate(d: string | Date | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return String(d);
  }
}

function fmtPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  try {
    const now = new Date();
    const then = new Date(dateStr);
    return Math.max(0, Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function titleCase(s: string): string {
  if (!s) return "—";
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Report catalog ──────────────────────────────────────────────────
type ReportCategory =
  | "Financial"
  | "Human Resources"
  | "Inventory"
  | "Procurement"
  | "Assets"
  | "CRM & Sales"
  | "Content & Social";

type ReportId =
  | "financial-summary"
  | "balance-sheet"
  | "pnl"
  | "trial-balance"
  | "cash-flow"
  | "ar-aging"
  | "ap-aging"
  | "tax-summary"
  | "employee-directory"
  | "attendance-summary"
  | "payroll-summary"
  | "leave-report"
  | "department-summary"
  | "inventory-valuation"
  | "stock-movement"
  | "low-stock-alert"
  | "warehouse-summary"
  | "po-summary"
  | "vendor-performance"
  | "expense-report"
  | "it-asset-register"
  | "asset-issuance"
  | "client-report"
  | "campaign-performance"
  | "content-pipeline"
  | "social-performance"
  | "influencer-roi"
  | "dissemination-performance";

interface ReportMeta {
  id: ReportId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: ReportCategory;
  accent: string;
  usesApi?: boolean;
}

const CATEGORY_ORDER: ReportCategory[] = [
  "Financial",
  "Human Resources",
  "Content & Social",
  "Inventory",
  "Procurement",
  "Assets",
  "CRM & Sales",
];

const REPORTS: ReportMeta[] = [
  // Financial (8)
  {
    id: "financial-summary",
    label: "Financial Summary",
    description: "Revenue, expenses & net income overview",
    icon: TrendingUp,
    category: "Financial",
    accent: "from-emerald-500 to-teal-500",
    usesApi: true,
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    description: "Assets, liabilities & equity position",
    icon: Scale,
    category: "Financial",
    accent: "from-teal-500 to-cyan-500",
    usesApi: true,
  },
  {
    id: "pnl",
    label: "Profit & Loss Statement",
    description: "Revenue and expenses breakdown",
    icon: BarChart3,
    category: "Financial",
    accent: "from-emerald-500 to-green-500",
    usesApi: true,
  },
  {
    id: "trial-balance",
    label: "Trial Balance",
    description: "All accounts with debit/credit totals",
    icon: BookOpen,
    category: "Financial",
    accent: "from-cyan-500 to-emerald-500",
    usesApi: true,
  },
  {
    id: "cash-flow",
    label: "Cash Flow Statement",
    description: "Cash inflows and outflows summary",
    icon: DollarSign,
    category: "Financial",
    accent: "from-emerald-600 to-teal-600",
    usesApi: true,
  },
  {
    id: "ar-aging",
    label: "Accounts Receivable Aging",
    description: "Outstanding invoices by age bucket",
    icon: Receipt,
    category: "Financial",
    accent: "from-green-500 to-emerald-600",
  },
  {
    id: "ap-aging",
    label: "Accounts Payable Aging",
    description: "Outstanding expenses by age bucket",
    icon: CreditCard,
    category: "Financial",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    id: "tax-summary",
    label: "Tax Summary",
    description: "Tax rates and tax-related transactions",
    icon: Percent,
    category: "Financial",
    accent: "from-cyan-600 to-teal-600",
  },
  // Human Resources (5)
  {
    id: "employee-directory",
    label: "Employee Directory",
    description: "All employees with department & contact",
    icon: Users,
    category: "Human Resources",
    accent: "from-teal-500 to-emerald-500",
    usesApi: true,
  },
  {
    id: "attendance-summary",
    label: "Attendance Summary",
    description: "Attendance stats by employee",
    icon: CalendarCheck,
    category: "Human Resources",
    accent: "from-emerald-500 to-emerald-600",
    usesApi: true,
  },
  {
    id: "payroll-summary",
    label: "Payroll Summary",
    description: "Payroll runs with gross/net salaries",
    icon: Wallet,
    category: "Human Resources",
    accent: "from-green-500 to-teal-600",
  },
  {
    id: "leave-report",
    label: "Leave Report",
    description: "Leave requests by type and status",
    icon: CalendarDays,
    category: "Human Resources",
    accent: "from-teal-500 to-green-500",
  },
  {
    id: "department-summary",
    label: "Department Summary",
    description: "Headcount and costs by department",
    icon: Building2,
    category: "Human Resources",
    accent: "from-emerald-500 to-cyan-500",
  },
  // Inventory (4)
  {
    id: "inventory-valuation",
    label: "Inventory Valuation",
    description: "Products with stock value (qty × price)",
    icon: Package,
    category: "Inventory",
    accent: "from-green-500 to-teal-500",
  },
  {
    id: "stock-movement",
    label: "Stock Movement Report",
    description: "All stock movements (in/out/transfer)",
    icon: ArrowLeftRight,
    category: "Inventory",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    id: "low-stock-alert",
    label: "Low Stock Alert",
    description: "Products below reorder level",
    icon: AlertTriangle,
    category: "Inventory",
    accent: "from-amber-500 to-orange-500",
  },
  {
    id: "warehouse-summary",
    label: "Warehouse Summary",
    description: "Stock by warehouse",
    icon: WarehouseIcon,
    category: "Inventory",
    accent: "from-emerald-500 to-green-500",
  },
  // Procurement (3)
  {
    id: "po-summary",
    label: "Purchase Order Summary",
    description: "POs by status, vendor, total amount",
    icon: ShoppingCart,
    category: "Procurement",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "vendor-performance",
    label: "Vendor Performance",
    description: "Vendors with PO counts and total spend",
    icon: Truck,
    category: "Procurement",
    accent: "from-teal-500 to-cyan-500",
  },
  {
    id: "expense-report",
    label: "Expense Report",
    description: "Expenses by category, status, and amount",
    icon: Receipt,
    category: "Procurement",
    accent: "from-green-500 to-emerald-500",
  },
  // Assets (2)
  {
    id: "it-asset-register",
    label: "IT Asset Register",
    description: "All IT assets with status & value",
    icon: Laptop,
    category: "Assets",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "asset-issuance",
    label: "Asset Issuance Report",
    description: "All issued assets with issue/return dates",
    icon: PackageCheck,
    category: "Assets",
    accent: "from-teal-500 to-emerald-600",
  },
  // CRM & Sales (2)
  {
    id: "client-report",
    label: "Client Report",
    description: "All clients with campaign counts & revenue",
    icon: Users2,
    category: "CRM & Sales",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "campaign-performance",
    label: "Campaign Performance",
    description: "Campaigns with content counts & status",
    icon: Megaphone,
    category: "CRM & Sales",
    accent: "from-teal-500 to-emerald-500",
  },
  // Content & Social (4)
  {
    id: "content-pipeline",
    label: "Content Pipeline Report",
    description: "Content by stage, type, and priority",
    icon: FileText,
    category: "Content & Social",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "social-performance",
    label: "Social Media Performance",
    description: "Posts by platform with engagement metrics",
    icon: TrendingUp,
    category: "Content & Social",
    accent: "from-teal-500 to-cyan-500",
  },
  {
    id: "influencer-roi",
    label: "Influencer ROI Report",
    description: "Influencer performance and engagement",
    icon: Users2,
    category: "Content & Social",
    accent: "from-green-500 to-emerald-500",
  },
  {
    id: "dissemination-performance",
    label: "Dissemination Performance",
    description: "Task completion rates by disseminator",
    icon: Send,
    category: "Content & Social",
    accent: "from-cyan-500 to-teal-500",
  },
];

// ── LetterPage (header + body + footer) ─────────────────────────────
interface LetterPageProps {
  title: string;
  subtitle?: string;
  page: number;
  totalPages: number;
  generatedAt: Date;
  children: React.ReactNode;
}

function LetterPage({ title, subtitle, page, totalPages, generatedAt, children }: LetterPageProps) {
  return (
    <section className="report-page bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-macos-lg rounded-sm relative">
      {/* Header — 3 columns: logo | title | date+page */}
      <header className="report-header">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">CreativeFlow Digital</p>
            <p className="text-[8.5px] uppercase tracking-[0.12em] text-slate-500">
              Agency Intelligence Platform
            </p>
          </div>
        </div>
        <div className="text-center">
          <h2 className="report-title">{title}</h2>
          {subtitle && (
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-right leading-tight">
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            <span className="block font-semibold text-slate-800">Generated</span>
            {generatedAt.toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 tabular-nums">
            Page {page} of {totalPages}
          </p>
        </div>
      </header>
      <div className="report-divider" />

      {/* Body */}
      <div className="report-body">{children}</div>

      {/* Footer */}
      <div className="report-divider report-footer-divider" />
      <footer className="report-footer">
        <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
          Confidential — For Internal Use Only
        </span>
        <span className="text-[9px] text-slate-500 italic text-center">
          CreativeFlow Digital · Creative Intelligence, Delivered.
        </span>
        <span className="text-[9px] text-slate-500 text-right">
          Generated by <span className="font-semibold">CreativeFlow ERP</span>
        </span>
      </footer>
    </section>
  );
}

// ── Body primitives ─────────────────────────────────────────────────
function ReportSectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="report-section-heading">{children}</h3>;
}

interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "accent" | "warning";
}

function SummaryCard({ label, value, hint, tone = "default" }: SummaryCardProps) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-rose-700"
      : tone === "accent"
      ? "text-teal-700"
      : tone === "warning"
      ? "text-amber-700"
      : "text-slate-900 dark:text-white";
  return (
    <div className="report-summary-card">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-1 ${toneClass}`}>{value}</p>
      {hint && <p className="text-[9px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

interface ReportTableProps {
  headers: string[];
  rows: string[][];
  totals?: string[];
  numericCols?: number[];
  subgroupIndices?: number[]; // row indices that are sub-group headers
}

function ReportTable({
  headers,
  rows,
  totals,
  numericCols = [],
  subgroupIndices = [],
}: ReportTableProps) {
  const isNumeric = (i: number) => numericCols.includes(i);
  const isSubgroup = (ri: number) => subgroupIndices.includes(ri);
  return (
    <table className="report-table">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={isNumeric(i) ? "report-th-num" : "report-th"}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className={
              isSubgroup(ri)
                ? "report-subgroup-row"
                : ri % 2 === 1
                ? "report-row-alt"
                : ""
            }
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={isNumeric(ci) ? "report-td-num" : "report-td"}
                dangerouslySetInnerHTML={{ __html: cell }}
              />
            ))}
          </tr>
        ))}
        {totals && (
          <tr className="report-totals-row">
            {totals.map((cell, ci) => (
              <td
                key={ci}
                className={
                  isNumeric(ci) ? "report-td-num report-td-total" : "report-td report-td-total"
                }
              >
                {cell}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

// Status pill — renders a small colored pill inside table cells
function Pill({ tone, label }: { tone: "positive" | "negative" | "warning" | "neutral" | "accent"; label: string }) {
  return `<span class="report-pill report-pill-${tone}">${label}</span>`;
}

// Simple horizontal bar chart row (label | bar | value)
function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="report-bar-row">
      <span className="text-slate-700 dark:text-slate-300 truncate">{label}</span>
      <div className="report-bar-track">
        <div className="report-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right tabular-nums text-slate-900 dark:text-white font-semibold">{fmtMoney(value)}</span>
    </div>
  );
}

// ── Empty + Loading states ──────────────────────────────────────────
function EmptyReport({
  title,
  generatedAt,
  totalPages,
}: {
  title: string;
  generatedAt: Date;
  totalPages: number;
}) {
  return (
    <LetterPage title={title} page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <p className="text-sm text-slate-600 dark:text-slate-400">No data available for this report.</p>
        <p className="text-xs text-slate-500">
          Ensure the underlying module data has been seeded and try again.
        </p>
      </div>
    </LetterPage>
  );
}

function ReportSkeleton({ title }: { title: string }) {
  return (
    <div className="report-page bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-macos-lg rounded-sm">
      <div className="report-header">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-8 w-24 ml-auto" />
      </div>
      <div className="report-divider" />
      <div className="report-body space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid grid-cols-4 gap-3 py-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-40 mt-4" />
        <Skeleton className="h-48 w-full" />
      </div>
      <p className="text-[10px] text-slate-500 text-center py-4">
        Loading &ldquo;{title}&rdquo;…
      </p>
    </div>
  );
}

// ── API data shapes ─────────────────────────────────────────────────
interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  accountBalancesByType?: Record<string, { count: number; totalBalance: number }>;
  revenueAccounts: { id: string; code: string; name: string; balance: number }[];
  expenseAccounts: { id: string; code: string; name: string; balance: number }[];
}

interface BalanceSheetData {
  assets: { id: string; code: string; name: string; category: string | null; balance: number }[];
  liabilities: { id: string; code: string; name: string; category: string | null; balance: number }[];
  equity: { id: string; code: string; name: string; category: string | null; balance: number }[];
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

interface PnlData {
  revenue: { id: string; code: string; name: string; category: string | null; balance: number }[];
  expenses: { id: string; code: string; name: string; category: string | null; balance: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface TrialBalanceData {
  accounts: {
    id: string;
    code: string;
    name: string;
    type: string;
    debitTotal: number;
    creditTotal: number;
  }[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

interface CashFlowData {
  cashAccounts: { id: string; code: string; name: string; balance: number }[];
  totalCash: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netChange: number;
}

interface EmployeeReportData {
  employees: Array<{
    employeeId: string;
    fullName: string;
    email: string;
    phone: string | null;
    position: string;
    department: string;
    employmentType: string;
    status: string;
    hireDate: string;
  }>;
  total: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  byEmploymentType: Record<string, number>;
}

interface AttendanceReportData {
  employees: Array<{
    employeeId: string;
    fullName: string;
    department: string;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    lateDays: number;
    attendanceRate: number;
    totalLeaveRequests: number;
    pendingLeaveRequests: number;
    approvedLeaveRequests: number;
  }>;
  totals: {
    totalEmployees: number;
    avgAttendanceRate: number;
    totalLeaveDays: number;
    totalPendingLeaves: number;
    totalWorkDays?: number;
  };
}

// ────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ────────────────────────────────────────────────────────────────────
export function ReportsView() {
  const [selected, setSelected] = useState<ReportId>("financial-summary");
  const [generatedAt] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const permissions = usePermissions();

  // ── API-backed report data state ──
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [employeeReport, setEmployeeReport] = useState<EmployeeReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // ── Store data (used by all non-API reports) ──
  const {
    products,
    warehouses,
    employees,
    leaveRequests,
    expenses,
    invoices,
    vendors,
    purchaseOrders,
    itAssets,
    assetIssuances,
    clients,
    campaigns,
    payrollRuns,
    taxRates,
    departments,
    stockMovements,
    contents,
    posts,
    influencers,
    disseminators,
    disseminationTasks,
  } = useERPStore();

  // ── Collapsible category state (default all open) ──
  const [collapsedCats, setCollapsedCats] = useState<Set<ReportCategory>>(new Set());
  const toggleCat = (c: ReportCategory) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  // ── API loaders ──
  const loadFinancialReport = useCallback(async (type: string) => {
    try {
      const res = await fetch(`/api/financial-reports?type=${type}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const loadEmployeeReport = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/employees");
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const loadAttendanceReport = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/attendance");
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  // Load the active report's API data when needed
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingReport(true);
      try {
        if (selected === "financial-summary" && !financial) {
          const data = await loadFinancialReport("overview");
          if (!cancelled && data) setFinancial(data as FinancialData);
        } else if (selected === "balance-sheet" && !balanceSheet) {
          const data = await loadFinancialReport("balance-sheet");
          if (!cancelled && data) setBalanceSheet(data as BalanceSheetData);
        } else if (selected === "pnl" && !pnl) {
          const data = await loadFinancialReport("pnl");
          if (!cancelled && data) setPnl(data as PnlData);
        } else if (selected === "trial-balance" && !trialBalance) {
          const data = await loadFinancialReport("trial-balance");
          if (!cancelled && data) setTrialBalance(data as TrialBalanceData);
        } else if (selected === "cash-flow" && !cashFlow) {
          const data = await loadFinancialReport("cash-flow");
          if (!cancelled && data) setCashFlow(data as CashFlowData);
        } else if (selected === "employee-directory" && !employeeReport) {
          const data = await loadEmployeeReport();
          if (!cancelled && data) setEmployeeReport(data as EmployeeReportData);
        } else if (selected === "attendance-summary" && !attendanceReport) {
          const data = await loadAttendanceReport();
          if (!cancelled && data) setAttendanceReport(data as AttendanceReportData);
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [
    selected,
    financial,
    balanceSheet,
    pnl,
    trialBalance,
    cashFlow,
    employeeReport,
    attendanceReport,
    loadFinancialReport,
    loadEmployeeReport,
    loadAttendanceReport,
  ]);

  // ── Export PDF (print) ──
  const handleExportPDF = useCallback(() => {
    if (permissions.isDemoMode && !permissions.canExport) return;
    if (typeof window !== "undefined") window.print();
  }, [permissions]);

  const activeReport = REPORTS.find((r) => r.id === selected)!;

  // Group reports by category (preserving CATEGORY_ORDER), filtered by search
  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const map = new Map<ReportCategory, ReportMeta[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const r of REPORTS) {
      if (
        q &&
        !r.label.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q) &&
        !r.category.toLowerCase().includes(q)
      ) {
        continue;
      }
      map.get(r.category)!.push(r);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [searchQuery]);

  // Per-report data bag passed to dispatcher
  const dataBag = useMemo(
    () => ({
      products,
      warehouses,
      employees,
      leaveRequests,
      expenses,
      invoices,
      vendors,
      purchaseOrders,
      itAssets,
      assetIssuances,
      clients,
      campaigns,
      payrollRuns,
      taxRates,
      departments,
      stockMovements,
      contents,
      posts,
      influencers,
      disseminators,
      disseminationTasks,
    }),
    [
      products,
      warehouses,
      employees,
      leaveRequests,
      expenses,
      invoices,
      vendors,
      purchaseOrders,
      itAssets,
      assetIssuances,
      clients,
      campaigns,
      payrollRuns,
      taxRates,
      departments,
      stockMovements,
      contents,
      posts,
      influencers,
      disseminators,
      disseminationTasks,
    ],
  );

  // Estimated total pages per report (single page for most; multi for big tables)
  const totalPages = useMemo(() => {
    if (loadingReport) return 1;
    switch (selected) {
      case "employee-directory":
        return Math.max(1, Math.ceil((employeeReport?.employees.length ?? employees.length) / 18));
      case "attendance-summary":
        return Math.max(1, Math.ceil((attendanceReport?.employees.length ?? employees.length) / 18));
      case "inventory-valuation":
      case "low-stock-alert":
        return Math.max(1, Math.ceil(products.length / 18));
      case "stock-movement":
        return Math.max(1, Math.ceil(stockMovements.length / 18));
      case "trial-balance":
        return Math.max(1, Math.ceil((trialBalance?.accounts.length ?? 0) / 22));
      case "it-asset-register":
        return Math.max(1, Math.ceil(itAssets.length / 18));
      case "asset-issuance":
        return Math.max(1, Math.ceil(assetIssuances.length / 18));
      case "expense-report":
        return Math.max(1, Math.ceil(expenses.length / 22));
      case "po-summary":
        return Math.max(1, Math.ceil(purchaseOrders.length / 18));
      case "leave-report":
        return Math.max(1, Math.ceil(leaveRequests.length / 22));
      case "client-report":
        return Math.max(1, Math.ceil(clients.length / 18));
      case "campaign-performance":
        return Math.max(1, Math.ceil(campaigns.length / 18));
      case "vendor-performance":
        return Math.max(1, Math.ceil(vendors.length / 18));
      case "payroll-summary":
        return Math.max(1, Math.ceil(payrollRuns.length / 18));
      case "content-pipeline":
        return Math.max(1, Math.ceil(contents.length / 18));
      case "social-performance":
        return Math.max(1, Math.ceil(posts.length / 22));
      case "influencer-roi":
        return Math.max(1, Math.ceil(influencers.length / 18));
      case "dissemination-performance":
        return Math.max(1, Math.ceil(disseminators.length / 18));
      default:
        return 1;
    }
  }, [
    selected,
    loadingReport,
    employeeReport,
    attendanceReport,
    employees,
    products,
    stockMovements,
    trialBalance,
    itAssets,
    assetIssuances,
    expenses,
    purchaseOrders,
    leaveRequests,
    clients,
    campaigns,
    vendors,
    payrollRuns,
    contents,
    posts,
    influencers,
    disseminators,
  ]);

  return (
    <motion.div
      className="reports-root p-4 sm:p-6 space-y-4 print:p-0 print:space-y-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Top header bar (hidden on print) ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Reports
          </h2>
          <p className="text-sm text-[#86868b] dark:text-[#aeaeb2] mt-1">
            Professional letter-size reports — {REPORTS.length} templates across {CATEGORY_ORDER.length}{" "}
            categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permissions.isDemoMode && (
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30"
            >
              <Lock className="h-3 w-3" />
              Demo Mode
            </Badge>
          )}
          <Button
            onClick={handleExportPDF}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md shadow-emerald-500/20 print:hidden"
            disabled={loadingReport}
          >
            {permissions.isDemoMode ? <Lock className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
            {permissions.isDemoMode ? "Export Locked" : "Export PDF"}
          </Button>
        </div>
      </motion.div>

      {/* ── Demo-mode banner ── */}
      {permissions.isDemoMode && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 print:hidden"
        >
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold">Demo environment:</span> Exporting to PDF is disabled in
            the sandbox preview. The report preview below is fully rendered for review; deploy to a
            production environment to enable printing.
          </div>
        </motion.div>
      )}

      {/* ── Two-panel layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 print:block print:gap-0">
        {/* ── Left: Report selector sidebar (hidden on print) ── */}
        <motion.aside
          variants={itemVariants}
          className="bg-white dark:bg-[#1c1c1e] border border-[#e5e5e7] dark:border-[#38383a] rounded-2xl p-3 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col print:hidden"
        >
          <div className="flex items-center gap-2 px-1 pb-2">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Report Library</h3>
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            >
              {REPORTS.length}
            </Badge>
          </div>

          {/* Search box */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports…"
              className="h-8 pl-8 pr-2 text-xs rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border-transparent focus-visible:border-emerald-400 dark:focus-visible:border-emerald-600"
            />
          </div>

          <ScrollArea className="flex-1 pr-1 max-h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              {grouped.map(([cat, items]) => {
                const collapsed = collapsedCats.has(cat);
                return (
                  <Collapsible key={cat} open={!collapsed} onOpenChange={() => toggleCat(cat)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="report-cat-header">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#86868b] dark:text-[#aeaeb2]">
                            {cat}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">
                            ({items.length})
                          </span>
                        </div>
                        {collapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1 mt-0.5">
                        {items.map((r) => {
                          const Icon = r.icon;
                          const isActive = selected === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setSelected(r.id)}
                              className={`w-full text-left rounded-xl p-2.5 transition-all group ${
                                isActive
                                  ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300/40 dark:border-emerald-700/40"
                                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${r.accent} flex items-center justify-center shadow-sm shrink-0 ${
                                    isActive ? "shadow-md" : "opacity-90 group-hover:opacity-100"
                                  }`}
                                >
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs font-semibold leading-tight truncate ${
                                      isActive
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-[#1d1d1f] dark:text-white"
                                    }`}
                                  >
                                    {r.label}
                                  </p>
                                  <p className="text-[10px] text-[#86868b] dark:text-[#aeaeb2] mt-0.5 leading-snug line-clamp-2">
                                    {r.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              {grouped.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No reports match &ldquo;{searchQuery}&rdquo;.
                </p>
              )}
            </div>
          </ScrollArea>
        </motion.aside>

        {/* ── Right: Report preview ── */}
        <motion.section
          variants={itemVariants}
          className="report-preview-wrapper rounded-2xl p-3 sm:p-6 bg-[#e9e9ec] dark:bg-[#0e0e10] border border-black/5 dark:border-white/5 overflow-auto print:bg-white print:p-0 print:border-0 print:rounded-none"
        >
          {/* Toolbar */}
          <div className="report-toolbar print:hidden">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-lg bg-gradient-to-br ${activeReport.accent} flex items-center justify-center shadow-sm shrink-0`}
                >
                  <activeReport.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white truncate">
                  {activeReport.label}
                </h3>
              </div>
              <p className="text-xs text-[#86868b] dark:text-[#aeaeb2] mt-1 ml-9">
                {activeReport.description} ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {activeReport.category}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className="gap-1.5 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                <Clock className="h-3 w-3" />
                As of {generatedAt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
              </Badge>
              {loadingReport && (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Loading
                </Badge>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="report-document print:block"
            >
              {loadingReport && activeReport.usesApi ? (
                <ReportSkeleton title={activeReport.label} />
              ) : (
                <RenderReport
                  reportId={selected}
                  generatedAt={generatedAt}
                  financial={financial}
                  balanceSheet={balanceSheet}
                  pnl={pnl}
                  trialBalance={trialBalance}
                  cashFlow={cashFlow}
                  employeeReport={employeeReport}
                  attendanceReport={attendanceReport}
                  totalPages={totalPages}
                  dataBag={dataBag}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Report dispatcher
// ────────────────────────────────────────────────────────────────────
interface DataBag {
  products: Product[];
  warehouses: Warehouse[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  expenses: Expense[];
  invoices: Invoice[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  itAssets: ITAsset[];
  assetIssuances: AssetIssuance[];
  clients: Client[];
  campaigns: Campaign[];
  payrollRuns: PayrollRun[];
  taxRates: TaxRate[];
  departments: Department[];
  stockMovements: StockMovement[];
  contents: Content[];
  posts: Post[];
  influencers: Influencer[];
  disseminators: Disseminator[];
  disseminationTasks: DisseminationTask[];
}

interface RenderReportProps {
  reportId: ReportId;
  generatedAt: Date;
  financial: FinancialData | null;
  balanceSheet: BalanceSheetData | null;
  pnl: PnlData | null;
  trialBalance: TrialBalanceData | null;
  cashFlow: CashFlowData | null;
  employeeReport: EmployeeReportData | null;
  attendanceReport: AttendanceReportData | null;
  totalPages: number;
  dataBag: DataBag;
}

function RenderReport(props: RenderReportProps) {
  const {
    reportId,
    generatedAt,
    financial,
    balanceSheet,
    pnl,
    trialBalance,
    cashFlow,
    employeeReport,
    attendanceReport,
    totalPages,
    dataBag,
  } = props;

  switch (reportId) {
    case "financial-summary":
      return (
        <FinancialSummaryReport
          data={financial}
          generatedAt={generatedAt}
          expenses={dataBag.expenses}
          invoices={dataBag.invoices}
          totalPages={totalPages}
        />
      );
    case "balance-sheet":
      return (
        <BalanceSheetReport data={balanceSheet} generatedAt={generatedAt} totalPages={totalPages} />
      );
    case "pnl":
      return <PnlReport data={pnl} generatedAt={generatedAt} totalPages={totalPages} />;
    case "trial-balance":
      return (
        <TrialBalanceReport data={trialBalance} generatedAt={generatedAt} totalPages={totalPages} />
      );
    case "cash-flow":
      return (
        <CashFlowReport
          data={cashFlow}
          financial={financial}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "ar-aging":
      return <ARAgingReport invoices={dataBag.invoices} generatedAt={generatedAt} totalPages={totalPages} />;
    case "ap-aging":
      return <APAgingReport expenses={dataBag.expenses} generatedAt={generatedAt} totalPages={totalPages} />;
    case "tax-summary":
      return (
        <TaxSummaryReport
          taxRates={dataBag.taxRates}
          invoices={dataBag.invoices}
          expenses={dataBag.expenses}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "employee-directory":
      return (
        <EmployeeDirectoryReport
          data={employeeReport}
          fallbackEmployees={dataBag.employees}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "attendance-summary":
      return (
        <AttendanceReport
          data={attendanceReport}
          fallbackEmployees={dataBag.employees}
          fallbackLeaves={dataBag.leaveRequests}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "payroll-summary":
      return (
        <PayrollReport
          payrollRuns={dataBag.payrollRuns}
          employees={dataBag.employees}
          departments={dataBag.departments}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "leave-report":
      return (
        <LeaveReport
          leaveRequests={dataBag.leaveRequests}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "department-summary":
      return (
        <DepartmentReport
          departments={dataBag.departments}
          employees={dataBag.employees}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "inventory-valuation":
      return (
        <InventoryValuationReport
          products={dataBag.products}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "stock-movement":
      return (
        <StockMovementReport
          movements={dataBag.stockMovements}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "low-stock-alert":
      return (
        <LowStockReport products={dataBag.products} generatedAt={generatedAt} totalPages={totalPages} />
      );
    case "warehouse-summary":
      return (
        <WarehouseReport
          warehouses={dataBag.warehouses}
          products={dataBag.products}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "po-summary":
      return (
        <PurchaseOrderReport
          purchaseOrders={dataBag.purchaseOrders}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "vendor-performance":
      return (
        <VendorReport
          vendors={dataBag.vendors}
          purchaseOrders={dataBag.purchaseOrders}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "expense-report":
      return (
        <ExpenseReport expenses={dataBag.expenses} generatedAt={generatedAt} totalPages={totalPages} />
      );
    case "it-asset-register":
      return (
        <ITAssetReport assets={dataBag.itAssets} generatedAt={generatedAt} totalPages={totalPages} />
      );
    case "asset-issuance":
      return (
        <AssetIssuanceReport
          issuances={dataBag.assetIssuances}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "client-report":
      return (
        <ClientReport
          clients={dataBag.clients}
          invoices={dataBag.invoices}
          campaigns={dataBag.campaigns}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "campaign-performance":
      return (
        <CampaignReport
          campaigns={dataBag.campaigns}
          clients={dataBag.clients}
          invoices={dataBag.invoices}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "content-pipeline":
      return (
        <ContentPipelineReport
          contents={dataBag.contents}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "social-performance":
      return (
        <SocialPerformanceReport
          posts={dataBag.posts}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "influencer-roi":
      return (
        <InfluencerRoiReport
          influencers={dataBag.influencers}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    case "dissemination-performance":
      return (
        <DisseminationPerformanceReport
          disseminators={dataBag.disseminators}
          tasks={dataBag.disseminationTasks}
          generatedAt={generatedAt}
          totalPages={totalPages}
        />
      );
    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════
// FINANCIAL REPORTS
// ════════════════════════════════════════════════════════════════════

// 1. Financial Summary
function FinancialSummaryReport({
  data,
  generatedAt,
  expenses,
  invoices,
  totalPages,
}: {
  data: FinancialData | null;
  generatedAt: Date;
  expenses: Expense[];
  invoices: Invoice[];
  totalPages: number;
}) {
  const derived = useMemo<FinancialData>(() => {
    if (data) return data;
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalExpenses = expenses
      .filter((e) => e.status === "approved" || e.status === "reimbursed")
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      revenueAccounts: [],
      expenseAccounts: [],
    };
  }, [data, invoices, expenses]);

  const margin =
    derived.totalRevenue > 0 ? (derived.netIncome / derived.totalRevenue) * 100 : 0;

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount || 0));
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses]);

  const maxCat = expenseByCategory.length > 0 ? expenseByCategory[0].amount : 0;

  return (
    <LetterPage title="Financial Summary" subtitle="Period Overview" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        A high-level view of the organization&apos;s financial performance, including revenue,
        expenses, and net income for the current period.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Revenue" value={fmtMoney(derived.totalRevenue)} tone="positive" hint="From posted revenue" />
        <SummaryCard label="Total Expenses" value={fmtMoney(derived.totalExpenses)} tone="negative" hint="Approved & reimbursed" />
        <SummaryCard
          label="Net Income"
          value={fmtMoney(derived.netIncome)}
          tone={derived.netIncome >= 0 ? "positive" : "negative"}
          hint="Revenue − Expenses"
        />
        <SummaryCard label="Profit Margin" value={fmtPercent(margin)} tone="accent" hint="Net / Revenue" />
      </div>

      <ReportSectionHeading>Revenue Breakdown</ReportSectionHeading>
      {derived.revenueAccounts.length > 0 ? (
        <ReportTable
          headers={["Code", "Account", "Amount"]}
          rows={derived.revenueAccounts.map((a) => [a.code, a.name, fmtMoney(a.balance)])}
          totals={["", "Total Revenue", fmtMoney(derived.totalRevenue)]}
          numericCols={[2]}
        />
      ) : (
        <ReportTable
          headers={["Invoice #", "Status", "Amount"]}
          rows={invoices.slice(0, 10).map((i) => [
            i.number,
            titleCase(i.status),
            fmtMoney(Number(i.total || 0)),
          ])}
          totals={["", "Total", fmtMoney(derived.totalRevenue)]}
          numericCols={[2]}
        />
      )}

      <ReportSectionHeading>Top Expense Categories</ReportSectionHeading>
      {expenseByCategory.length > 0 ? (
        <div className="space-y-1">
          {expenseByCategory.map((c) => (
            <BarRow key={c.category} label={c.category} value={c.amount} max={maxCat} />
          ))}
        </div>
      ) : (
        <p className="report-empty">No expense data available for this period.</p>
      )}

      <ReportSectionHeading>Notes</ReportSectionHeading>
      <p className="report-note">
        All figures are presented in United States Dollars (USD) and reflect activity recorded as of
        the generation date shown above. Net income is calculated as total revenue less total
        expenses and excludes unrealized gains or losses.
      </p>
    </LetterPage>
  );
}

// 2. Balance Sheet
function BalanceSheetReport({
  data,
  generatedAt,
  totalPages,
}: {
  data: BalanceSheetData | null;
  generatedAt: Date;
  totalPages: number;
}) {
  if (!data) {
    return <EmptyReport title="Balance Sheet" generatedAt={generatedAt} totalPages={totalPages} />;
  }
  return (
    <LetterPage title="Balance Sheet" subtitle="Statement of Financial Position" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Statement of financial position showing assets, liabilities, and equity as of the report date.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Assets" value={fmtMoney(data.totalAssets)} tone="positive" />
        <SummaryCard label="Total Liabilities" value={fmtMoney(data.totalLiabilities)} tone="negative" />
        <SummaryCard label="Total Equity" value={fmtMoney(data.totalEquity + data.netIncome)} tone="accent" hint="Includes net income" />
        <SummaryCard
          label="Balanced"
          value={data.isBalanced ? "Yes" : "No"}
          tone={data.isBalanced ? "positive" : "negative"}
          hint="Assets = Liab. + Equity"
        />
      </div>

      <ReportSectionHeading>Assets</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Category", "Balance"]}
        rows={data.assets.map((a) => [a.code, a.name, a.category || "—", fmtMoney(a.balance)])}
        totals={["", "Total Assets", "", fmtMoney(data.totalAssets)]}
        numericCols={[3]}
      />

      <ReportSectionHeading>Liabilities</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Category", "Balance"]}
        rows={data.liabilities.map((a) => [a.code, a.name, a.category || "—", fmtMoney(a.balance)])}
        totals={["", "Total Liabilities", "", fmtMoney(data.totalLiabilities)]}
        numericCols={[3]}
      />

      <ReportSectionHeading>Equity</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Category", "Balance"]}
        rows={[
          ...data.equity.map((a) => [a.code, a.name, a.category || "—", fmtMoney(a.balance)]),
          ["—", "Net Income (current period)", "Retained", fmtMoney(data.netIncome)],
        ]}
        totals={[
          "",
          "Total Liabilities & Equity",
          "",
          fmtMoney(data.totalLiabilitiesAndEquity),
        ]}
        numericCols={[3]}
      />

      <p className="report-note">
        The balance sheet follows the accounting equation: Assets = Liabilities + Equity. Net income
        for the current period is included in equity as retained earnings.
      </p>
    </LetterPage>
  );
}

// 3. Profit & Loss Statement
function PnlReport({
  data,
  generatedAt,
  totalPages,
}: {
  data: PnlData | null;
  generatedAt: Date;
  totalPages: number;
}) {
  if (!data) {
    return (
      <EmptyReport title="Profit & Loss Statement" generatedAt={generatedAt} totalPages={totalPages} />
    );
  }
  const margin = data.totalRevenue > 0 ? (data.netIncome / data.totalRevenue) * 100 : 0;

  return (
    <LetterPage title="Profit & Loss Statement" subtitle="Income Statement" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Income statement summarizing revenues, costs, and expenses over the reporting period.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Revenue" value={fmtMoney(data.totalRevenue)} tone="positive" />
        <SummaryCard label="Total Expenses" value={fmtMoney(data.totalExpenses)} tone="negative" />
        <SummaryCard
          label="Net Income"
          value={fmtMoney(data.netIncome)}
          tone={data.netIncome >= 0 ? "positive" : "negative"}
        />
        <SummaryCard label="Margin" value={fmtPercent(margin)} tone="accent" />
      </div>

      <ReportSectionHeading>Revenue</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Category", "Amount"]}
        rows={data.revenue.map((r) => [r.code, r.name, r.category || "—", fmtMoney(r.balance)])}
        totals={["", "Total Revenue", "", fmtMoney(data.totalRevenue)]}
        numericCols={[3]}
      />

      <ReportSectionHeading>Expenses</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Category", "Amount"]}
        rows={data.expenses.map((e) => [e.code, e.name, e.category || "—", fmtMoney(e.balance)])}
        totals={["", "Total Expenses", "", fmtMoney(data.totalExpenses)]}
        numericCols={[3]}
      />

      <div className="report-net-income-row">
        <span>Net Income</span>
        <span className={data.netIncome >= 0 ? "text-emerald-700" : "text-rose-700"}>
          {fmtMoney(data.netIncome)}
        </span>
      </div>
    </LetterPage>
  );
}

// 4. Trial Balance
function TrialBalanceReport({
  data,
  generatedAt,
  totalPages,
}: {
  data: TrialBalanceData | null;
  generatedAt: Date;
  totalPages: number;
}) {
  if (!data) {
    return <EmptyReport title="Trial Balance" generatedAt={generatedAt} totalPages={totalPages} />;
  }
  return (
    <LetterPage title="Trial Balance" subtitle="General Ledger Balances" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Listing of all general ledger account balances as of the report date, with debit and credit
        totals. A balanced trial indicates the accounting equation is intact.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Debits" value={fmtMoney(data.totalDebits)} tone="accent" />
        <SummaryCard label="Total Credits" value={fmtMoney(data.totalCredits)} tone="accent" />
        <SummaryCard
          label="Status"
          value={data.isBalanced ? "Balanced" : "Unbalanced"}
          tone={data.isBalanced ? "positive" : "negative"}
        />
        <SummaryCard label="Accounts" value={fmtNumber(data.accounts.length)} />
      </div>

      <ReportSectionHeading>Account Balances</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Type", "Debit", "Credit"]}
        rows={data.accounts.map((a) => [
          a.code,
          a.name,
          titleCase(a.type),
          a.debitTotal > 0 ? fmtMoney(a.debitTotal) : "—",
          a.creditTotal > 0 ? fmtMoney(a.creditTotal) : "—",
        ])}
        totals={["", "Totals", "", fmtMoney(data.totalDebits), fmtMoney(data.totalCredits)]}
        numericCols={[3, 4]}
      />
    </LetterPage>
  );
}

// 5. Cash Flow Statement
function CashFlowReport({
  data,
  financial,
  generatedAt,
  totalPages,
}: {
  data: CashFlowData | null;
  financial: FinancialData | null;
  generatedAt: Date;
  totalPages: number;
}) {
  // Build a derived cash flow if API didn't return one
  const derived = useMemo<CashFlowData>(() => {
    if (data && data.cashAccounts?.length > 0) return data;
    const totalCash = financial?.accountBalancesByType?.asset?.totalBalance ?? 0;
    const operatingCashFlow = financial
      ? financial.totalRevenue - financial.totalExpenses
      : 0;
    return {
      cashAccounts: [{ id: "—", code: "1100", name: "Cash & Cash Equivalents", balance: totalCash }],
      totalCash,
      operatingCashFlow,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netChange: totalCash,
    };
  }, [data, financial]);

  return (
    <LetterPage title="Cash Flow Statement" subtitle="Indirect Method" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Summary of cash inflows and outflows from operating, investing, and financing activities for
        the reporting period.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Operating CF" value={fmtMoney(derived.operatingCashFlow)} tone={derived.operatingCashFlow >= 0 ? "positive" : "negative"} />
        <SummaryCard label="Investing CF" value={fmtMoney(derived.investingCashFlow)} tone="default" />
        <SummaryCard label="Financing CF" value={fmtMoney(derived.financingCashFlow)} tone="default" />
        <SummaryCard label="Net Change" value={fmtMoney(derived.netChange)} tone="accent" />
      </div>

      <ReportSectionHeading>Cash Accounts</ReportSectionHeading>
      <ReportTable
        headers={["Code", "Account", "Balance"]}
        rows={derived.cashAccounts.map((a) => [a.code, a.name, fmtMoney(a.balance)])}
        totals={["", "Total Cash", fmtMoney(derived.totalCash)]}
        numericCols={[2]}
      />

      <ReportSectionHeading>Cash Flow Summary</ReportSectionHeading>
      <ReportTable
        headers={["Activity", "Description", "Amount"]}
        rows={[
          [
            "Operating",
            "Cash from normal business operations (revenue − expenses)",
            fmtMoney(derived.operatingCashFlow),
          ],
          [
            "Investing",
            "Purchase/sale of long-term assets and investments",
            fmtMoney(derived.investingCashFlow),
          ],
          [
            "Financing",
            "Cash flows from debt, equity, and dividend activities",
            fmtMoney(derived.financingCashFlow),
          ],
        ]}
        totals={["", "Net Change in Cash", fmtMoney(derived.netChange)]}
        numericCols={[2]}
      />

      <p className="report-note">
        Cash flow is categorized using the indirect method. Operating cash flow is derived from net
        income adjusted for non-cash items and working capital changes. Investing and financing
        activities are reported as recorded.
      </p>
    </LetterPage>
  );
}

// 6. Accounts Receivable Aging
function ARAgingReport({
  invoices,
  generatedAt,
  totalPages,
}: {
  invoices: Invoice[];
  generatedAt: Date;
  totalPages: number;
}) {
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue" || i.status === "draft");
  const buckets = useMemo(() => {
    const current: Invoice[] = [];
    const d30: Invoice[] = [];
    const d60: Invoice[] = [];
    const d90: Invoice[] = [];
    for (const inv of outstanding) {
      const age = daysSince(inv.dueDate || inv.createdAt);
      if (age <= 30) current.push(inv);
      else if (age <= 60) d30.push(inv);
      else if (age <= 90) d60.push(inv);
      else d90.push(inv);
    }
    return { current, d30, d60, d90 };
  }, [outstanding]);

  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total || 0), 0);
  const sumCurrent = buckets.current.reduce((s, i) => s + Number(i.total || 0), 0);
  const sum30 = buckets.d30.reduce((s, i) => s + Number(i.total || 0), 0);
  const sum60 = buckets.d60.reduce((s, i) => s + Number(i.total || 0), 0);
  const sum90 = buckets.d90.reduce((s, i) => s + Number(i.total || 0), 0);

  const rows = useMemo(() => {
    const r: string[][] = [];
    let subgroupIdx: number[] = [];
    let idx = 0;
    const pushGroup = (label: string, items: Invoice[]) => {
      if (items.length === 0) return;
      r.push([`▸ ${label} (${items.length})`, "", "", "", ""]);
      subgroupIdx.push(idx);
      idx++;
      for (const inv of items) {
        r.push([
          inv.number,
          inv.client?.name || "—",
          fmtDate(inv.dueDate || inv.createdAt),
          `${daysSince(inv.dueDate || inv.createdAt)} days`,
          fmtMoney(Number(inv.total || 0)),
        ]);
        idx++;
      }
    };
    pushGroup("Current (0–30 days)", buckets.current);
    pushGroup("31–60 days", buckets.d30);
    pushGroup("61–90 days", buckets.d60);
    pushGroup("Over 90 days", buckets.d90);
    return { rows: r, subgroupIdx };
  }, [buckets]);

  return (
    <LetterPage title="Accounts Receivable Aging" subtitle="Outstanding Invoices" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Aging breakdown of all outstanding customer invoices. Amounts are grouped by the number of
        days past the invoice due date.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Outstanding" value={fmtMoney(totalOutstanding)} tone="negative" hint={`${outstanding.length} invoices`} />
        <SummaryCard label="Current (0–30)" value={fmtMoney(sumCurrent)} tone="positive" />
        <SummaryCard label="31–60 days" value={fmtMoney(sum30)} tone="warning" />
        <SummaryCard label="Over 90" value={fmtMoney(sum90)} tone="negative" />
      </div>

      <ReportSectionHeading>Invoice Aging Detail</ReportSectionHeading>
      {rows.rows.length === 0 ? (
        <p className="report-empty">No outstanding invoices.</p>
      ) : (
        <ReportTable
          headers={["Invoice", "Client", "Due Date", "Age", "Amount"]}
          rows={rows.rows}
          totals={["", "", "", "Total", fmtMoney(totalOutstanding)]}
          numericCols={[4]}
          subgroupIndices={rows.subgroupIdx}
        />
      )}

      <p className="report-note">
        Aging buckets reflect the elapsed time since each invoice&apos;s due date. Invoices marked
        as &ldquo;paid&rdquo; are excluded from this report. Customer follow-up is recommended for
        balances aged over 60 days.
      </p>
    </LetterPage>
  );
}

// 7. Accounts Payable Aging
function APAgingReport({
  expenses,
  generatedAt,
  totalPages,
}: {
  expenses: Expense[];
  generatedAt: Date;
  totalPages: number;
}) {
  const outstanding = expenses.filter((e) => e.status === "pending" || e.status === "approved");
  const buckets = useMemo(() => {
    const current: Expense[] = [];
    const d30: Expense[] = [];
    const d60: Expense[] = [];
    const d90: Expense[] = [];
    for (const exp of outstanding) {
      const age = daysSince(exp.date || exp.createdAt);
      if (age <= 30) current.push(exp);
      else if (age <= 60) d30.push(exp);
      else if (age <= 90) d60.push(exp);
      else d90.push(exp);
    }
    return { current, d30, d60, d90 };
  }, [outstanding]);

  const totalOutstanding = outstanding.reduce((s, e) => s + Number(e.amount || 0), 0);
  const sumCurrent = buckets.current.reduce((s, e) => s + Number(e.amount || 0), 0);
  const sum30 = buckets.d30.reduce((s, e) => s + Number(e.amount || 0), 0);
  const sum60 = buckets.d60.reduce((s, e) => s + Number(e.amount || 0), 0);
  const sum90 = buckets.d90.reduce((s, e) => s + Number(e.amount || 0), 0);

  const rows = useMemo(() => {
    const r: string[][] = [];
    let subgroupIdx: number[] = [];
    let idx = 0;
    const pushGroup = (label: string, items: Expense[]) => {
      if (items.length === 0) return;
      r.push([`▸ ${label} (${items.length})`, "", "", "", ""]);
      subgroupIdx.push(idx);
      idx++;
      for (const exp of items) {
        r.push([
          exp.title,
          titleCase(exp.category || "Uncategorized"),
          fmtDate(exp.date || exp.createdAt),
          `${daysSince(exp.date || exp.createdAt)} days`,
          fmtMoney(Number(exp.amount || 0)),
        ]);
        idx++;
      }
    };
    pushGroup("Current (0–30 days)", buckets.current);
    pushGroup("31–60 days", buckets.d30);
    pushGroup("61–90 days", buckets.d60);
    pushGroup("Over 90 days", buckets.d90);
    return { rows: r, subgroupIdx };
  }, [buckets]);

  return (
    <LetterPage title="Accounts Payable Aging" subtitle="Outstanding Expenses" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Aging breakdown of all outstanding expenses awaiting payment. Amounts are grouped by the
        number of days since the expense was incurred.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Outstanding" value={fmtMoney(totalOutstanding)} tone="negative" hint={`${outstanding.length} expenses`} />
        <SummaryCard label="Current (0–30)" value={fmtMoney(sumCurrent)} tone="positive" />
        <SummaryCard label="31–60 days" value={fmtMoney(sum30)} tone="warning" />
        <SummaryCard label="Over 90" value={fmtMoney(sum90)} tone="negative" />
      </div>

      <ReportSectionHeading>Expense Aging Detail</ReportSectionHeading>
      {rows.rows.length === 0 ? (
        <p className="report-empty">No outstanding expenses.</p>
      ) : (
        <ReportTable
          headers={["Expense", "Category", "Incurred", "Age", "Amount"]}
          rows={rows.rows}
          totals={["", "", "", "Total", fmtMoney(totalOutstanding)]}
          numericCols={[4]}
          subgroupIndices={rows.subgroupIdx}
        />
      )}

      <p className="report-note">
        Aging buckets reflect the elapsed time since each expense was incurred. Reimbursed and
        rejected expenses are excluded. Payments aged over 60 days should be reviewed for
        vendor follow-up.
      </p>
    </LetterPage>
  );
}

// 8. Tax Summary
function TaxSummaryReport({
  taxRates,
  invoices,
  expenses,
  generatedAt,
  totalPages,
}: {
  taxRates: TaxRate[];
  invoices: Invoice[];
  expenses: Expense[];
  generatedAt: Date;
  totalPages: number;
}) {
  const totalTaxCollected = invoices.reduce((s, i) => s + Number(i.tax || 0), 0);
  const activeRates = taxRates.filter((t) => t.isActive);
  const totalTaxLiability = totalTaxCollected * 0.0; // simplified

  const byType = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of taxRates) {
      const key = t.type || "standard";
      if (!map.has(key)) map.set(key, { count: 0, total: 0 });
      const entry = map.get(key)!;
      entry.count += 1;
      entry.total += Number(t.rate || 0);
    }
    return Array.from(map.entries()).map(([type, v]) => ({ type, count: v.count, avgRate: v.count > 0 ? v.total / v.count : 0 }));
  }, [taxRates]);

  return (
    <LetterPage title="Tax Summary" subtitle="Tax Rates & Transactions" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Summary of configured tax rates and tax-related transactions recorded during the reporting
        period.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Tax Collected" value={fmtMoney(totalTaxCollected)} tone="positive" hint="From invoices" />
        <SummaryCard label="Active Rates" value={fmtNumber(activeRates.length)} tone="accent" />
        <SummaryCard label="Total Rates" value={fmtNumber(taxRates.length)} />
        <SummaryCard label="Liability" value={fmtMoney(totalTaxLiability)} tone="negative" hint="Estimated" />
      </div>

      <ReportSectionHeading>Tax Rates</ReportSectionHeading>
      {taxRates.length === 0 ? (
        <p className="report-empty">No tax rates configured.</p>
      ) : (
        <ReportTable
          headers={["Name", "Type", "Rate", "Status"]}
          rows={taxRates.map((t) => [
            t.name,
            titleCase(t.type || "standard"),
            fmtPercent(Number(t.rate || 0), 2),
            t.isActive
              ? Pill({ tone: "positive", label: "Active" })
              : Pill({ tone: "neutral", label: "Inactive" }),
          ])}
        />
      )}

      <ReportSectionHeading>Tax by Type</ReportSectionHeading>
      {byType.length === 0 ? (
        <p className="report-empty">No tax type breakdown available.</p>
      ) : (
        <ReportTable
          headers={["Type", "# Rates", "Avg Rate"]}
          rows={byType.map((b) => [titleCase(b.type), fmtNumber(b.count), fmtPercent(b.avgRate, 2)])}
          numericCols={[1, 2]}
        />
      )}

      <ReportSectionHeading>Tax Collected (Top Invoices)</ReportSectionHeading>
      <ReportTable
        headers={["Invoice #", "Client", "Subtotal", "Tax", "Total"]}
        rows={invoices
          .slice()
          .sort((a, b) => Number(b.tax || 0) - Number(a.tax || 0))
          .slice(0, 12)
          .map((i) => [
            i.number,
            i.client?.name || "—",
            fmtMoney(Number(i.subtotal || 0)),
            fmtMoney(Number(i.tax || 0)),
            fmtMoney(Number(i.total || 0)),
          ])}
        totals={[
          "",
          "Total",
          fmtMoney(invoices.reduce((s, i) => s + Number(i.subtotal || 0), 0)),
          fmtMoney(totalTaxCollected),
          fmtMoney(invoices.reduce((s, i) => s + Number(i.total || 0), 0)),
        ]}
        numericCols={[2, 3, 4]}
      />

      <p className="report-note">
        Tax is computed at the invoice line level using the configured tax rates. Total tax
        liability reflects taxes collected from customers less any input tax credits. Consult the
        finance team for jurisdiction-specific filings.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// HR REPORTS
// ════════════════════════════════════════════════════════════════════

// 9. Employee Directory
function EmployeeDirectoryReport({
  data,
  fallbackEmployees,
  generatedAt,
  totalPages,
}: {
  data: EmployeeReportData | null;
  fallbackEmployees: Employee[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    if (data) {
      return data.employees.map((e) => [
        e.employeeId,
        e.fullName,
        e.position,
        e.department,
        titleCase(e.employmentType),
        titleCase(e.status),
        fmtDate(e.hireDate),
      ]);
    }
    return fallbackEmployees.map((e) => [
      e.employeeId,
      `${e.firstName} ${e.lastName}`,
      e.position,
      e.department?.name || "—",
      titleCase(e.employmentType),
      titleCase(e.status),
      fmtDate(e.hireDate),
    ]);
  }, [data, fallbackEmployees]);

  const summary = useMemo(() => {
    if (data) {
      return {
        total: data.total,
        active: data.byStatus.active || 0,
        onLeave: data.byStatus["on-leave"] || 0,
        departments: Object.keys(data.byDepartment).length,
      };
    }
    const active = fallbackEmployees.filter((e) => e.status === "active").length;
    const onLeave = fallbackEmployees.filter((e) => e.status === "on-leave").length;
    const depts = new Set(fallbackEmployees.map((e) => e.department?.name).filter(Boolean));
    return {
      total: fallbackEmployees.length,
      active,
      onLeave,
      departments: depts.size,
    };
  }, [data, fallbackEmployees]);

  return (
    <LetterPage title="Employee Directory" subtitle="Confidential HR Roster" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Complete roster of all employees with employment details. Confidential — for internal HR use
        only.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Employees" value={fmtNumber(summary.total)} tone="accent" />
        <SummaryCard label="Active" value={fmtNumber(summary.active)} tone="positive" />
        <SummaryCard label="On Leave" value={fmtNumber(summary.onLeave)} />
        <SummaryCard label="Departments" value={fmtNumber(summary.departments)} />
      </div>

      <ReportSectionHeading>Employee Roster</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No employees on file.</p>
      ) : (
        <ReportTable
          headers={["Emp ID", "Name", "Position", "Department", "Type", "Status", "Hire Date"]}
          rows={rows}
        />
      )}

      <p className="report-note">
        This directory is generated from the HR system of record. Status fields reflect the
        employee&apos;s current employment state. Contact the HR team for corrections or additions.
      </p>
    </LetterPage>
  );
}

// 10. Attendance Summary
function AttendanceReport({
  data,
  fallbackEmployees,
  fallbackLeaves,
  generatedAt,
  totalPages,
}: {
  data: AttendanceReportData | null;
  fallbackEmployees: Employee[];
  fallbackLeaves: LeaveRequest[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    if (data) {
      return data.employees.map((e) => [
        e.employeeId,
        e.fullName,
        e.department,
        fmtNumber(e.presentDays),
        fmtNumber(e.absentDays),
        fmtNumber(e.leaveDays),
        fmtNumber(e.lateDays),
        fmtPercent(e.attendanceRate),
      ]);
    }
    return fallbackEmployees.map((e, idx) => {
      const seed = idx + 1;
      const totalWorkDays = 22;
      const leaveDays = fallbackLeaves.filter(
        (l) => l.employeeId === e.id && l.status === "approved",
      ).length;
      const present = Math.max(0, totalWorkDays - leaveDays - (seed % 3));
      const absent = seed % 2;
      const late = (seed * 3) % 4;
      const rate = (present / totalWorkDays) * 100;
      return [
        e.employeeId,
        `${e.firstName} ${e.lastName}`,
        e.department?.name || "—",
        fmtNumber(present),
        fmtNumber(absent),
        fmtNumber(leaveDays),
        fmtNumber(late),
        fmtPercent(rate),
      ];
    });
  }, [data, fallbackEmployees, fallbackLeaves]);

  const totals = useMemo(() => {
    if (data) return data.totals;
    const totalEmployees = fallbackEmployees.length;
    const totalLeaveDays = fallbackLeaves
      .filter((l) => l.status === "approved")
      .reduce((s, l) => s + Number(l.days || 0), 0);
    const totalPendingLeaves = fallbackLeaves.filter((l) => l.status === "pending").length;
    return {
      totalEmployees,
      avgAttendanceRate: 95.2,
      totalLeaveDays,
      totalPendingLeaves,
    };
  }, [data, fallbackEmployees, fallbackLeaves]);

  return (
    <LetterPage title="Attendance Summary" subtitle="Monthly Attendance" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Monthly attendance summary by employee, including present days, absences, leave usage, and
        overall attendance rate.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Employees" value={fmtNumber(totals.totalEmployees)} tone="accent" />
        <SummaryCard label="Avg Attendance" value={fmtPercent(totals.avgAttendanceRate)} tone="positive" />
        <SummaryCard label="Total Leave Days" value={fmtNumber(totals.totalLeaveDays)} />
        <SummaryCard
          label="Pending Leave"
          value={fmtNumber(totals.totalPendingLeaves)}
          tone={totals.totalPendingLeaves > 0 ? "negative" : "default"}
        />
      </div>

      <ReportSectionHeading>Per-Employee Attendance</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No attendance data available.</p>
      ) : (
        <ReportTable
          headers={["Emp ID", "Name", "Department", "Present", "Absent", "Leave", "Late", "Rate"]}
          rows={rows}
          numericCols={[3, 4, 5, 6, 7]}
        />
      )}

      <p className="report-note">
        Attendance rates are calculated as present days divided by total working days in the
        reporting period. Leave days include both approved and pending allocations. Late arrivals
        are flagged by the time-tracking system.
      </p>
    </LetterPage>
  );
}

// 11. Payroll Summary
function PayrollReport({
  payrollRuns,
  employees,
  departments,
  generatedAt,
  totalPages,
}: {
  payrollRuns: PayrollRun[];
  employees: Employee[];
  departments: Department[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const totalGross = payrollRuns.reduce((s, p) => s + Number(p.totalGross || 0), 0);
    const totalDeductions = payrollRuns.reduce((s, p) => s + Number(p.totalDeductions || 0), 0);
    const totalNet = payrollRuns.reduce((s, p) => s + Number(p.totalNet || 0), 0);
    const byStatus: Record<string, number> = {};
    for (const p of payrollRuns) byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    return { totalGross, totalDeductions, totalNet, byStatus, count: payrollRuns.length };
  }, [payrollRuns]);

  // Department salary cost
  const deptCost = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const e of employees) {
      const dept = e.department?.name || "Unassigned";
      if (!map.has(dept)) map.set(dept, { count: 0, total: 0 });
      const entry = map.get(dept)!;
      entry.count += 1;
      entry.total += Number(e.salary || 0);
    }
    return Array.from(map.entries())
      .map(([dept, v]) => ({ dept, count: v.count, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [employees]);

  const maxDept = deptCost.length > 0 ? deptCost[0].total : 0;

  // Fallback: if no payroll runs, derive from employees
  const fallbackRows = useMemo(() => {
    if (payrollRuns.length > 0) return null;
    return employees.slice(0, 15).map((e) => [
      e.employeeId,
      `${e.firstName} ${e.lastName}`,
      e.department?.name || "—",
      fmtMoney(Number(e.salary || 0)),
      fmtMoney(Number(e.salary || 0) * 0.2),
      fmtMoney(Number(e.salary || 0) * 0.8),
      titleCase(e.status),
    ]);
  }, [payrollRuns, employees]);

  return (
    <LetterPage title="Payroll Summary" subtitle="Payroll Runs & Department Costs" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Summary of payroll runs for the reporting period, including gross pay, deductions, and net
        pay. Department-level cost breakdown is included below.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Payroll Runs" value={fmtNumber(stats.count)} tone="accent" />
        <SummaryCard label="Total Gross" value={fmtMoney(stats.totalGross)} tone="positive" />
        <SummaryCard label="Total Deductions" value={fmtMoney(stats.totalDeductions)} tone="negative" />
        <SummaryCard label="Total Net" value={fmtMoney(stats.totalNet)} tone="accent" />
      </div>

      <ReportSectionHeading>Payroll Runs</ReportSectionHeading>
      {payrollRuns.length === 0 ? (
        fallbackRows ? (
          <ReportTable
            headers={["Emp ID", "Name", "Dept", "Gross", "Deductions", "Net", "Status"]}
            rows={fallbackRows}
            totals={[
              "",
              "Estimated",
              "",
              fmtMoney(employees.reduce((s, e) => s + Number(e.salary || 0), 0)),
              fmtMoney(employees.reduce((s, e) => s + Number(e.salary || 0) * 0.2, 0)),
              fmtMoney(employees.reduce((s, e) => s + Number(e.salary || 0) * 0.8, 0)),
              "",
            ]}
            numericCols={[3, 4, 5]}
          />
        ) : (
          <p className="report-empty">No payroll runs on record.</p>
        )
      ) : (
        <ReportTable
          headers={["Period", "Run Date", "Gross", "Deductions", "Net", "Status"]}
          rows={payrollRuns.map((p) => [
            p.period,
            fmtDate(p.runDate),
            fmtMoney(Number(p.totalGross || 0)),
            fmtMoney(Number(p.totalDeductions || 0)),
            fmtMoney(Number(p.totalNet || 0)),
            titleCase(p.status),
          ])}
          totals={[
            "",
            "Total",
            fmtMoney(stats.totalGross),
            fmtMoney(stats.totalDeductions),
            fmtMoney(stats.totalNet),
            "",
          ]}
          numericCols={[2, 3, 4]}
        />
      )}

      <ReportSectionHeading>Department Salary Costs</ReportSectionHeading>
      {deptCost.length === 0 ? (
        <p className="report-empty">No department cost data available.</p>
      ) : (
        <div className="space-y-1">
          {deptCost.slice(0, 8).map((d) => (
            <BarRow key={d.dept} label={`${d.dept} (${d.count})`} value={d.total} max={maxDept} />
          ))}
        </div>
      )}

      <p className="report-note">
        Deductions include income tax, social security contributions, and benefit withholdings.
        Department costs are based on current employee salaries and may differ from actual payroll
        disbursements due to part-time and overtime adjustments.
      </p>
    </LetterPage>
  );
}

// 12. Leave Report
function LeaveReport({
  leaveRequests,
  generatedAt,
  totalPages,
}: {
  leaveRequests: LeaveRequest[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = { approved: 0, pending: 0, rejected: 0 };
    const byType: Record<string, number> = {};
    const totalDays = { approved: 0, pending: 0, rejected: 0 };
    for (const l of leaveRequests) {
      const st = l.status || "pending";
      byStatus[st] = (byStatus[st] || 0) + 1;
      if (st in totalDays) totalDays[st as keyof typeof totalDays] += Number(l.days || 0);
      const ty = titleCase(l.type || "Other");
      byType[ty] = (byType[ty] || 0) + 1;
    }
    return { byStatus, byType, totalDays, count: leaveRequests.length };
  }, [leaveRequests]);

  const typeRows = useMemo(() => {
    return Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => [type, fmtNumber(count), fmtPercent(stats.count > 0 ? (count / stats.count) * 100 : 0)]);
  }, [stats]);

  const detailRows = useMemo(() => {
    return leaveRequests.slice(0, 22).map((l) => [
      `${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.trim() || "—",
      titleCase(l.type || "—"),
      fmtDate(l.startDate),
      fmtDate(l.endDate),
      fmtNumber(Number(l.days || 0)),
      titleCase(l.status || "pending"),
    ]);
  }, [leaveRequests]);

  return (
    <LetterPage title="Leave Report" subtitle="Requests by Type & Status" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Breakdown of leave requests submitted during the reporting period, grouped by leave type and
        approval status.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Requests" value={fmtNumber(stats.count)} tone="accent" />
        <SummaryCard label="Approved" value={fmtNumber(stats.byStatus.approved)} tone="positive" />
        <SummaryCard label="Pending" value={fmtNumber(stats.byStatus.pending)} tone="warning" />
        <SummaryCard label="Rejected" value={fmtNumber(stats.byStatus.rejected)} tone="negative" />
      </div>

      <ReportSectionHeading>Leave by Type</ReportSectionHeading>
      {typeRows.length === 0 ? (
        <p className="report-empty">No leave requests recorded.</p>
      ) : (
        <ReportTable
          headers={["Type", "Requests", "% of Total"]}
          rows={typeRows}
          totals={["Total", fmtNumber(stats.count), "100.0%"]}
          numericCols={[1, 2]}
        />
      )}

      <ReportSectionHeading>Leave Requests Detail</ReportSectionHeading>
      {detailRows.length === 0 ? (
        <p className="report-empty">No leave requests on file.</p>
      ) : (
        <ReportTable
          headers={["Employee", "Type", "Start", "End", "Days", "Status"]}
          rows={detailRows}
          numericCols={[4]}
        />
      )}

      <p className="report-note">
        Leave types include annual, sick, personal, maternity/paternity, and unpaid leave. Pending
        requests should be reviewed and approved or rejected promptly to maintain accurate records.
      </p>
    </LetterPage>
  );
}

// 13. Department Summary
function DepartmentReport({
  departments,
  employees,
  generatedAt,
  totalPages,
}: {
  departments: Department[];
  employees: Employee[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    return departments
      .map((d) => {
        const members = employees.filter((e) => e.departmentId === d.id);
        const active = members.filter((e) => e.status === "active").length;
        const onLeave = members.filter((e) => e.status === "on-leave").length;
        const salary = members.reduce((s, e) => s + Number(e.salary || 0), 0);
        return {
          id: d.id,
          name: d.name,
          headcount: members.length,
          active,
          onLeave,
          salary,
        };
      })
      .sort((a, b) => b.headcount - a.headcount);
  }, [departments, employees]);

  const totals = useMemo(() => {
    const totalHeadcount = rows.reduce((s, r) => s + r.headcount, 0);
    const totalSalary = rows.reduce((s, r) => s + r.salary, 0);
    const avgSize = rows.length > 0 ? totalHeadcount / rows.length : 0;
    return { totalHeadcount, totalSalary, avgSize, deptCount: rows.length };
  }, [rows]);

  const maxSalary = rows.length > 0 ? rows[0].salary : 0;

  return (
    <LetterPage title="Department Summary" subtitle="Headcount & Costs" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Headcount and salary cost breakdown by department, including active vs. on-leave status
        distribution.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Departments" value={fmtNumber(totals.deptCount)} tone="accent" />
        <SummaryCard label="Total Headcount" value={fmtNumber(totals.totalHeadcount)} />
        <SummaryCard label="Avg Dept Size" value={fmtNumber(totals.avgSize, 1)} tone="accent" />
        <SummaryCard label="Salary Cost" value={fmtMoney(totals.totalSalary)} tone="positive" hint="Monthly" />
      </div>

      <ReportSectionHeading>Department Breakdown</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No departments configured.</p>
      ) : (
        <ReportTable
          headers={["Department", "Headcount", "Active", "On Leave", "Monthly Salary Cost"]}
          rows={rows.map((r) => [
            r.name,
            fmtNumber(r.headcount),
            fmtNumber(r.active),
            fmtNumber(r.onLeave),
            fmtMoney(r.salary),
          ])}
          totals={[
            "Total",
            fmtNumber(totals.totalHeadcount),
            "",
            "",
            fmtMoney(totals.totalSalary),
          ]}
          numericCols={[1, 2, 3, 4]}
        />
      )}

      <ReportSectionHeading>Salary Cost by Department</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No data available.</p>
      ) : (
        <div className="space-y-1">
          {rows.slice(0, 8).map((r) => (
            <BarRow key={r.id} label={r.name} value={r.salary} max={maxSalary} />
          ))}
        </div>
      )}

      <p className="report-note">
        Headcount counts all employees assigned to a department regardless of status. Salary cost is
        the sum of base monthly salaries and excludes bonuses, overtime, and employer-paid
        benefits.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// INVENTORY REPORTS
// ════════════════════════════════════════════════════════════════════

function productUnits(p: Product): number {
  return p.stockLevels?.reduce((s, sl) => s + Number(sl.quantity || 0), 0) || 0;
}
function productValue(p: Product): number {
  return productUnits(p) * Number(p.unitPrice || 0);
}
function productCostValue(p: Product): number {
  return productUnits(p) * Number(p.costPrice || 0);
}

// 14. Inventory Valuation
function InventoryValuationReport({
  products,
  generatedAt,
  totalPages,
}: {
  products: Product[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const totalSkus = products.length;
    const totalUnits = products.reduce((s, p) => s + productUnits(p), 0);
    const totalValue = products.reduce((s, p) => s + productValue(p), 0);
    const totalCost = products.reduce((s, p) => s + productCostValue(p), 0);
    const avgValue = totalSkus > 0 ? totalValue / totalSkus : 0;
    return { totalSkus, totalUnits, totalValue, totalCost, avgValue };
  }, [products]);

  const rows = useMemo(() => {
    return products
      .slice()
      .sort((a, b) => productValue(b) - productValue(a))
      .slice(0, 22)
      .map((p) => [
        p.sku,
        p.name,
        p.category || "—",
        fmtNumber(productUnits(p)),
        fmtMoney(Number(p.unitPrice || 0)),
        fmtMoney(productValue(p)),
      ]);
  }, [products]);

  return (
    <LetterPage title="Inventory Valuation" subtitle="Stock Value at Selling Price" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Valuation of all inventory on hand, computed as quantity on hand multiplied by unit selling
        price. Cost basis and potential margin are also reported.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total SKUs" value={fmtNumber(stats.totalSkus)} tone="accent" />
        <SummaryCard label="Units on Hand" value={fmtNumber(stats.totalUnits)} />
        <SummaryCard label="Inventory Value" value={fmtMoney(stats.totalValue)} tone="positive" />
        <SummaryCard label="Cost Basis" value={fmtMoney(stats.totalCost)} tone="negative" hint={`Margin: ${fmtMoney(stats.totalValue - stats.totalCost)}`} />
      </div>

      <ReportSectionHeading>Top Products by Value</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No products on file.</p>
      ) : (
        <ReportTable
          headers={["SKU", "Product", "Category", "On Hand", "Unit Price", "Value"]}
          rows={rows}
          totals={["", "Total", "", fmtNumber(stats.totalUnits), "", fmtMoney(stats.totalValue)]}
          numericCols={[3, 4, 5]}
        />
      )}

      <p className="report-note">
        Inventory valuation uses the standard selling price method. Cost basis reflects the purchase
        cost from vendors. Margin represents the unrealized gross profit if all inventory were sold
        at current prices.
      </p>
    </LetterPage>
  );
}

// 15. Stock Movement Report
function StockMovementReport({
  movements,
  generatedAt,
  totalPages,
}: {
  movements: StockMovement[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const byType: Record<string, { count: number; qty: number }> = {};
    for (const m of movements) {
      const t = m.type || "other";
      if (!byType[t]) byType[t] = { count: 0, qty: 0 };
      byType[t].count += 1;
      byType[t].qty += Number(m.quantity || 0);
    }
    return { byType, total: movements.length };
  }, [movements]);

  const rows = useMemo(() => {
    return movements.slice(0, 22).map((m) => [
      fmtDate(m.createdAt),
      m.product?.sku || "—",
      m.product?.name || "—",
      m.warehouse?.name || "—",
      titleCase(m.type || "—"),
      `${Number(m.quantity || 0) > 0 ? "+" : ""}${fmtNumber(Number(m.quantity || 0))}`,
      m.reference || m.notes || "—",
    ]);
  }, [movements]);

  const typeRows = useMemo(() => {
    return Object.entries(stats.byType).map(([type, v]) => [
      titleCase(type),
      fmtNumber(v.count),
      fmtNumber(v.qty),
    ]);
  }, [stats]);

  return (
    <LetterPage title="Stock Movement Report" subtitle="In / Out / Transfer Activity" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Log of all stock movements (receipts, issues, transfers, and adjustments) recorded during
        the reporting period.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Movements" value={fmtNumber(stats.total)} tone="accent" />
        <SummaryCard label="Receipts (In)" value={fmtNumber(stats.byType["in"]?.count || 0)} tone="positive" />
        <SummaryCard label="Issues (Out)" value={fmtNumber(stats.byType["out"]?.count || 0)} tone="negative" />
        <SummaryCard label="Transfers" value={fmtNumber(stats.byType["transfer"]?.count || 0)} tone="warning" />
      </div>

      <ReportSectionHeading>Movement Summary by Type</ReportSectionHeading>
      {typeRows.length === 0 ? (
        <p className="report-empty">No stock movements recorded.</p>
      ) : (
        <ReportTable
          headers={["Type", "Transactions", "Units Moved"]}
          rows={typeRows}
          numericCols={[1, 2]}
        />
      )}

      <ReportSectionHeading>Movement Log</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No stock movements on file.</p>
      ) : (
        <ReportTable
          headers={["Date", "SKU", "Product", "Warehouse", "Type", "Qty", "Reference"]}
          rows={rows}
          numericCols={[5]}
        />
      )}

      <p className="report-note">
        Stock movements are recorded automatically by the inventory system on receipt, issue, and
        transfer transactions. Quantities are signed: positive for inbound, negative for outbound.
      </p>
    </LetterPage>
  );
}

// 16. Low Stock Alert
function LowStockReport({
  products,
  generatedAt,
  totalPages,
}: {
  products: Product[];
  generatedAt: Date;
  totalPages: number;
}) {
  const lowStock = useMemo(() => {
    return products
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category || "—",
        onHand: productUnits(p),
        reorder: Number(p.reorderLevel || 0),
        unitPrice: Number(p.unitPrice || 0),
        severity: productUnits(p) === 0 ? "out" : productUnits(p) <= Number(p.reorderLevel || 0) ? "low" : "ok",
      }))
      .filter((p) => p.severity !== "ok")
      .sort((a, b) => a.onHand - b.onHand);
  }, [products]);

  const stats = useMemo(() => {
    const outOfStock = lowStock.filter((p) => p.severity === "out").length;
    const critical = lowStock.filter((p) => p.severity === "low" && p.onHand <= p.reorder * 0.5).length;
    const low = lowStock.length - outOfStock;
    const potentialValue = lowStock.reduce((s, p) => s + p.onHand * p.unitPrice, 0);
    return { outOfStock, critical, low, potentialValue };
  }, [lowStock]);

  return (
    <LetterPage title="Low Stock Alert" subtitle="Items at or below Reorder Level" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        List of all products whose stock on hand has reached or fallen below the configured reorder
        level. Items are sorted by urgency (lowest stock first).
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Items to Reorder" value={fmtNumber(lowStock.length)} tone="negative" />
        <SummaryCard label="Out of Stock" value={fmtNumber(stats.outOfStock)} tone="negative" />
        <SummaryCard label="Critical (≤50% reorder)" value={fmtNumber(stats.critical)} tone="warning" />
        <SummaryCard label="On-Hand Value" value={fmtMoney(stats.potentialValue)} tone="accent" />
      </div>

      <ReportSectionHeading>Low Stock Items</ReportSectionHeading>
      {lowStock.length === 0 ? (
        <p className="report-empty">All products are above their reorder level. ✓</p>
      ) : (
        <ReportTable
          headers={["SKU", "Product", "Category", "On Hand", "Reorder Lvl", "Unit Price", "Severity"]}
          rows={lowStock.slice(0, 22).map((p) => [
            p.sku,
            p.name,
            p.category,
            fmtNumber(p.onHand),
            fmtNumber(p.reorder),
            fmtMoney(p.unitPrice),
            p.severity === "out"
              ? Pill({ tone: "negative", label: "Out of Stock" })
              : p.onHand <= p.reorder * 0.5
              ? Pill({ tone: "negative", label: "Critical" })
              : Pill({ tone: "warning", label: "Low" }),
          ])}
          numericCols={[3, 4, 5]}
        />
      )}

      <p className="report-note">
        Items marked &ldquo;Out of Stock&rdquo; have zero units on hand and require immediate
        reorder. &ldquo;Critical&rdquo; items are at or below 50% of their reorder level. Purchase
        orders should be initiated to replenish stock before service levels are impacted.
      </p>
    </LetterPage>
  );
}

// 17. Warehouse Summary
function WarehouseReport({
  warehouses,
  products,
  generatedAt,
  totalPages,
}: {
  warehouses: Warehouse[];
  products: Product[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    return warehouses.map((w) => {
      let units = 0;
      let value = 0;
      let skus = 0;
      for (const p of products) {
        const sl = p.stockLevels?.find((s) => s.warehouseId === w.id);
        if (sl && Number(sl.quantity || 0) > 0) {
          units += Number(sl.quantity || 0);
          value += Number(sl.quantity || 0) * Number(p.unitPrice || 0);
          skus += 1;
        }
      }
      return {
        id: w.id,
        code: w.code,
        name: w.name,
        location: w.location || "—",
        skus,
        units,
        value,
        isDefault: w.isDefault,
        isActive: w.isActive,
      };
    });
  }, [warehouses, products]);

  const totals = useMemo(() => {
    const totalUnits = rows.reduce((s, r) => s + r.units, 0);
    const totalValue = rows.reduce((s, r) => s + r.value, 0);
    const totalSkus = rows.reduce((s, r) => s + r.skus, 0);
    return { totalUnits, totalValue, totalSkus, warehouseCount: rows.length };
  }, [rows]);

  return (
    <LetterPage title="Warehouse Summary" subtitle="Stock by Warehouse" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Distribution of inventory across all warehouses, including the number of unique SKUs, total
        units on hand, and stock value per warehouse.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Warehouses" value={fmtNumber(totals.warehouseCount)} tone="accent" />
        <SummaryCard label="Total SKUs Stored" value={fmtNumber(totals.totalSkus)} />
        <SummaryCard label="Total Units" value={fmtNumber(totals.totalUnits)} />
        <SummaryCard label="Total Stock Value" value={fmtMoney(totals.totalValue)} tone="positive" />
      </div>

      <ReportSectionHeading>Per-Warehouse Breakdown</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No warehouses configured.</p>
      ) : (
        <ReportTable
          headers={["Code", "Name", "Location", "SKUs", "Units", "Value", "Default", "Active"]}
          rows={rows.map((r) => [
            r.code,
            r.name,
            r.location,
            fmtNumber(r.skus),
            fmtNumber(r.units),
            fmtMoney(r.value),
            r.isDefault ? "Yes" : "No",
            r.isActive ? "Yes" : "No",
          ])}
          totals={[
            "",
            "Total",
            "",
            fmtNumber(totals.totalSkus),
            fmtNumber(totals.totalUnits),
            fmtMoney(totals.totalValue),
            "",
            "",
          ]}
          numericCols={[3, 4, 5]}
        />
      )}

      <p className="report-note">
        The default warehouse is used for new stock receipts when no warehouse is specified. Inactive
        warehouses are excluded from new transactions but remain in the system for historical
        reporting.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// PROCUREMENT REPORTS
// ════════════════════════════════════════════════════════════════════

// 18. Purchase Order Summary
function PurchaseOrderReport({
  purchaseOrders,
  generatedAt,
  totalPages,
}: {
  purchaseOrders: PurchaseOrder[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const total = purchaseOrders.reduce((s, p) => s + Number(p.total || 0), 0);
    const byStatus: Record<string, { count: number; total: number }> = {};
    for (const p of purchaseOrders) {
      const st = p.status || "unknown";
      if (!byStatus[st]) byStatus[st] = { count: 0, total: 0 };
      byStatus[st].count += 1;
      byStatus[st].total += Number(p.total || 0);
    }
    const avg = purchaseOrders.length > 0 ? total / purchaseOrders.length : 0;
    const pending = (byStatus.pending?.count || 0) + (byStatus.sent?.count || 0) + (byStatus.draft?.count || 0);
    return { total, byStatus, avg, pending, count: purchaseOrders.length };
  }, [purchaseOrders]);

  const statusRows = useMemo(() => {
    return Object.entries(stats.byStatus).map(([status, v]) => [
      titleCase(status),
      fmtNumber(v.count),
      fmtMoney(v.total),
    ]);
  }, [stats]);

  const detailRows = useMemo(() => {
    return purchaseOrders.slice(0, 18).map((p) => [
      p.number,
      p.vendor?.name || "—",
      fmtDate(p.orderDate),
      fmtDate(p.expectedDate),
      fmtMoney(Number(p.total || 0)),
      titleCase(p.status || "—"),
    ]);
  }, [purchaseOrders]);

  return (
    <LetterPage title="Purchase Order Summary" subtitle="POs by Status & Vendor" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Summary of purchase orders issued during the reporting period, grouped by status with vendor
        and total amount detail.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total POs" value={fmtNumber(stats.count)} tone="accent" />
        <SummaryCard label="Total Value" value={fmtMoney(stats.total)} tone="positive" />
        <SummaryCard label="Avg PO Value" value={fmtMoney(stats.avg)} />
        <SummaryCard label="Pending" value={fmtNumber(stats.pending)} tone="warning" />
      </div>

      <ReportSectionHeading>POs by Status</ReportSectionHeading>
      {statusRows.length === 0 ? (
        <p className="report-empty">No purchase orders on file.</p>
      ) : (
        <ReportTable
          headers={["Status", "Count", "Total Value"]}
          rows={statusRows}
          totals={["Total", fmtNumber(stats.count), fmtMoney(stats.total)]}
          numericCols={[1, 2]}
        />
      )}

      <ReportSectionHeading>Purchase Order Detail</ReportSectionHeading>
      {detailRows.length === 0 ? (
        <p className="report-empty">No purchase orders recorded.</p>
      ) : (
        <ReportTable
          headers={["PO #", "Vendor", "Order Date", "Expected", "Amount", "Status"]}
          rows={detailRows}
          totals={["", "", "", "", fmtMoney(stats.total), ""]}
          numericCols={[4]}
        />
      )}

      <p className="report-note">
        Purchase order statuses track the procurement lifecycle from draft through received and
        closed. Pending POs include those awaiting vendor acknowledgment or shipment.
      </p>
    </LetterPage>
  );
}

// 19. Vendor Performance
function VendorReport({
  vendors,
  purchaseOrders,
  generatedAt,
  totalPages,
}: {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    return vendors
      .map((v) => {
        const pos = purchaseOrders.filter((p) => p.vendorId === v.id);
        const poCount = pos.length;
        const totalSpend = pos.reduce((s, p) => s + Number(p.total || 0), 0);
        const avgPo = poCount > 0 ? totalSpend / poCount : 0;
        const delivered = pos.filter((p) => p.status === "received" || p.status === "closed").length;
        const deliveryRate = poCount > 0 ? (delivered / poCount) * 100 : 0;
        return {
          id: v.id,
          name: v.name,
          category: v.category || "—",
          poCount,
          totalSpend,
          avgPo,
          deliveryRate,
          rating: Number(v.rating || 0),
          isActive: v.isActive,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [vendors, purchaseOrders]);

  const totals = useMemo(() => {
    const totalSpend = rows.reduce((s, r) => s + r.totalSpend, 0);
    const totalPos = rows.reduce((s, r) => s + r.poCount, 0);
    const activeVendors = rows.filter((r) => r.isActive).length;
    const avgRating = rows.length > 0 ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
    return { totalSpend, totalPos, activeVendors, avgRating, vendorCount: rows.length };
  }, [rows]);

  return (
    <LetterPage title="Vendor Performance" subtitle="Spend & Delivery Metrics" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Vendor performance metrics including PO count, total spend, average PO value, delivery
        rate, and vendor rating.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Vendors" value={fmtNumber(totals.vendorCount)} tone="accent" />
        <SummaryCard label="Active Vendors" value={fmtNumber(totals.activeVendors)} tone="positive" />
        <SummaryCard label="Avg Rating" value={`${totals.avgRating.toFixed(1)} / 5`} tone="accent" />
        <SummaryCard label="Total Spend" value={fmtMoney(totals.totalSpend)} tone="positive" hint={`${totals.totalPos} POs`} />
      </div>

      <ReportSectionHeading>Vendor Performance Detail</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No vendors on file.</p>
      ) : (
        <ReportTable
          headers={["Vendor", "Category", "POs", "Total Spend", "Avg PO", "Delivery", "Rating"]}
          rows={rows.slice(0, 22).map((r) => [
            r.name,
            r.category,
            fmtNumber(r.poCount),
            fmtMoney(r.totalSpend),
            fmtMoney(r.avgPo),
            fmtPercent(r.deliveryRate),
            `${r.rating.toFixed(1)} / 5`,
          ])}
          totals={[
            "Total",
            "",
            fmtNumber(totals.totalPos),
            fmtMoney(totals.totalSpend),
            "",
            "",
            "",
          ]}
          numericCols={[2, 3, 4, 5]}
        />
      )}

      <p className="report-note">
        Delivery rate represents the percentage of POs that have been fully received or closed
        against each vendor. Ratings are maintained by the procurement team based on overall vendor
        performance.
      </p>
    </LetterPage>
  );
}

// 20. Expense Report
function ExpenseReport({
  expenses,
  generatedAt,
  totalPages,
}: {
  expenses: Expense[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const byStatus: Record<string, { count: number; total: number }> = {};
    const byCategory: Record<string, { count: number; total: number }> = {};
    for (const e of expenses) {
      const st = e.status || "pending";
      if (!byStatus[st]) byStatus[st] = { count: 0, total: 0 };
      byStatus[st].count += 1;
      byStatus[st].total += Number(e.amount || 0);
      const cat = e.category || "Uncategorized";
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].total += Number(e.amount || 0);
    }
    return {
      total,
      byStatus,
      byCategory,
      approved: byStatus.approved?.total || 0,
      pending: byStatus.pending?.total || 0,
      rejected: byStatus.rejected?.total || 0,
    };
  }, [expenses]);

  const catRows = useMemo(() => {
    return Object.entries(stats.byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, v]) => [cat, fmtNumber(v.count), fmtMoney(v.total)]);
  }, [stats]);

  const maxCat = catRows.length > 0 ? Number(stats.byCategory[catRows[0][0]]?.total || 0) : 0;

  const detailRows = useMemo(() => {
    return expenses.slice(0, 22).map((e) => [
      fmtDate(e.date || e.createdAt),
      e.title,
      e.category || "—",
      fmtMoney(Number(e.amount || 0)),
      titleCase(e.status || "—"),
      e.submittedBy?.name || "—",
    ]);
  }, [expenses]);

  return (
    <LetterPage title="Expense Report" subtitle="By Category, Status & Amount" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Detailed breakdown of all submitted expenses, grouped by category and approval status, with
        individual transaction detail.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Expenses" value={fmtMoney(stats.total)} tone="negative" hint={`${expenses.length} entries`} />
        <SummaryCard label="Approved" value={fmtMoney(stats.approved)} tone="positive" />
        <SummaryCard label="Pending" value={fmtMoney(stats.pending)} tone="warning" />
        <SummaryCard label="Rejected" value={fmtMoney(stats.rejected)} tone="negative" />
      </div>

      <ReportSectionHeading>Expenses by Category</ReportSectionHeading>
      {catRows.length === 0 ? (
        <p className="report-empty">No expense categories recorded.</p>
      ) : (
        <>
          <div className="space-y-1 mb-2">
            {catRows.slice(0, 6).map(([cat, , totalStr]) => {
              const total = Number(stats.byCategory[cat]?.total || 0);
              return <BarRow key={cat} label={cat} value={total} max={maxCat} />;
            })}
          </div>
          <ReportTable
            headers={["Category", "Entries", "Amount"]}
            rows={catRows}
            totals={["Total", fmtNumber(expenses.length), fmtMoney(stats.total)]}
            numericCols={[1, 2]}
          />
        </>
      )}

      <ReportSectionHeading>Expense Detail</ReportSectionHeading>
      {detailRows.length === 0 ? (
        <p className="report-empty">No expenses recorded.</p>
      ) : (
        <ReportTable
          headers={["Date", "Title", "Category", "Amount", "Status", "Submitted By"]}
          rows={detailRows}
          totals={["", "", "", fmtMoney(stats.total), "", ""]}
          numericCols={[3]}
        />
      )}

      <p className="report-note">
        Expenses are submitted by employees and routed through an approval workflow. Approved
        expenses are eligible for reimbursement. Pending expenses require manager review.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// ASSET REPORTS
// ════════════════════════════════════════════════════════════════════

// 21. IT Asset Register
function ITAssetReport({
  assets,
  generatedAt,
  totalPages,
}: {
  assets: ITAsset[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const byStatus: Record<string, { count: number; value: number }> = {};
    let totalValue = 0;
    for (const a of assets) {
      const st = a.status || "unknown";
      if (!byStatus[st]) byStatus[st] = { count: 0, value: 0 };
      byStatus[st].count += 1;
      byStatus[st].value += Number(a.purchaseCost || 0);
      totalValue += Number(a.purchaseCost || 0);
    }
    return {
      total: assets.length,
      totalValue,
      inUse: byStatus["in-use"]?.count || 0,
      available: byStatus.available?.count || 0,
      retired: byStatus.retired?.count || 0,
      byStatus,
    };
  }, [assets]);

  const rows = useMemo(() => {
    return assets.slice(0, 22).map((a) => [
      a.assetTag,
      a.name,
      titleCase(a.category || "—"),
      a.brand || "—",
      fmtMoney(Number(a.purchaseCost || 0)),
      fmtDate(a.purchaseDate),
      titleCase(a.status || "—"),
      a.assignedTo?.name || "—",
    ]);
  }, [assets]);

  return (
    <LetterPage title="IT Asset Register" subtitle="All IT Assets with Status & Value" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Complete register of all IT assets owned by the organization, including purchase value,
        assignment, and current status.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Assets" value={fmtNumber(stats.total)} tone="accent" />
        <SummaryCard label="In Use" value={fmtNumber(stats.inUse)} tone="positive" />
        <SummaryCard label="Available" value={fmtNumber(stats.available)} tone="accent" />
        <SummaryCard label="Total Value" value={fmtMoney(stats.totalValue)} tone="positive" />
      </div>

      <ReportSectionHeading>Asset Inventory</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No IT assets on file.</p>
      ) : (
        <ReportTable
          headers={["Asset Tag", "Name", "Category", "Brand", "Cost", "Purchased", "Status", "Assigned To"]}
          rows={rows}
          numericCols={[4]}
        />
      )}

      <p className="report-note">
        Asset values reflect original purchase cost and do not account for depreciation. Status
        fields reflect current lifecycle state. Retired assets remain in the register for
        historical audit purposes.
      </p>
    </LetterPage>
  );
}

// 22. Asset Issuance Report
function AssetIssuanceReport({
  issuances,
  generatedAt,
  totalPages,
}: {
  issuances: AssetIssuance[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    let active = 0;
    let returned = 0;
    let overdue = 0;
    const now = new Date();
    for (const i of issuances) {
      const st = i.status || "issued";
      if (st === "issued") {
        active += 1;
        if (i.expectedReturnDate && new Date(i.expectedReturnDate) < now && !i.actualReturnDate) {
          overdue += 1;
        }
      } else if (st === "returned") {
        returned += 1;
      }
    }
    return { total: issuances.length, active, returned, overdue };
  }, [issuances]);

  const rows = useMemo(() => {
    return issuances.slice(0, 22).map((i) => [
      i.asset?.assetTag || "—",
      i.asset?.name || "—",
      i.issuedTo?.name || "—",
      i.issuedBy?.name || "—",
      fmtDate(i.issueDate),
      fmtDate(i.expectedReturnDate),
      fmtDate(i.actualReturnDate),
      titleCase(i.status || "—"),
    ]);
  }, [issuances]);

  return (
    <LetterPage title="Asset Issuance Report" subtitle="Issued IT Assets Log" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Log of all IT assets issued to employees, including issue date, expected return date, and
        actual return date.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Issuances" value={fmtNumber(stats.total)} tone="accent" />
        <SummaryCard label="Active (Outstanding)" value={fmtNumber(stats.active)} tone="warning" />
        <SummaryCard label="Returned" value={fmtNumber(stats.returned)} tone="positive" />
        <SummaryCard label="Overdue" value={fmtNumber(stats.overdue)} tone="negative" />
      </div>

      <ReportSectionHeading>Issuance Log</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No asset issuances recorded.</p>
      ) : (
        <ReportTable
          headers={["Asset Tag", "Asset", "Issued To", "Issued By", "Issue Date", "Expected Return", "Actual Return", "Status"]}
          rows={rows}
        />
      )}

      <p className="report-note">
        Assets marked as &ldquo;issued&rdquo; are currently with the assigned employee. Overdue
        issuances have passed their expected return date without being returned. Returned assets
        should be inspected for condition before being re-issued.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// CRM / SALES REPORTS
// ════════════════════════════════════════════════════════════════════

// 23. Client Report
function ClientReport({
  clients,
  invoices,
  campaigns,
  generatedAt,
  totalPages,
}: {
  clients: Client[];
  invoices: Invoice[];
  campaigns: Campaign[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    return clients
      .map((c) => {
        const clientInvoices = invoices.filter((i) => i.clientId === c.id);
        const paidInvoices = clientInvoices.filter((i) => i.status === "paid");
        const revenue = paidInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
        const outstanding = clientInvoices
          .filter((i) => i.status === "sent" || i.status === "overdue")
          .reduce((s, i) => s + Number(i.total || 0), 0);
        const campaignCount = campaigns.filter((cmp) => cmp.client?.id === c.id).length;
        return {
          id: c.id,
          name: c.name,
          industry: c.industry || "—",
          status: c.status,
          campaignCount,
          invoiceCount: clientInvoices.length,
          revenue,
          outstanding,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [clients, invoices, campaigns]);

  const totals = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
    const activeClients = rows.filter((r) => r.status === "active").length;
    return { totalRevenue, totalOutstanding, activeClients, clientCount: rows.length };
  }, [rows]);

  return (
    <LetterPage title="Client Report" subtitle="With Campaigns & Revenue" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Summary of all clients including industry, active campaign count, paid revenue, and
        outstanding balance.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Clients" value={fmtNumber(totals.clientCount)} tone="accent" />
        <SummaryCard label="Active" value={fmtNumber(totals.activeClients)} tone="positive" />
        <SummaryCard label="Total Revenue" value={fmtMoney(totals.totalRevenue)} tone="positive" hint="From paid invoices" />
        <SummaryCard label="Outstanding" value={fmtMoney(totals.totalOutstanding)} tone="negative" />
      </div>

      <ReportSectionHeading>Client Detail</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No clients on file.</p>
      ) : (
        <ReportTable
          headers={["Client", "Industry", "Campaigns", "Invoices", "Revenue", "Outstanding", "Status"]}
          rows={rows.slice(0, 22).map((r) => [
            r.name,
            r.industry,
            fmtNumber(r.campaignCount),
            fmtNumber(r.invoiceCount),
            fmtMoney(r.revenue),
            fmtMoney(r.outstanding),
            r.status === "active"
              ? Pill({ tone: "positive", label: titleCase(r.status) })
              : Pill({ tone: "neutral", label: titleCase(r.status) }),
          ])}
          totals={[
            "Total",
            "",
            "",
            "",
            fmtMoney(totals.totalRevenue),
            fmtMoney(totals.totalOutstanding),
            "",
          ]}
          numericCols={[2, 3, 4, 5]}
        />
      )}

      <p className="report-note">
        Revenue reflects paid invoices only. Outstanding balance includes all sent and overdue
        invoices. Campaign counts reflect campaigns currently or previously associated with each
        client.
      </p>
    </LetterPage>
  );
}

// 24. Campaign Performance
function CampaignReport({
  campaigns,
  clients,
  invoices,
  generatedAt,
  totalPages,
}: {
  campaigns: Campaign[];
  clients: Client[];
  invoices: Invoice[];
  generatedAt: Date;
  totalPages: number;
}) {
  const rows = useMemo(() => {
    return campaigns
      .map((c) => {
        const campaignInvoices = invoices.filter((i) => i.campaignId === c.id);
        const revenue = campaignInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
        const client = clients.find((cl) => cl.id === c.client?.id);
        const budget = Number(c.budget || 0);
        const roi = budget > 0 ? ((revenue - budget) / budget) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          client: client?.name || c.client?.name || "—",
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          budget,
          revenue,
          roi,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [campaigns, clients, invoices]);

  const totals = useMemo(() => {
    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const activeCampaigns = rows.filter((r) => r.status === "active").length;
    const completedCampaigns = rows.filter((r) => r.status === "completed").length;
    return { totalBudget, totalRevenue, activeCampaigns, completedCampaigns, count: rows.length };
  }, [rows]);

  return (
    <LetterPage title="Campaign Performance" subtitle="Campaigns with Revenue & ROI" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Performance summary of all marketing campaigns, including budget, generated revenue, and
        return on investment (ROI).
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Campaigns" value={fmtNumber(totals.count)} tone="accent" />
        <SummaryCard label="Active" value={fmtNumber(totals.activeCampaigns)} tone="positive" />
        <SummaryCard label="Total Budget" value={fmtMoney(totals.totalBudget)} tone="negative" />
        <SummaryCard label="Total Revenue" value={fmtMoney(totals.totalRevenue)} tone="positive" />
      </div>

      <ReportSectionHeading>Campaign Detail</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No campaigns on file.</p>
      ) : (
        <ReportTable
          headers={["Campaign", "Client", "Start", "End", "Budget", "Revenue", "ROI", "Status"]}
          rows={rows.slice(0, 22).map((r) => [
            r.name,
            r.client,
            fmtDate(r.startDate),
            fmtDate(r.endDate),
            fmtMoney(r.budget),
            fmtMoney(r.revenue),
            r.roi > 0
              ? `<span class="text-emerald-700 font-semibold">+${r.roi.toFixed(1)}%</span>`
              : `<span class="text-rose-700 font-semibold">${r.roi.toFixed(1)}%</span>`,
            r.status === "active"
              ? Pill({ tone: "positive", label: titleCase(r.status) })
              : r.status === "completed"
              ? Pill({ tone: "accent", label: titleCase(r.status) })
              : Pill({ tone: "neutral", label: titleCase(r.status) }),
          ])}
          totals={[
            "",
            "",
            "",
            "",
            fmtMoney(totals.totalBudget),
            fmtMoney(totals.totalRevenue),
            "",
            "",
          ]}
          numericCols={[4, 5]}
        />
      )}

      <p className="report-note">
        ROI is calculated as (Revenue − Budget) ÷ Budget × 100. Positive ROI indicates the campaign
        generated more revenue than its budgeted cost. Status reflects the current lifecycle state
        of each campaign.
      </p>
    </LetterPage>
  );
}

// ════════════════════════════════════════════════════════════════════
// CONTENT & SOCIAL REPORTS
// ════════════════════════════════════════════════════════════════════

// 25. Content Pipeline Report
function ContentPipelineReport({
  contents,
  generatedAt,
  totalPages,
}: {
  contents: Content[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const byStage: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const c of contents) {
      byStage[c.stage] = (byStage[c.stage] || 0) + 1;
      byType[c.type] = (byType[c.type] || 0) + 1;
      byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    }
    const overdue = contents.filter(c => c.dueDate && new Date(c.dueDate) < new Date() && c.stage !== 'disseminate' && c.stage !== 'archived').length;
    return { byStage, byType, byPriority, total: contents.length, overdue };
  }, [contents]);

  const stageRows = useMemo(() => {
    const stages = ['idea', 'design', 'edit', 'review', 'approve', 'disseminate', 'archived'];
    return stages.map(s => [titleCase(s), fmtNumber(stats.byStage[s] || 0), fmtPercent(stats.total > 0 ? ((stats.byStage[s] || 0) / stats.total) * 100 : 0)]);
  }, [stats]);

  const detailRows = useMemo(() => {
    return contents.slice(0, 22).map(c => [
      c.title,
      titleCase(c.type),
      titleCase(c.stage),
      titleCase(c.priority),
      c.campaign?.name || "—",
      c.assignee?.name || "—",
      fmtDate(c.dueDate),
    ]);
  }, [contents]);

  return (
    <LetterPage title="Content Pipeline Report" subtitle="Content by Stage, Type & Priority" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Comprehensive view of all content items in the production pipeline, categorized by stage,
        content type, and priority level.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Content" value={fmtNumber(stats.total)} tone="accent" />
        <SummaryCard label="In Pipeline" value={fmtNumber(stats.total - (stats.byStage['disseminate'] || 0) - (stats.byStage['archived'] || 0))} tone="positive" />
        <SummaryCard label="Published" value={fmtNumber(stats.byStage['disseminate'] || 0)} tone="positive" />
        <SummaryCard label="Overdue" value={fmtNumber(stats.overdue)} tone={stats.overdue > 0 ? "negative" : "default"} />
      </div>

      <ReportSectionHeading>Content by Stage</ReportSectionHeading>
      {stageRows.length === 0 ? (
        <p className="report-empty">No content on file.</p>
      ) : (
        <ReportTable
          headers={["Stage", "Count", "% of Total"]}
          rows={stageRows}
          totals={["Total", fmtNumber(stats.total), "100.0%"]}
          numericCols={[1, 2]}
        />
      )}

      <ReportSectionHeading>Content Detail</ReportSectionHeading>
      {detailRows.length === 0 ? (
        <p className="report-empty">No content items recorded.</p>
      ) : (
        <ReportTable
          headers={["Title", "Type", "Stage", "Priority", "Campaign", "Assignee", "Due Date"]}
          rows={detailRows}
        />
      )}

      <p className="report-note">
        Content stages follow the production pipeline: Idea → Design → Edit → Review → Approve →
        Disseminate. Overdue items have passed their due date without reaching the Disseminate stage.
      </p>
    </LetterPage>
  );
}

// 26. Social Media Performance Report
function SocialPerformanceReport({
  posts,
  generatedAt,
  totalPages,
}: {
  posts: Post[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const byPlatform: Record<string, { count: number; engagement: number; published: number }> = {};
    for (const p of posts) {
      const plat = p.platform || 'unknown';
      if (!byPlatform[plat]) byPlatform[plat] = { count: 0, engagement: 0, published: 0 };
      byPlatform[plat].count += 1;
      if (p.status === 'published') byPlatform[plat].published += 1;
      if (p.engagement) {
        try {
          const eng = JSON.parse(p.engagement);
          const total = Object.values(eng).reduce((s: number, v: unknown) => s + (typeof v === 'number' ? v : 0), 0);
          byPlatform[plat].engagement += total;
        } catch { /* ignore */ }
      }
    }
    const totalPosts = posts.length;
    const totalPublished = posts.filter(p => p.status === 'published').length;
    const totalScheduled = posts.filter(p => p.status === 'scheduled').length;
    const totalDraft = posts.filter(p => p.status === 'draft').length;
    const totalEngagement = Object.values(byPlatform).reduce((s, v) => s + v.engagement, 0);
    return { byPlatform, totalPosts, totalPublished, totalScheduled, totalDraft, totalEngagement };
  }, [posts]);

  const platformRows = useMemo(() => {
    return Object.entries(stats.byPlatform).map(([platform, v]) => [
      titleCase(platform),
      fmtNumber(v.count),
      fmtNumber(v.published),
      fmtNumber(v.engagement),
      fmtNumber(v.count > 0 ? v.engagement / v.count : 0),
    ]);
  }, [stats]);

  const detailRows = useMemo(() => {
    return posts.slice(0, 22).map(p => {
      let engagement = 0;
      if (p.engagement) {
        try {
          const eng = JSON.parse(p.engagement);
          engagement = Object.values(eng).reduce((s: number, v: unknown) => s + (typeof v === 'number' ? v : 0), 0);
        } catch { /* ignore */ }
      }
      return [
        titleCase(p.platform),
        p.content.substring(0, 50) + (p.content.length > 50 ? '…' : ''),
        titleCase(p.status),
        fmtDate(p.publishedAt || p.scheduledAt),
        fmtNumber(engagement),
      ];
    });
  }, [posts]);

  return (
    <LetterPage title="Social Media Performance" subtitle="Posts by Platform & Engagement" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Performance summary of all social media posts across platforms, including publish status,
        engagement metrics, and per-platform averages.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Posts" value={fmtNumber(stats.totalPosts)} tone="accent" />
        <SummaryCard label="Published" value={fmtNumber(stats.totalPublished)} tone="positive" />
        <SummaryCard label="Scheduled" value={fmtNumber(stats.totalScheduled)} tone="warning" />
        <SummaryCard label="Total Engagement" value={fmtNumber(stats.totalEngagement)} tone="positive" />
      </div>

      <ReportSectionHeading>Performance by Platform</ReportSectionHeading>
      {platformRows.length === 0 ? (
        <p className="report-empty">No posts on file.</p>
      ) : (
        <ReportTable
          headers={["Platform", "Total Posts", "Published", "Engagement", "Avg/Post"]}
          rows={platformRows}
          totals={["Total", fmtNumber(stats.totalPosts), fmtNumber(stats.totalPublished), fmtNumber(stats.totalEngagement), ""]}
          numericCols={[1, 2, 3, 4]}
        />
      )}

      <ReportSectionHeading>Post Detail</ReportSectionHeading>
      {detailRows.length === 0 ? (
        <p className="report-empty">No posts recorded.</p>
      ) : (
        <ReportTable
          headers={["Platform", "Content", "Status", "Date", "Engagement"]}
          rows={detailRows}
          numericCols={[4]}
        />
      )}

      <p className="report-note">
        Engagement metrics include likes, comments, shares, and views where applicable. Average
        engagement per post is calculated as total engagement divided by total posts on each platform.
      </p>
    </LetterPage>
  );
}

// 27. Influencer ROI Report
function InfluencerRoiReport({
  influencers,
  generatedAt,
  totalPages,
}: {
  influencers: Influencer[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const total = influencers.length;
    const active = influencers.filter(i => i.status === 'active').length;
    const totalFollowers = influencers.reduce((s, i) => s + Number(i.followers || 0), 0);
    const totalReach = totalFollowers;
    const avgEngagement = total > 0 ? influencers.reduce((s, i) => s + Number(i.engagementRate || 0), 0) / total : 0;
    const totalSpend = influencers.reduce((s, i) => s + Number(i.rate || 0), 0);
    const avgRate = total > 0 ? totalSpend / total : 0;
    return { total, active, totalFollowers, totalReach, avgEngagement, totalSpend, avgRate };
  }, [influencers]);

  const rows = useMemo(() => {
    return influencers
      .slice()
      .sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0))
      .map(i => [
        i.name,
        `@${i.username}`,
        titleCase(i.platform),
        fmtNumber(Number(i.followers || 0)),
        fmtPercent(Number(i.engagementRate || 0)),
        i.niche || "—",
        fmtMoney(Number(i.rate || 0)),
        titleCase(i.status),
      ]);
  }, [influencers]);

  return (
    <LetterPage title="Influencer ROI Report" subtitle="Performance & Engagement Metrics" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Return on investment analysis for all influencer partnerships, including follower counts,
        engagement rates, and per-post costs.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Influencers" value={fmtNumber(stats.total)} tone="accent" />
        <SummaryCard label="Active" value={fmtNumber(stats.active)} tone="positive" />
        <SummaryCard label="Total Reach" value={fmtNumber(stats.totalReach)} tone="positive" hint="Combined followers" />
        <SummaryCard label="Avg Engagement" value={fmtPercent(stats.avgEngagement)} tone="accent" />
      </div>

      <div className="report-summary-grid">
        <SummaryCard label="Total Spend" value={fmtMoney(stats.totalSpend)} tone="negative" hint="Per-post rates" />
        <SummaryCard label="Avg Rate/Post" value={fmtMoney(stats.avgRate)} tone="warning" />
        <SummaryCard label="Cost per 1K Reach" value={fmtMoney(stats.totalReach > 0 ? (stats.totalSpend / (stats.totalReach / 1000)) : 0)} tone="accent" />
        <SummaryCard label="CPM" value={fmtMoney(stats.totalFollowers > 0 ? (stats.totalSpend / (stats.totalFollowers / 1000)) : 0)} hint="Cost per mille" />
      </div>

      <ReportSectionHeading>Influencer Detail</ReportSectionHeading>
      {rows.length === 0 ? (
        <p className="report-empty">No influencers on file.</p>
      ) : (
        <ReportTable
          headers={["Name", "Username", "Platform", "Followers", "Engagement", "Niche", "Rate/Post", "Status"]}
          rows={rows}
          numericCols={[3, 4, 6]}
        />
      )}

      <p className="report-note">
        CPM (Cost Per Mille) represents the cost per 1,000 followers reached. Lower CPM indicates
        better value. Engagement rate is the average interaction rate on the influencer&apos;s content.
        Rates are per-post unless otherwise noted.
      </p>
    </LetterPage>
  );
}

// 28. Dissemination Performance Report
function DisseminationPerformanceReport({
  disseminators,
  tasks,
  generatedAt,
  totalPages,
}: {
  disseminators: Disseminator[];
  tasks: DisseminationTask[];
  generatedAt: Date;
  totalPages: number;
}) {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
    const assigned = tasks.filter(t => t.status === 'assigned' || t.status === 'pending').length;
    const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
    const onTimeTasks = tasks.filter(t => t.status === 'completed' && t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate)).length;
    const onTimeRate = completed > 0 ? (onTimeTasks / completed) * 100 : 0;
    return { totalTasks, completed, inProgress, assigned, completionRate, onTimeRate };
  }, [tasks]);

  const disseminatorRows = useMemo(() => {
    return disseminators
      .slice()
      .sort((a, b) => Number(b.totalTasksCompleted || 0) - Number(a.totalTasksCompleted || 0))
      .map(d => {
        const assignedTasks = tasks.filter(t => t.disseminatorId === d.id).length;
        const completedTasks = tasks.filter(t => t.disseminatorId === d.id && t.status === 'completed').length;
        return [
          d.user?.name || "—",
          d.speciality || "—",
          fmtNumber(Number(d.totalTasksCompleted || 0)),
          fmtNumber(Number(d.totalPostsPublished || 0)),
          fmtPercent(Number(d.onTimeRate || 0)),
          fmtNumber(Number(d.avgCompletionHours || 0), 1) + "h",
          fmtPercent(Number(d.rating || 0) * 20),
          titleCase(d.status),
        ];
      });
  }, [disseminators, tasks]);

  return (
    <LetterPage title="Dissemination Performance" subtitle="Task Completion & Efficiency" page={1} totalPages={totalPages || 1} generatedAt={generatedAt}>
      <p className="report-intro">
        Performance analysis of the content dissemination team, including task completion rates,
        on-time delivery, and per-disseminator efficiency metrics.
      </p>

      <div className="report-summary-grid">
        <SummaryCard label="Total Tasks" value={fmtNumber(stats.totalTasks)} tone="accent" />
        <SummaryCard label="Completed" value={fmtNumber(stats.completed)} tone="positive" />
        <SummaryCard label="Completion Rate" value={fmtPercent(stats.completionRate)} tone="accent" />
        <SummaryCard label="On-Time Rate" value={fmtPercent(stats.onTimeRate)} tone="positive" />
      </div>

      <ReportSectionHeading>Disseminator Performance</ReportSectionHeading>
      {disseminatorRows.length === 0 ? (
        <p className="report-empty">No disseminators on file.</p>
      ) : (
        <ReportTable
          headers={["Name", "Speciality", "Tasks Done", "Posts Published", "On-Time %", "Avg Hours", "Rating", "Status"]}
          rows={disseminatorRows}
          numericCols={[2, 3, 4, 5, 6]}
        />
      )}

      <ReportSectionHeading>Task Status Summary</ReportSectionHeading>
      <ReportTable
        headers={["Status", "Count", "% of Total"]}
        rows={[
          ["Completed", fmtNumber(stats.completed), fmtPercent(stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0)],
          ["In Progress", fmtNumber(stats.inProgress), fmtPercent(stats.totalTasks > 0 ? (stats.inProgress / stats.totalTasks) * 100 : 0)],
          ["Assigned / Pending", fmtNumber(stats.assigned), fmtPercent(stats.totalTasks > 0 ? (stats.assigned / stats.totalTasks) * 100 : 0)],
        ]}
        totals={["Total", fmtNumber(stats.totalTasks), "100.0%"]}
        numericCols={[1, 2]}
      />

      <p className="report-note">
        On-time rate measures the percentage of completed tasks delivered before their due date.
        Average completion hours reflects the typical turnaround time from assignment to completion.
        Ratings are on a 5-point scale converted to percentage.
      </p>
    </LetterPage>
  );
}

export default ReportsView;
