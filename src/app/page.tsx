"use client"

import React, { useEffect, useState, useCallback } from "react";
import { useERPStore, type ActiveView, type DashboardData, type Content, type Post, type Team, type SocialAccount, type Campaign, type Client, type AutomationRule, type CalendarEvent, type Approval, type Invoice, type TimeEntry, type Asset, type ERPNotification, type InboxMessage, type Influencer, type BrandKit, type Department, type Employee, type LeaveRequest, type PayrollRun, type JobPosting, type Expense, type Account, type TaxRate, type Product, type Warehouse, type StockMovement, type Vendor, type PurchaseOrder } from "@/lib/store";
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
import { PayrollView } from "@/components/erp/payroll-view";
import { RecruitmentView } from "@/components/erp/recruitment-view";
import { ExpensesView } from "@/components/erp/expenses-view";
import { FinanceAccountsView } from "@/components/erp/finance-accounts-view";
import { ProductsView } from "@/components/erp/products-view";
import { PurchaseOrdersView } from "@/components/erp/purchase-orders-view";
import { VendorsView } from "@/components/erp/vendors-view";
import { CreateContentModal } from "@/components/erp/create-content-modal";
import { CreatePostModal } from "@/components/erp/create-post-modal";
import { ContentDetailModal } from "@/components/erp/content-detail-modal";
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
  payroll: PayrollView,
  recruitment: RecruitmentView,
  expenses: ExpensesView,
  financeAccounts: FinanceAccountsView,
  products: ProductsView,
  purchaseOrders: PurchaseOrdersView,
  vendors: VendorsView,
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
    setDepartments, setEmployees, setLeaveRequests, setPayrollRuns, setJobPostings,
    setExpenses, setFinanceAccounts, setTaxRates, setProducts, setWarehouses,
    setStockMovements, setVendors, setPurchaseOrders,
  } = useERPStore();
  const [seeded, setSeeded] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Seed the database first
      if (!seeded) {
        await fetch("/api/seed");
        setSeeded(true);
      }

      // Load all data in parallel
      const [
        dashboardRes, contentsRes, postsRes, teamsRes,
        accountsRes, campaignsRes, clientsRes, automationsRes, calendarRes,
        approvalsRes, invoicesRes, timeEntriesRes, assetsRes,
        notificationsRes, inboxRes, influencersRes, brandKitRes,
        departmentsRes, employeesRes, leaveRequestsRes, payrollRes,
        jobPostingsRes, expensesRes, financeAccountsRes, taxRatesRes,
        productsRes, warehousesRes, stockMovementsRes, vendorsRes, purchaseOrdersRes,
      ] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/contents"),
        fetch("/api/posts"),
        fetch("/api/teams"),
        fetch("/api/social-accounts"),
        fetch("/api/campaigns"),
        fetch("/api/clients"),
        fetch("/api/automation"),
        fetch("/api/calendar"),
        fetch("/api/approvals"),
        fetch("/api/invoices"),
        fetch("/api/time-entries"),
        fetch("/api/assets"),
        fetch("/api/notifications"),
        fetch("/api/inbox"),
        fetch("/api/influencers"),
        fetch("/api/brand-kit"),
        fetch("/api/departments"),
        fetch("/api/employees"),
        fetch("/api/leave-requests"),
        fetch("/api/payroll"),
        fetch("/api/job-postings"),
        fetch("/api/expenses"),
        fetch("/api/accounts"),
        fetch("/api/tax-rates"),
        fetch("/api/products"),
        fetch("/api/warehouses"),
        fetch("/api/stock-movements"),
        fetch("/api/vendors"),
        fetch("/api/purchase-orders"),
      ]);

      const [
        dashboardJson, contentsJson, postsJson, teamsJson,
        accountsJson, campaignsJson, clientsJson, automationsJson, calendarJson,
        approvalsJson, invoicesJson, timeEntriesJson, assetsJson,
        notificationsJson, inboxJson, influencersJson, brandKitJson,
        departmentsJson, employeesJson, leaveRequestsJson, payrollJson,
        jobPostingsJson, expensesJson, financeAccountsJson, taxRatesJson,
        productsJson, warehousesJson, stockMovementsJson, vendorsJson, purchaseOrdersJson,
      ] = await Promise.all([
        dashboardRes.json(), contentsRes.json(), postsRes.json(),
        teamsRes.json(), accountsRes.json(), campaignsRes.json(),
        clientsRes.json(), automationsRes.json(),
        calendarRes.json(),
        approvalsRes.json(), invoicesRes.json(), timeEntriesRes.json(),
        assetsRes.json(), notificationsRes.json(), inboxRes.json(),
        influencersRes.json(), brandKitRes.json(),
        departmentsRes.json(), employeesRes.json(), leaveRequestsRes.json(),
        payrollRes.json(), jobPostingsRes.json(), expensesRes.json(),
        financeAccountsRes.json(), taxRatesRes.json(),
        productsRes.json(), warehousesRes.json(), stockMovementsRes.json(),
        vendorsRes.json(), purchaseOrdersRes.json(),
      ]);

      // Dashboard - map API response to store format
      if (dashboardJson && !dashboardJson.error) {
        const dash: DashboardData = {
          totalContent: dashboardJson.totalContent || 0,
          contentByStage: dashboardJson.contentByStage || {},
          postsThisWeek: dashboardJson.postsPublishedThisWeek || 0,
          postsThisMonth: dashboardJson.postsPublishedThisMonth || 0,
          scheduledPosts: dashboardJson.scheduledPosts || 0,
          activeCampaigns: dashboardJson.activeCampaigns || 0,
          totalClients: dashboardJson.totalClients || 0,
          totalAccounts: dashboardJson.socialAccountsCount || 0,
          teamProductivity: (dashboardJson.teamStats || []).map((t: Record<string, unknown>) => ({
            team: t.name as string,
            completed: Object.values(t.contentByStage as Record<string, number> || {}).reduce((a: number, b: number) => a + b, 0),
            pending: (t.contentCount as number || 0),
          })),
          platformBreakdown: [],
          recentActivity: (dashboardJson.recentActivity || []).map((a: Record<string, unknown>) => ({
            id: a.id as string,
            action: a.action as string,
            entity: a.entity as string,
            entityId: a.entityId as string || null,
            details: typeof a.details === 'string' ? a.details : JSON.stringify(a.details) || null,
            actor: a.actor as { id: string; name: string; email: string; avatar: string | null; role: string },
            createdAt: a.createdAt as string,
          })),
          contentTrend: [],
          pendingApprovals: dashboardJson.pendingApprovals || 0,
          totalRevenue: dashboardJson.totalRevenue || 0,
          paidRevenue: dashboardJson.paidRevenue || 0,
          outstandingRevenue: dashboardJson.outstandingRevenue || 0,
          timeTrackedThisWeek: dashboardJson.timeTrackedThisWeek || 0,
          unreadInbox: dashboardJson.unreadInbox || 0,
          assetCount: dashboardJson.assetCount || 0,
        };
        setDashboard(dash);
      }

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
      const influencersData = influencersJson?.influencers || (Array.isArray(influencersJson) ? influencersJson : []);
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

      // Set current user
      setCurrentUser({
        id: "user-admin",
        email: "sarah@vortexdigital.com",
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
    loadData();
  }, [loadData]);

  const ActiveViewComponent = viewComponents[activeView];

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Loading VortexERP...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
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
