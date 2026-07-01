// ── Comprehensive Demo Data for CreativeFlow ERP ───────────────────────────
// Served by proxy.ts when the database is unreachable (sandbox mode).
// Every module gets realistic data so the full workflow is visible.

const now = new Date()
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString()
const future = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000).toISOString()

// ── Shared entities ─────────────────────────────────────────────────
const users = [
  { id: 'u1', email: 'sarah@creativeflow.com', name: 'Sarah Chen', avatar: null, role: 'admin', organizationId: 'org-1' },
  { id: 'u2', email: 'mike@creativeflow.com', name: 'Mike Ross', avatar: null, role: 'manager', organizationId: 'org-1' },
  { id: 'u3', email: 'alex@creativeflow.com', name: 'Alex Rivera', avatar: null, role: 'disseminator', organizationId: 'org-1' },
  { id: 'u4', email: 'emma@creativeflow.com', name: 'Emma Stone', avatar: null, role: 'designer', organizationId: 'org-1' },
  { id: 'u5', email: 'james@creativeflow.com', name: 'James Wilson', avatar: null, role: 'editor', organizationId: 'org-1' },
  { id: 'u6', email: 'lisa@creativeflow.com', name: 'Lisa Park', avatar: null, role: 'creative_lead', organizationId: 'org-1' },
  { id: 'u7', email: 'david@creativeflow.com', name: 'David Kim', avatar: null, role: 'reviewer', organizationId: 'org-1' },
  { id: 'u8', email: 'rachel@creativeflow.com', name: 'Rachel Green', avatar: null, role: 'approver', organizationId: 'org-1' },
]

// ── User Accounts (login credentials) ───────────────────────────────
// Each employee has a login account with username/password and role-based permissions.
// Roles: admin, creative_lead, designer, editor, reviewer, approver, disseminator, manager
const userAccounts = [
  { id: 'ua1', userId: 'u1', username: 'sarah', password: 'CreativeFlow@2024', role: 'admin', email: 'sarah@creativeflow.com', name: 'Sarah Chen', isActive: true, organizationId: 'org-1' },
  { id: 'ua2', userId: 'u2', username: 'mike', password: 'CreativeFlow@2024', role: 'manager', email: 'mike@creativeflow.com', name: 'Mike Ross', isActive: true, organizationId: 'org-1' },
  { id: 'ua3', userId: 'u3', username: 'alex', password: 'CreativeFlow@2024', role: 'disseminator', email: 'alex@creativeflow.com', name: 'Alex Rivera', isActive: true, organizationId: 'org-1' },
  { id: 'ua4', userId: 'u4', username: 'emma', password: 'CreativeFlow@2024', role: 'designer', email: 'emma@creativeflow.com', name: 'Emma Stone', isActive: true, organizationId: 'org-1' },
  { id: 'ua5', userId: 'u5', username: 'james', password: 'CreativeFlow@2024', role: 'editor', email: 'james@creativeflow.com', name: 'James Wilson', isActive: true, organizationId: 'org-1' },
  { id: 'ua6', userId: 'u6', username: 'lisa', password: 'CreativeFlow@2024', role: 'creative_lead', email: 'lisa@creativeflow.com', name: 'Lisa Park', isActive: true, organizationId: 'org-1' },
  { id: 'ua7', userId: 'u7', username: 'david', password: 'CreativeFlow@2024', role: 'reviewer', email: 'david@creativeflow.com', name: 'David Kim', isActive: true, organizationId: 'org-1' },
  { id: 'ua8', userId: 'u8', username: 'rachel', password: 'CreativeFlow@2024', role: 'approver', email: 'rachel@creativeflow.com', name: 'Rachel Green', isActive: true, organizationId: 'org-1' },
]

const clients = [
  { id: 'cl1', name: 'TechCorp', logo: null, industry: 'Technology', status: 'active' },
  { id: 'cl2', name: 'FashionHub', logo: null, industry: 'Fashion', status: 'active' },
  { id: 'cl3', name: 'AutoDrive', logo: null, industry: 'Automotive', status: 'active' },
  { id: 'cl4', name: 'GreenLife', logo: null, industry: 'Wellness', status: 'active' },
  { id: 'cl5', name: 'FoodieApp', logo: null, industry: 'Food & Beverage', status: 'active' },
  { id: 'cl6', name: 'TravelQuest', logo: null, industry: 'Travel', status: 'inactive' },
]

const campaigns = [
  { id: 'cmp1', name: 'Summer Launch 2025', description: 'Product launch campaign for summer collection', status: 'active', startDate: iso(30), endDate: future(60), budget: 50000, client: clients[0] },
  { id: 'cmp2', name: 'Brand Refresh', description: 'Complete brand identity refresh', status: 'active', startDate: iso(15), endDate: future(45), budget: 35000, client: clients[1] },
  { id: 'cmp3', name: 'Holiday Push', description: 'Q4 holiday season campaign', status: 'active', startDate: iso(7), endDate: future(90), budget: 75000, client: clients[2] },
  { id: 'cmp4', name: 'Product Showcase', description: 'Featured product highlights', status: 'active', startDate: iso(20), endDate: future(30), budget: 25000, client: clients[3] },
  { id: 'cmp5', name: 'Q4 Growth Drive', description: 'End-of-year growth campaign', status: 'planning', startDate: future(10), endDate: future(100), budget: 60000, client: clients[4] },
]

const teams = [
  { id: 't1', name: 'Creative', type: 'creative', color: '#10b981', icon: null, description: 'Content creation and design team' },
  { id: 't2', name: 'Production', type: 'production', color: '#06b6d4', icon: null, description: 'Video production and editing' },
  { id: 't3', name: 'Strategy', type: 'strategy', color: '#f59e0b', icon: null, description: 'Campaign strategy and planning' },
  { id: 't4', name: 'Distribution', type: 'distribution', color: '#8b5cf6', icon: null, description: 'Social media distribution team' },
]

const socialAccounts = [
  { id: 'sa1', platform: 'instagram', accountId: 'ig_techcorp', username: '@techcorp', displayName: 'TechCorp', avatar: null, followers: 125000, isVerified: true, isActive: true, userId: 'u3', user: users[2] },
  { id: 'sa2', platform: 'tiktok', accountId: 'tt_fashionhub', username: '@fashionhub', displayName: 'FashionHub', avatar: null, followers: 89000, isVerified: true, isActive: true, userId: 'u3', user: users[2] },
  { id: 'sa3', platform: 'facebook', accountId: 'fb_autodrive', username: 'AutoDrive', displayName: 'AutoDrive Official', avatar: null, followers: 67000, isVerified: false, isActive: true, userId: 'u3', user: users[2] },
  { id: 'sa4', platform: 'twitter', accountId: 'tw_greenlife', username: '@greenlife', displayName: 'GreenLife', avatar: null, followers: 45000, isVerified: true, isActive: true, userId: 'u3', user: users[2] },
  { id: 'sa5', platform: 'youtube', accountId: 'yt_foodieapp', username: 'FoodieApp', displayName: 'FoodieApp Channel', avatar: null, followers: 210000, isVerified: true, isActive: true, userId: 'u3', user: users[2] },
  { id: 'sa6', platform: 'linkedin', accountId: 'li_creativeflow', username: 'CreativeFlow Digital', displayName: 'CreativeFlow Digital', avatar: null, followers: 12000, isVerified: false, isActive: true, userId: 'u3', user: users[2] },
]

// ── Content ─────────────────────────────────────────────────────────
const contents = [
  { id: 'c1', title: 'Summer Campaign Reel', description: '30-second Instagram reel for summer launch', type: 'reel', stage: 'idea', priority: 'high', format: '9:16', tags: 'summer,launch,reel', dueDate: future(7), publishedAt: null, campaignId: 'cmp1', creatorId: 'u1', assigneeId: 'u4', teamId: 't1', creator: users[0], assignee: users[3], team: teams[0], campaign: campaigns[0], posts: [], comments: [], createdAt: iso(3), updatedAt: iso(1) },
  { id: 'c2', title: 'Product Launch Carousel', description: '5-slide Instagram carousel highlighting features', type: 'carousel', stage: 'design', priority: 'medium', format: '1:1', tags: 'product,carousel,features', dueDate: future(10), publishedAt: null, campaignId: 'cmp1', creatorId: 'u1', assigneeId: 'u4', teamId: 't1', creator: users[0], assignee: users[3], team: teams[0], campaign: campaigns[0], posts: [], comments: [], createdAt: iso(5), updatedAt: iso(2) },
  { id: 'c3', title: 'Brand Story Video', description: '60-second brand story video for YouTube', type: 'video', stage: 'edit', priority: 'high', format: '16:9', tags: 'brand,story,video', dueDate: future(5), publishedAt: null, campaignId: 'cmp2', creatorId: 'u2', assigneeId: 'u5', teamId: 't2', creator: users[1], assignee: users[4], team: teams[1], campaign: campaigns[1], posts: [], comments: [], createdAt: iso(8), updatedAt: iso(1) },
  { id: 'c4', title: 'Holiday Sale Announcement', description: 'Facebook post announcing holiday sale', type: 'post', stage: 'review', priority: 'urgent', format: '1:1', tags: 'holiday,sale,announcement', dueDate: future(2), publishedAt: null, campaignId: 'cmp3', creatorId: 'u6', assigneeId: 'u5', teamId: 't3', creator: users[5], assignee: users[4], team: teams[2], campaign: campaigns[2], posts: [], comments: [], createdAt: iso(4), updatedAt: iso(1) },
  { id: 'c5', title: 'Product Showcase Reel', description: 'TikTok reel showcasing product features', type: 'reel', stage: 'approve', priority: 'medium', format: '9:16', tags: 'product,showcase,tiktok', dueDate: future(3), publishedAt: null, campaignId: 'cmp4', creatorId: 'u1', assigneeId: 'u4', teamId: 't1', creator: users[0], assignee: users[3], team: teams[0], campaign: campaigns[3], posts: [], comments: [], createdAt: iso(6), updatedAt: iso(1) },
  { id: 'c6', title: 'Wellness Tips Infographic', description: 'Infographic with wellness tips', type: 'graphic', stage: 'disseminate', priority: 'low', format: '4:5', tags: 'wellness,tips,infographic', dueDate: iso(1), publishedAt: iso(1), campaignId: 'cmp4', creatorId: 'u6', assigneeId: 'u3', teamId: 't4', creator: users[5], assignee: users[2], team: teams[3], campaign: campaigns[3], posts: [], comments: [], createdAt: iso(10), updatedAt: iso(1) },
  { id: 'c7', title: 'Food Recipe Story', description: 'Instagram story with quick recipe', type: 'story', stage: 'idea', priority: 'medium', format: '9:16', tags: 'food,recipe,story', dueDate: future(14), publishedAt: null, campaignId: 'cmp5', creatorId: 'u2', assigneeId: 'u4', teamId: 't1', creator: users[1], assignee: users[3], team: teams[0], campaign: campaigns[4], posts: [], comments: [], createdAt: iso(2), updatedAt: iso(2) },
  { id: 'c8', title: 'Travel Destination Reel', description: 'Cinematic travel destination reel', type: 'reel', stage: 'design', priority: 'high', format: '9:16', tags: 'travel,destination,reel', dueDate: future(8), publishedAt: null, campaignId: 'cmp5', creatorId: 'u1', assigneeId: 'u5', teamId: 't2', creator: users[0], assignee: users[4], team: teams[1], campaign: campaigns[4], posts: [], comments: [], createdAt: iso(4), updatedAt: iso(1) },
]

// ── Posts ───────────────────────────────────────────────────────────
const posts = [
  { id: 'p1', content: '☀️ Summer is here! Check out our new collection. #SummerLaunch', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1']), platform: 'instagram', status: 'published', scheduledAt: null, publishedAt: iso(2), engagement: JSON.stringify({ likes: 3420, comments: 156, shares: 89 }), failureReason: null, socialAccountId: 'sa1', contentId: 'c1', socialAccount: socialAccounts[0], createdAt: iso(3) },
  { id: 'p2', content: 'New product drop! Swipe to see more →', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-2']), platform: 'instagram', status: 'published', scheduledAt: null, publishedAt: iso(1), engagement: JSON.stringify({ likes: 2890, comments: 234, shares: 145 }), failureReason: null, socialAccountId: 'sa1', contentId: 'c2', socialAccount: socialAccounts[0], createdAt: iso(4) },
  { id: 'p3', content: 'Behind the scenes of our brand story 🎬', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-3']), platform: 'youtube', status: 'published', scheduledAt: null, publishedAt: iso(5), engagement: JSON.stringify({ views: 15400, likes: 1200, comments: 89 }), failureReason: null, socialAccountId: 'sa5', contentId: 'c3', socialAccount: socialAccounts[4], createdAt: iso(8) },
  { id: 'p4', content: '🎬 Quick recipe for you! #FoodieApp', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-4']), platform: 'tiktok', status: 'published', scheduledAt: null, publishedAt: iso(3), engagement: JSON.stringify({ views: 45000, likes: 3200, comments: 445 }), failureReason: null, socialAccountId: 'sa2', contentId: 'c7', socialAccount: socialAccounts[1], createdAt: iso(5) },
  { id: 'p5', content: 'Holiday sale starts now! 50% off everything 🎄', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-5']), platform: 'facebook', status: 'scheduled', scheduledAt: future(2), publishedAt: null, engagement: null, failureReason: null, socialAccountId: 'sa3', contentId: 'c4', socialAccount: socialAccounts[2], createdAt: iso(2) },
  { id: 'p6', content: 'Wellness tip: Stay hydrated! 💧', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-6']), platform: 'twitter', status: 'scheduled', scheduledAt: future(1), publishedAt: null, engagement: null, failureReason: null, socialAccountId: 'sa4', contentId: 'c6', socialAccount: socialAccounts[3], createdAt: iso(1) },
  { id: 'p7', content: 'Product showcase coming soon... 👀', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-7']), platform: 'instagram', status: 'draft', scheduledAt: null, publishedAt: null, engagement: null, failureReason: null, socialAccountId: 'sa1', contentId: 'c5', socialAccount: socialAccounts[0], createdAt: iso(1) },
  { id: 'p8', content: 'Share your favorite travel destination! ✈️', mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-8']), platform: 'instagram', status: 'published', scheduledAt: null, publishedAt: iso(7), engagement: JSON.stringify({ likes: 5600, comments: 320, shares: 210 }), failureReason: null, socialAccountId: 'sa1', contentId: 'c8', socialAccount: socialAccounts[0], createdAt: iso(10) },
]

// ── Team Members ────────────────────────────────────────────────────
const teamMembers = [
  { id: 'tm1', userId: 'u1', teamId: 't1', role: 'lead', user: users[0] },
  { id: 'tm2', userId: 'u4', teamId: 't1', role: 'member', user: users[3] },
  { id: 'tm3', userId: 'u2', teamId: 't2', role: 'lead', user: users[1] },
  { id: 'tm4', userId: 'u5', teamId: 't2', role: 'member', user: users[4] },
  { id: 'tm5', userId: 'u6', teamId: 't3', role: 'lead', user: users[5] },
  { id: 'tm6', userId: 'u3', teamId: 't4', role: 'lead', user: users[2] },
]

const teamsWithMembers = teams.map(t => ({
  ...t,
  members: teamMembers.filter(m => m.teamId === t.id),
}))

// ── Approvals ───────────────────────────────────────────────────────
const approvals = [
  { id: 'ap1', type: 'content', status: 'pending', comment: null, contentId: 'c4', postId: null, requestedById: 'u6', reviewedById: null, reviewedAt: null, requestedBy: users[5], reviewedBy: null, content: contents[3], post: null, createdAt: iso(2) },
  { id: 'ap2', type: 'content', status: 'pending', comment: null, contentId: 'c5', postId: null, requestedById: 'u4', reviewedById: null, reviewedAt: null, requestedBy: users[3], reviewedBy: null, content: contents[4], post: null, createdAt: iso(1) },
  { id: 'ap3', type: 'post', status: 'approved', comment: 'Looks great, go ahead!', contentId: null, postId: 'p1', requestedById: 'u3', reviewedById: 'u1', reviewedAt: iso(3), requestedBy: users[2], reviewedBy: users[0], content: null, post: posts[0], createdAt: iso(4) },
  { id: 'ap4', type: 'content', status: 'rejected', comment: 'Need more brand alignment', contentId: 'c1', postId: null, requestedById: 'u4', reviewedById: 'u1', reviewedAt: iso(2), requestedBy: users[3], reviewedBy: users[0], content: contents[0], post: null, createdAt: iso(5) },
  { id: 'ap5', type: 'post', status: 'pending', comment: null, contentId: null, postId: 'p5', requestedById: 'u3', reviewedById: null, reviewedAt: null, requestedBy: users[2], reviewedBy: null, content: null, post: posts[4], createdAt: iso(1) },
]

// ── Invoices ────────────────────────────────────────────────────────
const invoices = [
  { id: 'inv1', number: 'INV-2025-001', clientId: 'cl1', campaignId: 'cmp1', status: 'paid', subtotal: 15000, tax: 1500, total: 16500, dueDate: iso(10), paidAt: iso(8), notes: 'Monthly retainer', client: clients[0], campaign: campaigns[0], invoiceItems: [{ id: 'ii1', invoiceId: 'inv1', description: 'Social media management', quantity: 1, rate: 10000, amount: 10000, organizationId: 'org-1', createdAt: iso(20), updatedAt: iso(20) }, { id: 'ii2', invoiceId: 'inv1', description: 'Content creation (5 reels)', quantity: 5, rate: 1000, amount: 5000, organizationId: 'org-1', createdAt: iso(20), updatedAt: iso(20) }], createdAt: iso(20) },
  { id: 'inv2', number: 'INV-2025-002', clientId: 'cl2', campaignId: 'cmp2', status: 'sent', subtotal: 22000, tax: 2200, total: 24200, dueDate: future(15), paidAt: null, notes: 'Brand refresh project', client: clients[1], campaign: campaigns[1], invoiceItems: [{ id: 'ii3', invoiceId: 'inv2', description: 'Brand strategy', quantity: 1, rate: 12000, amount: 12000, organizationId: 'org-1', createdAt: iso(15), updatedAt: iso(15) }, { id: 'ii4', invoiceId: 'inv2', description: 'Design assets', quantity: 1, rate: 10000, amount: 10000, organizationId: 'org-1', createdAt: iso(15), updatedAt: iso(15) }], createdAt: iso(15) },
  { id: 'inv3', number: 'INV-2025-003', clientId: 'cl3', campaignId: 'cmp3', status: 'overdue', subtotal: 35000, tax: 3500, total: 38500, dueDate: iso(10), paidAt: null, notes: 'Holiday campaign', client: clients[2], campaign: campaigns[2], invoiceItems: [{ id: 'ii5', invoiceId: 'inv3', description: 'Campaign management', quantity: 1, rate: 20000, amount: 20000, organizationId: 'org-1', createdAt: iso(25), updatedAt: iso(25) }, { id: 'ii6', invoiceId: 'inv3', description: 'Video production', quantity: 3, rate: 5000, amount: 15000, organizationId: 'org-1', createdAt: iso(25), updatedAt: iso(25) }], createdAt: iso(25) },
  { id: 'inv4', number: 'INV-2025-004', clientId: 'cl4', campaignId: 'cmp4', status: 'draft', subtotal: 8000, tax: 800, total: 8800, dueDate: future(30), paidAt: null, notes: null, client: clients[3], campaign: campaigns[3], invoiceItems: [{ id: 'ii7', invoiceId: 'inv4', description: 'Content creation', quantity: 8, rate: 1000, amount: 8000, organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5) }], createdAt: iso(5) },
  { id: 'inv5', number: 'INV-2025-005', clientId: 'cl5', campaignId: 'cmp5', status: 'paid', subtotal: 18000, tax: 1800, total: 19800, dueDate: iso(20), paidAt: iso(18), notes: 'Q4 growth campaign', client: clients[4], campaign: campaigns[4], invoiceItems: [{ id: 'ii8', invoiceId: 'inv5', description: 'Strategy consulting', quantity: 1, rate: 8000, amount: 8000, organizationId: 'org-1', createdAt: iso(30), updatedAt: iso(30) }, { id: 'ii9', invoiceId: 'inv5', description: 'Social ads management', quantity: 1, rate: 10000, amount: 10000, organizationId: 'org-1', createdAt: iso(30), updatedAt: iso(30) }], createdAt: iso(30) },
]

// ── Time Entries ────────────────────────────────────────────────────
const timeEntries = [
  { id: 'te1', description: 'Designing summer campaign reel', hours: 4.5, billable: true, date: iso(1), userId: 'u4', clientId: 'cl1', campaignId: 'cmp1', contentId: 'c1', user: users[3], client: clients[0], campaign: campaigns[0], createdAt: iso(1) },
  { id: 'te2', description: 'Editing brand story video', hours: 6, billable: true, date: iso(2), userId: 'u5', clientId: 'cl2', campaignId: 'cmp2', contentId: 'c3', user: users[4], client: clients[1], campaign: campaigns[1], createdAt: iso(2) },
  { id: 'te3', description: 'Strategy meeting with client', hours: 2, billable: true, date: iso(3), userId: 'u6', clientId: 'cl3', campaignId: 'cmp3', contentId: null, user: users[5], client: clients[2], campaign: campaigns[2], createdAt: iso(3) },
  { id: 'te4', description: 'Creating carousel graphics', hours: 3.5, billable: true, date: iso(1), userId: 'u4', clientId: 'cl1', campaignId: 'cmp1', contentId: 'c2', user: users[3], client: clients[0], campaign: campaigns[0], createdAt: iso(1) },
  { id: 'te5', description: 'Internal team meeting', hours: 1, billable: false, date: iso(2), userId: 'u1', clientId: null, campaignId: null, contentId: null, user: users[0], client: null, campaign: null, createdAt: iso(2) },
  { id: 'te6', description: 'Scheduling social posts', hours: 2.5, billable: true, date: iso(1), userId: 'u3', clientId: 'cl4', campaignId: 'cmp4', contentId: 'c6', user: users[2], client: clients[3], campaign: campaigns[3], createdAt: iso(1) },
]

// ── Expenses ────────────────────────────────────────────────────────
const expenses = [
  { id: 'ex1', title: 'Adobe Creative Cloud', description: 'Monthly subscription', amount: 79.99, category: 'Software', date: iso(5), status: 'approved', receiptUrl: null, submittedById: 'u4', approvedById: 'u1', approvedAt: iso(4), campaignId: null, clientId: null, submittedBy: users[3], createdAt: iso(5) },
  { id: 'ex2', title: 'Stock Footage License', description: 'Video footage for brand story', amount: 250, category: 'Production', date: iso(3), status: 'approved', receiptUrl: null, submittedById: 'u5', approvedById: 'u1', approvedAt: iso(2), campaignId: 'cmp2', clientId: 'cl2', submittedBy: users[4], createdAt: iso(3) },
  { id: 'ex3', title: 'Social Ads Budget', description: 'Facebook ad spend for holiday campaign', amount: 5000, category: 'Advertising', date: iso(2), status: 'pending', receiptUrl: null, submittedById: 'u3', approvedById: null, approvedAt: null, campaignId: 'cmp3', clientId: 'cl3', submittedBy: users[2], createdAt: iso(2) },
  { id: 'ex4', title: 'Client Lunch Meeting', description: 'Lunch with TechCorp team', amount: 85.50, category: 'Meals', date: iso(4), status: 'approved', receiptUrl: null, submittedById: 'u1', approvedById: 'u2', approvedAt: iso(3), campaignId: null, clientId: 'cl1', submittedBy: users[0], createdAt: iso(4) },
  { id: 'ex5', title: 'Travel - Client Visit', description: 'Travel to FashionHub office', amount: 120, category: 'Travel', date: iso(6), status: 'rejected', receiptUrl: null, submittedById: 'u6', approvedById: 'u1', approvedAt: iso(5), campaignId: 'cmp2', clientId: 'cl2', submittedBy: users[5], createdAt: iso(6) },
  { id: 'ex6', title: 'Canva Pro Subscription', description: 'Annual subscription for design team', amount: 119.99, category: 'Software', date: iso(1), status: 'pending', receiptUrl: null, submittedById: 'u4', approvedById: null, approvedAt: null, campaignId: null, clientId: null, submittedBy: users[3], createdAt: iso(1) },
]

// ── Assets ──────────────────────────────────────────────────────────
const assets = [
  { id: 'a1', name: 'summer-reel-final.mp4', type: 'video', url: 'https://cdn.creativeflow.com/assets/summer-reel-final.mp4', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/summer-reel.jpg', size: 45000000, mimeType: 'video/mp4', tags: 'summer,reel,video', folder: 'Summer Campaign', metadata: JSON.stringify({ duration: '30s', resolution: '1080x1920' }), uploadedById: 'u4', clientId: 'cl1', uploadedBy: users[3], client: clients[0], createdAt: iso(3) },
  { id: 'a2', name: 'brand-story-v2.mp4', type: 'video', url: 'https://cdn.creativeflow.com/assets/brand-story-v2.mp4', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/brand-story.jpg', size: 120000000, mimeType: 'video/mp4', tags: 'brand,story,video', folder: 'Brand Refresh', metadata: JSON.stringify({ duration: '60s', resolution: '1920x1080' }), uploadedById: 'u5', clientId: 'cl2', uploadedBy: users[4], client: clients[1], createdAt: iso(5) },
  { id: 'a3', name: 'carousel-design-01.png', type: 'image', url: 'https://cdn.creativeflow.com/assets/carousel-01.png', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/carousel-01.jpg', size: 2400000, mimeType: 'image/png', tags: 'carousel,design', folder: 'Summer Campaign', metadata: JSON.stringify({ dimensions: '1080x1080' }), uploadedById: 'u4', clientId: 'cl1', uploadedBy: users[3], client: clients[0], createdAt: iso(2) },
  { id: 'a4', name: 'brand-guidelines.pdf', type: 'document', url: 'https://cdn.creativeflow.com/assets/brand-guidelines.pdf', thumbnailUrl: null, size: 8500000, mimeType: 'application/pdf', tags: 'brand,guidelines', folder: 'Brand Assets', metadata: null, uploadedById: 'u4', clientId: null, uploadedBy: users[3], client: null, createdAt: iso(10) },
  { id: 'a5', name: 'holiday-sale-banner.jpg', type: 'image', url: 'https://cdn.creativeflow.com/assets/holiday-banner.jpg', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/holiday-banner.jpg', size: 1800000, mimeType: 'image/jpeg', tags: 'holiday,banner', folder: 'Holiday Campaign', metadata: JSON.stringify({ dimensions: '1200x628' }), uploadedById: 'u4', clientId: 'cl3', uploadedBy: users[3], client: clients[2], createdAt: iso(4) },
  { id: 'a6', name: 'product-showcase.mp4', type: 'video', url: 'https://cdn.creativeflow.com/assets/product-showcase.mp4', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/product-showcase.jpg', size: 67000000, mimeType: 'video/mp4', tags: 'product,showcase', folder: 'Product Showcase', metadata: JSON.stringify({ duration: '45s', resolution: '1080x1920' }), uploadedById: 'u5', clientId: 'cl4', uploadedBy: users[4], client: clients[3], createdAt: iso(6) },
  { id: 'a7', name: 'wellness-infographic.png', type: 'image', url: 'https://cdn.creativeflow.com/assets/wellness-infographic.png', thumbnailUrl: 'https://cdn.creativeflow.com/thumbs/wellness.jpg', size: 3200000, mimeType: 'image/png', tags: 'wellness,infographic', folder: 'Wellness Campaign', metadata: JSON.stringify({ dimensions: '1080x1350' }), uploadedById: 'u4', clientId: 'cl4', uploadedBy: users[3], client: clients[3], createdAt: iso(8) },
  { id: 'a8', name: 'social-template-reel.psd', type: 'template', url: 'https://cdn.creativeflow.com/assets/reel-template.psd', thumbnailUrl: null, size: 15000000, mimeType: 'image/vnd.adobe.photoshop', tags: 'template,reel,psd', folder: 'Templates', metadata: null, uploadedById: 'u4', clientId: null, uploadedBy: users[3], client: null, createdAt: iso(15) },
]

// ── Notifications ───────────────────────────────────────────────────
const notifications = [
  { id: 'n1', title: 'New Approval Request', message: 'Lisa Park requested approval for "Holiday Sale Announcement"', type: 'approval', category: 'approval', isRead: false, actionUrl: '/approvals', userId: 'u1', createdAt: iso(1) },
  { id: 'n2', title: 'Invoice Overdue', message: 'Invoice INV-2025-003 for AutoDrive is overdue by 10 days', type: 'warning', category: 'invoice', isRead: false, actionUrl: '/invoicing', userId: 'u1', createdAt: iso(2) },
  { id: 'n3', title: 'Content Published', message: 'Your post "Summer Campaign Reel" was published on Instagram', type: 'success', category: 'post', isRead: true, actionUrl: '/content', userId: 'u3', createdAt: iso(3) },
  { id: 'n4', title: 'New Comment', message: 'Sarah Chen commented on "Product Launch Carousel"', type: 'mention', category: 'content', isRead: false, actionUrl: '/content', userId: 'u4', createdAt: iso(1) },
  { id: 'n5', title: 'System Update', message: 'CreativeFlow ERP v2.5 has been deployed with new features', type: 'info', category: 'system', isRead: true, actionUrl: null, userId: 'u1', createdAt: iso(5) },
  { id: 'n6', title: 'Expense Approved', message: 'Your expense "Adobe Creative Cloud" has been approved', type: 'success', category: 'expense', isRead: false, actionUrl: '/expenses', userId: 'u4', createdAt: iso(1) },
]

// ── Inbox Messages ──────────────────────────────────────────────────
const inboxMessages = [
  { id: 'im1', platform: 'instagram', senderName: 'tech_fan_2025', senderAvatar: null, content: 'Love the new summer reel! 🔥 When does the collection drop?', type: 'comment', status: 'unread', postUrl: 'https://instagram.com/p/abc123', socialAccountId: 'sa1', repliedAt: null, createdAt: iso(1) },
  { id: 'im2', platform: 'instagram', senderName: 'fashion_lover', senderAvatar: null, content: 'Can you share the carousel template?', type: 'comment', status: 'unread', postUrl: 'https://instagram.com/p/def456', socialAccountId: 'sa1', repliedAt: null, createdAt: iso(2) },
  { id: 'im3', platform: 'tiktok', senderName: 'foodie_addict', senderAvatar: null, content: 'This recipe is amazing! 😍', type: 'comment', status: 'read', postUrl: 'https://tiktok.com/@foodieapp/video/123', socialAccountId: 'sa2', repliedAt: iso(3), createdAt: iso(3) },
  { id: 'im4', platform: 'facebook', senderName: 'John Smith', senderAvatar: null, content: 'When does the holiday sale start?', type: 'message', status: 'unread', postUrl: null, socialAccountId: 'sa3', repliedAt: null, createdAt: iso(1) },
  { id: 'im5', platform: 'twitter', senderName: '@wellness_guru', senderAvatar: null, content: 'Great tips! Sharing with my followers.', type: 'comment', status: 'read', postUrl: 'https://twitter.com/greenlife/status/123', socialAccountId: 'sa4', repliedAt: iso(2), createdAt: iso(2) },
  { id: 'im6', platform: 'youtube', senderName: 'Subscriber123', senderAvatar: null, content: 'The production quality is incredible!', type: 'comment', status: 'unread', postUrl: 'https://youtube.com/watch?v=abc', socialAccountId: 'sa5', repliedAt: null, createdAt: iso(1) },
  { id: 'im7', platform: 'instagram', senderName: 'travel_bug', senderAvatar: null, content: 'Where is this destination? 😍', type: 'comment', status: 'read', postUrl: 'https://instagram.com/p/ghi789', socialAccountId: 'sa1', repliedAt: iso(5), createdAt: iso(5) },
  { id: 'im8', platform: 'instagram', senderName: 'brand_collab', senderAvatar: null, content: 'Hi! We would love to collaborate. DM sent!', type: 'message', status: 'unread', postUrl: null, socialAccountId: 'sa1', repliedAt: null, createdAt: iso(1) },
]

// ── Influencers ─────────────────────────────────────────────────────
const influencers = [
  { id: 'inf1', name: 'StyleMaven', username: '@stylemaven', platform: 'instagram', followers: 450000, engagementRate: 4.5, niche: 'Fashion & Lifestyle', email: 'style@maven.com', phone: '+1-555-0101', notes: 'Great for fashion campaigns, high engagement', status: 'active', rate: 5000, contractStart: iso(30), contractEnd: future(60), clientId: 'cl2', campaignId: 'cmp2', client: clients[1], campaign: campaigns[1], createdAt: iso(30) },
  { id: 'inf2', name: 'TechGuru Dan', username: '@techgurudan', platform: 'youtube', followers: 850000, engagementRate: 3.8, niche: 'Technology Reviews', email: 'dan@techguru.com', phone: '+1-555-0102', notes: 'Excellent for tech product launches', status: 'active', rate: 12000, contractStart: iso(20), contractEnd: future(40), clientId: 'cl1', campaignId: 'cmp1', client: clients[0], campaign: campaigns[0], createdAt: iso(20) },
  { id: 'inf3', name: 'FoodieExplorer', username: '@foodieexplorer', platform: 'tiktok', followers: 620000, engagementRate: 6.2, niche: 'Food & Cooking', email: 'hello@foodieexplorer.com', phone: '+1-555-0103', notes: 'Viral food content creator', status: 'active', rate: 3500, contractStart: iso(15), contractEnd: future(45), clientId: 'cl5', campaignId: 'cmp5', client: clients[4], campaign: campaigns[4], createdAt: iso(15) },
  { id: 'inf4', name: 'EcoDriver Sam', username: '@ecodriver', platform: 'instagram', followers: 280000, engagementRate: 5.1, niche: 'Automotive & Sustainability', email: 'sam@ecodriver.com', phone: '+1-555-0104', notes: 'Perfect for auto + eco campaigns', status: 'active', rate: 4500, contractStart: iso(10), contractEnd: future(50), clientId: 'cl3', campaignId: 'cmp3', client: clients[2], campaign: campaigns[2], createdAt: iso(10) },
  { id: 'inf5', name: 'WellnessWithMia', username: '@wellnesswithmia', platform: 'instagram', followers: 520000, engagementRate: 4.8, niche: 'Health & Wellness', email: 'mia@wellness.com', phone: '+1-555-0105', notes: 'Wellness expert with loyal following', status: 'prospect', rate: 6000, contractStart: null, contractEnd: null, clientId: 'cl4', campaignId: 'cmp4', client: clients[3], campaign: campaigns[3], createdAt: iso(5) },
  { id: 'inf6', name: 'TravelWithJen', username: '@travelwithjen', platform: 'youtube', followers: 980000, engagementRate: 3.5, niche: 'Travel & Adventure', email: 'jen@travelwithjen.com', phone: '+1-555-0106', notes: 'Cinematic travel content', status: 'inactive', rate: 8000, contractStart: iso(60), contractEnd: iso(5), clientId: 'cl6', campaignId: null, client: clients[5], campaign: null, createdAt: iso(60) },
]

// ── Brand Kit ───────────────────────────────────────────────────────
const brandKits = [
  { id: 'bk1', name: 'Primary Green', type: 'color', value: '#34c759', clientId: null, client: null, createdAt: iso(30) },
  { id: 'bk2', name: 'Secondary Teal', type: 'color', value: '#30d158', clientId: null, client: null, createdAt: iso(30) },
  { id: 'bk3', name: 'TechCorp Blue', type: 'color', value: '#0a84ff', clientId: 'cl1', client: clients[0], createdAt: iso(25) },
  { id: 'bk4', name: 'Primary Font', type: 'font', value: 'SF Pro Display', clientId: null, client: null, createdAt: iso(30) },
  { id: 'bk5', name: 'Logo URL', type: 'logo', value: 'https://cdn.creativeflow.com/brands/creativeflow-logo.svg', clientId: null, client: null, createdAt: iso(30) },
  { id: 'bk6', name: 'Brand Voice', type: 'voice', value: 'Professional, innovative, approachable', clientId: null, client: null, createdAt: iso(30) },
]

// ── Departments ─────────────────────────────────────────────────────
const departments = [
  { id: 'd1', name: 'Creative', description: 'Content creation and design', color: '#10b981', headId: 'u1', _count: { employees: 3, jobPostings: 1 }, createdAt: iso(60) },
  { id: 'd2', name: 'Production', description: 'Video production and editing', color: '#06b6d4', headId: 'u2', _count: { employees: 2, jobPostings: 1 }, createdAt: iso(60) },
  { id: 'd3', name: 'Strategy', description: 'Campaign strategy and planning', color: '#f59e0b', headId: 'u6', _count: { employees: 2, jobPostings: 0 }, createdAt: iso(60) },
  { id: 'd4', name: 'Operations', description: 'Business operations and admin', color: '#8b5cf6', headId: 'u2', _count: { employees: 2, jobPostings: 1 }, createdAt: iso(60) },
]

// ── Employees ───────────────────────────────────────────────────────
const employees = [
  { id: 'e1', userId: 'u1', employeeId: 'EMP-001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@creativeflow.com', phone: '+1-555-1001', avatar: null, position: 'Creative Director', departmentId: 'd1', hireDate: iso(365), status: 'active', employmentType: 'full-time', salary: 95000, salaryCurrency: 'USD', bankAccount: '****1234', taxId: 'TX-001', emergencyContact: '+1-555-9001', address: '123 Main St, San Francisco, CA', notes: 'Leads creative team', department: departments[0], user: users[0], createdAt: iso(365) },
  { id: 'e2', userId: 'u2', employeeId: 'EMP-002', firstName: 'Mike', lastName: 'Ross', email: 'mike@creativeflow.com', phone: '+1-555-1002', avatar: null, position: 'Production Manager', departmentId: 'd2', hireDate: iso(300), status: 'active', employmentType: 'full-time', salary: 85000, salaryCurrency: 'USD', bankAccount: '****2345', taxId: 'TX-002', emergencyContact: '+1-555-9002', address: '456 Oak Ave, San Francisco, CA', notes: null, department: departments[1], user: users[1], createdAt: iso(300) },
  { id: 'e3', userId: 'u3', employeeId: 'EMP-003', firstName: 'Alex', lastName: 'Rivera', email: 'alex@creativeflow.com', phone: '+1-555-1003', avatar: null, position: 'Social Media Manager', departmentId: 'd1', hireDate: iso(250), status: 'active', employmentType: 'full-time', salary: 72000, salaryCurrency: 'USD', bankAccount: '****3456', taxId: 'TX-003', emergencyContact: '+1-555-9003', address: '789 Pine St, San Francisco, CA', notes: null, department: departments[0], user: users[2], createdAt: iso(250) },
  { id: 'e4', userId: 'u4', employeeId: 'EMP-004', firstName: 'Emma', lastName: 'Stone', email: 'emma@creativeflow.com', phone: '+1-555-1004', avatar: null, position: 'Senior Designer', departmentId: 'd1', hireDate: iso(200), status: 'active', employmentType: 'full-time', salary: 78000, salaryCurrency: 'USD', bankAccount: '****4567', taxId: 'TX-004', emergencyContact: '+1-555-9004', address: '321 Elm St, San Francisco, CA', notes: null, department: departments[0], user: users[3], createdAt: iso(200) },
  { id: 'e5', userId: 'u5', employeeId: 'EMP-005', firstName: 'James', lastName: 'Wilson', email: 'james@creativeflow.com', phone: '+1-555-1005', avatar: null, position: 'Video Editor', departmentId: 'd2', hireDate: iso(180), status: 'active', employmentType: 'full-time', salary: 68000, salaryCurrency: 'USD', bankAccount: '****5678', taxId: 'TX-005', emergencyContact: '+1-555-9005', address: '654 Cedar St, San Francisco, CA', notes: null, department: departments[1], user: users[4], createdAt: iso(180) },
  { id: 'e6', userId: 'u6', employeeId: 'EMP-006', firstName: 'Lisa', lastName: 'Park', email: 'lisa@creativeflow.com', phone: '+1-555-1006', avatar: null, position: 'Strategist', departmentId: 'd3', hireDate: iso(150), status: 'active', employmentType: 'full-time', salary: 82000, salaryCurrency: 'USD', bankAccount: '****6789', taxId: 'TX-006', emergencyContact: '+1-555-9006', address: '987 Birch St, San Francisco, CA', notes: null, department: departments[2], user: users[5], createdAt: iso(150) },
  { id: 'e7', userId: null, employeeId: 'EMP-007', firstName: 'David', lastName: 'Kim', email: 'david@creativeflow.com', phone: '+1-555-1007', avatar: null, position: 'Junior Designer', departmentId: 'd1', hireDate: iso(90), status: 'active', employmentType: 'full-time', salary: 52000, salaryCurrency: 'USD', bankAccount: '****7890', taxId: 'TX-007', emergencyContact: '+1-555-9007', address: '147 Maple St, San Francisco, CA', notes: null, department: departments[0], user: null, createdAt: iso(90) },
  { id: 'e8', userId: null, employeeId: 'EMP-008', firstName: 'Rachel', lastName: 'Green', email: 'rachel@creativeflow.com', phone: '+1-555-1008', avatar: null, position: 'HR Coordinator', departmentId: 'd4', hireDate: iso(120), status: 'on-leave', employmentType: 'full-time', salary: 58000, salaryCurrency: 'USD', bankAccount: '****8901', taxId: 'TX-008', emergencyContact: '+1-555-9008', address: '258 Spruce St, San Francisco, CA', notes: 'On maternity leave', department: departments[3], user: null, createdAt: iso(120) },
]

// ── Attendance ──────────────────────────────────────────────────────
const attendance = [
  { id: 'att1', employeeId: 'e1', date: iso(0), clockIn: iso(0) + 'T09:00:00Z', clockOut: null, status: 'present', workHours: null, notes: null, organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[0] },
  { id: 'att2', employeeId: 'e2', date: iso(0), clockIn: new Date(now.getTime() - 8 * 3600000).toISOString(), clockOut: new Date(now.getTime() - 0.5 * 3600000).toISOString(), status: 'present', workHours: 7.5, notes: null, organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[1] },
  { id: 'att3', employeeId: 'e3', date: iso(0), clockIn: new Date(now.getTime() - 7 * 3600000).toISOString(), clockOut: null, status: 'present', workHours: null, notes: null, organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[2] },
  { id: 'att4', employeeId: 'e4', date: iso(0), clockIn: null, clockOut: null, status: 'remote', workHours: null, notes: 'Working from home', organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[3] },
  { id: 'att5', employeeId: 'e5', date: iso(0), clockIn: new Date(now.getTime() - 6 * 3600000).toISOString(), clockOut: null, status: 'present', workHours: null, notes: null, organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[4] },
  { id: 'att6', employeeId: 'e6', date: iso(0), clockIn: null, clockOut: null, status: 'absent', workHours: null, notes: 'Sick leave', organizationId: 'org-1', createdAt: iso(0), updatedAt: iso(0), employee: employees[5] },
  { id: 'att7', employeeId: 'e7', date: iso(1), clockIn: iso(1) + 'T09:15:00Z', clockOut: iso(1) + 'T17:45:00Z', status: 'present', workHours: 8, notes: 'Late by 15 min', organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), employee: employees[6] },
  { id: 'att8', employeeId: 'e8', date: iso(1), clockIn: null, clockOut: null, status: 'leave', workHours: null, notes: 'Maternity leave', organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), employee: employees[7] },
]

// ── Leave Requests ──────────────────────────────────────────────────
const leaveRequests = [
  { id: 'lr1', employeeId: 'e6', type: 'sick', startDate: iso(0), endDate: iso(0), days: 1, reason: 'Flu symptoms', status: 'approved', approvedById: 'u1', approvedAt: iso(1), comment: 'Get well soon!', employee: employees[5], createdAt: iso(2) },
  { id: 'lr2', employeeId: 'e3', type: 'vacation', startDate: future(10), endDate: future(15), days: 5, reason: 'Family vacation', status: 'pending', approvedById: null, approvedAt: null, comment: null, employee: employees[2], createdAt: iso(1) },
  { id: 'lr3', employeeId: 'e4', type: 'personal', startDate: future(3), endDate: future(3), days: 1, reason: 'Personal appointment', status: 'approved', approvedById: 'u1', approvedAt: iso(1), comment: 'Approved', employee: employees[3], createdAt: iso(3) },
  { id: 'lr4', employeeId: 'e7', type: 'vacation', startDate: future(20), endDate: future(27), days: 7, reason: 'Annual leave', status: 'pending', approvedById: null, approvedAt: null, comment: null, employee: employees[6], createdAt: iso(2) },
  { id: 'lr5', employeeId: 'e8', type: 'maternity', startDate: iso(30), endDate: future(90), days: 120, reason: 'Maternity leave', status: 'approved', approvedById: 'u1', approvedAt: iso(35), comment: 'Congratulations!', employee: employees[7], createdAt: iso(40) },
]

// ── Payroll ─────────────────────────────────────────────────────────
const payrollRuns = [
  { id: 'pr1', period: 'June 2025', status: 'completed', runDate: iso(5), totalGross: 487000, totalDeductions: 121750, totalNet: 365250, items: [
    { id: 'pi1', payrollRunId: 'pr1', employeeId: 'e1', baseSalary: 95000, overtime: 0, bonuses: 2000, deductions: 23750, tax: 9500, netPay: 63750, employee: employees[0], createdAt: iso(5) },
    { id: 'pi2', payrollRunId: 'pr1', employeeId: 'e2', baseSalary: 85000, overtime: 0, bonuses: 0, deductions: 21250, tax: 8500, netPay: 55250, employee: employees[1], createdAt: iso(5) },
    { id: 'pi3', payrollRunId: 'pr1', employeeId: 'e3', baseSalary: 72000, overtime: 1000, bonuses: 0, deductions: 18000, tax: 7200, netPay: 47800, employee: employees[2], createdAt: iso(5) },
  ], createdAt: iso(5) },
  { id: 'pr2', period: 'May 2025', status: 'completed', runDate: iso(35), totalGross: 475000, totalDeductions: 118750, totalNet: 356250, items: [
    { id: 'pi4', payrollRunId: 'pr2', employeeId: 'e1', baseSalary: 95000, overtime: 0, bonuses: 0, deductions: 23750, tax: 9500, netPay: 61750, employee: employees[0], createdAt: iso(35) },
    { id: 'pi5', payrollRunId: 'pr2', employeeId: 'e2', baseSalary: 85000, overtime: 0, bonuses: 1000, deductions: 21250, tax: 8500, netPay: 56250, employee: employees[1], createdAt: iso(35) },
  ], createdAt: iso(35) },
  { id: 'pr3', period: 'July 2025', status: 'draft', runDate: future(5), totalGross: 0, totalDeductions: 0, totalNet: 0, items: [], createdAt: iso(1) },
]

// ── Job Postings ────────────────────────────────────────────────────
const jobPostings = [
  { id: 'jp1', title: 'Senior Content Creator', departmentId: 'd1', type: 'full-time', location: 'San Francisco, CA', salary_min: 70000, salary_max: 90000, description: 'We are looking for a creative content creator to join our team.', requirements: '3+ years experience in social media content creation', status: 'open', postedDate: iso(10), closingDate: future(20), applicants: 24, department: departments[0], createdAt: iso(10) },
  { id: 'jp2', title: 'Video Editor', departmentId: 'd2', type: 'full-time', location: 'San Francisco, CA', salary_min: 60000, salary_max: 75000, description: 'Join our production team as a video editor.', requirements: 'Proficiency in Premiere Pro and After Effects', status: 'open', postedDate: iso(7), closingDate: future(23), applicants: 18, department: departments[1], createdAt: iso(7) },
  { id: 'jp3', title: 'Social Media Intern', departmentId: 'd1', type: 'internship', location: 'Remote', salary_min: 25000, salary_max: 35000, description: 'Summer internship opportunity for social media enthusiasts.', requirements: 'Currently enrolled in college, passion for social media', status: 'open', postedDate: iso(5), closingDate: future(25), applicants: 45, department: departments[0], createdAt: iso(5) },
  { id: 'jp4', title: 'HR Coordinator', departmentId: 'd4', type: 'full-time', location: 'San Francisco, CA', salary_min: 55000, salary_max: 65000, description: 'Manage HR operations and employee relations.', requirements: '2+ years HR experience, SHRM certification preferred', status: 'closed', postedDate: iso(30), closingDate: iso(1), applicants: 32, department: departments[3], createdAt: iso(30) },
  { id: 'jp5', title: 'Campaign Strategist', departmentId: 'd3', type: 'contract', location: 'San Francisco, CA', salary_min: 80000, salary_max: 100000, description: 'Lead campaign strategy for high-profile clients.', requirements: '5+ years agency experience', status: 'open', postedDate: iso(3), closingDate: future(27), applicants: 12, department: departments[2], createdAt: iso(3) },
]

// ── Finance Accounts ────────────────────────────────────────────────
const financeAccounts = [
  { id: 'fa1', code: '1000', name: 'Cash', type: 'asset', category: 'Current Assets', description: 'Cash on hand', normalBalance: 'debit', parentId: null, balance: 125000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(1), parent: null, children: [], _count: { journalLines: 15 } },
  { id: 'fa2', code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets', description: 'Money owed by clients', normalBalance: 'debit', parentId: null, balance: 25500, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(1), parent: null, children: [], _count: { journalLines: 22 } },
  { id: 'fa3', code: '1200', name: 'Equipment', type: 'asset', category: 'Fixed Assets', description: 'Office equipment', normalBalance: 'debit', parentId: null, balance: 45000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(30), parent: null, children: [], _count: { journalLines: 5 } },
  { id: 'fa4', code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities', description: 'Money owed to vendors', normalBalance: 'credit', parentId: null, balance: 32000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(2), parent: null, children: [], _count: { journalLines: 18 } },
  { id: 'fa5', code: '2100', name: 'Accrued Expenses', type: 'liability', category: 'Current Liabilities', description: 'Accrued operating expenses', normalBalance: 'credit', parentId: null, balance: 15500, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(5), parent: null, children: [], _count: { journalLines: 8 } },
  { id: 'fa6', code: '3000', name: 'Owner\'s Equity', type: 'equity', category: 'Equity', description: 'Owner capital', normalBalance: 'credit', parentId: null, balance: 100000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(60), parent: null, children: [], _count: { journalLines: 2 } },
  { id: 'fa7', code: '4000', name: 'Service Revenue', type: 'revenue', category: 'Operating Revenue', description: 'Revenue from services', normalBalance: 'credit', parentId: null, balance: 285000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(1), parent: null, children: [], _count: { journalLines: 35 } },
  { id: 'fa8', code: '5000', name: 'Salaries Expense', type: 'expense', category: 'Operating Expenses', description: 'Employee salaries', normalBalance: 'debit', parentId: null, balance: 180000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(5), parent: null, children: [], _count: { journalLines: 12 } },
  { id: 'fa9', code: '5100', name: 'Software Expense', type: 'expense', category: 'Operating Expenses', description: 'Software subscriptions', normalBalance: 'debit', parentId: null, balance: 12000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(10), parent: null, children: [], _count: { journalLines: 6 } },
  { id: 'fa10', code: '5200', name: 'Advertising Expense', type: 'expense', category: 'Operating Expenses', description: 'Ad spend for clients', normalBalance: 'debit', parentId: null, balance: 45000, isActive: true, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(3), parent: null, children: [], _count: { journalLines: 9 } },
]

// ── Journal Entries ─────────────────────────────────────────────────
const journalEntries = [
  { id: 'je1', number: 'JE-001', date: iso(5), description: 'Record service revenue', reference: 'INV-2025-001', source: 'invoice', sourceId: 'inv1', status: 'posted', isAdjusting: false, period: '2025-06', totalDebit: 16500, totalCredit: 16500, organizationId: 'org-1', createdById: 'u1', createdAt: iso(5), updatedAt: iso(5), createdBy: { id: 'u1', name: 'Sarah Chen', email: 'sarah@creativeflow.com' }, lines: [
    { id: 'jel1', journalEntryId: 'je1', accountId: 'fa1', debit: 16500, credit: 0, description: 'Cash received', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5), account: { id: 'fa1', code: '1000', name: 'Cash', type: 'asset' } },
    { id: 'jel2', journalEntryId: 'je1', accountId: 'fa7', debit: 0, credit: 16500, description: 'Service revenue', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5), account: { id: 'fa7', code: '4000', name: 'Service Revenue', type: 'revenue' } },
  ] },
  { id: 'je2', number: 'JE-002', date: iso(5), description: 'Payroll for June 2025', reference: 'PR-001', source: 'payroll', sourceId: 'pr1', status: 'posted', isAdjusting: false, period: '2025-06', totalDebit: 487000, totalCredit: 487000, organizationId: 'org-1', createdById: 'u1', createdAt: iso(5), updatedAt: iso(5), createdBy: { id: 'u1', name: 'Sarah Chen', email: 'sarah@creativeflow.com' }, lines: [
    { id: 'jel3', journalEntryId: 'je2', accountId: 'fa8', debit: 365250, credit: 0, description: 'Net payroll', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5), account: { id: 'fa8', code: '5000', name: 'Salaries Expense', type: 'expense' } },
    { id: 'jel4', journalEntryId: 'je2', accountId: 'fa5', debit: 121750, credit: 0, description: 'Payroll deductions', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5), account: { id: 'fa5', code: '2100', name: 'Accrued Expenses', type: 'liability' } },
    { id: 'jel5', journalEntryId: 'je2', accountId: 'fa1', debit: 0, credit: 487000, description: 'Cash paid', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(5), account: { id: 'fa1', code: '1000', name: 'Cash', type: 'asset' } },
  ] },
  { id: 'je3', number: 'JE-003', date: iso(10), description: 'Software subscription payment', reference: 'EXP-001', source: 'expense', sourceId: 'ex1', status: 'posted', isAdjusting: false, period: '2025-06', totalDebit: 79.99, totalCredit: 79.99, organizationId: 'org-1', createdById: 'u4', createdAt: iso(10), updatedAt: iso(10), createdBy: { id: 'u4', name: 'Emma Stone', email: 'emma@creativeflow.com' }, lines: [
    { id: 'jel6', journalEntryId: 'je3', accountId: 'fa9', debit: 79.99, credit: 0, description: 'Adobe CC', organizationId: 'org-1', createdAt: iso(10), updatedAt: iso(10), account: { id: 'fa9', code: '5100', name: 'Software Expense', type: 'expense' } },
    { id: 'jel7', journalEntryId: 'je3', accountId: 'fa1', debit: 0, credit: 79.99, description: 'Cash paid', organizationId: 'org-1', createdAt: iso(10), updatedAt: iso(10), account: { id: 'fa1', code: '1000', name: 'Cash', type: 'asset' } },
  ] },
  { id: 'je4', number: 'JE-004', date: iso(3), description: 'Advertising expense for holiday campaign', reference: 'EXP-003', source: 'expense', sourceId: 'ex3', status: 'draft', isAdjusting: false, period: '2025-06', totalDebit: 5000, totalCredit: 5000, organizationId: 'org-1', createdById: 'u3', createdAt: iso(3), updatedAt: iso(3), createdBy: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com' }, lines: [
    { id: 'jel8', journalEntryId: 'je4', accountId: 'fa10', debit: 5000, credit: 0, description: 'Facebook ads', organizationId: 'org-1', createdAt: iso(3), updatedAt: iso(3), account: { id: 'fa10', code: '5200', name: 'Advertising Expense', type: 'expense' } },
    { id: 'jel9', journalEntryId: 'je4', accountId: 'fa4', debit: 0, credit: 5000, description: 'Payable', organizationId: 'org-1', createdAt: iso(3), updatedAt: iso(3), account: { id: 'fa4', code: '2000', name: 'Accounts Payable', type: 'liability' } },
  ] },
  { id: 'je5', number: 'JE-005', date: iso(1), description: 'Equipment purchase', reference: 'EQ-001', source: 'manual', sourceId: null, status: 'posted', isAdjusting: false, period: '2025-06', totalDebit: 12000, totalCredit: 12000, organizationId: 'org-1', createdById: 'u1', createdAt: iso(1), updatedAt: iso(1), createdBy: { id: 'u1', name: 'Sarah Chen', email: 'sarah@creativeflow.com' }, lines: [
    { id: 'jel10', journalEntryId: 'je5', accountId: 'fa3', debit: 12000, credit: 0, description: 'New iMac', organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), account: { id: 'fa3', code: '1200', name: 'Equipment', type: 'asset' } },
    { id: 'jel11', journalEntryId: 'je5', accountId: 'fa1', debit: 0, credit: 12000, description: 'Cash paid', organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), account: { id: 'fa1', code: '1000', name: 'Cash', type: 'asset' } },
  ] },
]

// ── Tax Rates ───────────────────────────────────────────────────────
const taxRates = [
  { id: 'tr1', name: 'Sales Tax', rate: 10, type: 'percentage', isActive: true, createdAt: iso(60) },
  { id: 'tr2', name: 'VAT', rate: 15, type: 'percentage', isActive: true, createdAt: iso(60) },
  { id: 'tr3', name: 'Service Tax', rate: 5, type: 'percentage', isActive: true, createdAt: iso(60) },
  { id: 'tr4', name: 'Withholding Tax', rate: 3, type: 'percentage', isActive: false, createdAt: iso(60) },
]

// ── Warehouses ──────────────────────────────────────────────────────
const warehouses = [
  { id: 'wh1', name: 'Main Warehouse', code: 'WH-MAIN', location: 'San Francisco, CA', isDefault: true, isActive: true, _count: { stockLevels: 6, stockMovements: 8 }, createdAt: iso(60) },
  { id: 'wh2', name: 'East Coast', code: 'WH-EAST', location: 'New York, NY', isDefault: false, isActive: true, _count: { stockLevels: 4, stockMovements: 3 }, createdAt: iso(60) },
  { id: 'wh3', name: 'Archive Storage', code: 'WH-ARCH', location: 'Offline', isDefault: false, isActive: false, _count: { stockLevels: 0, stockMovements: 0 }, createdAt: iso(60) },
]

// ── Products ────────────────────────────────────────────────────────
const products = [
  { id: 'pr1', name: 'Branded T-Shirt', sku: 'TSHIRT-001', description: 'Cotton t-shirt with CreativeFlow logo', category: 'Apparel', unit: 'pcs', unitPrice: 25, costPrice: 12, reorderLevel: 50, imageUrl: null, tags: 'apparel,branded', isActive: true, stockLevels: [{ id: 'sl1', productId: 'pr1', warehouseId: 'wh1', quantity: 150, reservedQuantity: 10, warehouse: warehouses[0] }, { id: 'sl2', productId: 'pr1', warehouseId: 'wh2', quantity: 80, reservedQuantity: 5, warehouse: warehouses[1] }], createdAt: iso(60) },
  { id: 'pr2', name: 'Branded Mug', sku: 'MUG-001', description: 'Ceramic mug with logo', category: 'Merchandise', unit: 'pcs', unitPrice: 15, costPrice: 6, reorderLevel: 30, imageUrl: null, tags: 'merchandise,branded', isActive: true, stockLevels: [{ id: 'sl3', productId: 'pr2', warehouseId: 'wh1', quantity: 45, reservedQuantity: 0, warehouse: warehouses[0] }], createdAt: iso(60) },
  { id: 'pr3', name: 'Branded Notebook', sku: 'NB-001', description: 'Leather-bound notebook', category: 'Stationery', unit: 'pcs', unitPrice: 35, costPrice: 18, reorderLevel: 20, imageUrl: null, tags: 'stationery,branded', isActive: true, stockLevels: [{ id: 'sl4', productId: 'pr3', warehouseId: 'wh1', quantity: 25, reservedQuantity: 2, warehouse: warehouses[0] }], createdAt: iso(60) },
  { id: 'pr4', name: 'USB Drive 32GB', sku: 'USB-032', description: 'Branded USB flash drive', category: 'Electronics', unit: 'pcs', unitPrice: 20, costPrice: 8, reorderLevel: 40, imageUrl: null, tags: 'electronics,branded', isActive: true, stockLevels: [{ id: 'sl5', productId: 'pr4', warehouseId: 'wh1', quantity: 60, reservedQuantity: 0, warehouse: warehouses[0] }, { id: 'sl6', productId: 'pr4', warehouseId: 'wh2', quantity: 35, reservedQuantity: 5, warehouse: warehouses[1] }], createdAt: iso(60) },
  { id: 'pr5', name: 'Pop Socket', sku: 'POP-001', description: 'Phone stand with logo', category: 'Accessories', unit: 'pcs', unitPrice: 12, costPrice: 4, reorderLevel: 25, imageUrl: null, tags: 'accessories,branded', isActive: true, stockLevels: [{ id: 'sl7', productId: 'pr5', warehouseId: 'wh1', quantity: 15, reservedQuantity: 0, warehouse: warehouses[0] }], createdAt: iso(60) },
  { id: 'pr6', name: 'Water Bottle', sku: 'BTL-001', description: 'Insulated water bottle', category: 'Merchandise', unit: 'pcs', unitPrice: 28, costPrice: 14, reorderLevel: 30, imageUrl: null, tags: 'merchandise,branded', isActive: false, stockLevels: [{ id: 'sl8', productId: 'pr6', warehouseId: 'wh1', quantity: 0, reservedQuantity: 0, warehouse: warehouses[0] }], createdAt: iso(60) },
]

// ── Stock Movements ─────────────────────────────────────────────────
const stockMovements = [
  { id: 'sm1', productId: 'pr1', warehouseId: 'wh1', type: 'in', quantity: 100, reference: 'PO-001', notes: 'Initial stock', product: products[0], warehouse: warehouses[0], createdAt: iso(30) },
  { id: 'sm2', productId: 'pr1', warehouseId: 'wh1', type: 'out', quantity: 20, reference: 'SO-001', notes: 'Client order - TechCorp', product: products[0], warehouse: warehouses[0], createdAt: iso(10) },
  { id: 'sm3', productId: 'pr2', warehouseId: 'wh1', type: 'in', quantity: 50, reference: 'PO-002', notes: 'Restock', product: products[1], warehouse: warehouses[0], createdAt: iso(15) },
  { id: 'sm4', productId: 'pr4', warehouseId: 'wh1', type: 'transfer', quantity: 30, reference: 'TR-001', notes: 'Transfer to East Coast', product: products[3], warehouse: warehouses[0], createdAt: iso(7) },
  { id: 'sm5', productId: 'pr3', warehouseId: 'wh1', type: 'out', quantity: 10, reference: 'SO-002', notes: 'Event giveaway', product: products[2], warehouse: warehouses[0], createdAt: iso(5) },
]

// ── Vendors ─────────────────────────────────────────────────────────
const vendors = [
  { id: 'v1', name: 'PrintPro Solutions', email: 'orders@printpro.com', phone: '+1-555-2001', address: '100 Print St, SF, CA', category: 'Printing', rating: 4.5, isActive: true, _count: { purchaseOrders: 3 }, createdAt: iso(90) },
  { id: 'v2', name: 'MerchWorld', email: 'sales@merchworld.com', phone: '+1-555-2002', address: '200 Merch Ave, LA, CA', category: 'Merchandise', rating: 4.2, isActive: true, _count: { purchaseOrders: 2 }, createdAt: iso(90) },
  { id: 'v3', name: 'TechSupply Inc', email: 'info@techsupply.com', phone: '+1-555-2003', address: '300 Tech Blvd, SJ, CA', category: 'Technology', rating: 4.8, isActive: true, _count: { purchaseOrders: 1 }, createdAt: iso(90) },
  { id: 'v4', name: 'GreenPackaging', email: 'hello@greenpack.com', phone: '+1-555-2004', address: '400 Eco St, Portland, OR', category: 'Packaging', rating: 4.0, isActive: true, _count: { purchaseOrders: 0 }, createdAt: iso(60) },
  { id: 'v5', name: 'FastDelivery Co', email: 'support@fastdelivery.com', phone: '+1-555-2005', address: '500 Speed Ave, SF, CA', category: 'Logistics', rating: 4.6, isActive: false, _count: { purchaseOrders: 0 }, createdAt: iso(90) },
]

// ── Purchase Orders ─────────────────────────────────────────────────
const purchaseOrders = [
  { id: 'po1', number: 'PO-001', vendorId: 'v1', status: 'received', items: '2', subtotal: 1200, tax: 120, total: 1320, orderDate: iso(20), expectedDate: iso(15), notes: 'Branded notebooks', vendor: vendors[0], poItems: [{ id: 'poi1', purchaseOrderId: 'po1', productId: 'pr3', quantity: 50, unitPrice: 24, total: 1200, product: products[2] }], createdAt: iso(20) },
  { id: 'po2', number: 'PO-002', vendorId: 'v2', status: 'ordered', items: '1', subtotal: 750, tax: 75, total: 825, orderDate: iso(5), expectedDate: future(10), notes: 'Branded mugs restock', vendor: vendors[1], poItems: [{ id: 'poi2', purchaseOrderId: 'po2', productId: 'pr2', quantity: 50, unitPrice: 15, total: 750, product: products[1] }], createdAt: iso(5) },
  { id: 'po3', number: 'PO-003', vendorId: 'v3', status: 'ordered', items: '2', subtotal: 1800, tax: 180, total: 1980, orderDate: iso(3), expectedDate: future(7), notes: 'USB drives and pop sockets', vendor: vendors[2], poItems: [{ id: 'poi3', purchaseOrderId: 'po3', productId: 'pr4', quantity: 60, unitPrice: 20, total: 1200, product: products[3] }, { id: 'poi4', purchaseOrderId: 'po3', productId: 'pr5', quantity: 50, unitPrice: 12, total: 600, product: products[4] }], createdAt: iso(3) },
  { id: 'po4', number: 'PO-004', vendorId: 'v1', status: 'draft', items: '1', subtotal: 500, tax: 50, total: 550, orderDate: iso(1), expectedDate: null, notes: null, vendor: vendors[0], poItems: [{ id: 'poi5', purchaseOrderId: 'po4', productId: 'pr1', quantity: 20, unitPrice: 25, total: 500, product: products[0] }], createdAt: iso(1) },
]

// ── IT Assets ───────────────────────────────────────────────────────
const itAssets = [
  { id: 'ita1', assetTag: 'IT-LAP-001', name: 'MacBook Pro 16"', category: 'laptop', brand: 'Apple', model: 'MacBook Pro 16" M3', serialNumber: 'C02XK1234ABC', specifications: '32GB RAM, 1TB SSD', purchaseDate: iso(120), purchaseCost: 2799, warrantyExpiry: future(245), vendor: 'Apple Store', invoiceNumber: 'INV-APP-001', condition: 'excellent', status: 'assigned', assignedToId: 'u1', location: 'Office - Floor 3', notes: 'Primary work laptop', imageUrl: null, organizationId: 'org-1', createdAt: iso(120), updatedAt: iso(30), assignedTo: users[0], issuances: [], _count: { issuances: 1 } },
  { id: 'ita2', assetTag: 'IT-LAP-002', name: 'MacBook Pro 14"', category: 'laptop', brand: 'Apple', model: 'MacBook Pro 14" M3', serialNumber: 'C02XK5678DEF', specifications: '16GB RAM, 512GB SSD', purchaseDate: iso(100), purchaseCost: 1999, warrantyExpiry: future(265), vendor: 'Apple Store', invoiceNumber: 'INV-APP-002', condition: 'good', status: 'assigned', assignedToId: 'u4', location: 'Office - Floor 3', notes: null, imageUrl: null, organizationId: 'org-1', createdAt: iso(100), updatedAt: iso(20), assignedTo: users[3], issuances: [], _count: { issuances: 1 } },
  { id: 'ita3', assetTag: 'IT-MON-001', name: 'LG UltraFine 27"', category: 'monitor', brand: 'LG', model: '27UP850-W', serialNumber: 'LG27UP850001', specifications: '4K UHD, USB-C', purchaseDate: iso(90), purchaseCost: 599, warrantyExpiry: future(275), vendor: 'Amazon', invoiceNumber: 'INV-AMZ-001', condition: 'excellent', status: 'assigned', assignedToId: 'u4', location: 'Office - Floor 3', notes: 'Paired with IT-LAP-002', imageUrl: null, organizationId: 'org-1', createdAt: iso(90), updatedAt: iso(20), assignedTo: users[3], issuances: [], _count: { issuances: 1 } },
  { id: 'ita4', assetTag: 'IT-KB-001', name: 'Magic Keyboard', category: 'accessory', brand: 'Apple', model: 'Magic Keyboard with Touch ID', serialNumber: 'MkKB001', specifications: 'Wireless, USB-C', purchaseDate: iso(80), purchaseCost: 149, warrantyExpiry: future(285), vendor: 'Apple Store', invoiceNumber: 'INV-APP-003', condition: 'good', status: 'in-storage', assignedToId: null, location: 'Storage Room', notes: 'Spare keyboard', imageUrl: null, organizationId: 'org-1', createdAt: iso(80), updatedAt: iso(80), assignedTo: null, issuances: [], _count: { issuances: 0 } },
  { id: 'ita5', assetTag: 'IT-MS-001', name: 'Logitech MX Master 3S', category: 'accessory', brand: 'Logitech', model: 'MX Master 3S', serialNumber: 'LGMS001', specifications: 'Wireless, Ergonomic', purchaseDate: iso(70), purchaseCost: 99, warrantyExpiry: future(295), vendor: 'Amazon', invoiceNumber: 'INV-AMZ-002', condition: 'excellent', status: 'assigned', assignedToId: 'u5', location: 'Office - Floor 2', notes: null, imageUrl: null, organizationId: 'org-1', createdAt: iso(70), updatedAt: iso(10), assignedTo: users[4], issuances: [], _count: { issuances: 1 } },
  { id: 'ita6', assetTag: 'IT-HP-001', name: 'Sony WH-1000XM5', category: 'audio', brand: 'Sony', model: 'WH-1000XM5', serialNumber: 'SWH001', specifications: 'Noise cancelling, Bluetooth', purchaseDate: iso(60), purchaseCost: 399, warrantyExpiry: future(305), vendor: 'Best Buy', invoiceNumber: 'INV-BB-001', condition: 'excellent', status: 'assigned', assignedToId: 'u3', location: 'Office - Floor 3', notes: 'For video editing', imageUrl: null, organizationId: 'org-1', createdAt: iso(60), updatedAt: iso(5), assignedTo: users[2], issuances: [], _count: { issuances: 1 } },
]

// ── Asset Issuances ─────────────────────────────────────────────────
const assetIssuances = [
  { id: 'asi1', assetId: 'ita1', issuedToId: 'u1', issuedById: 'u2', issueDate: iso(120), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'Primary work laptop', notes: 'Admin laptop', status: 'issued', organizationId: 'org-1', createdAt: iso(120), updatedAt: iso(120), asset: itAssets[0], issuedTo: users[0], issuedBy: users[1] },
  { id: 'asi2', assetId: 'ita2', issuedToId: 'u4', issuedById: 'u1', issueDate: iso(100), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'Design work', notes: 'Designer laptop', status: 'issued', organizationId: 'org-1', createdAt: iso(100), updatedAt: iso(100), asset: itAssets[1], issuedTo: users[3], issuedBy: users[0] },
  { id: 'asi3', assetId: 'ita3', issuedToId: 'u4', issuedById: 'u1', issueDate: iso(90), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'External monitor for design work', notes: 'Paired with IT-LAP-002', status: 'issued', organizationId: 'org-1', createdAt: iso(90), updatedAt: iso(90), asset: itAssets[2], issuedTo: users[3], issuedBy: users[0] },
  { id: 'asi4', assetId: 'ita5', issuedToId: 'u5', issuedById: 'u1', issueDate: iso(70), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'Video editing mouse', notes: null, status: 'issued', organizationId: 'org-1', createdAt: iso(70), updatedAt: iso(70), asset: itAssets[4], issuedTo: users[4], issuedBy: users[0] },
]

// ── Disseminators ───────────────────────────────────────────────────
const disseminators = [
  { id: 'dis1', userId: 'u3', teamId: 't4', speciality: 'Instagram & TikTok', platforms: JSON.stringify(['instagram', 'tiktok']), workloadCapacity: 10, status: 'available', rating: 4.8, totalTasksCompleted: 145, totalPostsPublished: 320, avgCompletionHours: 2.5, onTimeRate: 96, notes: 'Top performer for IG and TikTok', organizationId: 'org-1', createdAt: iso(90), updatedAt: iso(1), user: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com', avatar: null, role: 'social_manager' }, team: { id: 't4', name: 'Distribution', type: 'distribution', color: '#8b5cf6' }, _count: { assignedTasks: 3 } },
  { id: 'dis2', userId: 'u5', teamId: 't2', speciality: 'YouTube & Video', platforms: JSON.stringify(['youtube', 'facebook']), workloadCapacity: 8, status: 'busy', rating: 4.6, totalTasksCompleted: 89, totalPostsPublished: 156, avgCompletionHours: 3.2, onTimeRate: 92, notes: 'Video specialist', organizationId: 'org-1', createdAt: iso(80), updatedAt: iso(2), user: { id: 'u5', name: 'James Wilson', email: 'james@creativeflow.com', avatar: null, role: 'editor' }, team: { id: 't2', name: 'Production', type: 'production', color: '#06b6d4' }, _count: { assignedTasks: 5 } },
  { id: 'dis3', userId: 'u6', teamId: 't3', speciality: 'LinkedIn & Twitter', platforms: JSON.stringify(['linkedin', 'twitter']), workloadCapacity: 12, status: 'available', rating: 4.9, totalTasksCompleted: 210, totalPostsPublished: 450, avgCompletionHours: 1.8, onTimeRate: 98, notes: 'B2B specialist', organizationId: 'org-1', createdAt: iso(85), updatedAt: iso(1), user: { id: 'u6', name: 'Lisa Park', email: 'lisa@creativeflow.com', avatar: null, role: 'strategist' }, team: { id: 't3', name: 'Strategy', type: 'strategy', color: '#f59e0b' }, _count: { assignedTasks: 2 } },
  { id: 'dis4', userId: 'u4', teamId: 't1', speciality: 'All Platforms', platforms: JSON.stringify(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']), workloadCapacity: 6, status: 'offline', rating: 4.5, totalTasksCompleted: 67, totalPostsPublished: 120, avgCompletionHours: 4.0, onTimeRate: 88, notes: 'Backup disseminator', organizationId: 'org-1', createdAt: iso(70), updatedAt: iso(5), user: { id: 'u4', name: 'Emma Stone', email: 'emma@creativeflow.com', avatar: null, role: 'designer' }, team: { id: 't1', name: 'Creative', type: 'creative', color: '#10b981' }, _count: { assignedTasks: 0 } },
]

// ── Dissemination Tasks ─────────────────────────────────────────────
const disseminationTasks = [
  { id: 'dt1', title: 'Publish Summer Campaign Reel', description: 'Post the summer campaign reel on Instagram', contentId: 'c1', assigneeId: 'u3', disseminatorId: 'dis1', clientId: 'cl1', campaignId: 'cmp1', targetPlatforms: JSON.stringify(['instagram']), postContent: '☀️ Summer is here! Check out our new collection. #SummerLaunch', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/summer-reel.mp4']), hashtags: 'summer,launch,reel,fashion', scheduledAt: future(1), dueDate: future(2), priority: 'high', status: 'assigned', startedAt: null, completedAt: null, postId: null, failureReason: null, assignedById: 'u1', assignedAt: iso(1), completionNotes: null, engagement: null, organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), assignee: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com', avatar: null }, disseminator: { id: 'dis1', userId: 'u3', speciality: 'Instagram & TikTok', rating: 4.8 }, content: { id: 'c1', title: 'Summer Campaign Reel', type: 'reel', stage: 'idea' }, client: { id: 'cl1', name: 'TechCorp', logo: null }, campaign: { id: 'cmp1', name: 'Summer Launch 2025', status: 'active' } },
  { id: 'dt2', title: 'Publish Brand Story Video', description: 'Upload brand story video to YouTube', contentId: 'c3', assigneeId: 'u5', disseminatorId: 'dis2', clientId: 'cl2', campaignId: 'cmp2', targetPlatforms: JSON.stringify(['youtube']), postContent: 'Behind the scenes of our brand story 🎬', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/brand-story.mp4']), hashtags: 'brand,story,video', scheduledAt: future(3), dueDate: future(4), priority: 'medium', status: 'in-progress', startedAt: iso(1), completedAt: null, postId: null, failureReason: null, assignedById: 'u2', assignedAt: iso(2), completionNotes: null, engagement: null, organizationId: 'org-1', createdAt: iso(2), updatedAt: iso(1), assignee: { id: 'u5', name: 'James Wilson', email: 'james@creativeflow.com', avatar: null }, disseminator: { id: 'dis2', userId: 'u5', speciality: 'YouTube & Video', rating: 4.6 }, content: { id: 'c3', title: 'Brand Story Video', type: 'video', stage: 'edit' }, client: { id: 'cl2', name: 'FashionHub', logo: null }, campaign: { id: 'cmp2', name: 'Brand Refresh', status: 'active' } },
  { id: 'dt3', title: 'Publish Holiday Sale Post', description: 'Post holiday sale announcement on Facebook', contentId: 'c4', assigneeId: 'u3', disseminatorId: 'dis1', clientId: 'cl3', campaignId: 'cmp3', targetPlatforms: JSON.stringify(['facebook']), postContent: 'Holiday sale starts now! 50% off everything 🎄', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/holiday-banner.jpg']), hashtags: 'holiday,sale,christmas', scheduledAt: future(2), dueDate: future(3), priority: 'urgent', status: 'assigned', startedAt: null, completedAt: null, postId: null, failureReason: null, assignedById: 'u1', assignedAt: iso(1), completionNotes: null, engagement: null, organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), assignee: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com', avatar: null }, disseminator: { id: 'dis1', userId: 'u3', speciality: 'Instagram & TikTok', rating: 4.8 }, content: { id: 'c4', title: 'Holiday Sale Announcement', type: 'post', stage: 'review' }, client: { id: 'cl3', name: 'AutoDrive', logo: null }, campaign: { id: 'cmp3', name: 'Holiday Push', status: 'active' } },
  { id: 'dt4', title: 'Publish Wellness Tips', description: 'Share wellness tips infographic on Twitter', contentId: 'c6', assigneeId: 'u6', disseminatorId: 'dis3', clientId: 'cl4', campaignId: 'cmp4', targetPlatforms: JSON.stringify(['twitter']), postContent: 'Wellness tip: Stay hydrated! 💧 #WellnessWednesday', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/wellness-infographic.png']), hashtags: 'wellness,tips,health', scheduledAt: iso(1), dueDate: iso(1), priority: 'low', status: 'completed', startedAt: iso(2), completedAt: iso(1), postId: 'p6', failureReason: null, assignedById: 'u1', assignedAt: iso(3), completionNotes: 'Posted successfully, good engagement', engagement: JSON.stringify({ likes: 234, retweets: 45, replies: 12 }), organizationId: 'org-1', createdAt: iso(3), updatedAt: iso(1), assignee: { id: 'u6', name: 'Lisa Park', email: 'lisa@creativeflow.com', avatar: null }, disseminator: { id: 'dis3', userId: 'u6', speciality: 'LinkedIn & Twitter', rating: 4.9 }, content: { id: 'c6', title: 'Wellness Tips Infographic', type: 'graphic', stage: 'disseminate' }, client: { id: 'cl4', name: 'GreenLife', logo: null }, campaign: { id: 'cmp4', name: 'Product Showcase', status: 'active' } },
  { id: 'dt5', title: 'Publish Product Showcase Reel', description: 'Post product showcase reel on TikTok', contentId: 'c5', assigneeId: 'u3', disseminatorId: 'dis1', clientId: 'cl4', campaignId: 'cmp4', targetPlatforms: JSON.stringify(['tiktok', 'instagram']), postContent: 'Product showcase coming soon... 👀 #ProductLaunch', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/product-showcase.mp4']), hashtags: 'product,showcase,tiktok', scheduledAt: future(5), dueDate: future(6), priority: 'medium', status: 'pending', startedAt: null, completedAt: null, postId: null, failureReason: null, assignedById: 'u1', assignedAt: iso(1), completionNotes: null, engagement: null, organizationId: 'org-1', createdAt: iso(1), updatedAt: iso(1), assignee: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com', avatar: null }, disseminator: { id: 'dis1', userId: 'u3', speciality: 'Instagram & TikTok', rating: 4.8 }, content: { id: 'c5', title: 'Product Showcase Reel', type: 'reel', stage: 'approve' }, client: { id: 'cl4', name: 'GreenLife', logo: null }, campaign: { id: 'cmp4', name: 'Product Showcase', status: 'active' } },
  { id: 'dt6', title: 'Publish Travel Destination Reel', description: 'Post travel reel on Instagram', contentId: 'c8', assigneeId: 'u3', disseminatorId: 'dis1', clientId: 'cl6', campaignId: 'cmp5', targetPlatforms: JSON.stringify(['instagram']), postContent: 'Share your favorite travel destination! ✈️ #Wanderlust', mediaUrls: JSON.stringify(['https://cdn.creativeflow.com/assets/travel-reel.mp4']), hashtags: 'travel,destination,adventure', scheduledAt: iso(7), dueDate: iso(7), priority: 'high', status: 'completed', startedAt: iso(9), completedAt: iso(7), postId: 'p8', failureReason: null, assignedById: 'u1', assignedAt: iso(10), completionNotes: 'Great engagement!', engagement: JSON.stringify({ likes: 5600, comments: 320, shares: 210 }), organizationId: 'org-1', createdAt: iso(10), updatedAt: iso(7), assignee: { id: 'u3', name: 'Alex Rivera', email: 'alex@creativeflow.com', avatar: null }, disseminator: { id: 'dis1', userId: 'u3', speciality: 'Instagram & TikTok', rating: 4.8 }, content: { id: 'c8', title: 'Travel Destination Reel', type: 'reel', stage: 'disseminate' }, client: { id: 'cl6', name: 'TravelQuest', logo: null }, campaign: { id: 'cmp5', name: 'Q4 Growth Drive', status: 'planning' } },
]

// ── Automation Rules ────────────────────────────────────────────────
const automations = [
  { id: 'ar1', name: 'Auto-assign to Creative Team', description: 'New content ideas are auto-assigned to the Creative team', trigger: 'content_created', conditions: JSON.stringify({ stage: 'idea', type: ['reel', 'carousel'] }), actions: JSON.stringify({ assignTeam: 't1', setPriority: 'medium' }), isActive: true },
  { id: 'ar2', name: 'Notify on Approval', description: 'Send notification when approval is requested', trigger: 'approval_requested', conditions: JSON.stringify({ priority: ['high', 'urgent'] }), actions: JSON.stringify({ notify: ['u1'], sendEmail: true }), isActive: true },
  { id: 'ar3', name: 'Archive Old Content', description: 'Move content to archive after 90 days', trigger: 'scheduled', conditions: JSON.stringify({ olderThan: 90, stage: 'disseminate' }), actions: JSON.stringify({ setStage: 'archived' }), isActive: true },
  { id: 'ar4', name: 'Welcome New Client', description: 'Send welcome email when new client is added', trigger: 'client_created', conditions: JSON.stringify({}), actions: JSON.stringify({ sendEmail: true, templateId: 'tmpl1' }), isActive: false },
]

// ── Calendar Events ─────────────────────────────────────────────────
const calendarEvents = [
  { id: 'ce1', title: 'Summer Campaign Reel - Publish', date: future(1), type: 'post', status: 'scheduled', platform: 'instagram', color: '#E4405F' },
  { id: 'ce2', title: 'Brand Story Video - Upload', date: future(3), type: 'post', status: 'scheduled', platform: 'youtube', color: '#FF0000' },
  { id: 'ce3', title: 'Holiday Sale Post', date: future(2), type: 'post', status: 'scheduled', platform: 'facebook', color: '#1877F2' },
  { id: 'ce4', title: 'Wellness Tips - Published', date: iso(1), type: 'post', status: 'published', platform: 'twitter', color: '#1DA1F2' },
  { id: 'ce5', title: 'Product Showcase Review', date: future(1), type: 'content', status: 'review', color: '#f59e0b' },
  { id: 'ce6', title: 'Travel Reel - Published', date: iso(7), type: 'post', status: 'published', platform: 'instagram', color: '#E4405F' },
  { id: 'ce7', title: 'Summer Campaign Kickoff', date: iso(5), type: 'campaign', status: 'started', color: '#10b981' },
  { id: 'ce8', title: 'Brand Refresh Deadline', date: future(45), type: 'campaign', status: 'upcoming', color: '#8b5cf6' },
  { id: 'ce9', title: 'Carousel Design Due', date: future(10), type: 'content', status: 'upcoming', color: '#06b6d4' },
  { id: 'ce10', title: 'Client Meeting - TechCorp', date: future(2), type: 'content', status: 'meeting', color: '#34c759' },
]

// ── Communication Templates ─────────────────────────────────────────
const commTemplates = [
  { id: 'tmpl1', name: 'Welcome Email', subject: 'Welcome to CreativeFlow Digital!', body: 'Hi {{name}},\n\nWelcome to CreativeFlow Digital! We are excited to work with you.\n\nBest regards,\nThe CreativeFlow Team', type: 'email', category: 'onboarding', variables: JSON.stringify(['name']), isDefault: true, isActive: true, organizationId: 'org-1', createdAt: iso(30) },
  { id: 'tmpl2', name: 'Invoice Reminder', subject: 'Invoice {{invoice_number}} is due', body: 'Hi {{name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nPlease process payment at your earliest convenience.\n\nBest,\nCreativeFlow Digital', type: 'email', category: 'billing', variables: JSON.stringify(['name', 'invoice_number', 'amount', 'due_date']), isDefault: false, isActive: true, organizationId: 'org-1', createdAt: iso(25) },
  { id: 'tmpl3', name: 'WhatsApp Welcome', subject: null, body: 'Hi {{name}}! 👋 Welcome to CreativeFlow Digital. We are excited to work with you! Feel free to reach out anytime.', type: 'whatsapp', category: 'onboarding', variables: JSON.stringify(['name']), isDefault: false, isActive: true, organizationId: 'org-1', createdAt: iso(20) },
  { id: 'tmpl4', name: 'Campaign Update', subject: 'Campaign Update: {{campaign_name}}', body: 'Hi {{name}},\n\nHere is your weekly update on the {{campaign_name}} campaign:\n\n- Posts published: {{posts_count}}\n- Total engagement: {{engagement}}\n- Upcoming content: {{upcoming}}\n\nLet us know if you have any questions!\n\nBest,\nCreativeFlow Digital', type: 'email', category: 'reporting', variables: JSON.stringify(['name', 'campaign_name', 'posts_count', 'engagement', 'upcoming']), isDefault: false, isActive: true, organizationId: 'org-1', createdAt: iso(15) },
]

// ── Conversations ───────────────────────────────────────────────────
const conversations = [
  { id: 'conv1', subject: 'Summer Campaign Discussion', type: 'email', status: 'active', priority: 'high', channel: 'email', clientId: 'cl1', influencerId: null, campaignId: 'cmp1', assignedToId: 'u1', lastMessageAt: iso(1), lastMessagePreview: 'Looking forward to the summer campaign launch!', unreadCount: 2, tags: 'summer,campaign', organizationId: 'org-1', createdAt: iso(5), updatedAt: iso(1), client: { id: 'cl1', name: 'TechCorp', logo: null }, influencer: null, assignedTo: { id: 'u1', name: 'Sarah Chen', email: 'sarah@creativeflow.com', avatar: null }, messages: [] },
  { id: 'conv2', subject: 'Brand Refresh Feedback', type: 'email', status: 'active', priority: 'normal', channel: 'email', clientId: 'cl2', influencerId: null, campaignId: 'cmp2', assignedToId: 'u4', lastMessageAt: iso(2), lastMessagePreview: 'The new logo looks amazing! Can we see more options?', unreadCount: 0, tags: 'brand,design', organizationId: 'org-1', createdAt: iso(8), updatedAt: iso(2), client: { id: 'cl2', name: 'FashionHub', logo: null }, influencer: null, assignedTo: { id: 'u4', name: 'Emma Stone', email: 'emma@creativeflow.com', avatar: null }, messages: [] },
  { id: 'conv3', subject: 'Influencer Collaboration', type: 'whatsapp', status: 'active', priority: 'urgent', channel: 'whatsapp', clientId: null, influencerId: 'inf1', campaignId: 'cmp2', assignedToId: 'u6', lastMessageAt: iso(1), lastMessagePreview: 'Hi! I would love to collaborate on the fashion campaign!', unreadCount: 1, tags: 'influencer,collab', organizationId: 'org-1', createdAt: iso(3), updatedAt: iso(1), client: null, influencer: { id: 'inf1', name: 'StyleMaven', username: '@stylemaven', platform: 'instagram' }, assignedTo: { id: 'u6', name: 'Lisa Park', email: 'lisa@creativeflow.com', avatar: null }, messages: [] },
  { id: 'conv4', subject: 'Invoice Question', type: 'email', status: 'active', priority: 'normal', channel: 'email', clientId: 'cl3', influencerId: null, campaignId: null, assignedToId: 'u2', lastMessageAt: iso(3), lastMessagePreview: 'Can we get an updated invoice?', unreadCount: 0, tags: 'billing', organizationId: 'org-1', createdAt: iso(7), updatedAt: iso(3), client: { id: 'cl3', name: 'AutoDrive', logo: null }, influencer: null, assignedTo: { id: 'u2', name: 'Mike Ross', email: 'mike@creativeflow.com', avatar: null }, messages: [] },
  { id: 'conv5', subject: 'Product Showcase Planning', type: 'mixed', status: 'archived', priority: 'low', channel: 'email', clientId: 'cl4', influencerId: null, campaignId: 'cmp4', assignedToId: null, lastMessageAt: iso(10), lastMessagePreview: 'Thanks for the update!', unreadCount: 0, tags: 'product,planning', organizationId: 'org-1', createdAt: iso(15), updatedAt: iso(10), client: { id: 'cl4', name: 'GreenLife', logo: null }, influencer: null, assignedTo: null, messages: [] },
]

// ── Communication Contacts ──────────────────────────────────────────
const commContacts = [
  { id: 'cc1', name: 'John Smith', email: 'john@techcorp.com', phone: '+1-555-3001', whatsappNumber: '+1-555-3001', company: 'TechCorp', role: 'Marketing Director', avatar: null, notes: 'Primary contact for TechCorp', preferredChannel: 'email', lastContactedAt: iso(1), isFavorite: true, tags: 'client,techcorp', clientId: 'cl1', influencerId: null, organizationId: 'org-1', createdAt: iso(30) },
  { id: 'cc2', name: 'Sarah Johnson', email: 'sarah@fashionhub.com', phone: '+1-555-3002', whatsappNumber: null, company: 'FashionHub', role: 'Brand Manager', avatar: null, notes: 'Decision maker for brand refresh', preferredChannel: 'email', lastContactedAt: iso(2), isFavorite: false, tags: 'client,fashion', clientId: 'cl2', influencerId: null, organizationId: 'org-1', createdAt: iso(25) },
  { id: 'cc3', name: 'StyleMaven', email: 'style@maven.com', phone: '+1-555-3003', whatsappNumber: '+1-555-3003', company: null, role: 'Influencer', avatar: null, notes: 'Fashion influencer, 450k followers', preferredChannel: 'whatsapp', lastContactedAt: iso(1), isFavorite: true, tags: 'influencer,fashion', clientId: null, influencerId: 'inf1', organizationId: 'org-1', createdAt: iso(20) },
  { id: 'cc4', name: 'Mike Anderson', email: 'mike@autodrive.com', phone: '+1-555-3004', whatsappNumber: null, company: 'AutoDrive', role: 'CMO', avatar: null, notes: 'Approves all marketing budgets', preferredChannel: 'email', lastContactedAt: iso(3), isFavorite: false, tags: 'client,automotive', clientId: 'cl3', influencerId: null, organizationId: 'org-1', createdAt: iso(28) },
  { id: 'cc5', name: 'Emma Wilson', email: 'emma@greenlife.com', phone: null, whatsappNumber: '+1-555-3005', company: 'GreenLife', role: 'Founder', avatar: null, notes: 'Prefers WhatsApp communication', preferredChannel: 'whatsapp', lastContactedAt: iso(5), isFavorite: false, tags: 'client,wellness', clientId: 'cl4', influencerId: null, organizationId: 'org-1', createdAt: iso(22) },
  { id: 'cc6', name: 'TechGuru Dan', email: 'dan@techguru.com', phone: '+1-555-3006', whatsappNumber: null, company: null, role: 'Influencer', avatar: null, notes: 'Tech reviewer, 850k YouTube subscribers', preferredChannel: 'email', lastContactedAt: iso(7), isFavorite: true, tags: 'influencer,tech', clientId: null, influencerId: 'inf2', organizationId: 'org-1', createdAt: iso(18) },
]

// ── Financial Report Data (computed from demo data) ─────────────────
const revenueAccounts = financeAccounts.filter(a => a.type === 'revenue').map(a => ({ id: a.id, code: a.code, name: a.name, category: a.category, balance: a.balance }))
const expenseAccounts = financeAccounts.filter(a => a.type === 'expense').map(a => ({ id: a.id, code: a.code, name: a.name, category: a.category, balance: a.balance }))
const assetAccounts = financeAccounts.filter(a => a.type === 'asset').map(a => ({ id: a.id, code: a.code, name: a.name, category: a.category, balance: a.balance }))
const liabilityAccounts = financeAccounts.filter(a => a.type === 'liability').map(a => ({ id: a.id, code: a.code, name: a.name, category: a.category, balance: a.balance }))
const equityAccounts = financeAccounts.filter(a => a.type === 'equity').map(a => ({ id: a.id, code: a.code, name: a.name, category: a.category, balance: a.balance }))

const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0)
const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0)
const netIncome = totalRevenue - totalExpenses
const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0)
const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.balance, 0)
const totalEquity = equityAccounts.reduce((s, a) => s + a.balance, 0)

// Trial balance data — computed from journal entries
const trialBalanceAccounts = financeAccounts.map(a => {
  const lines = journalEntries.flatMap(je => je.lines.filter(l => l.accountId === a.id))
  const debitTotal = lines.reduce((s, l) => s + l.debit, 0)
  const creditTotal = lines.reduce((s, l) => s + l.credit, 0)
  return { id: a.id, code: a.code, name: a.name, type: a.type, debitTotal, creditTotal }
}).filter(a => a.debitTotal > 0 || a.creditTotal > 0)

const totalDebits = trialBalanceAccounts.reduce((s, a) => s + a.debitTotal, 0)
const totalCredits = trialBalanceAccounts.reduce((s, a) => s + a.creditTotal, 0)

// ── Financial Reports by type (query param) ─────────────────────────
const FINANCIAL_REPORTS: Record<string, unknown> = {
  'overview': {
    totalRevenue,
    totalExpenses,
    netIncome,
    accountBalancesByType: {
      asset: { count: assetAccounts.length, totalBalance: totalAssets },
      liability: { count: liabilityAccounts.length, totalBalance: totalLiabilities },
      equity: { count: equityAccounts.length, totalBalance: totalEquity },
      revenue: { count: revenueAccounts.length, totalBalance: totalRevenue },
      expense: { count: expenseAccounts.length, totalBalance: totalExpenses },
    },
    revenueAccounts,
    expenseAccounts,
  },
  'balance-sheet': {
    assets: assetAccounts,
    liabilities: liabilityAccounts,
    equity: equityAccounts,
    netIncome,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity + netIncome,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + netIncome)) < 0.01,
  },
  'pnl': {
    revenue: revenueAccounts,
    expenses: expenseAccounts,
    totalRevenue,
    totalExpenses,
    netIncome,
  },
  'trial-balance': {
    accounts: trialBalanceAccounts,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
  },
  'cash-flow': {
    cashAccounts: assetAccounts.filter(a => a.code === '1000' || a.name.toLowerCase().includes('cash')),
    totalCash: totalAssets,
    operatingCashFlow: netIncome,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netChange: netIncome,
  },
}

// ── Employee Report Data ────────────────────────────────────────────
const employeeReportData = {
  employees: employees.map(e => ({
    employeeId: e.employeeId,
    fullName: `${e.firstName} ${e.lastName}`,
    email: e.email,
    phone: e.phone,
    position: e.position,
    department: e.department?.name || '—',
    employmentType: e.employmentType,
    status: e.status,
    hireDate: e.hireDate,
  })),
  total: employees.length,
  byStatus: {
    active: employees.filter(e => e.status === 'active').length,
    'on-leave': employees.filter(e => e.status === 'on-leave').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  },
  byDepartment: departments.reduce((acc, d) => {
    acc[d.name] = employees.filter(e => e.departmentId === d.id).length
    return acc
  }, {} as Record<string, number>),
  byEmploymentType: {
    'full-time': employees.filter(e => e.employmentType === 'full-time').length,
    'part-time': employees.filter(e => e.employmentType === 'part-time').length,
    'contract': employees.filter(e => e.employmentType === 'contract').length,
    'internship': employees.filter(e => e.employmentType === 'internship').length,
  },
}

// ── Attendance Report Data ──────────────────────────────────────────
const attendanceReportData = {
  employees: employees.map((e, idx) => {
    const seed = idx + 1
    const totalWorkDays = 22
    const leaveDays = leaveRequests.filter(l => l.employeeId === e.id && l.status === 'approved').reduce((s, l) => s + l.days, 0)
    const present = Math.max(0, totalWorkDays - leaveDays - (seed % 3))
    const absent = seed % 2
    const late = (seed * 3) % 4
    const rate = (present / totalWorkDays) * 100
    return {
      employeeId: e.employeeId,
      fullName: `${e.firstName} ${e.lastName}`,
      department: e.department?.name || '—',
      presentDays: present,
      absentDays: absent,
      leaveDays,
      lateDays: late,
      attendanceRate: rate,
      totalLeaveRequests: leaveRequests.filter(l => l.employeeId === e.id).length,
      pendingLeaveRequests: leaveRequests.filter(l => l.employeeId === e.id && l.status === 'pending').length,
      approvedLeaveRequests: leaveRequests.filter(l => l.employeeId === e.id && l.status === 'approved').length,
    }
  }),
  totals: {
    totalEmployees: employees.length,
    avgAttendanceRate: 95.2,
    totalLeaveDays: leaveRequests.filter(l => l.status === 'approved').reduce((s, l) => s + l.days, 0),
    totalPendingLeaves: leaveRequests.filter(l => l.status === 'pending').length,
    totalWorkDays: 22,
  },
}

// ── Export ──────────────────────────────────────────────────────────
export const DEMO_DATA: Record<string, unknown> = {
  '/api/users': { data: userAccounts },
  '/api/contents': { contents },
  '/api/posts': { posts },
  '/api/teams': { teams: teamsWithMembers },
  '/api/social-accounts': { data: socialAccounts },
  '/api/campaigns': { data: campaigns },
  '/api/clients': { data: clients },
  '/api/automation': { data: automations },
  '/api/calendar': { data: calendarEvents },
  '/api/approvals': { approvals },
  '/api/invoices': { data: invoices },
  '/api/time-entries': { data: timeEntries },
  '/api/expenses': { data: expenses },
  '/api/assets': { data: assets },
  '/api/notifications': { data: notifications },
  '/api/inbox': { data: inboxMessages },
  '/api/influencers': { data: influencers },
  '/api/brand-kit': { data: brandKits },
  '/api/departments': { data: departments },
  '/api/employees': { data: employees },
  '/api/attendance': { data: attendance },
  '/api/leave-requests': { data: leaveRequests },
  '/api/payroll': { data: payrollRuns },
  '/api/job-postings': { data: jobPostings },
  '/api/accounts': { data: financeAccounts },
  '/api/tax-rates': { data: taxRates },
  '/api/journal-entries': { data: journalEntries },
  '/api/products': { data: products },
  '/api/warehouses': { data: warehouses },
  '/api/stock-movements': { data: stockMovements },
  '/api/vendors': { data: vendors },
  '/api/purchase-orders': { data: purchaseOrders },
  '/api/it-assets': { data: itAssets },
  '/api/asset-issuances': { data: assetIssuances },
  '/api/disseminators': { disseminators },
  '/api/dissemination-tasks': { tasks: disseminationTasks },
  '/api/communications/conversations': { conversations },
  '/api/communications/templates': { templates: commTemplates },
  '/api/communications/contacts': { contacts: commContacts },
}

// Export financial report data keyed by type (for query-param lookup)
export const FINANCIAL_REPORT_DATA: Record<string, unknown> = FINANCIAL_REPORTS

// Export employee/attendance report data (for /api/reports/* routes)
export const REPORT_DATA: Record<string, unknown> = {
  '/api/reports/employees': { data: employeeReportData },
  '/api/reports/attendance': { data: attendanceReportData },
}
