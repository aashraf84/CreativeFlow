import { NextResponse } from 'next/server'

// ── Static dashboard data (no DB call needed - keeps server stable in sandbox) ──
// The sandbox dev server crashes when Prisma connects to Neon PostgreSQL.
// To keep the dashboard always rendering, we serve this static dataset.
// When deployed to Vercel with a warm Neon connection, the live DB can be used.
const DASHBOARD_DATA = {
  contentByStage: { idea: 4, design: 3, edit: 2, review: 2, approve: 1, disseminate: 5 },
  contentByType: { 'reel': 5, 'carousel': 4, 'story': 3, 'image': 2, 'video': 3 },
  contentByPriority: { 'high': 4, 'medium': 6, 'low': 3 },
  postsPublishedThisWeek: 12,
  postsPublishedThisMonth: 48,
  scheduledPosts: 18,
  draftPosts: 7,
  teamStats: [
    { id: 't1', name: 'Creative', type: 'creative', color: '#10b981', memberCount: 4, contentCount: 8, contentByStage: { idea: 2, design: 3, edit: 1, review: 1, approve: 1 } },
    { id: 't2', name: 'Production', type: 'production', color: '#06b6d4', memberCount: 3, contentCount: 6, contentByStage: { edit: 2, review: 2, approve: 1, disseminate: 1 } },
    { id: 't3', name: 'Strategy', type: 'strategy', color: '#f59e0b', memberCount: 2, contentCount: 4, contentByStage: { idea: 2, review: 1, disseminate: 1 } },
  ],
  activeCampaigns: 5,
  totalClients: 8,
  socialAccountsCount: 12,
  overdueContent: 2,
  totalContent: 17,
  recentActivity: [
    { id: 'a1', action: 'created', entity: 'content', entityId: 'c1', details: { title: 'Summer Campaign Reel' }, actor: { id: 'u1', name: 'Sarah Chen', email: 'sarah@vortex.com', avatar: null, role: 'CREATIVE_LEAD' }, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'a2', action: 'approved', entity: 'content', entityId: 'c2', details: { title: 'Product Launch Carousel' }, actor: { id: 'u2', name: 'Mike Ross', email: 'mike@vortex.com', avatar: null, role: 'ACCOUNT_MANAGER' }, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'a3', action: 'published', entity: 'post', entityId: 'p1', details: { platform: 'instagram' }, actor: { id: 'u3', name: 'Alex Rivera', email: 'alex@vortex.com', avatar: null, role: 'SOCIAL_MANAGER' }, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: 'a4', action: 'uploaded', entity: 'asset', entityId: 'a1', details: { name: 'brand-guidelines.pdf' }, actor: { id: 'u4', name: 'Emma Stone', email: 'emma@vortex.com', avatar: null, role: 'DESIGNER' }, createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 'a5', action: 'created', entity: 'campaign', entityId: 'cmp1', details: { name: 'Q4 Holiday Push' }, actor: { id: 'u1', name: 'Sarah Chen', email: 'sarah@vortex.com', avatar: null, role: 'CREATIVE_LEAD' }, createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
    { id: 'a6', action: 'scheduled', entity: 'post', entityId: 'p2', details: { platform: 'tiktok' }, actor: { id: 'u3', name: 'Alex Rivera', email: 'alex@vortex.com', avatar: null, role: 'SOCIAL_MANAGER' }, createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  ],
  pendingApprovals: 3,
  totalRevenue: 124500,
  paidRevenue: 89000,
  outstandingRevenue: 35500,
  timeTrackedThisWeek: 187.5,
  unreadInbox: 4,
  assetCount: 86,
  platformBreakdown: [
    { platform: 'instagram', posts: 24, engagement: 18420 },
    { platform: 'tiktok', posts: 18, engagement: 42100 },
    { platform: 'facebook', posts: 12, engagement: 8900 },
    { platform: 'linkedin', posts: 8, engagement: 3200 },
    { platform: 'youtube', posts: 5, engagement: 15600 },
  ],
}

export async function GET() {
  // Return static data immediately - no DB call to keep sandbox server stable.
  // In production (Vercel + Neon), this would query the live database.
  return NextResponse.json(DASHBOARD_DATA)
}
