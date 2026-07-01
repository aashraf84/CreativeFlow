"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useERPStore, type ActiveView, type DashboardData, type Content, type Post, type Team, type SocialAccount, type Campaign, type Client, type AutomationRule, type CalendarEvent, type Approval, type Invoice, type TimeEntry, type Asset, type ERPNotification, type InboxMessage, type Influencer, type BrandKit, type Department, type Employee, type Attendance, type LeaveRequest, type PayrollRun, type JobPosting, type Expense, type Account, type TaxRate, type Product, type Warehouse, type StockMovement, type Vendor, type PurchaseOrder, type ITAsset, type AssetIssuance, type Disseminator, type DisseminationTask, type Conversation, type CommunicationTemplate, type CommunicationContact, type JournalEntry, type InvoiceItem } from "@/lib/store";
import { Sidebar } from "@/components/erp/sidebar";
import { Header } from "@/components/erp/header";
import { DashboardView } from "@/components/erp/dashboard-view";
import { PipelineView } from "@/components/erp/pipeline-view";
import { DisseminationView } from "@/components/erp/dissemination-view";
import { CalendarView } from "@/components/erp/calendar-view";
import { TeamsView } from "@/components/erp/teams-view";
import { AccountsView } from "@/components/erp/accounts-view";
import { ClientsView } from "@/components/erp/clients-view";
import { AnalyticsView } from "@/components/erp/analytics-view";
import { AutomationView } from "@/components/erp/automation-view";
import { ArchiveView } from "@/components/erp/archive-view";
import { SettingsView } from "@/components/erp/settings-view";
import { InboxView } from "@/components/erp/inbox-view";
import { ApprovalsView } from "@/components/erp/approvals-view";
import { InvoicingView } from "@/components/erp/invoicing-view";
import { AssetsView } from "@/components/erp/assets-view";
import { BrandKitView } from "@/components/erp/brand-kit-view";
import { InfluencersView } from "@/components/erp/influencers-view";
import { EmployeesView } from "@/components/erp/employees-view";
import { AttendanceView } from "@/components/erp/attendance-view";
import { PayrollView } from "@/components/erp/payroll-view";
import { RecruitmentView } from "@/components/erp/recruitment-view";
import { ExpensesView } from "@/components/erp/expenses-view";
import { FinanceAccountsView } from "@/components/erp/finance-accounts-view";
import { ProductsView } from "@/components/erp/products-view";
import { PurchaseOrdersView } from "@/components/erp/purchase-orders-view";
import { VendorsView } from "@/components/erp/vendors-view";
import { ITAssetsView } from "@/components/erp/it-assets-view";
import { ReportsView } from "@/components/erp/reports-view";
import { CreateContentModal } from "@/components/erp/create-content-modal";
import { CreatePostModal } from "@/components/erp/create-post-modal";
import { ContentDetailModal } from "@/components/erp/content-detail-modal";
import { AuthScreen } from "@/components/erp/auth-screen";
import { AnimatePresence, motion } from "framer-motion";

const viewComponents: Record<ActiveView, React.ComponentType> = {
  dashboard: DashboardView,
  pipeline: PipelineView,
  dissemination: DisseminationView,
  calendar: CalendarView,
  teams: TeamsView,
  accounts: AccountsView,
  clients: ClientsView,
  analytics: AnalyticsView,
  automation: AutomationView,
  archive: ArchiveView,
  settings: SettingsView,
  inbox: InboxView,
  approvals: ApprovalsView,
  invoicing: InvoicingView,
  assets: AssetsView,
  brandKit: BrandKitView,
  influencers: InfluencersView,
  employees: EmployeesView,
  attendance: AttendanceView,
  payroll: PayrollView,
  recruitment: RecruitmentView,
  expenses: ExpensesView,
  financeAccounts: FinanceAccountsView,
  products: ProductsView,
  purchaseOrders: PurchaseOrdersView,
  vendors: VendorsView,
  itAssets: ITAssetsView,
  reports: ReportsView,
};

// Helper to safely extract data from various API response formats
function extractData(response: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const key of keys) {
    if (response[key] !== undefined) return response[key] as unknown[];
  }
  return [];
}

export default function ERPPage() {
  const {
    setIsLoading, setContents, setPosts, setTeams, setSocialAccounts,
    setCampaigns, setClients, setAutomations, setCalendarEvents, setDashboard,
    setCurrentUser, isLoading, activeView,
    setApprovals, setInvoices, setTimeEntries, setAssets, setNotifications,
    setInboxMessages, setInfluencers, setBrandKits,
    setDepartments, setEmployees, setAttendance, setLeaveRequests, setPayrollRuns, setJobPostings,
    setExpenses, setFinanceAccounts, setTaxRates, setJournalEntries, setInvoiceItems, setProducts, setWarehouses,
    setStockMovements, setVendors, setPurchaseOrders, setItAssets, setAssetIssuances,
    setDisseminators, setDisseminationTasks,
    setConversations, setCommunicationTemplates, setCommunicationContacts,
    authState,
  } = useERPStore();
  const [seeded, setSeeded] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Seed the database first
      if (!seeded) {
        await Promise.race([
          fetch("/api/seed").catch(() => {}),
          new Promise(r => setTimeout(r, 3000)),
        ]);
        setSeeded(true);
      }

      const safeJson = (res: Response) => res.json().catch(() => ({}));

      // Safe fetch with timeout - never throws, returns null on failure
      const safeFetch = async (url: string, timeoutMs = 8000): Promise<Response | null> => {
        try {
          return await Promise.race([
            fetch(url),
            new Promise<Response | null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
          ])
        } catch {
          return null
        }
      }
      const safeJsonFrom = async (res: Response | null) => {
        if (!res) return {}
        return res.json().catch(() => ({}))
      }

      // Load dashboard FIRST so it appears quickly
      try {
        // Use a timeout so the page renders even if the server crashes mid-request
        const dashRes = await Promise.race([
          fetch("/api/dashboard"),
          new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('dashboard timeout')), 12000)),
        ]);
        const dashJson = await safeJson(dashRes);
        // Accept both success and fallback responses (API now returns fallback data on DB failure)
        if (dashJson && !dashJson.error) {
          const dash: DashboardData = {
            totalContent: dashJson.totalContent || 0,
            contentByStage: dashJson.contentByStage || {},
            postsThisWeek: dashJson.postsPublishedThisWeek || 0,
            postsThisMonth: dashJson.postsPublishedThisMonth || 0,
            scheduledPosts: dashJson.scheduledPosts || 0,
            activeCampaigns: dashJson.activeCampaigns || 0,
            totalClients: dashJson.totalClients || 0,
            totalAccounts: dashJson.socialAccountsCount || 0,
            teamProductivity: (dashJson.teamStats || []).map((t: Record<string, unknown>) => ({
              team: t.name as string,
              completed: Object.values(t.contentByStage as Record<string, number> || {}).reduce((a: number, b: number) => a + b, 0),
              pending: (t.contentCount as number || 0),
            })),
            platformBreakdown: (dashJson.platformBreakdown || []).map((p: Record<string, unknown>) => ({
              platform: p.platform as string,
              posts: p.posts as number,
              engagement: p.engagement as number,
            })),
            recentActivity: (dashJson.recentActivity || []).map((a: Record<string, unknown>) => ({
              id: a.id as string,
              action: a.action as string,
              entity: a.entity as string,
              entityId: a.entityId as string || null,
              details: typeof a.details === 'string' ? a.details : JSON.stringify(a.details) || null,
              actor: a.actor as { id: string; name: string; email: string; avatar: string | null; role: string },
              createdAt: a.createdAt as string,
            })),
            contentTrend: [],
            pendingApprovals: dashJson.pendingApprovals || 0,
            totalRevenue: dashJson.totalRevenue || 0,
            paidRevenue: dashJson.paidRevenue || 0,
            outstandingRevenue: dashJson.outstandingRevenue || 0,
            timeTrackedThisWeek: dashJson.timeTrackedThisWeek || 0,
            unreadInbox: dashJson.unreadInbox || 0,
            assetCount: dashJson.assetCount || 0,
          };
          setDashboard(dash);
        }
      } catch { /* ignore dashboard errors */ }
      // ALWAYS stop loading after dashboard attempt so UI renders even on failure
      setIsLoading(false);

      // Load remaining data in small batches of 3 to avoid overwhelming the dev server.
      // The middleware returns empty data instantly (no DB calls), but compiling
      // many routes concurrently can still crash the sandbox.
      const fetchSeq = async (url: string) => {
        const res = await safeFetch(url, 8000)
        return safeJsonFrom(res)
      }

      const allEndpoints = [
        "/api/contents", "/api/posts", "/api/teams",
        "/api/social-accounts", "/api/campaigns", "/api/clients",
        "/api/automation", "/api/calendar", "/api/approvals",
        "/api/invoices", "/api/time-entries", "/api/expenses",
        "/api/assets", "/api/notifications", "/api/inbox",
        "/api/influencers", "/api/brand-kit", "/api/departments",
        "/api/employees", "/api/attendance", "/api/leave-requests",
        "/api/payroll", "/api/job-postings", "/api/accounts",
        "/api/tax-rates", "/api/journal-entries", "/api/products",
        "/api/warehouses", "/api/stock-movements", "/api/vendors",
        "/api/purchase-orders", "/api/it-assets", "/api/asset-issuances",
        "/api/disseminators", "/api/dissemination-tasks",
        "/api/communications/conversations", "/api/communications/templates", "/api/communications/contacts",
      ]

      const allResults: Record<string, unknown>[] = []
      // Process in batches of 3
      for (let i = 0; i < allEndpoints.length; i += 3) {
        const batch = allEndpoints.slice(i, i + 3)
        const batchResults = await Promise.all(batch.map(url => fetchSeq(url).catch(() => ({}))))
        allResults.push(...batchResults)
      }

      const [
        contentsJson, postsJson, teamsJson, accountsJson, campaignsJson, clientsJson,
        automationsJson, calendarJson, approvalsJson, invoicesJson, timeEntriesJson, expensesJson,
        assetsJson, notificationsJson, inboxJson, influencersJson, brandKitJson, departmentsJson,
        employeesJson, attendanceJson, leaveRequestsJson, payrollJson, jobPostingsJson,
        financeAccountsJson, taxRatesJson, journalEntriesJson, productsJson, warehousesJson,
        stockMovementsJson, vendorsJson, purchaseOrdersJson, itAssetsJson, assetIssuancesJson,
        disseminatorsJson, disseminationTasksJson, conversationsJson, commTemplatesJson, commContactsJson,
      ] = allResults

      // Contents
      const contentsData = contentsJson?.contents || contentsJson?.data || (Array.isArray(contentsJson) ? contentsJson : []);
      if (Array.isArray(contentsData)) setContents(contentsData as Content[]);

      // Posts
      const postsData = postsJson?.posts || postsJson?.data || (Array.isArray(postsJson) ? postsJson : []);
      if (Array.isArray(postsData)) setPosts(postsData as Post[]);

      // Teams
      const teamsData = teamsJson?.data || (Array.isArray(teamsJson) ? teamsJson : []);
      if (Array.isArray(teamsData)) setTeams(teamsData as Team[]);

      // Social Accounts
      const accountsData = accountsJson?.accounts || accountsJson?.data || (Array.isArray(accountsJson) ? accountsJson : []);
      if (Array.isArray(accountsData)) setSocialAccounts(accountsData as SocialAccount[]);

      // Campaigns
      const campaignsData = campaignsJson?.data || (Array.isArray(campaignsJson) ? campaignsJson : []);
      if (Array.isArray(campaignsData)) setCampaigns(campaignsData as Campaign[]);

      // Clients
      const clientsData = clientsJson?.data || (Array.isArray(clientsJson) ? clientsJson : []);
      if (Array.isArray(clientsData)) setClients(clientsData as Client[]);

      // Automations
      const autoData = automationsJson?.data || (Array.isArray(automationsJson) ? automationsJson : []);
      if (Array.isArray(autoData)) setAutomations(autoData as AutomationRule[]);

      // Calendar
      const calData = calendarJson?.data || calendarJson?.events || (Array.isArray(calendarJson) ? calendarJson : []);
      if (Array.isArray(calData)) setCalendarEvents(calData as CalendarEvent[]);

      // Approvals
      const approvalsData = approvalsJson?.approvals || (Array.isArray(approvalsJson) ? approvalsJson : []);
      if (Array.isArray(approvalsData)) setApprovals(approvalsData as Approval[]);

      // Invoices
      const invoicesData = invoicesJson?.invoices || (Array.isArray(invoicesJson) ? invoicesJson : []);
      if (Array.isArray(invoicesData)) setInvoices(invoicesData as Invoice[]);

      // Time Entries
      const timeEntriesData = timeEntriesJson?.timeEntries || (Array.isArray(timeEntriesJson) ? timeEntriesJson : []);
      if (Array.isArray(timeEntriesData)) setTimeEntries(timeEntriesData as TimeEntry[]);

      // Assets
      const assetsData = assetsJson?.assets || (Array.isArray(assetsJson) ? assetsJson : []);
      if (Array.isArray(assetsData)) setAssets(assetsData as Asset[]);

      // Notifications
      const notifData = notificationsJson?.notifications || (Array.isArray(notificationsJson) ? notificationsJson : []);
      if (Array.isArray(notifData)) setNotifications(notifData as ERPNotification[]);

      // Inbox Messages
      const inboxData = inboxJson?.messages || (Array.isArray(inboxJson) ? inboxJson : []);
      if (Array.isArray(inboxData)) setInboxMessages(inboxData as InboxMessage[]);

      // Influencers
      const influencersData = influencersJson?.influencers || influencersJson?.data || (Array.isArray(influencersJson) ? influencersJson : []);
      if (Array.isArray(influencersData)) setInfluencers(influencersData as Influencer[]);

      // Brand Kits
      const brandKitData = brandKitJson?.brandKits || (Array.isArray(brandKitJson) ? brandKitJson : []);
      if (Array.isArray(brandKitData)) setBrandKits(brandKitData as BrandKit[]);

      // Departments
      const departmentsData = departmentsJson?.data || (Array.isArray(departmentsJson) ? departmentsJson : []);
      if (Array.isArray(departmentsData)) setDepartments(departmentsData as Department[]);

      // Employees
      const employeesData = employeesJson?.data || (Array.isArray(employeesJson) ? employeesJson : []);
      if (Array.isArray(employeesData)) setEmployees(employeesData as Employee[]);

      // Attendance
      const attendanceData = attendanceJson?.data || (Array.isArray(attendanceJson) ? attendanceJson : []);
      if (Array.isArray(attendanceData)) setAttendance(attendanceData as Attendance[]);

      // Leave Requests
      const leaveRequestsData = leaveRequestsJson?.data || (Array.isArray(leaveRequestsJson) ? leaveRequestsJson : []);
      if (Array.isArray(leaveRequestsData)) setLeaveRequests(leaveRequestsData as LeaveRequest[]);

      // Payroll Runs
      const payrollData = payrollJson?.data || (Array.isArray(payrollJson) ? payrollJson : []);
      if (Array.isArray(payrollData)) setPayrollRuns(payrollData as PayrollRun[]);

      // Job Postings
      const jobPostingsData = jobPostingsJson?.data || (Array.isArray(jobPostingsJson) ? jobPostingsJson : []);
      if (Array.isArray(jobPostingsData)) setJobPostings(jobPostingsData as JobPosting[]);

      // Expenses
      const expensesData = expensesJson?.data || (Array.isArray(expensesJson) ? expensesJson : []);
      if (Array.isArray(expensesData)) setExpenses(expensesData as Expense[]);

      // Finance Accounts
      const financeAccountsData = financeAccountsJson?.data || (Array.isArray(financeAccountsJson) ? financeAccountsJson : []);
      if (Array.isArray(financeAccountsData)) setFinanceAccounts(financeAccountsData as Account[]);

      // Tax Rates
      const taxRatesData = taxRatesJson?.data || (Array.isArray(taxRatesJson) ? taxRatesJson : []);
      if (Array.isArray(taxRatesData)) setTaxRates(taxRatesData as TaxRate[]);

      // Journal Entries
      const journalEntriesData = journalEntriesJson?.data || (Array.isArray(journalEntriesJson) ? journalEntriesJson : []);
      if (Array.isArray(journalEntriesData)) setJournalEntries(journalEntriesData as JournalEntry[]);

      // Invoice Items - extract from invoices
      const allInvoiceItems: InvoiceItem[] = [];
      if (Array.isArray(invoicesData)) {
        for (const inv of invoicesData as Record<string, unknown>[]) {
          if (inv.invoiceItems && Array.isArray(inv.invoiceItems)) {
            allInvoiceItems.push(...(inv.invoiceItems as InvoiceItem[]));
          }
        }
      }
      if (allInvoiceItems.length > 0) setInvoiceItems(allInvoiceItems);

      // Products
      const productsData = productsJson?.data || (Array.isArray(productsJson) ? productsJson : []);
      if (Array.isArray(productsData)) setProducts(productsData as Product[]);

      // Warehouses
      const warehousesData = warehousesJson?.data || (Array.isArray(warehousesJson) ? warehousesJson : []);
      if (Array.isArray(warehousesData)) setWarehouses(warehousesData as Warehouse[]);

      // Stock Movements
      const stockMovementsData = stockMovementsJson?.data || (Array.isArray(stockMovementsJson) ? stockMovementsJson : []);
      if (Array.isArray(stockMovementsData)) setStockMovements(stockMovementsData as StockMovement[]);

      // Vendors
      const vendorsData = vendorsJson?.data || (Array.isArray(vendorsJson) ? vendorsJson : []);
      if (Array.isArray(vendorsData)) setVendors(vendorsData as Vendor[]);

      // Purchase Orders
      const purchaseOrdersData = purchaseOrdersJson?.data || (Array.isArray(purchaseOrdersJson) ? purchaseOrdersJson : []);
      if (Array.isArray(purchaseOrdersData)) setPurchaseOrders(purchaseOrdersData as PurchaseOrder[]);

      // IT Assets
      const itAssetsData = itAssetsJson?.data || (Array.isArray(itAssetsJson) ? itAssetsJson : []);
      if (Array.isArray(itAssetsData)) setItAssets(itAssetsData as ITAsset[]);

      // Asset Issuances
      const assetIssuancesData = assetIssuancesJson?.data || (Array.isArray(assetIssuancesJson) ? assetIssuancesJson : []);
      if (Array.isArray(assetIssuancesData)) setAssetIssuances(assetIssuancesData as AssetIssuance[]);

      // Disseminators
      const disseminatorsData = disseminatorsJson?.disseminators || disseminatorsJson?.data || (Array.isArray(disseminatorsJson) ? disseminatorsJson : []);
      if (Array.isArray(disseminatorsData)) setDisseminators(disseminatorsData as Disseminator[]);

      // Dissemination Tasks
      const disseminationTasksData = disseminationTasksJson?.tasks || disseminationTasksJson?.data || (Array.isArray(disseminationTasksJson) ? disseminationTasksJson : []);
      if (Array.isArray(disseminationTasksData)) setDisseminationTasks(disseminationTasksData as DisseminationTask[]);

      // Conversations
      const conversationsData = conversationsJson?.conversations || conversationsJson?.data || (Array.isArray(conversationsJson) ? conversationsJson : []);
      if (Array.isArray(conversationsData)) setConversations(conversationsData as Conversation[]);

      // Communication Templates
      const commTemplatesData = commTemplatesJson?.templates || commTemplatesJson?.data || (Array.isArray(commTemplatesJson) ? commTemplatesJson : []);
      if (Array.isArray(commTemplatesData)) setCommunicationTemplates(commTemplatesData as CommunicationTemplate[]);

      // Communication Contacts
      const commContactsData = commContactsJson?.contacts || commContactsJson?.data || (Array.isArray(commContactsJson) ? commContactsJson : []);
      if (Array.isArray(commContactsData)) setCommunicationContacts(commContactsData as CommunicationContact[]);

      // Set current user (matches demo data user id so My Tasks shows assigned content)
      setCurrentUser({
        id: "u1",
        email: "sarah@creativeflow.com",
        name: "Sarah Chen",
        avatar: null,
        role: "admin",
        organizationId: "org-1",
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [seeded]);

  useEffect(() => {
    if (authState === 'authenticated') {
      loadData();
    }
  }, [loadData, authState]);

  const ActiveViewComponent = viewComponents[activeView];

  // Show auth screen if not authenticated
  if (authState !== 'authenticated') {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#e8e8ed] via-[#f5f5f7] to-[#e0e0e3] dark:from-[#0c0c0e] dark:via-[#0a0a0c] dark:to-[#08080a] text-[#1d1d1f] dark:text-white antialiased selection:bg-emerald-500/25">
      {/* Subtle ambient color orbs for depth (visible through translucent panels) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-500/6 dark:bg-teal-500/4 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/4 dark:bg-cyan-500/3 blur-[100px]" />
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-black/10 dark:border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-sm text-[#86868b] dark:text-[#aeaeb2] font-medium">Loading CreativeFlow ERP…</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full"
              >
                <ActiveViewComponent />
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
      <CreateContentModal />
      <CreatePostModal />
      <ContentDetailModal />
    </div>
  );
}
