import { create } from 'zustand'

// Types for the ERP
export type ActiveView = 'dashboard' | 'pipeline' | 'dissemination' | 'calendar' | 'teams' | 'accounts' | 'clients' | 'analytics' | 'automation' | 'archive' | 'settings' | 'inbox' | 'approvals' | 'invoicing' | 'assets' | 'brandKit' | 'influencers'

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
  items: string
  subtotal: number
  tax: number
  total: number
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  client: Client
  campaign: Campaign | null
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
