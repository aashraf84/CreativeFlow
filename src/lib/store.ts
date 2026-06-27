import { create } from 'zustand'

// Types for the ERP
export type ActiveView = 'dashboard' | 'pipeline' | 'dissemination' | 'calendar' | 'teams' | 'accounts' | 'clients' | 'analytics' | 'automation' | 'archive' | 'settings' | 'inbox' | 'approvals' | 'invoicing' | 'assets' | 'brandKit' | 'influencers' | 'employees' | 'payroll' | 'recruitment' | 'expenses' | 'financeAccounts' | 'products' | 'purchaseOrders' | 'vendors' | 'itAssets'

export type ContentStage = 'idea' | 'design' | 'edit' | 'review' | 'approve' | 'disseminate' | 'archived'
export type ContentPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ContentType = 'post' | 'story' | 'reel' | 'carousel' | 'video' | 'graphic' | 'article'
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'snapchat'

export interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  plan: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: string
  organizationId: string
}

export interface Team {
  id: string
  name: string
  type: string
  color: string
  icon: string | null
  description: string | null
  members: TeamMember[]
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: string
  user: User
}

export interface Client {
  id: string
  name: string
  logo: string | null
  industry: string | null
  status: string
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  budget: number | null
  client: Client | null
}

export interface Content {
  id: string
  title: string
  description: string | null
  type: ContentType
  stage: ContentStage
  priority: ContentPriority
  format: string | null
  tags: string | null
  dueDate: string | null
  publishedAt: string | null
  campaignId: string | null
  creatorId: string | null
  assigneeId: string | null
  teamId: string | null
  creator: User | null
  assignee: User | null
  team: Team | null
  campaign: Campaign | null
  posts: Post[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface SocialAccount {
  id: string
  platform: Platform
  accountId: string
  username: string
  displayName: string | null
  avatar: string | null
  followers: number
  isVerified: boolean
  isActive: boolean
  userId: string
  user: User
}

export interface Post {
  id: string
  content: string
  mediaUrls: string | null
  platform: Platform
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  engagement: string | null
  failureReason: string | null
  socialAccountId: string
  contentId: string | null
  socialAccount: SocialAccount
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  description: string | null
  trigger: string
  conditions: string
  actions: string
  isActive: boolean
}

export interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  actor: User
  createdAt: string
}

export interface Comment {
  id: string
  text: string
  userId: string
  contentId: string
  user: User
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'content' | 'post' | 'campaign'
  status: string
  platform?: string
  color: string
}

export interface Approval {
  id: string
  type: string
  status: string
  comment: string | null
  contentId: string | null
  postId: string | null
  requestedById: string
  reviewedById: string | null
  reviewedAt: string | null
  requestedBy: User
  reviewedBy: User | null
  content: Content | null
  post: Post | null
  createdAt: string
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  campaignId: string | null
  status: string
  subtotal: number
  tax: number
  total: number
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  client: Client
  campaign: Campaign | null
  invoiceItems: InvoiceItem[]
  createdAt: string
}

export interface TimeEntry {
  id: string
  description: string
  hours: number
  billable: boolean
  date: string
  userId: string
  clientId: string | null
  campaignId: string | null
  contentId: string | null
  user: User
  client: Client | null
  campaign: Campaign | null
  createdAt: string
}

export interface Asset {
  id: string
  name: string
  type: string
  url: string
  thumbnailUrl: string | null
  size: number
  mimeType: string | null
  tags: string | null
  folder: string | null
  metadata: string | null
  uploadedById: string
  clientId: string | null
  uploadedBy: User
  client: Client | null
  createdAt: string
}

export interface ERPNotification {
  id: string
  title: string
  message: string
  type: string
  category: string
  isRead: boolean
  actionUrl: string | null
  userId: string
  createdAt: string
}

export interface InboxMessage {
  id: string
  platform: Platform
  senderName: string
  senderAvatar: string | null
  content: string
  type: string
  status: string
  postUrl: string | null
  socialAccountId: string
  repliedAt: string | null
  createdAt: string
}

export interface Influencer {
  id: string
  name: string
  username: string
  platform: Platform
  followers: number
  engagementRate: number
  niche: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: string
  rate: number | null
  contractStart: string | null
  contractEnd: string | null
  clientId: string | null
  campaignId: string | null
  client: Client | null
  campaign: Campaign | null
  createdAt: string
}

export interface BrandKit {
  id: string
  name: string
  type: string
  value: string
  clientId: string | null
  client: Client | null
  createdAt: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  color: string
  headId: string | null
  _count?: { employees: number; jobPostings: number }
  createdAt: string
}

export interface Employee {
  id: string
  userId: string | null
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatar: string | null
  position: string
  departmentId: string
  hireDate: string
  status: string
  employmentType: string
  salary: number | null
  salaryCurrency: string
  bankAccount: string | null
  taxId: string | null
  emergencyContact: string | null
  address: string | null
  notes: string | null
  department: Department
  user: User | null
  createdAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string | null
  status: string
  approvedById: string | null
  approvedAt: string | null
  comment: string | null
  employee: Employee
  createdAt: string
}

export interface PayrollItem {
  id: string
  payrollRunId: string
  employeeId: string
  baseSalary: number
  overtime: number
  bonuses: number
  deductions: number
  tax: number
  netPay: number
  employee: Employee
  createdAt: string
}

export interface PayrollRun {
  id: string
  period: string
  status: string
  runDate: string
  totalGross: number
  totalDeductions: number
  totalNet: number
  items: PayrollItem[]
  createdAt: string
}

export interface JobPosting {
  id: string
  title: string
  departmentId: string
  type: string
  location: string | null
  salary_min: number | null
  salary_max: number | null
  description: string
  requirements: string | null
  status: string
  postedDate: string | null
  closingDate: string | null
  applicants: number
  department: Department
  createdAt: string
}

export interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  date: string
  status: string
  receiptUrl: string | null
  submittedById: string
  approvedById: string | null
  approvedAt: string | null
  campaignId: string | null
  clientId: string | null
  submittedBy: User
  createdAt: string
}

export interface Account {
  id: string
  code: string
  name: string
  type: string
  category: string | null
  description: string | null
  normalBalance: string
  parentId: string | null
  balance: number
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
  parent: { id: string; code: string; name: string } | null
  children: { id: string; code: string; name: string; type: string; balance: number }[]
  _count?: { journalLines: number }
}

export interface JournalEntryLine {
  id: string
  journalEntryId: string
  accountId: string
  debit: number
  credit: number
  description: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  account: { id: string; code: string; name: string; type: string }
}

export interface JournalEntry {
  id: string
  number: string
  date: string
  description: string
  reference: string | null
  source: string
  sourceId: string | null
  status: string
  isAdjusting: boolean
  period: string
  totalDebit: number
  totalCredit: number
  organizationId: string
  createdById: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; email: string } | null
  lines: JournalEntryLine[]
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  rate: number
  amount: number
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface TaxRate {
  id: string
  name: string
  rate: number
  type: string
  isActive: boolean
  createdAt: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  location: string | null
  isDefault: boolean
  isActive: boolean
  _count?: { stockLevels: number; stockMovements: number }
  createdAt: string
}

export interface StockLevel {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  reservedQuantity: number
  warehouse: Warehouse
}

export interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: string | null
  unit: string
  unitPrice: number
  costPrice: number
  reorderLevel: number
  imageUrl: string | null
  tags: string | null
  isActive: boolean
  stockLevels: StockLevel[]
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: string
  quantity: number
  reference: string | null
  notes: string | null
  product: Product
  warehouse: Warehouse
  createdAt: string
}

export interface Vendor {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  category: string | null
  rating: number
  isActive: boolean
  _count?: { purchaseOrders: number }
  createdAt: string
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  product: Product
}

export interface PurchaseOrder {
  id: string
  number: string
  vendorId: string
  status: string
  items: string
  subtotal: number
  tax: number
  total: number
  orderDate: string
  expectedDate: string | null
  notes: string | null
  vendor: Vendor
  poItems: PurchaseOrderItem[]
  createdAt: string
}

export interface ITAsset {
  id: string
  assetTag: string
  name: string
  category: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  specifications: string | null
  purchaseDate: string | null
  purchaseCost: number | null
  warrantyExpiry: string | null
  vendor: string | null
  invoiceNumber: string | null
  condition: string
  status: string
  assignedToId: string | null
  location: string | null
  notes: string | null
  imageUrl: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  assignedTo: User | null
  issuances: AssetIssuance[]
  _count?: { issuances: number }
}

export interface Disseminator {
  id: string
  userId: string
  teamId: string | null
  speciality: string | null
  platforms: string | null  // JSON array string
  workloadCapacity: number
  status: string
  rating: number
  totalTasksCompleted: number
  totalPostsPublished: number
  avgCompletionHours: number
  onTimeRate: number
  notes: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string; avatar: string | null; role: string }
  team: { id: string; name: string; type: string; color: string } | null
  _count?: { assignedTasks: number }
}

export interface DisseminationTask {
  id: string
  title: string
  description: string | null
  contentId: string | null
  assigneeId: string | null
  disseminatorId: string | null
  clientId: string | null
  campaignId: string | null
  targetPlatforms: string | null  // JSON array string
  postContent: string | null
  mediaUrls: string | null  // JSON array string
  hashtags: string | null
  scheduledAt: string | null
  dueDate: string | null
  priority: string
  status: string
  startedAt: string | null
  completedAt: string | null
  postId: string | null
  failureReason: string | null
  assignedById: string | null
  assignedAt: string | null
  completionNotes: string | null
  engagement: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  assignee: { id: string; name: string; email: string; avatar: string | null } | null
  disseminator: { id: string; userId: string; speciality: string | null; rating: number } | null
  content: { id: string; title: string; type: string; stage: string } | null
  client: { id: string; name: string; logo: string | null } | null
  campaign: { id: string; name: string; status: string } | null
}

export interface AssetIssuance {
  id: string
  assetId: string
  issuedToId: string
  issuedById: string
  issueDate: string
  expectedReturnDate: string | null
  actualReturnDate: string | null
  returnCondition: string | null
  issueCondition: string | null
  purpose: string | null
  notes: string | null
  status: string
  organizationId: string
  createdAt: string
  updatedAt: string
  asset: ITAsset
  issuedTo: User
  issuedBy: User
}

export interface CommunicationTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  type: string  // email, whatsapp
  category: string | null
  variables: string | null  // JSON array
  isDefault: boolean
  isActive: boolean
  organizationId: string
  createdAt: string
}

export interface Conversation {
  id: string
  subject: string | null
  type: string  // email, whatsapp, mixed
  status: string  // active, archived, closed
  priority: string  // low, normal, high, urgent
  channel: string  // email, whatsapp, manual
  clientId: string | null
  influencerId: string | null
  campaignId: string | null
  assignedToId: string | null
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadCount: number
  tags: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
  client: { id: string; name: string; logo: string | null } | null
  influencer: { id: string; name: string; username: string; platform: string } | null
  assignedTo: { id: string; name: string; email: string; avatar: string | null } | null
  messages: CommunicationMessage[]
}

export interface CommunicationMessage {
  id: string
  conversationId: string
  senderId: string | null
  senderName: string
  senderEmail: string | null
  senderPhone: string | null
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  subject: string | null
  body: string
  htmlBody: string | null
  mediaUrls: string | null  // JSON array
  type: string  // email, whatsapp, note
  direction: string  // inbound, outbound
  status: string  // draft, queued, sent, delivered, read, failed, bounced
  failureReason: string | null
  templateId: string | null
  isStarred: boolean
  isRead: boolean
  readAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  clickedAt: string | null
  repliedAt: string | null
  organizationId: string
  createdAt: string
}

export interface CommunicationContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsappNumber: string | null
  company: string | null
  role: string | null
  avatar: string | null
  notes: string | null
  preferredChannel: string  // email, whatsapp
  lastContactedAt: string | null
  isFavorite: boolean
  tags: string | null
  clientId: string | null
  influencerId: string | null
  organizationId: string
  createdAt: string
}

export interface DashboardData {
  totalContent: number
  contentByStage: Record<ContentStage, number>
  postsThisWeek: number
  postsThisMonth: number
  scheduledPosts: number
  activeCampaigns: number
  totalClients: number
  totalAccounts: number
  teamProductivity: { team: string; completed: number; pending: number }[]
  platformBreakdown: { platform: string; posts: number; engagement: number }[]
  recentActivity: ActivityLog[]
  contentTrend: { date: string; created: number; published: number }[]
  pendingApprovals: number
  totalRevenue: number
  paidRevenue: number
  outstandingRevenue: number
  timeTrackedThisWeek: number
  unreadInbox: number
  assetCount: number
}

interface ERPStore {
  // Navigation
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Data
  dashboard: DashboardData | null
  contents: Content[]
  posts: Post[]
  teams: Team[]
  socialAccounts: SocialAccount[]
  campaigns: Campaign[]
  clients: Client[]
  automations: AutomationRule[]
  calendarEvents: CalendarEvent[]
  activities: ActivityLog[]
  currentUser: User | null
  approvals: Approval[]
  invoices: Invoice[]
  timeEntries: TimeEntry[]
  assets: Asset[]
  notifications: ERPNotification[]
  inboxMessages: InboxMessage[]
  influencers: Influencer[]
  brandKits: BrandKit[]
  departments: Department[]
  employees: Employee[]
  leaveRequests: LeaveRequest[]
  payrollRuns: PayrollRun[]
  jobPostings: JobPosting[]
  expenses: Expense[]
  financeAccounts: Account[]
  taxRates: TaxRate[]
  journalEntries: JournalEntry[]
  invoiceItems: InvoiceItem[]
  products: Product[]
  warehouses: Warehouse[]
  stockMovements: StockMovement[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
  itAssets: ITAsset[]
  assetIssuances: AssetIssuance[]
  disseminators: Disseminator[]
  disseminationTasks: DisseminationTask[]
  conversations: Conversation[]
  communicationTemplates: CommunicationTemplate[]
  communicationContacts: CommunicationContact[]

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Data setters (from API)
  setDashboard: (data: DashboardData) => void
  setContents: (data: Content[]) => void
  setPosts: (data: Post[]) => void
  setTeams: (data: Team[]) => void
  setSocialAccounts: (data: SocialAccount[]) => void
  setCampaigns: (data: Campaign[]) => void
  setClients: (data: Client[]) => void
  setAutomations: (data: AutomationRule[]) => void
  setCalendarEvents: (data: CalendarEvent[]) => void
  setActivities: (data: ActivityLog[]) => void
  setCurrentUser: (user: User) => void
  setApprovals: (data: Approval[]) => void
  setInvoices: (data: Invoice[]) => void
  setTimeEntries: (data: TimeEntry[]) => void
  setAssets: (data: Asset[]) => void
  setNotifications: (data: ERPNotification[]) => void
  setInboxMessages: (data: InboxMessage[]) => void
  setInfluencers: (data: Influencer[]) => void
  setBrandKits: (data: BrandKit[]) => void
  setDepartments: (data: Department[]) => void
  setEmployees: (data: Employee[]) => void
  setLeaveRequests: (data: LeaveRequest[]) => void
  setPayrollRuns: (data: PayrollRun[]) => void
  setJobPostings: (data: JobPosting[]) => void
  setExpenses: (data: Expense[]) => void
  setFinanceAccounts: (data: Account[]) => void
  setTaxRates: (data: TaxRate[]) => void
  setJournalEntries: (data: JournalEntry[]) => void
  setInvoiceItems: (data: InvoiceItem[]) => void
  setProducts: (data: Product[]) => void
  setWarehouses: (data: Warehouse[]) => void
  setStockMovements: (data: StockMovement[]) => void
  setVendors: (data: Vendor[]) => void
  setPurchaseOrders: (data: PurchaseOrder[]) => void
  setItAssets: (data: ITAsset[]) => void
  setAssetIssuances: (data: AssetIssuance[]) => void
  setDisseminators: (data: Disseminator[]) => void
  setDisseminationTasks: (data: DisseminationTask[]) => void
  setConversations: (data: Conversation[]) => void
  setCommunicationTemplates: (data: CommunicationTemplate[]) => void
  setCommunicationContacts: (data: CommunicationContact[]) => void

  // Modals
  showCreateContent: boolean
  setShowCreateContent: (show: boolean) => void
  showCreatePost: boolean
  setShowCreatePost: (show: boolean) => void
  selectedContent: Content | null
  setSelectedContent: (content: Content | null) => void

  // Filters
  pipelineFilter: string
  setPipelineFilter: (filter: string) => void
  disseminationPlatformFilter: string
  setDisseminationPlatformFilter: (filter: string) => void
}

export const useERPStore = create<ERPStore>((set) => ({
  // Navigation
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Data
  dashboard: null,
  contents: [],
  posts: [],
  teams: [],
  socialAccounts: [],
  campaigns: [],
  clients: [],
  automations: [],
  calendarEvents: [],
  activities: [],
  currentUser: null,
  approvals: [],
  invoices: [],
  timeEntries: [],
  assets: [],
  notifications: [],
  inboxMessages: [],
  influencers: [],
  brandKits: [],
  departments: [],
  employees: [],
  leaveRequests: [],
  payrollRuns: [],
  jobPostings: [],
  expenses: [],
  financeAccounts: [],
  taxRates: [],
  journalEntries: [],
  invoiceItems: [],
  products: [],
  warehouses: [],
  stockMovements: [],
  vendors: [],
  purchaseOrders: [],
  itAssets: [],
  assetIssuances: [],
  disseminators: [],
  disseminationTasks: [],
  conversations: [],
  communicationTemplates: [],
  communicationContacts: [],

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Setters
  setDashboard: (data) => set({ dashboard: data }),
  setContents: (data) => set({ contents: data }),
  setPosts: (data) => set({ posts: data }),
  setTeams: (data) => set({ teams: data }),
  setSocialAccounts: (data) => set({ socialAccounts: data }),
  setCampaigns: (data) => set({ campaigns: data }),
  setClients: (data) => set({ clients: data }),
  setAutomations: (data) => set({ automations: data }),
  setCalendarEvents: (data) => set({ calendarEvents: data }),
  setActivities: (data) => set({ activities: data }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setApprovals: (data) => set({ approvals: data }),
  setInvoices: (data) => set({ invoices: data }),
  setTimeEntries: (data) => set({ timeEntries: data }),
  setAssets: (data) => set({ assets: data }),
  setNotifications: (data) => set({ notifications: data }),
  setInboxMessages: (data) => set({ inboxMessages: data }),
  setInfluencers: (data) => set({ influencers: data }),
  setBrandKits: (data) => set({ brandKits: data }),
  setDepartments: (data) => set({ departments: data }),
  setEmployees: (data) => set({ employees: data }),
  setLeaveRequests: (data) => set({ leaveRequests: data }),
  setPayrollRuns: (data) => set({ payrollRuns: data }),
  setJobPostings: (data) => set({ jobPostings: data }),
  setExpenses: (data) => set({ expenses: data }),
  setFinanceAccounts: (data) => set({ financeAccounts: data }),
  setTaxRates: (data) => set({ taxRates: data }),
  setJournalEntries: (data) => set({ journalEntries: data }),
  setInvoiceItems: (data) => set({ invoiceItems: data }),
  setProducts: (data) => set({ products: data }),
  setWarehouses: (data) => set({ warehouses: data }),
  setStockMovements: (data) => set({ stockMovements: data }),
  setVendors: (data) => set({ vendors: data }),
  setPurchaseOrders: (data) => set({ purchaseOrders: data }),
  setItAssets: (data) => set({ itAssets: data }),
  setAssetIssuances: (data) => set({ assetIssuances: data }),
  setDisseminators: (data) => set({ disseminators: data }),
  setDisseminationTasks: (data) => set({ disseminationTasks: data }),
  setConversations: (data) => set({ conversations: data }),
  setCommunicationTemplates: (data) => set({ communicationTemplates: data }),
  setCommunicationContacts: (data) => set({ communicationContacts: data }),

  // Modals
  showCreateContent: false,
  setShowCreateContent: (show) => set({ showCreateContent: show }),
  showCreatePost: false,
  setShowCreatePost: (show) => set({ showCreatePost: show }),
  selectedContent: null,
  setSelectedContent: (content) => set({ selectedContent: content }),

  // Filters
  pipelineFilter: 'all',
  setPipelineFilter: (filter) => set({ pipelineFilter: filter }),
  disseminationPlatformFilter: 'all',
  setDisseminationPlatformFilter: (filter) => set({ disseminationPlatformFilter: filter }),
}))
