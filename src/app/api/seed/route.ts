import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  // In sandbox dev mode, skip seeding to keep the server stable.
  // The Neon database is already seeded from previous `bun run seed` runs.
  // The dashboard API now serves static fallback data, so the UI renders
  // even without live DB queries. To re-seed, run `bun run seed` from CLI.
  return NextResponse.json({ success: true, message: 'Seed skipped (sandbox mode - use bun run seed from CLI)', skipped: true })
}

// Original seeding logic preserved below but not executed in sandbox
async function _seedHandler() {
  try {
    // Check if data already exists - skip seeding if so
    const existingOrg = await db.organization.findFirst()
    const existingApprovals = existingOrg ? await db.approval.count({ where: { organizationId: existingOrg.id } }) : 0
    const existingDisseminators = existingOrg ? await db.disseminator.count({ where: { organizationId: existingOrg.id } }) : 0
    const existingCommContacts = existingOrg ? await db.communicationContact.count({ where: { organizationId: existingOrg.id } }) : 0
    const existingJournalEntries = existingOrg ? await db.journalEntry.count({ where: { organizationId: existingOrg.id } }) : 0
    
    // Check for missing module data
    const existingInvoices = existingOrg ? await db.invoice.count({ where: { organizationId: existingOrg.id } }) : 0

    if (existingOrg && existingApprovals > 0 && existingDisseminators > 0 && existingCommContacts > 0 && existingJournalEntries > 0 && existingInvoices > 0) {
      return NextResponse.json({ success: true, message: 'Database already seeded', skipped: true })
    }

    // If org has basic data and finance but missing modules, seed only the missing modules
    if (existingOrg && existingJournalEntries > 0 && existingInvoices === 0) {
      await seedMissingModules(existingOrg.id)
      return NextResponse.json({ success: true, message: 'Missing module data seeded', skipped: false })
    }
    
    // If org exists and has approvals but no disseminators, create them
    if (existingOrg && existingApprovals > 0 && existingDisseminators === 0) {
      await seedDisseminators(existingOrg.id)
    }
    
    // If org exists but no communication data, seed communications
    if (existingOrg && existingCommContacts === 0 && existingApprovals > 0) {
      await seedCommunications(existingOrg.id)
    }

    // If org exists with all basic data but no finance data, seed finance only
    if (existingOrg && existingApprovals > 0 && existingJournalEntries === 0) {
      const adminUser = await db.user.findFirst({ where: { organizationId: existingOrg.id, role: 'admin' } })
      await seedFinance(existingOrg.id, adminUser?.id || '')
      return NextResponse.json({ success: true, message: 'Finance data seeded', skipped: false })
    }



    // Clear existing data in correct order (respecting foreign keys)
    // Delete child records first, then parent records
    await db.journalEntryLine.deleteMany()
    await db.journalEntry.deleteMany()
    await db.invoiceItem.deleteMany()
    await db.communicationMessage.deleteMany()
    await db.conversation.deleteMany()
    await db.communicationTemplate.deleteMany()
    await db.communicationContact.deleteMany()
    await db.brandKit.deleteMany()
    await db.influencer.deleteMany()
    await db.inboxMessage.deleteMany()
    await db.notification.deleteMany()
    await db.assetIssuance.deleteMany()
    await db.iTAsset.deleteMany()
    await db.purchaseOrderItem.deleteMany()
    await db.purchaseOrder.deleteMany()
    await db.vendor.deleteMany()
    await db.stockMovement.deleteMany()
    await db.stockLevel.deleteMany()
    await db.warehouse.deleteMany()
    await db.product.deleteMany()
    await db.expense.deleteMany()
    await db.taxRate.deleteMany()
    await db.account.deleteMany()
    await db.payrollItem.deleteMany()
    await db.payrollRun.deleteMany()
    await db.attendance.deleteMany()
    await db.leaveRequest.deleteMany()
    await db.employee.deleteMany()
    await db.jobPosting.deleteMany()
    await db.department.deleteMany()
    await db.asset.deleteMany()
    await db.timeEntry.deleteMany()
    await db.invoice.deleteMany()
    await db.approval.deleteMany()
    await db.activityLog.deleteMany()
    await db.comment.deleteMany()
    await db.disseminationTask.deleteMany()
    await db.disseminator.deleteMany()
    await db.post.deleteMany()
    await db.automationRule.deleteMany()
    await db.socialAccount.deleteMany()
    await db.content.deleteMany()
    await db.campaign.deleteMany()
    await db.client.deleteMany()
    await db.teamMember.deleteMany()
    await db.team.deleteMany()
    await db.user.deleteMany()
    await db.organization.deleteMany()
    await db.tenant.deleteMany()

    // ============================================
    // 1. Tenant (multi-tenant root)
    // ============================================
    const tenant = await db.tenant.create({
      data: {
        name: 'Default Tenant',
        slug: 'default',
        plan: 'professional',
        status: 'active',
      },
    })

    // ============================================
    // 2. Organization (scoped to tenant)
    // ============================================
    const org = await db.organization.create({
      data: {
        name: 'Vortex Digital',
        slug: 'vortex-digital',
        logo: '/logo.svg',
        plan: 'professional',
        maxUsers: 25,
        maxAccounts: 50,
        tenantId: tenant.id,
      },
    })

    // ============================================
    // 3. Users (linked to tenant + organization)
    // ============================================
    const users = await Promise.all([
      db.user.create({
        data: { email: 'sarah.chen@vortexdigital.com', name: 'Sarah Chen', role: 'admin', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'marcus.williams@vortexdigital.com', name: 'Marcus Williams', role: 'lead', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'priya.sharma@vortexdigital.com', name: 'Priya Sharma', role: 'lead', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'jake.morrison@vortexdigital.com', name: 'Jake Morrison', role: 'lead', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'luna.rodriguez@vortexdigital.com', name: 'Luna Rodriguez', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'david.kim@vortexdigital.com', name: 'David Kim', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'emma.thompson@vortexdigital.com', name: 'Emma Thompson', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'alex.nakamura@vortexdigital.com', name: 'Alex Nakamura', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'maya.patel@vortexdigital.com', name: 'Maya Patel', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'jordan.lee@vortexdigital.com', name: 'Jordan Lee', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'sam.rodriguez@vortexdigital.com', name: 'Sam Rodriguez', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
      db.user.create({
        data: { email: 'riley.kim@vortexdigital.com', name: 'Riley Kim', role: 'member', organizationId: org.id, tenantId: tenant.id },
      }),
    ])

    const [sarah, marcus, priya, jake, luna, david, emma, alex, maya, jordan, sam, riley] = users

    // ============================================
    // 3. Teams
    // ============================================
    const teams = await Promise.all([
      db.team.create({
        data: { name: 'Creatives', type: 'creatives', color: '#f59e0b', icon: 'lightbulb', description: 'Ideation and creative direction for all campaigns', organizationId: org.id },
      }),
      db.team.create({
        data: { name: 'Content', type: 'content', color: '#10b981', icon: 'pen-tool', description: 'Copywriting and content creation across all platforms', organizationId: org.id },
      }),
      db.team.create({
        data: { name: 'Design', type: 'design', color: '#8b5cf6', icon: 'palette', description: 'Visual design, graphics, and brand assets', organizationId: org.id },
      }),
      db.team.create({
        data: { name: 'Edit', type: 'edit', color: '#ef4444', icon: 'film', description: 'Video editing, post-production, and quality review', organizationId: org.id },
      }),
      db.team.create({
        data: { name: 'Archive', type: 'archive', color: '#6b7280', icon: 'archive', description: 'Content archiving and asset management', organizationId: org.id },
      }),
      db.team.create({
        data: { name: 'Dissemination', type: 'dissemination', color: '#3b82f6', icon: 'share-2', description: 'Scheduling, publishing, and distribution across platforms', organizationId: org.id },
      }),
    ])

    const [creativesTeam, contentTeam, designTeam, editTeam, archiveTeam, disseminationTeam] = teams

    // Team Members
    await Promise.all([
      db.teamMember.create({ data: { userId: marcus.id, teamId: creativesTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: luna.id, teamId: creativesTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: priya.id, teamId: contentTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: david.id, teamId: contentTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: emma.id, teamId: contentTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: jake.id, teamId: designTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: luna.id, teamId: designTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: alex.id, teamId: designTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: marcus.id, teamId: editTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: david.id, teamId: editTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: emma.id, teamId: archiveTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: alex.id, teamId: disseminationTeam.id, role: 'lead' } }),
      db.teamMember.create({ data: { userId: luna.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: maya.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: jordan.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: sam.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.create({ data: { userId: riley.id, teamId: disseminationTeam.id, role: 'member' } }),
    ])

    // ============================================
    // 4. Clients
    // ============================================
    const clients = await Promise.all([
      db.client.create({
        data: { name: 'TechCorp', industry: 'Technology', website: 'https://techcorp.io', email: 'marketing@techcorp.io', phone: '+1-555-0101', status: 'active', organizationId: org.id },
      }),
      db.client.create({
        data: { name: 'FashionHub', industry: 'Fashion & Retail', website: 'https://fashionhub.com', email: 'pr@fashionhub.com', phone: '+1-555-0202', status: 'active', organizationId: org.id },
      }),
      db.client.create({
        data: { name: 'FoodVibe', industry: 'Food & Beverage', website: 'https://foodvibe.co', email: 'hello@foodvibe.co', phone: '+1-555-0303', status: 'active', organizationId: org.id },
      }),
      db.client.create({
        data: { name: 'AutoDrive', industry: 'Automotive', website: 'https://autodrive.com', email: 'media@autodrive.com', phone: '+1-555-0404', status: 'active', organizationId: org.id },
      }),
      db.client.create({
        data: { name: 'WellnessCo', industry: 'Health & Wellness', website: 'https://wellnessco.com', email: 'info@wellnessco.com', phone: '+1-555-0505', status: 'prospect', organizationId: org.id },
      }),
    ])

    const [techcorp, fashionhub, foodvibe, autodrive, wellnessco] = clients

    // ============================================
    // 5. Campaigns
    // ============================================
    const campaigns = await Promise.all([
      db.campaign.create({
        data: { name: 'TechCorp Spring Launch 2025', description: 'Full social media campaign for TechCorp\'s new SaaS product launch targeting enterprise clients', status: 'active', startDate: new Date('2025-02-01'), endDate: new Date('2025-04-30'), budget: 45000, clientId: techcorp.id, organizationId: org.id },
      }),
      db.campaign.create({
        data: { name: 'FashionHub Summer Collection', description: 'Visual-first campaign for FashionHub\'s summer line across Instagram and TikTok', status: 'active', startDate: new Date('2025-03-01'), endDate: new Date('2025-06-30'), budget: 32000, clientId: fashionhub.id, organizationId: org.id },
      }),
      db.campaign.create({
        data: { name: 'FoodVibe Taste Stories', description: 'User-generated content campaign encouraging food lovers to share their taste stories', status: 'draft', startDate: new Date('2025-05-01'), endDate: new Date('2025-07-31'), budget: 18000, clientId: foodvibe.id, organizationId: org.id },
      }),
      db.campaign.create({
        data: { name: 'AutoDrive EV Revolution', description: 'Multi-platform campaign for AutoDrive\'s electric vehicle lineup launch', status: 'completed', startDate: new Date('2024-10-01'), endDate: new Date('2025-01-31'), budget: 68000, clientId: autodrive.id, organizationId: org.id },
      }),
    ])

    const [techcorpCampaign, fashionCampaign, foodvibeCampaign, autodriveCampaign] = campaigns

    // ============================================
    // 6. Content Items
    // ============================================
    const now = new Date()
    const dayMs = 86400000

    const contentItems = await Promise.all([
      // IDEA stage
      db.content.create({ data: { title: 'TechCorp CEO Spotlight Interview', description: 'Behind-the-scenes interview series with TechCorp leadership about the future of enterprise AI', type: 'video', stage: 'idea', priority: 'high', format: 'landscape', tags: 'interview,leadership,behind-the-scenes', dueDate: new Date(now.getTime() + 14 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: marcus.id, assigneeId: marcus.id, teamId: creativesTeam.id } }),
      db.content.create({ data: { title: 'FashionHub Summer Lookbook Reel', description: 'Fast-paced reel showcasing the top 10 summer looks from the new collection', type: 'reel', stage: 'idea', priority: 'medium', format: 'vertical', tags: 'lookbook,summer,fashion-reel', dueDate: new Date(now.getTime() + 10 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: luna.id, assigneeId: luna.id, teamId: creativesTeam.id } }),
      db.content.create({ data: { title: 'FoodVibe Recipe Card Series', description: 'Weekly recipe cards featuring seasonal ingredients for Instagram carousel posts', type: 'carousel', stage: 'idea', priority: 'medium', format: 'square', tags: 'recipe,seasonal,carousel', dueDate: new Date(now.getTime() + 7 * dayMs), organizationId: org.id, campaignId: foodvibeCampaign.id, creatorId: priya.id, assigneeId: priya.id, teamId: contentTeam.id } }),
      db.content.create({ data: { title: 'AutoDrive Community Poll Series', description: 'Interactive LinkedIn polls about EV preferences and sustainability', type: 'post', stage: 'idea', priority: 'low', format: 'square', tags: 'poll,community,engagement', dueDate: new Date(now.getTime() + 21 * dayMs), organizationId: org.id, campaignId: autodriveCampaign.id, creatorId: emma.id, assigneeId: emma.id, teamId: contentTeam.id } }),
      // DESIGN stage
      db.content.create({ data: { title: 'TechCorp Product Feature Infographic', description: 'Infographic breaking down the 5 key features of the new SaaS platform', type: 'graphic', stage: 'design', priority: 'high', format: 'landscape', tags: 'infographic,product-features,saas', dueDate: new Date(now.getTime() + 5 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: marcus.id, assigneeId: jake.id, teamId: designTeam.id } }),
      db.content.create({ data: { title: 'FashionHub Brand Story Carousel', description: '7-slide carousel telling the FashionHub sustainability story', type: 'carousel', stage: 'design', priority: 'high', format: 'square', tags: 'brand-story,sustainability,carousel', dueDate: new Date(now.getTime() + 3 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: priya.id, assigneeId: alex.id, teamId: designTeam.id } }),
      db.content.create({ data: { title: 'WellnessCo Mindfulness Tips Graphic Set', description: 'Set of 5 daily mindfulness tip graphics for Instagram feed', type: 'graphic', stage: 'design', priority: 'medium', format: 'square', tags: 'mindfulness,wellness,daily-tips', dueDate: new Date(now.getTime() + 8 * dayMs), organizationId: org.id, creatorId: luna.id, assigneeId: jake.id, teamId: designTeam.id } }),
      db.content.create({ data: { title: 'AutoDrive EV Comparison Chart', description: 'Visual comparison chart of AutoDrive EV models vs competitors', type: 'graphic', stage: 'design', priority: 'urgent', format: 'landscape', tags: 'comparison,ev,competitive', dueDate: new Date(now.getTime() + 2 * dayMs), organizationId: org.id, campaignId: autodriveCampaign.id, creatorId: marcus.id, assigneeId: luna.id, teamId: designTeam.id } }),
      // EDIT stage
      db.content.create({ data: { title: 'TechCorp Platform Demo Video', description: '3-minute product demo video for LinkedIn and YouTube', type: 'video', stage: 'edit', priority: 'urgent', format: 'landscape', tags: 'demo,product,video', dueDate: new Date(now.getTime() + 1 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: marcus.id, assigneeId: david.id, teamId: editTeam.id } }),
      db.content.create({ data: { title: 'FashionHub BTS Fashion Show Reel', description: 'Behind-the-scenes reel from the summer fashion show photoshoot', type: 'reel', stage: 'edit', priority: 'high', format: 'vertical', tags: 'behind-the-scenes,fashion-show,reel', dueDate: new Date(now.getTime() + 4 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: luna.id, assigneeId: marcus.id, teamId: editTeam.id } }),
      db.content.create({ data: { title: 'FoodVibe Kitchen Stories Episode 3', description: 'Third episode of the Kitchen Stories video series featuring a local chef', type: 'video', stage: 'edit', priority: 'medium', format: 'landscape', tags: 'kitchen-stories,video-series,chef', dueDate: new Date(now.getTime() + 6 * dayMs), organizationId: org.id, campaignId: foodvibeCampaign.id, creatorId: priya.id, assigneeId: david.id, teamId: editTeam.id } }),
      // REVIEW stage
      db.content.create({ data: { title: 'TechCorp Case Study Carousel', description: 'Client success story carousel for TechCorp enterprise solution', type: 'carousel', stage: 'review', priority: 'high', format: 'square', tags: 'case-study,success-story,enterprise', dueDate: new Date(now.getTime() - 1 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: priya.id, assigneeId: sarah.id, teamId: contentTeam.id } }),
      db.content.create({ data: { title: 'FashionHub Influencer Collaboration Post', description: 'Sponsored post with @StyleMaven featuring FashionHub summer accessories', type: 'post', stage: 'review', priority: 'high', format: 'square', tags: 'influencer,sponsored,accessories', dueDate: new Date(now.getTime() - 1 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: emma.id, assigneeId: priya.id, teamId: contentTeam.id } }),
      db.content.create({ data: { title: 'AutoDrive Test Drive Story Series', description: '5-part Instagram story series of real customer test drive experiences', type: 'story', stage: 'review', priority: 'medium', format: 'vertical', tags: 'test-drive,stories,customer-experience', dueDate: new Date(now.getTime() - 2 * dayMs), organizationId: org.id, campaignId: autodriveCampaign.id, creatorId: david.id, assigneeId: jake.id, teamId: contentTeam.id } }),
      // APPROVE stage
      db.content.create({ data: { title: 'TechCorp LinkedIn Thought Leadership Article', description: 'Long-form article on the future of cloud infrastructure for LinkedIn publishing', type: 'article', stage: 'approve', priority: 'medium', format: 'landscape', tags: 'thought-leadership,linkedin,cloud', dueDate: new Date(now.getTime() - 3 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: priya.id, assigneeId: sarah.id, teamId: contentTeam.id } }),
      db.content.create({ data: { title: 'FashionHub Summer Sale Announcement', description: 'Promotional graphics and copy for the 4th of July summer sale event', type: 'post', stage: 'approve', priority: 'urgent', format: 'square', tags: 'sale,promotion,summer', dueDate: new Date(now.getTime() - 1 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: emma.id, assigneeId: sarah.id, teamId: contentTeam.id } }),
      db.content.create({ data: { title: 'WellnessCo 30-Day Challenge Graphic', description: 'Launch graphic for the 30-day wellness challenge community event', type: 'graphic', stage: 'approve', priority: 'medium', format: 'square', tags: 'challenge,community,wellness', dueDate: new Date(now.getTime() - 2 * dayMs), organizationId: org.id, creatorId: luna.id, assigneeId: sarah.id, teamId: designTeam.id } }),
      // DISSEMINATE stage
      db.content.create({ data: { title: 'TechCorp Feature Launch Thread', description: 'Twitter/X thread announcing the top 5 new features of the platform', type: 'post', stage: 'disseminate', priority: 'high', format: 'landscape', tags: 'launch,thread,features', dueDate: new Date(now.getTime() - 5 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: david.id, assigneeId: alex.id, teamId: disseminationTeam.id } }),
      db.content.create({ data: { title: 'FashionHub Style Guide TikTok', description: 'TikTok video showing 3 ways to style a summer outfit', type: 'video', stage: 'disseminate', priority: 'high', format: 'vertical', tags: 'style-guide,tiktok,outfit', dueDate: new Date(now.getTime() - 4 * dayMs), organizationId: org.id, campaignId: fashionCampaign.id, creatorId: luna.id, assigneeId: alex.id, teamId: disseminationTeam.id } }),
      db.content.create({ data: { title: 'AutoDrive EV Range Explainer Video', description: 'Short-form explainer video about EV range and charging for YouTube Shorts', type: 'video', stage: 'disseminate', priority: 'medium', format: 'vertical', tags: 'ev-range,explainer,youtube-shorts', dueDate: new Date(now.getTime() - 6 * dayMs), organizationId: org.id, campaignId: autodriveCampaign.id, creatorId: david.id, assigneeId: luna.id, teamId: disseminationTeam.id } }),
      // ARCHIVED stage
      db.content.create({ data: { title: 'AutoDrive Holiday Campaign Banner', description: 'Holiday season promotional banners across all platforms', type: 'graphic', stage: 'archived', priority: 'low', format: 'landscape', tags: 'holiday,promotional,banner', dueDate: new Date(now.getTime() - 30 * dayMs), publishedAt: new Date(now.getTime() - 35 * dayMs), organizationId: org.id, campaignId: autodriveCampaign.id, creatorId: jake.id, assigneeId: emma.id, teamId: archiveTeam.id } }),
      db.content.create({ data: { title: 'TechCorp Year-in-Review Video', description: 'Annual recap video highlighting TechCorp milestones and achievements', type: 'video', stage: 'archived', priority: 'low', format: 'landscape', tags: 'year-in-review,recap,milestones', dueDate: new Date(now.getTime() - 60 * dayMs), publishedAt: new Date(now.getTime() - 55 * dayMs), organizationId: org.id, campaignId: techcorpCampaign.id, creatorId: marcus.id, assigneeId: emma.id, teamId: archiveTeam.id } }),
    ])

    // ============================================
    // 7. Social Accounts
    // ============================================
    const socialAccounts = await Promise.all([
      db.socialAccount.create({ data: { platform: 'instagram', accountId: 'ig_techcorp_official', username: '@techcorp', displayName: 'TechCorp Official', followers: 245000, isVerified: true, isActive: true, userId: alex.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'instagram', accountId: 'ig_fashionhub', username: '@fashionhub', displayName: 'FashionHub', followers: 890000, isVerified: true, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'facebook', accountId: 'fb_techcorp', username: 'TechCorp', displayName: 'TechCorp Inc.', followers: 180000, isVerified: true, isActive: true, userId: alex.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'facebook', accountId: 'fb_foodvibe', username: 'FoodVibe', displayName: 'FoodVibe', followers: 320000, isVerified: false, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'twitter', accountId: 'tw_techcorp', username: '@techcorp_io', displayName: 'TechCorp', followers: 95000, isVerified: true, isActive: true, userId: alex.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'twitter', accountId: 'tw_autodrive', username: '@autodrive_ev', displayName: 'AutoDrive', followers: 67000, isVerified: false, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'linkedin', accountId: 'li_techcorp', username: 'techcorp', displayName: 'TechCorp', followers: 420000, isVerified: true, isActive: true, userId: alex.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'linkedin', accountId: 'li_wellnessco', username: 'wellnessco', displayName: 'WellnessCo', followers: 28000, isVerified: false, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'tiktok', accountId: 'tt_fashionhub', username: '@fashionhub', displayName: 'FashionHub', followers: 1250000, isVerified: true, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'tiktok', accountId: 'tt_foodvibe', username: '@foodvibe', displayName: 'FoodVibe', followers: 560000, isVerified: false, isActive: true, userId: luna.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'youtube', accountId: 'yt_techcorp', username: 'TechCorp', displayName: 'TechCorp', followers: 78000, isVerified: true, isActive: true, userId: alex.id, organizationId: org.id } }),
      db.socialAccount.create({ data: { platform: 'youtube', accountId: 'yt_autodrive', username: 'AutoDrive', displayName: 'AutoDrive Official', followers: 145000, isVerified: false, isActive: true, userId: alex.id, organizationId: org.id } }),
    ])

    // ============================================
    // 8. Posts
    // ============================================
    const [igTechcorp, igFashionhub, fbTechcorp, fbFoodvibe, twTechcorp, twAutodrive, liTechcorp, liWellnessco, ttFashionhub, ttFoodvibe, ytTechcorp, ytAutodrive] = socialAccounts

    const posts = await Promise.all([
      // Published
      db.post.create({ data: { content: '🚀 Exciting news! Our new enterprise platform just got 5 game-changing features. See what\'s new →', platform: 'instagram', status: 'published', scheduledAt: new Date(now.getTime() - 7 * dayMs), publishedAt: new Date(now.getTime() - 7 * dayMs), engagement: JSON.stringify({ likes: 1240, comments: 89, shares: 234, saves: 156, impressions: 45000 }), socialAccountId: igTechcorp.id, contentId: contentItems[16].id, userId: alex.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Summer vibes are here! ☀️ Swipe to see our top 10 looks from the new collection → #FashionHubSummer', platform: 'instagram', status: 'published', scheduledAt: new Date(now.getTime() - 5 * dayMs), publishedAt: new Date(now.getTime() - 5 * dayMs), engagement: JSON.stringify({ likes: 8900, comments: 432, shares: 1200, saves: 2300, impressions: 350000 }), socialAccountId: igFashionhub.id, contentId: contentItems[17].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'The future of cloud computing is here. Our CEO shares insights on what enterprise AI means for your business. Read the full article on our blog.', platform: 'linkedin', status: 'published', scheduledAt: new Date(now.getTime() - 3 * dayMs), publishedAt: new Date(now.getTime() - 3 * dayMs), engagement: JSON.stringify({ likes: 340, comments: 56, shares: 89, impressions: 28000 }), socialAccountId: liTechcorp.id, userId: alex.id, organizationId: org.id } }),
      db.post.create({ data: { content: '3 ways to style your summer outfit 🌴 Which one is your fave? #FashionHub #SummerStyle #OOTD', platform: 'tiktok', status: 'published', scheduledAt: new Date(now.getTime() - 4 * dayMs), publishedAt: new Date(now.getTime() - 4 * dayMs), engagement: JSON.stringify({ likes: 45000, comments: 2100, shares: 8900, views: 890000 }), socialAccountId: ttFashionhub.id, contentId: contentItems[17].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: '🎄 Holiday season is here! Save big on AutoDrive this season. Visit autodrive.com for exclusive deals.', platform: 'facebook', status: 'published', scheduledAt: new Date(now.getTime() - 35 * dayMs), publishedAt: new Date(now.getTime() - 35 * dayMs), engagement: JSON.stringify({ likes: 890, comments: 45, shares: 120, impressions: 65000 }), socialAccountId: fbTechcorp.id, userId: alex.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'How far can an EV really go? We put our models to the test. Watch the full video on YouTube →', platform: 'twitter', status: 'published', scheduledAt: new Date(now.getTime() - 6 * dayMs), publishedAt: new Date(now.getTime() - 6 * dayMs), engagement: JSON.stringify({ likes: 234, comments: 18, retweets: 67, impressions: 45000 }), socialAccountId: twAutodrive.id, contentId: contentItems[18].id, userId: luna.id, organizationId: org.id } }),
      // Scheduled
      db.post.create({ data: { content: '📣 New feature alert! Our platform now supports real-time collaboration. See it in action →', platform: 'twitter', status: 'scheduled', scheduledAt: new Date(now.getTime() + 1 * dayMs), socialAccountId: twTechcorp.id, contentId: contentItems[16].id, userId: alex.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Summer Sale starts NOW! 🎉 Up to 50% off select items. Shop the collection → #FashionHubSale', platform: 'instagram', status: 'scheduled', scheduledAt: new Date(now.getTime() + 2 * dayMs), socialAccountId: igFashionhub.id, contentId: contentItems[15].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Wondering about EV range? Our latest explainer breaks down everything you need to know about going electric.', platform: 'youtube', status: 'scheduled', scheduledAt: new Date(now.getTime() + 3 * dayMs), socialAccountId: ytAutodrive.id, contentId: contentItems[18].id, userId: alex.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Monday motivation! Start your week with these 3 simple mindfulness techniques 🧘‍♀️ #WellnessCo', platform: 'linkedin', status: 'scheduled', scheduledAt: new Date(now.getTime() + 4 * dayMs), socialAccountId: liWellnessco.id, contentId: contentItems[14].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Fresh recipes coming your way! 🍳 This week\'s seasonal special: Lemon Herb Grilled Salmon', platform: 'facebook', status: 'scheduled', scheduledAt: new Date(now.getTime() + 5 * dayMs), socialAccountId: fbFoodvibe.id, userId: luna.id, organizationId: org.id } }),
      // Draft
      db.post.create({ data: { content: 'Behind the scenes of our product photoshoot 📸 Stay tuned for the full reveal!', platform: 'instagram', status: 'draft', socialAccountId: igFashionhub.id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Introducing Kitchen Stories: a new video series featuring local chefs and their signature dishes.', platform: 'tiktok', status: 'draft', socialAccountId: ttFoodvibe.id, contentId: contentItems[8].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Our 30-day wellness challenge starts soon! Are you ready? Sign up at wellnessco.com/challenge', platform: 'instagram', status: 'draft', socialAccountId: igFashionhub.id, contentId: contentItems[14].id, userId: luna.id, organizationId: org.id } }),
      db.post.create({ data: { content: 'Customer spotlight: How TechCorp helped Acme Inc reduce their infrastructure costs by 40%', platform: 'linkedin', status: 'draft', socialAccountId: liTechcorp.id, contentId: contentItems[10].id, userId: alex.id, organizationId: org.id } }),
    ])

    // ============================================
    // 9. Automation Rules
    // ============================================
    const automations = await Promise.all([
      db.automationRule.create({ data: { name: 'Auto-assign to Design Team', description: 'When content moves to design stage, automatically assign to the Design team lead', trigger: 'stage_change', conditions: JSON.stringify({ fromStage: 'idea', toStage: 'design' }), actions: JSON.stringify({ assignToTeam: 'design', notifyTeamLead: true }), isActive: true, organizationId: org.id } }),
      db.automationRule.create({ data: { name: 'Content Review Reminder', description: 'Send a reminder when content has been in review stage for more than 48 hours', trigger: 'scheduled_time', conditions: JSON.stringify({ stage: 'review', hoursInStage: 48 }), actions: JSON.stringify({ sendReminder: true, escalateTo: 'admin' }), isActive: true, organizationId: org.id } }),
      db.automationRule.create({ data: { name: 'Auto-archive Completed Campaigns', description: 'Move all content to archive when a campaign status changes to completed', trigger: 'stage_change', conditions: JSON.stringify({ campaignStatus: 'completed' }), actions: JSON.stringify({ moveContentToArchive: true }), isActive: true, organizationId: org.id } }),
      db.automationRule.create({ data: { name: 'High Engagement Alert', description: 'Notify the team when a published post gets more than 1000 likes in the first hour', trigger: 'engagement_threshold', conditions: JSON.stringify({ metric: 'likes', threshold: 1000, timeWindow: '1h' }), actions: JSON.stringify({ notifyTeam: true, boostPost: true }), isActive: true, organizationId: org.id } }),
      db.automationRule.create({ data: { name: 'New Content Welcome Message', description: 'Send a welcome message to the content creator when new content is created', trigger: 'content_created', conditions: JSON.stringify({ contentType: ['post', 'video', 'graphic'] }), actions: JSON.stringify({ sendMessage: true, assignDefaultTeam: true }), isActive: false, organizationId: org.id } }),
    ])

    // ============================================
    // 10. Comments
    // ============================================
    await Promise.all([
      db.comment.create({ data: { text: 'Great concept! Let\'s make sure we highlight the AI-powered features prominently.', contentId: contentItems[0].id, userId: sarah.id } }),
      db.comment.create({ data: { text: 'I agree. Should we also include a demo snippet in the intro?', contentId: contentItems[0].id, userId: marcus.id } }),
      db.comment.create({ data: { text: 'The color palette needs to match TechCorp\'s brand guidelines. Please use the updated brand kit.', contentId: contentItems[4].id, userId: sarah.id } }),
      db.comment.create({ data: { text: 'Updated the colors. Can you review the new version?', contentId: contentItems[4].id, userId: jake.id } }),
      db.comment.create({ data: { text: 'This is urgent - the client wants it by Friday. Can we prioritize?', contentId: contentItems[7].id, userId: marcus.id } }),
      db.comment.create({ data: { text: 'Already on it. I\'ll have the first draft by tomorrow morning.', contentId: contentItems[7].id, userId: luna.id } }),
      db.comment.create({ data: { text: 'The video needs better transitions between sections. Also, the audio levels are inconsistent.', contentId: contentItems[8].id, userId: marcus.id } }),
      db.comment.create({ data: { text: 'Good catch! I\'ll fix the transitions and normalize the audio.', contentId: contentItems[8].id, userId: david.id } }),
      db.comment.create({ data: { text: 'Client approved the draft copy. Ready for final review.', contentId: contentItems[10].id, userId: priya.id } }),
      db.comment.create({ data: { text: 'Looks great! Minor edits on slide 3 - the font size is too small.', contentId: contentItems[10].id, userId: sarah.id } }),
      db.comment.create({ data: { text: 'Need to get influencer approval before we publish this.', contentId: contentItems[11].id, userId: priya.id } }),
      db.comment.create({ data: { text: 'Influencer approved! We\'re good to go.', contentId: contentItems[11].id, userId: emma.id } }),
      db.comment.create({ data: { text: 'The sale copy needs more urgency. Add countdown language.', contentId: contentItems[15].id, userId: sarah.id } }),
      db.comment.create({ data: { text: 'Updated with "Limited time only" and "Ends Sunday" messaging.', contentId: contentItems[15].id, userId: emma.id } }),
      db.comment.create({ data: { text: 'Please schedule this for Monday 9AM EST.', contentId: contentItems[16].id, userId: alex.id } }),
    ])

    // ============================================
    // 11. Activity Log
    // ============================================
    await Promise.all([
      db.activityLog.create({ data: { action: 'created', entity: 'content', entityId: contentItems[0].id, details: JSON.stringify({ title: 'TechCorp CEO Spotlight Interview', stage: 'idea' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 2 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'content', entityId: contentItems[1].id, details: JSON.stringify({ title: 'FashionHub Summer Lookbook Reel', stage: 'idea' }), organizationId: org.id, actorId: luna.id, createdAt: new Date(now.getTime() - 2 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[4].id, details: JSON.stringify({ title: 'TechCorp Product Feature Infographic', fromStage: 'idea', toStage: 'design' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.9 * dayMs) } }),
      db.activityLog.create({ data: { action: 'assigned', entity: 'content', entityId: contentItems[4].id, details: JSON.stringify({ title: 'TechCorp Product Feature Infographic', assignee: 'Jake Morrison' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.9 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[7].id, details: JSON.stringify({ title: 'AutoDrive EV Comparison Chart', fromStage: 'idea', toStage: 'design' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.8 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'content', entityId: contentItems[8].id, details: JSON.stringify({ title: 'TechCorp Platform Demo Video', stage: 'edit' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.7 * dayMs) } }),
      db.activityLog.create({ data: { action: 'commented', entity: 'content', entityId: contentItems[0].id, details: JSON.stringify({ title: 'TechCorp CEO Spotlight Interview', comment: 'Great concept!' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 1.5 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[10].id, details: JSON.stringify({ title: 'TechCorp Case Study Carousel', fromStage: 'edit', toStage: 'review' }), organizationId: org.id, actorId: priya.id, createdAt: new Date(now.getTime() - 1.4 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[11].id, details: JSON.stringify({ title: 'FashionHub Influencer Collaboration Post', fromStage: 'edit', toStage: 'review' }), organizationId: org.id, actorId: emma.id, createdAt: new Date(now.getTime() - 1.3 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[0].id, details: JSON.stringify({ platform: 'instagram', account: '@techcorp' }), organizationId: org.id, actorId: alex.id, createdAt: new Date(now.getTime() - 7 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[1].id, details: JSON.stringify({ platform: 'instagram', account: '@fashionhub' }), organizationId: org.id, actorId: luna.id, createdAt: new Date(now.getTime() - 5 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[2].id, details: JSON.stringify({ platform: 'linkedin', account: 'TechCorp' }), organizationId: org.id, actorId: alex.id, createdAt: new Date(now.getTime() - 3 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[3].id, details: JSON.stringify({ platform: 'tiktok', account: '@fashionhub' }), organizationId: org.id, actorId: luna.id, createdAt: new Date(now.getTime() - 4 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[13].id, details: JSON.stringify({ title: 'TechCorp LinkedIn Thought Leadership Article', fromStage: 'review', toStage: 'approve' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 1.2 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[14].id, details: JSON.stringify({ title: 'FashionHub Summer Sale Announcement', fromStage: 'review', toStage: 'approve' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 1.1 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[16].id, details: JSON.stringify({ title: 'TechCorp Feature Launch Thread', fromStage: 'approve', toStage: 'disseminate' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 1 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[17].id, details: JSON.stringify({ title: 'FashionHub Style Guide TikTok', fromStage: 'approve', toStage: 'disseminate' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 0.9 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'campaign', entityId: foodvibeCampaign.id, details: JSON.stringify({ name: 'FoodVibe Taste Stories', status: 'draft' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 3 * dayMs) } }),
      db.activityLog.create({ data: { action: 'updated', entity: 'campaign', entityId: techcorpCampaign.id, details: JSON.stringify({ name: 'TechCorp Spring Launch 2025', field: 'budget', value: 45000 }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 2.5 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'account', entityId: socialAccounts[0].id, details: JSON.stringify({ platform: 'instagram', username: '@techcorp' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 30 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'account', entityId: socialAccounts[1].id, details: JSON.stringify({ platform: 'instagram', username: '@fashionhub' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 30 * dayMs) } }),
      db.activityLog.create({ data: { action: 'assigned', entity: 'content', entityId: contentItems[5].id, details: JSON.stringify({ title: 'FashionHub Brand Story Carousel', assignee: 'Alex Nakamura' }), organizationId: org.id, actorId: jake.id, createdAt: new Date(now.getTime() - 1.6 * dayMs) } }),
      db.activityLog.create({ data: { action: 'commented', entity: 'content', entityId: contentItems[7].id, details: JSON.stringify({ title: 'AutoDrive EV Comparison Chart', comment: 'This is urgent!' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.5 * dayMs) } }),
      db.activityLog.create({ data: { action: 'commented', entity: 'content', entityId: contentItems[8].id, details: JSON.stringify({ title: 'TechCorp Platform Demo Video', comment: 'Needs better transitions' }), organizationId: org.id, actorId: marcus.id, createdAt: new Date(now.getTime() - 1.4 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[18].id, details: JSON.stringify({ title: 'AutoDrive EV Range Explainer Video', fromStage: 'approve', toStage: 'disseminate' }), organizationId: org.id, actorId: sarah.id, createdAt: new Date(now.getTime() - 0.8 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[15].id, details: JSON.stringify({ title: 'FashionHub Summer Sale Announcement', fromStage: 'design', toStage: 'approve' }), organizationId: org.id, actorId: jake.id, createdAt: new Date(now.getTime() - 0.7 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'content', entityId: contentItems[2].id, details: JSON.stringify({ title: 'FoodVibe Recipe Card Series', stage: 'idea' }), organizationId: org.id, actorId: priya.id, createdAt: new Date(now.getTime() - 0.6 * dayMs) } }),
      db.activityLog.create({ data: { action: 'created', entity: 'content', entityId: contentItems[3].id, details: JSON.stringify({ title: 'AutoDrive Community Poll Series', stage: 'idea' }), organizationId: org.id, actorId: emma.id, createdAt: new Date(now.getTime() - 0.5 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[6].id, details: JSON.stringify({ title: 'WellnessCo Mindfulness Tips Graphic Set', fromStage: 'idea', toStage: 'design' }), organizationId: org.id, actorId: luna.id, createdAt: new Date(now.getTime() - 0.4 * dayMs) } }),
      db.activityLog.create({ data: { action: 'updated', entity: 'content', entityId: contentItems[12].id, details: JSON.stringify({ title: 'AutoDrive Test Drive Story Series', field: 'priority', value: 'medium' }), organizationId: org.id, actorId: david.id, createdAt: new Date(now.getTime() - 0.3 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[4].id, details: JSON.stringify({ platform: 'facebook', account: 'TechCorp Inc.' }), organizationId: org.id, actorId: alex.id, createdAt: new Date(now.getTime() - 35 * dayMs) } }),
      db.activityLog.create({ data: { action: 'published', entity: 'post', entityId: posts[5].id, details: JSON.stringify({ platform: 'twitter', account: '@autodrive_ev' }), organizationId: org.id, actorId: luna.id, createdAt: new Date(now.getTime() - 6 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[19].id, details: JSON.stringify({ title: 'AutoDrive Holiday Campaign Banner', fromStage: 'disseminate', toStage: 'archived' }), organizationId: org.id, actorId: emma.id, createdAt: new Date(now.getTime() - 30 * dayMs) } }),
      db.activityLog.create({ data: { action: 'moved', entity: 'content', entityId: contentItems[20].id, details: JSON.stringify({ title: 'TechCorp Year-in-Review Video', fromStage: 'disseminate', toStage: 'archived' }), organizationId: org.id, actorId: emma.id, createdAt: new Date(now.getTime() - 55 * dayMs) } }),
    ])

    // ============================================
    // HR: Departments
    // ============================================
    const departments = await Promise.all([
      db.department.create({ data: { name: 'Engineering', description: 'Software development and technical operations', color: '#10b981', headId: marcus.id, organizationId: org.id } }),
      db.department.create({ data: { name: 'Marketing', description: 'Brand strategy, campaigns, and content creation', color: '#f59e0b', headId: priya.id, organizationId: org.id } }),
      db.department.create({ data: { name: 'Design', description: 'Visual design, UX/UI, and creative assets', color: '#ec4899', headId: jake.id, organizationId: org.id } }),
      db.department.create({ data: { name: 'Human Resources', description: 'People operations, recruitment, and culture', color: '#8b5cf6', headId: luna.id, organizationId: org.id } }),
      db.department.create({ data: { name: 'Finance', description: 'Financial planning, accounting, and payroll', color: '#06b6d4', headId: david.id, organizationId: org.id } }),
      db.department.create({ data: { name: 'Operations', description: 'Business operations and process optimization', color: '#f97316', headId: emma.id, organizationId: org.id } }),
    ])

    const [engDept, mktDept, designDept, hrDept, finDept, opsDept] = departments

    // ============================================
    // HR: Employees
    // ============================================
    const employees = await Promise.all([
      db.employee.create({ data: { employeeId: 'EMP-001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@vortexdigital.com', phone: '+1-555-0101', position: 'CEO', departmentId: engDept.id, hireDate: new Date('2021-01-15'), status: 'active', employmentType: 'full-time', salary: 185000, salaryCurrency: 'USD', bankAccount: '****4521', taxId: 'SSN-***-**-1234', emergencyContact: 'James Chen +1-555-0102', address: '123 Tech Ave, San Francisco, CA', userId: sarah.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-002', firstName: 'Marcus', lastName: 'Williams', email: 'marcus.williams@vortexdigital.com', phone: '+1-555-0103', position: 'VP of Engineering', departmentId: engDept.id, hireDate: new Date('2021-03-01'), status: 'active', employmentType: 'full-time', salary: 165000, salaryCurrency: 'USD', bankAccount: '****7832', taxId: 'SSN-***-**-5678', emergencyContact: 'Lisa Williams +1-555-0104', address: '456 Code St, San Francisco, CA', userId: marcus.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-003', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@vortexdigital.com', phone: '+1-555-0105', position: 'Marketing Director', departmentId: mktDept.id, hireDate: new Date('2021-06-15'), status: 'active', employmentType: 'full-time', salary: 145000, salaryCurrency: 'USD', bankAccount: '****3291', taxId: 'SSN-***-**-9012', emergencyContact: 'Raj Sharma +1-555-0106', address: '789 Market Blvd, San Jose, CA', userId: priya.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-004', firstName: 'Jake', lastName: 'Morrison', email: 'jake.morrison@vortexdigital.com', phone: '+1-555-0107', position: 'Creative Director', departmentId: designDept.id, hireDate: new Date('2021-09-01'), status: 'active', employmentType: 'full-time', salary: 135000, salaryCurrency: 'USD', bankAccount: '****6543', taxId: 'SSN-***-**-3456', emergencyContact: 'Amy Morrison +1-555-0108', address: '321 Design Ln, Oakland, CA', userId: jake.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-005', firstName: 'Luna', lastName: 'Rodriguez', email: 'luna.rodriguez@vortexdigital.com', phone: '+1-555-0109', position: 'HR Manager', departmentId: hrDept.id, hireDate: new Date('2022-01-10'), status: 'active', employmentType: 'full-time', salary: 115000, salaryCurrency: 'USD', bankAccount: '****8765', taxId: 'SSN-***-**-7890', emergencyContact: 'Carlos Rodriguez +1-555-0110', address: '654 People Dr, San Francisco, CA', userId: luna.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-006', firstName: 'David', lastName: 'Kim', email: 'david.kim@vortexdigital.com', phone: '+1-555-0111', position: 'Finance Director', departmentId: finDept.id, hireDate: new Date('2022-03-15'), status: 'active', employmentType: 'full-time', salary: 140000, salaryCurrency: 'USD', bankAccount: '****2345', taxId: 'SSN-***-**-2345', emergencyContact: 'Suki Kim +1-555-0112', address: '987 Finance Way, Palo Alto, CA', userId: david.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-007', firstName: 'Emma', lastName: 'Thompson', email: 'emma.thompson@vortexdigital.com', phone: '+1-555-0113', position: 'Operations Manager', departmentId: opsDept.id, hireDate: new Date('2022-06-01'), status: 'active', employmentType: 'full-time', salary: 120000, salaryCurrency: 'USD', bankAccount: '****5678', taxId: 'SSN-***-**-6789', emergencyContact: 'Tom Thompson +1-555-0114', address: '147 Ops Circle, Mountain View, CA', userId: emma.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-008', firstName: 'Alex', lastName: 'Nakamura', email: 'alex.nakamura@vortexdigital.com', phone: '+1-555-0115', position: 'Senior Developer', departmentId: engDept.id, hireDate: new Date('2022-09-15'), status: 'on_leave', employmentType: 'full-time', salary: 130000, salaryCurrency: 'USD', bankAccount: '****9012', taxId: 'SSN-***-**-0123', emergencyContact: 'Yuki Nakamura +1-555-0116', address: '258 Dev Road, San Francisco, CA', userId: alex.id, organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-009', firstName: 'Mia', lastName: 'Chang', email: 'mia.chang@vortexdigital.com', phone: '+1-555-0117', position: 'Content Strategist', departmentId: mktDept.id, hireDate: new Date('2023-01-20'), status: 'active', employmentType: 'full-time', salary: 95000, salaryCurrency: 'USD', bankAccount: '****3456', taxId: 'SSN-***-**-4567', emergencyContact: 'Wei Chang +1-555-0118', address: '369 Content Ave, San Jose, CA', organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-010', firstName: 'Ryan', lastName: 'O\'Brien', email: 'ryan.obrien@vortexdigital.com', phone: '+1-555-0119', position: 'UX Designer', departmentId: designDept.id, hireDate: new Date('2023-04-01'), status: 'probation', employmentType: 'full-time', salary: 90000, salaryCurrency: 'USD', bankAccount: '****7890', taxId: 'SSN-***-**-8901', emergencyContact: 'Kate O\'Brien +1-555-0120', address: '481 Design Blvd, Oakland, CA', organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-011', firstName: 'Sophie', lastName: 'Martinez', email: 'sophie.martinez@vortexdigital.com', phone: '+1-555-0121', position: 'Junior Developer', departmentId: engDept.id, hireDate: new Date('2024-01-15'), status: 'probation', employmentType: 'full-time', salary: 78000, salaryCurrency: 'USD', bankAccount: '****1357', taxId: 'SSN-***-**-2468', emergencyContact: 'Pablo Martinez +1-555-0122', address: '592 Code Way, San Francisco, CA', organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-012', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@vortexdigital.com', phone: '+1-555-0123', position: 'Accountant', departmentId: finDept.id, hireDate: new Date('2022-11-01'), status: 'active', employmentType: 'full-time', salary: 85000, salaryCurrency: 'USD', bankAccount: '****2468', taxId: 'SSN-***-**-1357', emergencyContact: 'Mary Wilson +1-555-0124', address: '703 Ledger St, Palo Alto, CA', organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-013', firstName: 'Olivia', lastName: 'Patel', email: 'olivia.patel@vortexdigital.com', phone: '+1-555-0125', position: 'Social Media Manager', departmentId: mktDept.id, hireDate: new Date('2023-07-01'), status: 'active', employmentType: 'part-time', salary: 65000, salaryCurrency: 'USD', bankAccount: '****3579', taxId: 'SSN-***-**-4680', emergencyContact: 'Ravi Patel +1-555-0126', address: '814 Social Ave, San Jose, CA', organizationId: org.id } }),
      db.employee.create({ data: { employeeId: 'EMP-014', firstName: 'Nathan', lastName: 'Brooks', email: 'nathan.brooks@vortexdigital.com', phone: '+1-555-0127', position: 'Backend Developer', departmentId: engDept.id, hireDate: new Date('2021-05-20'), status: 'terminated', employmentType: 'full-time', salary: 125000, salaryCurrency: 'USD', bankAccount: '****4680', taxId: 'SSN-***-**-5791', emergencyContact: 'Diana Brooks +1-555-0128', address: '925 Server Ln, San Francisco, CA', organizationId: org.id } }),
    ])

    const [empSarah, empMarcus, empPriya, empJake, empLuna, empDavid, empEmma, empAlex, empMia, empRyan, empSophie, empJames, empOlivia, empNathan] = employees

    // ============================================
    // HR: Attendance (last 5 working days for each employee)
    // ============================================
    const attendanceStatuses = ['present', 'late', 'half-day', 'leave', 'absent'] as const
    const statusWeights: Record<string, number> = { present: 0.65, late: 0.20, 'half-day': 0.07, leave: 0.05, absent: 0.03 }
    const statusNotes: Record<string, string> = {
      present: 'On time, regular work day',
      late: 'Late arrival — clocked in after 9:30 AM',
      'half-day': 'Half-day — left after lunch',
      leave: 'On approved leave',
      absent: 'No show, no prior notice',
    }

    // Build a list of the last 5 working days (skipping weekends)
    const workingDays: Date[] = []
    const cursor = new Date(now)
    // Start from "yesterday" so the most recent day is a completed workday
    cursor.setDate(cursor.getDate() - 1)
    while (workingDays.length < 5) {
      const day = cursor.getDay()
      if (day !== 0 && day !== 6) {
        // 0 = Sunday, 6 = Saturday
        workingDays.push(new Date(cursor))
      }
      cursor.setDate(cursor.getDate() - 1)
    }

    const attendancePromises: Promise<unknown>[] = []
    for (const emp of employees) {
      // Terminated employees don't have recent attendance
      if (emp.status === 'terminated') continue

      for (const day of workingDays) {
        const roll = Math.random()
        let cum = 0
        let status: (typeof attendanceStatuses)[number] = 'present'
        for (const s of attendanceStatuses) {
          cum += statusWeights[s]
          if (roll <= cum) {
            status = s
            break
          }
        }

        // Employees currently on leave get "leave" for the most recent day
        if (emp.status === 'on_leave' && day.getTime() === workingDays[0].getTime()) {
          status = 'leave'
        }

        let clockIn: Date | null = null
        let clockOut: Date | null = null
        const dateBase = new Date(day)
        dateBase.setHours(0, 0, 0, 0)

        if (status === 'present') {
          // Clock in 8:30 - 9:30 AM
          clockIn = new Date(dateBase.getTime() + (8 * 60 + 30 + Math.floor(Math.random() * 60)) * 60 * 1000)
          // Clock out 5:30 - 7:00 PM
          clockOut = new Date(dateBase.getTime() + (17 * 60 + 30 + Math.floor(Math.random() * 90)) * 60 * 1000)
        } else if (status === 'late') {
          // Clock in 9:31 - 10:00 AM
          clockIn = new Date(dateBase.getTime() + (9 * 60 + 31 + Math.floor(Math.random() * 29)) * 60 * 1000)
          // Clock out 5:30 - 7:00 PM
          clockOut = new Date(dateBase.getTime() + (17 * 60 + 30 + Math.floor(Math.random() * 90)) * 60 * 1000)
        } else if (status === 'half-day') {
          // Clock in 8:30 - 9:30 AM
          clockIn = new Date(dateBase.getTime() + (8 * 60 + 30 + Math.floor(Math.random() * 60)) * 60 * 1000)
          // Clock out 12:00 - 1:00 PM
          clockOut = new Date(dateBase.getTime() + (12 * 60 + Math.floor(Math.random() * 60)) * 60 * 1000)
        }
        // leave & absent => clockIn/clockOut stay null

        const workHours = clockIn && clockOut
          ? Math.round(((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
          : null

        attendancePromises.push(
          db.attendance.create({
            data: {
              employeeId: emp.id,
              date: dateBase,
              clockIn,
              clockOut,
              status,
              workHours,
              notes: statusNotes[status],
              organizationId: org.id,
            },
          })
        )
      }
    }
    await Promise.all(attendancePromises)

    // ============================================
    // HR: Leave Requests
    // ============================================
    await Promise.all([
      db.leaveRequest.create({ data: { employeeId: empAlex.id, type: 'vacation', startDate: new Date(now.getTime() - 3 * dayMs), endDate: new Date(now.getTime() + 4 * dayMs), days: 7, reason: 'Family vacation to Japan', status: 'approved', approvedById: empMarcus.id, approvedAt: new Date(now.getTime() - 10 * dayMs), organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empMia.id, type: 'sick', startDate: new Date(now.getTime() - 1 * dayMs), endDate: new Date(now.getTime() + 1 * dayMs), days: 3, reason: 'Flu recovery', status: 'pending', organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empEmma.id, type: 'personal', startDate: new Date(now.getTime() + 5 * dayMs), endDate: new Date(now.getTime() + 6 * dayMs), days: 2, reason: 'Moving to new apartment', status: 'pending', organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empRyan.id, type: 'vacation', startDate: new Date(now.getTime() + 14 * dayMs), endDate: new Date(now.getTime() + 21 * dayMs), days: 7, reason: 'Honeymoon trip', status: 'pending', organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empSarah.id, type: 'personal', startDate: new Date(now.getTime() - 15 * dayMs), endDate: new Date(now.getTime() - 14 * dayMs), days: 1, reason: 'Doctor appointment', status: 'approved', approvedById: empMarcus.id, approvedAt: new Date(now.getTime() - 20 * dayMs), organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empJames.id, type: 'sick', startDate: new Date(now.getTime() - 7 * dayMs), endDate: new Date(now.getTime() - 5 * dayMs), days: 3, reason: 'Migraine', status: 'approved', approvedById: empDavid.id, approvedAt: new Date(now.getTime() - 8 * dayMs), organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empOlivia.id, type: 'vacation', startDate: new Date(now.getTime() + 10 * dayMs), endDate: new Date(now.getTime() + 17 * dayMs), days: 7, reason: 'Visit family in India', status: 'rejected', approvedById: empLuna.id, approvedAt: new Date(now.getTime() - 3 * dayMs), comment: 'Too many team members on leave during this period', organizationId: org.id } }),
      db.leaveRequest.create({ data: { employeeId: empSophie.id, type: 'personal', startDate: new Date(now.getTime() + 3 * dayMs), endDate: new Date(now.getTime() + 3 * dayMs), days: 1, reason: 'Bank appointment', status: 'pending', organizationId: org.id } }),
    ])

    // ============================================
    // HR: Payroll Runs & Items
    // ============================================
    const payrollRun1 = await db.payrollRun.create({
      data: {
        period: '2025-01', status: 'completed', runDate: new Date('2025-01-31'), totalGross: 142800, totalDeductions: 42840, totalNet: 99960,
        organizationId: org.id,
        items: {
          create: [
            { employeeId: empSarah.id, baseSalary: 15417, overtime: 0, bonuses: 2000, deductions: 2500, tax: 4375, netPay: 10542, organizationId: org.id },
            { employeeId: empMarcus.id, baseSalary: 13750, overtime: 500, bonuses: 0, deductions: 2200, tax: 3900, netPay: 8150, organizationId: org.id },
            { employeeId: empPriya.id, baseSalary: 12083, overtime: 0, bonuses: 1500, deductions: 1900, tax: 3437, netPay: 8246, organizationId: org.id },
            { employeeId: empJake.id, baseSalary: 11250, overtime: 300, bonuses: 0, deductions: 1800, tax: 3188, netPay: 6562, organizationId: org.id },
            { employeeId: empLuna.id, baseSalary: 9583, overtime: 0, bonuses: 1000, deductions: 1500, tax: 2725, netPay: 6358, organizationId: org.id },
            { employeeId: empDavid.id, baseSalary: 11667, overtime: 0, bonuses: 0, deductions: 1850, tax: 3325, netPay: 6492, organizationId: org.id },
            { employeeId: empEmma.id, baseSalary: 10000, overtime: 200, bonuses: 500, deductions: 1600, tax: 2850, netPay: 6250, organizationId: org.id },
            { employeeId: empAlex.id, baseSalary: 10833, overtime: 0, bonuses: 0, deductions: 1733, tax: 3108, netPay: 5992, organizationId: org.id },
            { employeeId: empMia.id, baseSalary: 7917, overtime: 150, bonuses: 0, deductions: 1267, tax: 2275, netPay: 4525, organizationId: org.id },
            { employeeId: empJames.id, baseSalary: 7083, overtime: 0, bonuses: 300, deductions: 1133, tax: 2033, netPay: 4217, organizationId: org.id },
          ],
        },
      },
    })

    const payrollRun2 = await db.payrollRun.create({
      data: {
        period: '2025-02', status: 'completed', runDate: new Date('2025-02-28'), totalGross: 148500, totalDeductions: 44550, totalNet: 103950,
        organizationId: org.id,
        items: {
          create: [
            { employeeId: empSarah.id, baseSalary: 15417, overtime: 0, bonuses: 3000, deductions: 2600, tax: 4708, netPay: 11109, organizationId: org.id },
            { employeeId: empMarcus.id, baseSalary: 13750, overtime: 750, bonuses: 0, deductions: 2300, tax: 4050, netPay: 8150, organizationId: org.id },
            { employeeId: empPriya.id, baseSalary: 12083, overtime: 0, bonuses: 2000, deductions: 2000, tax: 3625, netPay: 8458, organizationId: org.id },
            { employeeId: empJake.id, baseSalary: 11250, overtime: 500, bonuses: 1000, deductions: 1900, tax: 3438, netPay: 7412, organizationId: org.id },
            { employeeId: empLuna.id, baseSalary: 9583, overtime: 0, bonuses: 500, deductions: 1550, tax: 2775, netPay: 5758, organizationId: org.id },
            { employeeId: empDavid.id, baseSalary: 11667, overtime: 250, bonuses: 0, deductions: 1900, tax: 3417, netPay: 6600, organizationId: org.id },
            { employeeId: empEmma.id, baseSalary: 10000, overtime: 400, bonuses: 500, deductions: 1650, tax: 2925, netPay: 6325, organizationId: org.id },
            { employeeId: empAlex.id, baseSalary: 10833, overtime: 0, bonuses: 0, deductions: 1733, tax: 3108, netPay: 5992, organizationId: org.id },
            { employeeId: empMia.id, baseSalary: 7917, overtime: 300, bonuses: 500, deductions: 1267, tax: 2425, netPay: 5025, organizationId: org.id },
            { employeeId: empSophie.id, baseSalary: 6500, overtime: 0, bonuses: 0, deductions: 1040, tax: 1870, netPay: 3590, organizationId: org.id },
            { employeeId: empJames.id, baseSalary: 7083, overtime: 100, bonuses: 0, deductions: 1133, tax: 2083, netPay: 3967, organizationId: org.id },
            { employeeId: empOlivia.id, baseSalary: 5417, overtime: 0, bonuses: 200, deductions: 867, tax: 1567, netPay: 3183, organizationId: org.id },
          ],
        },
      },
    })

    const payrollRun3 = await db.payrollRun.create({
      data: {
        period: '2025-03', status: 'draft', runDate: new Date(now.getTime()), totalGross: 152000, totalDeductions: 45600, totalNet: 106400,
        organizationId: org.id,
        items: {
          create: [
            { employeeId: empSarah.id, baseSalary: 15417, overtime: 0, bonuses: 0, deductions: 2467, tax: 4429, netPay: 8521, organizationId: org.id },
            { employeeId: empMarcus.id, baseSalary: 13750, overtime: 300, bonuses: 1000, deductions: 2200, tax: 3975, netPay: 8875, organizationId: org.id },
            { employeeId: empPriya.id, baseSalary: 12083, overtime: 0, bonuses: 0, deductions: 1933, tax: 3488, netPay: 6662, organizationId: org.id },
            { employeeId: empJake.id, baseSalary: 11250, overtime: 200, bonuses: 0, deductions: 1800, tax: 3255, netPay: 6395, organizationId: org.id },
            { employeeId: empLuna.id, baseSalary: 9583, overtime: 0, bonuses: 500, deductions: 1533, tax: 2769, netPay: 5781, organizationId: org.id },
            { employeeId: empDavid.id, baseSalary: 11667, overtime: 0, bonuses: 0, deductions: 1867, tax: 3367, netPay: 6433, organizationId: org.id },
            { employeeId: empEmma.id, baseSalary: 10000, overtime: 0, bonuses: 800, deductions: 1600, tax: 2900, netPay: 6300, organizationId: org.id },
            { employeeId: empAlex.id, baseSalary: 10833, overtime: 0, bonuses: 0, deductions: 1733, tax: 3108, netPay: 5992, organizationId: org.id },
            { employeeId: empMia.id, baseSalary: 7917, overtime: 0, bonuses: 300, deductions: 1267, tax: 2300, netPay: 4650, organizationId: org.id },
            { employeeId: empRyan.id, baseSalary: 7500, overtime: 0, bonuses: 0, deductions: 1200, tax: 2175, netPay: 4125, organizationId: org.id },
            { employeeId: empSophie.id, baseSalary: 6500, overtime: 100, bonuses: 0, deductions: 1040, tax: 1895, netPay: 3665, organizationId: org.id },
            { employeeId: empJames.id, baseSalary: 7083, overtime: 0, bonuses: 200, deductions: 1133, tax: 2067, netPay: 4083, organizationId: org.id },
            { employeeId: empOlivia.id, baseSalary: 5417, overtime: 0, bonuses: 0, deductions: 867, tax: 1566, netPay: 2984, organizationId: org.id },
          ],
        },
      },
    })

    void payrollRun1; void payrollRun2; void payrollRun3

    // ============================================
    // HR: Job Postings
    // ============================================
    await Promise.all([
      db.jobPosting.create({ data: { title: 'Senior Frontend Developer', departmentId: engDept.id, type: 'full-time', location: 'San Francisco, CA', salary_min: 130000, salary_max: 170000, description: 'We are looking for an experienced frontend developer to join our engineering team. You will build cutting-edge web applications using React, TypeScript, and Next.js.', requirements: '5+ years of React/TypeScript experience|Strong understanding of modern CSS and design systems|Experience with Next.js and server-side rendering|Excellent communication skills', status: 'open', postedDate: new Date(now.getTime() - 14 * dayMs), applicants: 23, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'Marketing Coordinator', departmentId: mktDept.id, type: 'full-time', location: 'San Jose, CA', salary_min: 60000, salary_max: 80000, description: 'Join our marketing team to coordinate campaigns, manage social media content calendars, and track performance metrics across all platforms.', requirements: '2+ years of marketing experience|Proficiency with marketing analytics tools|Strong organizational and project management skills|Experience with social media management', status: 'open', postedDate: new Date(now.getTime() - 7 * dayMs), applicants: 15, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'UI/UX Designer', departmentId: designDept.id, type: 'full-time', location: 'Remote', salary_min: 95000, salary_max: 130000, description: 'We need a talented UI/UX designer to create intuitive and beautiful user experiences for our products. You will work closely with product and engineering teams.', requirements: '3+ years of product design experience|Proficiency in Figma and design systems|Portfolio demonstrating user-centered design process|Strong prototyping skills', status: 'open', postedDate: new Date(now.getTime() - 3 * dayMs), applicants: 31, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'Backend Engineer', departmentId: engDept.id, type: 'full-time', location: 'San Francisco, CA', salary_min: 125000, salary_max: 165000, description: 'Seeking a backend engineer to design and implement scalable APIs and microservices. You will work on our core platform serving millions of users.', requirements: '4+ years of backend development|Experience with Node.js and PostgreSQL|Understanding of microservices architecture|Strong problem-solving skills', status: 'open', postedDate: new Date(now.getTime() - 21 * dayMs), applicants: 42, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'DevOps Engineer', departmentId: engDept.id, type: 'full-time', location: 'Remote', salary_min: 120000, salary_max: 155000, description: 'We are looking for a DevOps engineer to manage our cloud infrastructure, CI/CD pipelines, and ensure system reliability.', requirements: '3+ years of DevOps experience|Experience with AWS/GCP and Kubernetes|Strong knowledge of CI/CD tools|Experience with infrastructure as code', status: 'filled', postedDate: new Date(now.getTime() - 45 * dayMs), closingDate: new Date(now.getTime() - 10 * dayMs), applicants: 28, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'Content Writer (Intern)', departmentId: mktDept.id, type: 'internship', location: 'San Jose, CA', salary_min: 25000, salary_max: 35000, description: 'Great opportunity for a budding content writer to learn and grow. You will create blog posts, social media content, and marketing copy.', requirements: 'Pursuing a degree in English, Journalism, or Communications|Strong writing skills|Familiarity with social media platforms|Eager to learn and take feedback', status: 'open', postedDate: new Date(now.getTime() - 5 * dayMs), applicants: 19, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'Financial Analyst', departmentId: finDept.id, type: 'full-time', location: 'Palo Alto, CA', salary_min: 80000, salary_max: 110000, description: 'Join our finance team to analyze financial data, prepare reports, and support strategic decision-making across the organization.', requirements: '3+ years of financial analysis experience|Proficiency in Excel and financial modeling|CPA or CFA preferred|Strong analytical and communication skills', status: 'draft', applicants: 0, organizationId: org.id } }),
      db.jobPosting.create({ data: { title: 'Office Manager', departmentId: opsDept.id, type: 'full-time', location: 'San Francisco, CA', salary_min: 55000, salary_max: 75000, description: 'Manage daily office operations, coordinate facilities, and support the team with administrative tasks.', requirements: '2+ years of office management experience|Strong organizational skills|Proficiency in office software|Excellent interpersonal communication', status: 'closed', postedDate: new Date(now.getTime() - 60 * dayMs), closingDate: new Date(now.getTime() - 30 * dayMs), applicants: 34, organizationId: org.id } }),
    ])

    // ============================================
    // 20. Disseminators
    // ============================================
    const disseminators = await Promise.all([
      db.disseminator.create({
        data: {
          userId: maya.id,
          teamId: disseminationTeam.id,
          speciality: 'Instagram & TikTok Specialist',
          platforms: JSON.stringify(['instagram', 'tiktok']),
          workloadCapacity: 8,
          status: 'active',
          rating: 4.7,
          totalTasksCompleted: 47,
          totalPostsPublished: 156,
          avgCompletionHours: 2.5,
          onTimeRate: 94.2,
          notes: 'Expert at short-form video content and Instagram Reels. Great engagement rates on visual platforms.',
          organizationId: org.id,
        },
      }),
      db.disseminator.create({
        data: {
          userId: jordan.id,
          teamId: disseminationTeam.id,
          speciality: 'LinkedIn & Twitter Expert',
          platforms: JSON.stringify(['linkedin', 'twitter']),
          workloadCapacity: 10,
          status: 'active',
          rating: 4.5,
          totalTasksCompleted: 38,
          totalPostsPublished: 124,
          avgCompletionHours: 3.1,
          onTimeRate: 89.5,
          notes: 'Specializes in B2B content distribution and thought leadership posts. Strong LinkedIn network.',
          organizationId: org.id,
        },
      }),
      db.disseminator.create({
        data: {
          userId: sam.id,
          teamId: disseminationTeam.id,
          speciality: 'Multi-Platform Publisher',
          platforms: JSON.stringify(['instagram', 'facebook', 'youtube']),
          workloadCapacity: 12,
          status: 'active',
          rating: 4.8,
          totalTasksCompleted: 62,
          totalPostsPublished: 201,
          avgCompletionHours: 1.8,
          onTimeRate: 96.8,
          notes: 'Fastest disseminator on the team. Handles high-volume publishing across multiple platforms with excellent quality.',
          organizationId: org.id,
        },
      }),
      db.disseminator.create({
        data: {
          userId: riley.id,
          teamId: disseminationTeam.id,
          speciality: 'Pinterest & Visual Content',
          platforms: JSON.stringify(['pinterest', 'instagram']),
          workloadCapacity: 6,
          status: 'active',
          rating: 4.3,
          totalTasksCompleted: 29,
          totalPostsPublished: 87,
          avgCompletionHours: 3.5,
          onTimeRate: 86.2,
          notes: 'Creative visual content specialist. Strong at Pinterest strategy and Instagram carousel design.',
          organizationId: org.id,
        },
      }),
    ])

    const [mayaDisseminator, jordanDisseminator, samDisseminator, rileyDisseminator] = disseminators

    // ============================================
    // 21. Dissemination Tasks
    // ============================================
    const disseminationTasks = await Promise.all([
      // PENDING tasks (3)
      db.disseminationTask.create({
        data: {
          title: 'Publish TechCorp Feature Launch Thread on Twitter',
          description: 'Post the approved Twitter thread announcing the top 5 new features of the TechCorp platform. Thread should go out during peak engagement hours (9-10 AM EST).',
          contentId: contentItems[16].id,
          assigneeId: jordan.id,
          disseminatorId: jordanDisseminator.id,
          clientId: techcorp.id,
          campaignId: techcorpCampaign.id,
          targetPlatforms: JSON.stringify(['twitter']),
          postContent: '🚀 Big news! We just launched 5 game-changing features for our enterprise platform. Thread 🧵👇\n\n1/5 Real-time collaboration — now your whole team can work simultaneously with zero conflicts. #TechCorp #EnterpriseAI',
          hashtags: '#TechCorp #EnterpriseAI #SaaS #ProductLaunch #Innovation',
          scheduledAt: new Date(now.getTime() + 1 * dayMs),
          dueDate: new Date(now.getTime() + 2 * dayMs),
          priority: 'high',
          status: 'pending',
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 0.5 * dayMs),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'Schedule FashionHub Summer Sale Instagram Posts',
          description: 'Create and schedule Instagram posts for the FashionHub summer sale event. Include carousel and story formats.',
          contentId: contentItems[15].id,
          assigneeId: maya.id,
          disseminatorId: mayaDisseminator.id,
          clientId: fashionhub.id,
          campaignId: fashionCampaign.id,
          targetPlatforms: JSON.stringify(['instagram']),
          postContent: '☀️ SUMMER SALE IS HERE! ☀️ Up to 50% off select items. Shop the collection now → link in bio. #FashionHub #SummerSale #OOTD',
          hashtags: '#FashionHub #SummerSale #OOTD #Fashion #SummerStyle #Sale',
          scheduledAt: new Date(now.getTime() + 2 * dayMs),
          dueDate: new Date(now.getTime() + 3 * dayMs),
          priority: 'urgent',
          status: 'pending',
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 1 * dayMs),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'Post WellnessCo Mindfulness Tips to Pinterest',
          description: 'Publish the 5 mindfulness tip graphics as Pinterest pins with optimized descriptions and boards.',
          contentId: contentItems[6].id,
          assigneeId: riley.id,
          disseminatorId: rileyDisseminator.id,
          clientId: null,
          campaignId: null,
          targetPlatforms: JSON.stringify(['pinterest', 'instagram']),
          postContent: '🌿 Start your day with intention. 5 simple mindfulness techniques you can practice anywhere. Save this for later! #Mindfulness #WellnessCo #MentalHealth',
          hashtags: '#Mindfulness #Wellness #MentalHealth #SelfCare #WellnessCo #DailyTips',
          scheduledAt: new Date(now.getTime() + 4 * dayMs),
          dueDate: new Date(now.getTime() + 5 * dayMs),
          priority: 'medium',
          status: 'pending',
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 0.5 * dayMs),
          organizationId: org.id,
        },
      }),

      // IN_PROGRESS tasks (3)
      db.disseminationTask.create({
        data: {
          title: 'Distribute TechCorp Case Study on LinkedIn',
          description: 'Publish the client success story carousel on LinkedIn with a thought-provoking hook. Tag the client page.',
          contentId: contentItems[10].id,
          assigneeId: jordan.id,
          disseminatorId: jordanDisseminator.id,
          clientId: techcorp.id,
          campaignId: techcorpCampaign.id,
          targetPlatforms: JSON.stringify(['linkedin']),
          postContent: 'How did Acme Inc reduce infrastructure costs by 40%? 📊 Our latest case study reveals the strategy behind their cloud transformation with TechCorp. Swipe through the key results →',
          hashtags: '#TechCorp #CaseStudy #CloudTransformation #Enterprise #B2B',
          scheduledAt: new Date(now.getTime() - 1 * dayMs),
          dueDate: new Date(now.getTime() + 1 * dayMs),
          priority: 'high',
          status: 'in_progress',
          startedAt: new Date(now.getTime() - 4 * 3600000),
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 1 * dayMs),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'Publish FashionHub Style Guide Reel on TikTok',
          description: 'Post the approved TikTok showing 3 ways to style a summer outfit. Use trending audio and relevant hashtags.',
          contentId: contentItems[17].id,
          assigneeId: maya.id,
          disseminatorId: mayaDisseminator.id,
          clientId: fashionhub.id,
          campaignId: fashionCampaign.id,
          targetPlatforms: JSON.stringify(['tiktok', 'instagram']),
          postContent: '3 ways to style your summer outfit 🌴 Which one is your fave? #FashionHub #SummerStyle #OOTD #StyleGuide #FashionTok',
          hashtags: '#FashionHub #SummerStyle #OOTD #FashionTok #StyleGuide #Trending',
          scheduledAt: new Date(now.getTime() - 0.5 * dayMs),
          dueDate: new Date(now.getTime() + 0.5 * dayMs),
          priority: 'high',
          status: 'in_progress',
          startedAt: new Date(now.getTime() - 2 * 3600000),
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 0.5 * dayMs),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'Cross-Platform AutoDrive EV Range Video',
          description: 'Publish the EV range explainer video on YouTube Shorts and Facebook. Write platform-specific captions.',
          contentId: contentItems[18].id,
          assigneeId: sam.id,
          disseminatorId: samDisseminator.id,
          clientId: autodrive.id,
          campaignId: autodriveCampaign.id,
          targetPlatforms: JSON.stringify(['youtube', 'facebook']),
          postContent: 'How far can an EV really go? 🚗⚡ We put our models to the test — the results might surprise you. Watch the full breakdown now!',
          hashtags: '#AutoDrive #EV #ElectricVehicle #Range #Sustainability #CleanEnergy',
          scheduledAt: new Date(now.getTime() - 2 * dayMs),
          dueDate: new Date(now.getTime() + 1 * dayMs),
          priority: 'medium',
          status: 'in_progress',
          startedAt: new Date(now.getTime() - 6 * 3600000),
          assignedById: marcus.id,
          assignedAt: new Date(now.getTime() - 2 * dayMs),
          organizationId: org.id,
        },
      }),

      // COMPLETED tasks (3)
      db.disseminationTask.create({
        data: {
          title: 'Publish TechCorp Product Features on Instagram',
          description: 'Post the infographic highlighting 5 key features of the new SaaS platform on Instagram feed.',
          contentId: contentItems[4].id,
          assigneeId: maya.id,
          disseminatorId: mayaDisseminator.id,
          clientId: techcorp.id,
          campaignId: techcorpCampaign.id,
          targetPlatforms: JSON.stringify(['instagram']),
          postContent: '🚀 Exciting news! Our new enterprise platform just got 5 game-changing features. See what\'s new →',
          hashtags: '#TechCorp #Enterprise #SaaS #ProductUpdate #Innovation',
          scheduledAt: new Date(now.getTime() - 8 * dayMs),
          dueDate: new Date(now.getTime() - 7 * dayMs),
          priority: 'high',
          status: 'completed',
          startedAt: new Date(now.getTime() - 7.5 * dayMs),
          completedAt: new Date(now.getTime() - 7 * dayMs),
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 8 * dayMs),
          completionNotes: 'Published successfully on Instagram during morning peak hours. Strong initial engagement.',
          engagement: JSON.stringify({ likes: 1240, comments: 89, shares: 234, saves: 156, impressions: 45000 }),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'FashionHub Summer Collection Instagram Launch',
          description: 'Launch the summer collection post on Instagram with carousel format showing top 10 looks.',
          contentId: contentItems[1].id,
          assigneeId: maya.id,
          disseminatorId: mayaDisseminator.id,
          clientId: fashionhub.id,
          campaignId: fashionCampaign.id,
          targetPlatforms: JSON.stringify(['instagram', 'tiktok']),
          postContent: 'Summer vibes are here! ☀️ Swipe to see our top 10 looks from the new collection → #FashionHubSummer',
          hashtags: '#FashionHub #SummerCollection #Fashion #OOTD #NewArrivals',
          scheduledAt: new Date(now.getTime() - 6 * dayMs),
          dueDate: new Date(now.getTime() - 5 * dayMs),
          priority: 'urgent',
          status: 'completed',
          startedAt: new Date(now.getTime() - 5.5 * dayMs),
          completedAt: new Date(now.getTime() - 5 * dayMs),
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 6 * dayMs),
          completionNotes: 'Exceeded expectations - carousel format drove high swipe-through rate. TikTok version went viral.',
          engagement: JSON.stringify({ likes: 8900, comments: 432, shares: 1200, saves: 2300, impressions: 350000 }),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'AutoDrive EV Range Explainer on Twitter',
          description: 'Post the EV range explainer thread on Twitter with engaging stats and visuals.',
          contentId: contentItems[18].id,
          assigneeId: jordan.id,
          disseminatorId: jordanDisseminator.id,
          clientId: autodrive.id,
          campaignId: autodriveCampaign.id,
          targetPlatforms: JSON.stringify(['twitter', 'linkedin']),
          postContent: 'How far can an EV really go? We put our models to the test. Watch the full video on YouTube →',
          hashtags: '#AutoDrive #EV #ElectricVehicle #Range #CleanEnergy #Innovation',
          scheduledAt: new Date(now.getTime() - 7 * dayMs),
          dueDate: new Date(now.getTime() - 6 * dayMs),
          priority: 'medium',
          status: 'completed',
          startedAt: new Date(now.getTime() - 6.5 * dayMs),
          completedAt: new Date(now.getTime() - 6 * dayMs),
          assignedById: marcus.id,
          assignedAt: new Date(now.getTime() - 7 * dayMs),
          completionNotes: 'Thread performed well on Twitter. LinkedIn post generated 3 qualified leads.',
          engagement: JSON.stringify({ likes: 234, comments: 18, retweets: 67, impressions: 45000 }),
          organizationId: org.id,
        },
      }),

      // OVERDUE tasks (2)
      db.disseminationTask.create({
        data: {
          title: 'Publish FoodVibe Recipe Cards on Instagram',
          description: 'Post the weekly recipe card series as Instagram carousel posts. Seasonal ingredients theme.',
          contentId: contentItems[2].id,
          assigneeId: riley.id,
          disseminatorId: rileyDisseminator.id,
          clientId: foodvibe.id,
          campaignId: foodvibeCampaign.id,
          targetPlatforms: JSON.stringify(['instagram', 'pinterest']),
          postContent: '🍳 This week\'s seasonal special: Lemon Herb Grilled Salmon! Save this recipe for your next dinner. #FoodVibe #Recipe #CookingAtHome',
          hashtags: '#FoodVibe #Recipe #CookingAtHome #SeasonalEating #Foodie #HealthyEating',
          scheduledAt: new Date(now.getTime() - 4 * dayMs),
          dueDate: new Date(now.getTime() - 2 * dayMs),
          priority: 'medium',
          status: 'pending',
          assignedById: priya.id,
          assignedAt: new Date(now.getTime() - 5 * dayMs),
          organizationId: org.id,
        },
      }),
      db.disseminationTask.create({
        data: {
          title: 'Distribute AutoDrive Comparison Chart on Facebook',
          description: 'Share the AutoDrive EV comparison chart on Facebook with a compelling caption targeting EV-curious buyers.',
          contentId: contentItems[7].id,
          assigneeId: sam.id,
          disseminatorId: samDisseminator.id,
          clientId: autodrive.id,
          campaignId: autodriveCampaign.id,
          targetPlatforms: JSON.stringify(['facebook', 'linkedin']),
          postContent: 'See how AutoDrive EVs stack up against the competition 📊 The results speak for themselves. Explore our lineup →',
          hashtags: '#AutoDrive #EV #Comparison #ElectricVehicle #CarShopping #GreenDriving',
          scheduledAt: new Date(now.getTime() - 3 * dayMs),
          dueDate: new Date(now.getTime() - 1 * dayMs),
          priority: 'urgent',
          status: 'in_progress',
          startedAt: new Date(now.getTime() - 1.5 * dayMs),
          assignedById: marcus.id,
          assignedAt: new Date(now.getTime() - 3 * dayMs),
          organizationId: org.id,
        },
      }),

      // FAILED task (1)
      db.disseminationTask.create({
        data: {
          title: 'Publish TechCorp Thought Leadership on LinkedIn',
          description: 'Publish the long-form thought leadership article on LinkedIn about the future of cloud infrastructure.',
          contentId: contentItems[13].id,
          assigneeId: jordan.id,
          disseminatorId: jordanDisseminator.id,
          clientId: techcorp.id,
          campaignId: techcorpCampaign.id,
          targetPlatforms: JSON.stringify(['linkedin']),
          postContent: 'The future of cloud computing is here. Our CEO shares insights on what enterprise AI means for your business. Read the full article on our blog.',
          hashtags: '#TechCorp #CloudComputing #EnterpriseAI #ThoughtLeadership #FutureOfWork',
          scheduledAt: new Date(now.getTime() - 4 * dayMs),
          dueDate: new Date(now.getTime() - 3 * dayMs),
          priority: 'high',
          status: 'failed',
          startedAt: new Date(now.getTime() - 4 * dayMs),
          failureReason: 'LinkedIn API returned 403 error — article formatting exceeded character limit. Needs to be split into a post + article link format. Retrying after content adjustment.',
          assignedById: sarah.id,
          assignedAt: new Date(now.getTime() - 5 * dayMs),
          organizationId: org.id,
        },
      }),
    ])

    // Seed finance data
    const financeResult = await seedFinance(org.id, sarah.id)

    // Seed missing module data
    await seedMissingModules(org.id)

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        tenant: 1,
        organization: 1,
        users: users.length,
        teams: teams.length,
        clients: clients.length,
        campaigns: campaigns.length,
        content: contentItems.length,
        socialAccounts: socialAccounts.length,
        posts: posts.length,
        automations: automations.length,
        comments: 15,
        activities: 34,
        approvals: 5,
        departments: departments.length,
        employees: employees.length,
        payrollRuns: 3,
        jobPostings: 8,
        disseminators: disseminators.length,
        disseminationTasks: disseminationTasks.length,
        financeAccounts: financeResult.accounts,
        taxRates: financeResult.taxRates,
        journalEntries: financeResult.journalEntries,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed database', error: String(error) },
      { status: 500 }
    )
  }
}

async function seedDisseminators(orgId: string) {
  const now = Date.now()
  const dayMs = 86400000

  // Create disseminator users if they don't exist
  const [maya, jordan, sam, riley] = await Promise.all([
    db.user.upsert({
      where: { email: 'maya.patel@vortexdigital.com' },
      update: {},
      create: { email: 'maya.patel@vortexdigital.com', name: 'Maya Patel', role: 'member', organizationId: orgId },
    }),
    db.user.upsert({
      where: { email: 'jordan.lee@vortexdigital.com' },
      update: {},
      create: { email: 'jordan.lee@vortexdigital.com', name: 'Jordan Lee', role: 'member', organizationId: orgId },
    }),
    db.user.upsert({
      where: { email: 'sam.rodriguez@vortexdigital.com' },
      update: {},
      create: { email: 'sam.rodriguez@vortexdigital.com', name: 'Sam Rodriguez', role: 'member', organizationId: orgId },
    }),
    db.user.upsert({
      where: { email: 'riley.kim@vortexdigital.com' },
      update: {},
      create: { email: 'riley.kim@vortexdigital.com', name: 'Riley Kim', role: 'member', organizationId: orgId },
    }),
  ])

  // Find the dissemination team
  const disseminationTeam = await db.team.findFirst({ where: { type: 'dissemination', organizationId: orgId } })

  // Add team members if team exists
  if (disseminationTeam) {
    await Promise.all([
      db.teamMember.upsert({ where: { userId_teamId: { userId: maya.id, teamId: disseminationTeam.id } }, update: {}, create: { userId: maya.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.upsert({ where: { userId_teamId: { userId: jordan.id, teamId: disseminationTeam.id } }, update: {}, create: { userId: jordan.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.upsert({ where: { userId_teamId: { userId: sam.id, teamId: disseminationTeam.id } }, update: {}, create: { userId: sam.id, teamId: disseminationTeam.id, role: 'member' } }),
      db.teamMember.upsert({ where: { userId_teamId: { userId: riley.id, teamId: disseminationTeam.id } }, update: {}, create: { userId: riley.id, teamId: disseminationTeam.id, role: 'member' } }),
    ])
  }

  const disseminators = await Promise.all([
    db.disseminator.create({
      data: {
        userId: maya.id,
        teamId: disseminationTeam?.id,
        speciality: 'Instagram & TikTok Specialist',
        platforms: JSON.stringify(['instagram', 'tiktok']),
        workloadCapacity: 8,
        status: 'active',
        rating: 4.7,
        totalTasksCompleted: 47,
        totalPostsPublished: 156,
        avgCompletionHours: 2.5,
        onTimeRate: 94.2,
        notes: 'Expert at short-form video content and Instagram Reels. Great engagement rates on visual platforms.',
        organizationId: orgId,
      },
    }),
    db.disseminator.create({
      data: {
        userId: jordan.id,
        teamId: disseminationTeam?.id,
        speciality: 'LinkedIn & Twitter Expert',
        platforms: JSON.stringify(['linkedin', 'twitter']),
        workloadCapacity: 10,
        status: 'active',
        rating: 4.5,
        totalTasksCompleted: 38,
        totalPostsPublished: 124,
        avgCompletionHours: 3.1,
        onTimeRate: 89.5,
        notes: 'Specializes in B2B content distribution and thought leadership posts. Strong LinkedIn network.',
        organizationId: orgId,
      },
    }),
    db.disseminator.create({
      data: {
        userId: sam.id,
        teamId: disseminationTeam?.id,
        speciality: 'Multi-Platform Publisher',
        platforms: JSON.stringify(['instagram', 'facebook', 'youtube']),
        workloadCapacity: 12,
        status: 'active',
        rating: 4.8,
        totalTasksCompleted: 62,
        totalPostsPublished: 201,
        avgCompletionHours: 1.8,
        onTimeRate: 96.8,
        notes: 'Fastest disseminator on the team. Handles high-volume publishing across multiple platforms with excellent quality.',
        organizationId: orgId,
      },
    }),
    db.disseminator.create({
      data: {
        userId: riley.id,
        teamId: disseminationTeam?.id,
        speciality: 'Pinterest & Visual Content',
        platforms: JSON.stringify(['pinterest', 'instagram']),
        workloadCapacity: 6,
        status: 'active',
        rating: 4.3,
        totalTasksCompleted: 29,
        totalPostsPublished: 87,
        avgCompletionHours: 3.5,
        onTimeRate: 86.2,
        notes: 'Creative visual content specialist. Strong at Pinterest strategy and Instagram carousel design.',
        organizationId: orgId,
      },
    }),
  ])

  const [mayaDisseminator, jordanDisseminator, samDisseminator, rileyDisseminator] = disseminators

  // Find existing clients and campaigns
  const techcorp = await db.client.findFirst({ where: { name: 'TechCorp', organizationId: orgId } })
  const fashionhub = await db.client.findFirst({ where: { name: 'FashionHub', organizationId: orgId } })
  const autodrive = await db.client.findFirst({ where: { name: 'AutoDrive', organizationId: orgId } })
  const foodvibe = await db.client.findFirst({ where: { name: 'FoodVibe', organizationId: orgId } })
  const techcorpCampaign = await db.campaign.findFirst({ where: { name: 'TechCorp Product Launch', organizationId: orgId } })
  const fashionCampaign = await db.campaign.findFirst({ where: { name: 'FashionHub Summer Collection', organizationId: orgId } })
  const autodriveCampaign = await db.campaign.findFirst({ where: { name: 'AutoDrive EV Awareness', organizationId: orgId } })
  const foodvibeCampaign = await db.campaign.findFirst({ where: { name: 'FoodVibe Recipe Series', organizationId: orgId } })
  const sarah = await db.user.findUnique({ where: { email: 'sarah@vortexdigital.com' } })
  const marcus = await db.user.findUnique({ where: { email: 'marcus.johnson@vortexdigital.com' } })
  const priya = await db.user.findUnique({ where: { email: 'priya.sharma@vortexdigital.com' } })

  // Get some content items for linking
  const contentItems = await db.content.findMany({ where: { organizationId: orgId }, take: 20 })

  await Promise.all([
    // PENDING tasks (3)
    db.disseminationTask.create({
      data: {
        title: 'Publish TechCorp Feature Launch Thread on Twitter',
        description: 'Post the approved Twitter thread announcing the top 5 new features of the TechCorp platform.',
        contentId: contentItems[16]?.id || null,
        assigneeId: jordan.id,
        disseminatorId: jordanDisseminator.id,
        clientId: techcorp?.id || null,
        campaignId: techcorpCampaign?.id || null,
        targetPlatforms: JSON.stringify(['twitter']),
        postContent: '🚀 Big news! We just launched 5 game-changing features for our enterprise platform. Thread 🧵👇\n\n1/5 Real-time collaboration — now your whole team can work simultaneously with zero conflicts. #TechCorp #EnterpriseAI',
        hashtags: '#TechCorp #EnterpriseAI #SaaS #ProductLaunch #Innovation',
        scheduledAt: new Date(now + 1 * dayMs),
        dueDate: new Date(now + 2 * dayMs),
        priority: 'high',
        status: 'pending',
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 0.5 * dayMs),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'Schedule FashionHub Summer Sale Instagram Posts',
        description: 'Create and schedule Instagram posts for the FashionHub summer sale event.',
        contentId: contentItems[15]?.id || null,
        assigneeId: maya.id,
        disseminatorId: mayaDisseminator.id,
        clientId: fashionhub?.id || null,
        campaignId: fashionCampaign?.id || null,
        targetPlatforms: JSON.stringify(['instagram']),
        postContent: '☀️ SUMMER SALE IS HERE! ☀️ Up to 50% off select items. Shop the collection now → link in bio. #FashionHub #SummerSale #OOTD',
        hashtags: '#FashionHub #SummerSale #OOTD #Fashion #SummerStyle #Sale',
        scheduledAt: new Date(now + 2 * dayMs),
        dueDate: new Date(now + 3 * dayMs),
        priority: 'urgent',
        status: 'pending',
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 1 * dayMs),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'Post WellnessCo Mindfulness Tips to Pinterest',
        description: 'Publish the 5 mindfulness tip graphics as Pinterest pins with optimized descriptions.',
        contentId: contentItems[6]?.id || null,
        assigneeId: riley.id,
        disseminatorId: rileyDisseminator.id,
        clientId: null,
        campaignId: null,
        targetPlatforms: JSON.stringify(['pinterest', 'instagram']),
        postContent: '🌿 Start your day with intention. 5 simple mindfulness techniques you can practice anywhere. Save this for later! #Mindfulness #WellnessCo #MentalHealth',
        hashtags: '#Mindfulness #Wellness #MentalHealth #SelfCare #WellnessCo #DailyTips',
        scheduledAt: new Date(now + 4 * dayMs),
        dueDate: new Date(now + 5 * dayMs),
        priority: 'medium',
        status: 'pending',
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 0.5 * dayMs),
        organizationId: orgId,
      },
    }),
    // IN_PROGRESS tasks (3)
    db.disseminationTask.create({
      data: {
        title: 'Distribute TechCorp Case Study on LinkedIn',
        description: 'Publish the client success story carousel on LinkedIn with a thought-provoking hook.',
        contentId: contentItems[10]?.id || null,
        assigneeId: jordan.id,
        disseminatorId: jordanDisseminator.id,
        clientId: techcorp?.id || null,
        campaignId: techcorpCampaign?.id || null,
        targetPlatforms: JSON.stringify(['linkedin']),
        postContent: 'How did Acme Inc reduce infrastructure costs by 40%? 📊 Our latest case study reveals the strategy behind their cloud transformation with TechCorp.',
        hashtags: '#TechCorp #CaseStudy #CloudTransformation #Enterprise #B2B',
        scheduledAt: new Date(now - 1 * dayMs),
        dueDate: new Date(now + 1 * dayMs),
        priority: 'high',
        status: 'in_progress',
        startedAt: new Date(now - 4 * 3600000),
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 1 * dayMs),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'Publish FashionHub Style Guide Reel on TikTok',
        description: 'Post the approved TikTok showing 3 ways to style a summer outfit. Use trending audio.',
        contentId: contentItems[17]?.id || null,
        assigneeId: maya.id,
        disseminatorId: mayaDisseminator.id,
        clientId: fashionhub?.id || null,
        campaignId: fashionCampaign?.id || null,
        targetPlatforms: JSON.stringify(['tiktok', 'instagram']),
        postContent: '3 ways to style your summer outfit 🌴 Which one is your fave? #FashionHub #SummerStyle #OOTD #StyleGuide #FashionTok',
        hashtags: '#FashionHub #SummerStyle #OOTD #FashionTok #StyleGuide #Trending',
        scheduledAt: new Date(now - 0.5 * dayMs),
        dueDate: new Date(now + 0.5 * dayMs),
        priority: 'high',
        status: 'in_progress',
        startedAt: new Date(now - 2 * 3600000),
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 0.5 * dayMs),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'Cross-Platform AutoDrive EV Range Video',
        description: 'Publish the EV range explainer video on YouTube Shorts and Facebook.',
        contentId: contentItems[18]?.id || null,
        assigneeId: sam.id,
        disseminatorId: samDisseminator.id,
        clientId: autodrive?.id || null,
        campaignId: autodriveCampaign?.id || null,
        targetPlatforms: JSON.stringify(['youtube', 'facebook']),
        postContent: 'How far can an EV really go? 🚗⚡ We put our models to the test — the results might surprise you. Watch the full breakdown now!',
        hashtags: '#AutoDrive #EV #ElectricVehicle #Range #Sustainability #CleanEnergy',
        scheduledAt: new Date(now - 2 * dayMs),
        dueDate: new Date(now + 1 * dayMs),
        priority: 'medium',
        status: 'in_progress',
        startedAt: new Date(now - 6 * 3600000),
        assignedById: marcus?.id || null,
        assignedAt: new Date(now - 2 * dayMs),
        organizationId: orgId,
      },
    }),
    // COMPLETED tasks (3)
    db.disseminationTask.create({
      data: {
        title: 'Publish TechCorp Product Features on Instagram',
        description: 'Post the infographic highlighting 5 key features of the new SaaS platform.',
        contentId: contentItems[4]?.id || null,
        assigneeId: maya.id,
        disseminatorId: mayaDisseminator.id,
        clientId: techcorp?.id || null,
        campaignId: techcorpCampaign?.id || null,
        targetPlatforms: JSON.stringify(['instagram']),
        postContent: '🚀 Exciting news! Our new enterprise platform just got 5 game-changing features. See what\'s new →',
        hashtags: '#TechCorp #Enterprise #SaaS #ProductUpdate #Innovation',
        scheduledAt: new Date(now - 8 * dayMs),
        dueDate: new Date(now - 7 * dayMs),
        priority: 'high',
        status: 'completed',
        startedAt: new Date(now - 7.5 * dayMs),
        completedAt: new Date(now - 7 * dayMs),
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 8 * dayMs),
        completionNotes: 'Published successfully on Instagram during morning peak hours. Strong initial engagement.',
        engagement: JSON.stringify({ likes: 1240, comments: 89, shares: 234, saves: 156, impressions: 45000 }),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'FashionHub Summer Collection Instagram Launch',
        description: 'Launch the summer collection post on Instagram with carousel format.',
        contentId: contentItems[1]?.id || null,
        assigneeId: maya.id,
        disseminatorId: mayaDisseminator.id,
        clientId: fashionhub?.id || null,
        campaignId: fashionCampaign?.id || null,
        targetPlatforms: JSON.stringify(['instagram', 'tiktok']),
        postContent: 'Summer vibes are here! ☀️ Swipe to see our top 10 looks from the new collection → #FashionHubSummer',
        hashtags: '#FashionHub #SummerCollection #Fashion #OOTD #NewArrivals',
        scheduledAt: new Date(now - 6 * dayMs),
        dueDate: new Date(now - 5 * dayMs),
        priority: 'urgent',
        status: 'completed',
        startedAt: new Date(now - 5.5 * dayMs),
        completedAt: new Date(now - 5 * dayMs),
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 6 * dayMs),
        completionNotes: 'Exceeded expectations - carousel format drove high swipe-through rate. TikTok version went viral.',
        engagement: JSON.stringify({ likes: 8900, comments: 432, shares: 1200, saves: 2300, impressions: 350000 }),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'AutoDrive EV Range Explainer on Twitter',
        description: 'Post the EV range explainer thread on Twitter with engaging stats.',
        contentId: contentItems[18]?.id || null,
        assigneeId: jordan.id,
        disseminatorId: jordanDisseminator.id,
        clientId: autodrive?.id || null,
        campaignId: autodriveCampaign?.id || null,
        targetPlatforms: JSON.stringify(['twitter', 'linkedin']),
        postContent: 'How far can an EV really go? We put our models to the test. Watch the full video on YouTube →',
        hashtags: '#AutoDrive #EV #ElectricVehicle #Range #CleanEnergy #Innovation',
        scheduledAt: new Date(now - 7 * dayMs),
        dueDate: new Date(now - 6 * dayMs),
        priority: 'medium',
        status: 'completed',
        startedAt: new Date(now - 6.5 * dayMs),
        completedAt: new Date(now - 6 * dayMs),
        assignedById: marcus?.id || null,
        assignedAt: new Date(now - 7 * dayMs),
        completionNotes: 'Thread performed well on Twitter. LinkedIn post generated 3 qualified leads.',
        engagement: JSON.stringify({ likes: 234, comments: 18, retweets: 67, impressions: 45000 }),
        organizationId: orgId,
      },
    }),
    // OVERDUE tasks (2)
    db.disseminationTask.create({
      data: {
        title: 'Publish FoodVibe Recipe Cards on Instagram',
        description: 'Post the weekly recipe card series as Instagram carousel posts.',
        contentId: contentItems[2]?.id || null,
        assigneeId: riley.id,
        disseminatorId: rileyDisseminator.id,
        clientId: foodvibe?.id || null,
        campaignId: foodvibeCampaign?.id || null,
        targetPlatforms: JSON.stringify(['instagram', 'pinterest']),
        postContent: '🍳 This week\'s seasonal special: Lemon Herb Grilled Salmon! Save this recipe for your next dinner. #FoodVibe #Recipe #CookingAtHome',
        hashtags: '#FoodVibe #Recipe #CookingAtHome #SeasonalEating #Foodie #HealthyEating',
        scheduledAt: new Date(now - 4 * dayMs),
        dueDate: new Date(now - 2 * dayMs),
        priority: 'medium',
        status: 'pending',
        assignedById: priya?.id || null,
        assignedAt: new Date(now - 5 * dayMs),
        organizationId: orgId,
      },
    }),
    db.disseminationTask.create({
      data: {
        title: 'Distribute AutoDrive Comparison Chart on Facebook',
        description: 'Share the AutoDrive EV comparison chart on Facebook.',
        contentId: contentItems[7]?.id || null,
        assigneeId: sam.id,
        disseminatorId: samDisseminator.id,
        clientId: autodrive?.id || null,
        campaignId: autodriveCampaign?.id || null,
        targetPlatforms: JSON.stringify(['facebook', 'linkedin']),
        postContent: 'See how AutoDrive EVs stack up against the competition 📊 The results speak for themselves. Explore our lineup →',
        hashtags: '#AutoDrive #EV #Comparison #ElectricVehicle #CarShopping #GreenDriving',
        scheduledAt: new Date(now - 3 * dayMs),
        dueDate: new Date(now - 1 * dayMs),
        priority: 'urgent',
        status: 'in_progress',
        startedAt: new Date(now - 1.5 * dayMs),
        assignedById: marcus?.id || null,
        assignedAt: new Date(now - 3 * dayMs),
        organizationId: orgId,
      },
    }),
    // FAILED task (1)
    db.disseminationTask.create({
      data: {
        title: 'Publish TechCorp Thought Leadership on LinkedIn',
        description: 'Publish the long-form thought leadership article on LinkedIn about the future of cloud infrastructure.',
        contentId: contentItems[13]?.id || null,
        assigneeId: jordan.id,
        disseminatorId: jordanDisseminator.id,
        clientId: techcorp?.id || null,
        campaignId: techcorpCampaign?.id || null,
        targetPlatforms: JSON.stringify(['linkedin']),
        postContent: 'The future of cloud computing is here. Our CEO shares insights on what enterprise AI means for your business.',
        hashtags: '#TechCorp #CloudComputing #EnterpriseAI #ThoughtLeadership #FutureOfWork',
        scheduledAt: new Date(now - 4 * dayMs),
        dueDate: new Date(now - 3 * dayMs),
        priority: 'high',
        status: 'failed',
        startedAt: new Date(now - 4 * dayMs),
        failureReason: 'LinkedIn API returned 403 error — article formatting exceeded character limit. Needs to be split into a post + article link format.',
        assignedById: sarah?.id || null,
        assignedAt: new Date(now - 5 * dayMs),
        organizationId: orgId,
      },
    }),
  ])
}

async function seedCommunications(orgId: string) {
  const now = Date.now()
  const dayMs = 86400000
  const hourMs = 3600000

  // Find existing users
  const sarah = await db.user.findUnique({ where: { email: 'sarah@vortexdigital.com' } })
  const marcus = await db.user.findUnique({ where: { email: 'marcus.johnson@vortexdigital.com' } })
  const priya = await db.user.findUnique({ where: { email: 'priya.sharma@vortexdigital.com' } })

  // Find existing clients and influencers
  const techcorp = await db.client.findFirst({ where: { name: 'TechCorp', organizationId: orgId } })
  const fashionhub = await db.client.findFirst({ where: { name: 'FashionHub', organizationId: orgId } })
  const autodrive = await db.client.findFirst({ where: { name: 'AutoDrive', organizationId: orgId } })
  const foodvibe = await db.client.findFirst({ where: { name: 'FoodVibe', organizationId: orgId } })
  const techcorpCampaign = await db.campaign.findFirst({ where: { name: 'TechCorp Product Launch', organizationId: orgId } })
  const fashionCampaign = await db.campaign.findFirst({ where: { name: 'FashionHub Summer Collection', organizationId: orgId } })

  const influencers = await db.influencer.findMany({ where: { organizationId: orgId }, take: 6 })

  // ============================================
  // 1. Communication Templates
  // ============================================
  const templates = await Promise.all([
    db.communicationTemplate.create({
      data: {
        name: 'Welcome Email',
        subject: 'Welcome to {{company}}!',
        body: 'Hi {{name}},\n\nWelcome to {{company}}! We\'re excited to have you on board.\n\nOur team is ready to help you achieve your goals. If you have any questions, don\'t hesitate to reach out.\n\nBest regards,\nThe {{company}} Team',
        type: 'email',
        category: 'welcome',
        variables: JSON.stringify(['name', 'company']),
        isDefault: true,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'Follow-Up Email',
        subject: 'Following up on our conversation',
        body: 'Hi {{name}},\n\nI wanted to follow up on our recent conversation about {{topic}}. I\'ve attached the relevant documents for your review.\n\nPlease let me know if you have any questions or if there\'s anything else I can help with.\n\nBest,\n{{senderName}}',
        type: 'email',
        category: 'follow_up',
        variables: JSON.stringify(['name', 'topic', 'senderName']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'Proposal Email',
        subject: 'Proposal for {{projectName}}',
        body: 'Dear {{name}},\n\nThank you for your interest in working with us. Please find our proposal for {{projectName}} attached.\n\nThe proposal outlines our approach, timeline, and investment details. We believe this will be a great partnership.\n\nLooking forward to your feedback.\n\nRegards,\n{{senderName}}',
        type: 'email',
        category: 'proposal',
        variables: JSON.stringify(['name', 'projectName', 'senderName']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'Invoice Reminder',
        subject: 'Invoice #{{invoiceNumber}} Reminder',
        body: 'Hi {{name}},\n\nThis is a friendly reminder that invoice #{{invoiceNumber}} for {{amount}} is due on {{dueDate}}.\n\nIf you\'ve already processed this payment, please disregard this message.\n\nThank you for your prompt attention.\n\nBest,\nAccounts Team',
        type: 'email',
        category: 'invoice',
        variables: JSON.stringify(['name', 'invoiceNumber', 'amount', 'dueDate']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'Campaign Update',
        subject: 'Campaign Update: {{campaignName}}',
        body: 'Hi {{name}},\n\nHere\'s your weekly update on the {{campaignName}} campaign:\n\n📊 Impressions: {{impressions}}\n📈 Engagement Rate: {{engagementRate}}%\n👥 Reach: {{reach}}\n\nThe campaign is performing well and we\'re on track to meet our targets.\n\nBest,\n{{senderName}}',
        type: 'email',
        category: 'campaign',
        variables: JSON.stringify(['name', 'campaignName', 'impressions', 'engagementRate', 'reach', 'senderName']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'WhatsApp Quick Update',
        subject: null,
        body: 'Hi {{name}}! 👋 Quick update on {{topic}}: {{update}}. Let me know if you need anything else!',
        type: 'whatsapp',
        category: 'notification',
        variables: JSON.stringify(['name', 'topic', 'update']),
        isDefault: true,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'WhatsApp Meeting Reminder',
        subject: null,
        body: '📋 Reminder: You have a meeting tomorrow at {{time}} about {{topic}}. Location: {{location}}. See you there!',
        type: 'whatsapp',
        category: 'reminder',
        variables: JSON.stringify(['time', 'topic', 'location']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
    db.communicationTemplate.create({
      data: {
        name: 'WhatsApp Content Approval',
        subject: null,
        body: '🎨 Hi {{name}}! New content ready for review: "{{contentTitle}}". Please check and approve at your earliest convenience. Link: {{reviewLink}}',
        type: 'whatsapp',
        category: 'notification',
        variables: JSON.stringify(['name', 'contentTitle', 'reviewLink']),
        isDefault: false,
        isActive: true,
        organizationId: orgId,
      },
    }),
  ])

  // ============================================
  // 2. Communication Contacts
  // ============================================
  const contacts = await Promise.all([
    db.communicationContact.create({
      data: {
        name: 'Alex Thompson',
        email: 'alex.thompson@techcorp.io',
        phone: '+1-555-0101',
        whatsappNumber: '+1-555-0101',
        company: 'TechCorp',
        role: 'client',
        notes: 'Primary contact for TechCorp. Prefers email for formal communication, WhatsApp for quick updates.',
        preferredChannel: 'email',
        lastContactedAt: new Date(now - 2 * hourMs),
        isFavorite: true,
        tags: 'VIP,Enterprise',
        clientId: techcorp?.id || null,
        organizationId: orgId,
      },
    }),
    db.communicationContact.create({
      data: {
        name: 'Sophia Martinez',
        email: 'sophia@fashionhub.com',
        phone: '+1-555-0202',
        whatsappNumber: '+1-555-0202',
        company: 'FashionHub',
        role: 'client',
        notes: 'Creative director at FashionHub. Loves WhatsApp for quick back-and-forth on visual content.',
        preferredChannel: 'whatsapp',
        lastContactedAt: new Date(now - 5 * hourMs),
        isFavorite: true,
        tags: 'Creative,VIP',
        clientId: fashionhub?.id || null,
        organizationId: orgId,
      },
    }),
    db.communicationContact.create({
      data: {
        name: 'David Park',
        email: 'david.park@autodrive.co',
        phone: '+1-555-0303',
        whatsappNumber: '+1-555-0303',
        company: 'AutoDrive',
        role: 'client',
        notes: 'Marketing VP at AutoDrive. Very responsive on WhatsApp.',
        preferredChannel: 'whatsapp',
        lastContactedAt: new Date(now - 1 * dayMs),
        isFavorite: false,
        tags: 'Automotive,Decision Maker',
        clientId: autodrive?.id || null,
        organizationId: orgId,
      },
    }),
    db.communicationContact.create({
      data: {
        name: 'Emma Wilson',
        email: 'emma@foodvibe.com',
        phone: '+1-555-0404',
        whatsappNumber: null,
        company: 'FoodVibe',
        role: 'client',
        notes: 'Brand manager at FoodVibe. Email only - no WhatsApp.',
        preferredChannel: 'email',
        lastContactedAt: new Date(now - 3 * dayMs),
        isFavorite: false,
        tags: 'Food & Beverage',
        clientId: foodvibe?.id || null,
        organizationId: orgId,
      },
    }),
    db.communicationContact.create({
      data: {
        name: 'Raj Patel',
        email: 'raj@innovateai.com',
        phone: '+1-555-0505',
        whatsappNumber: '+1-555-0505',
        company: 'InnovateAI',
        role: 'partner',
        notes: 'Technology partner. Quick responses on WhatsApp, detailed discussions via email.',
        preferredChannel: 'email',
        lastContactedAt: new Date(now - 12 * hourMs),
        isFavorite: true,
        tags: 'Tech,Partner',
        organizationId: orgId,
      },
    }),
    db.communicationContact.create({
      data: {
        name: 'Lisa Chen',
        email: 'lisa.chen@brightmedia.co',
        phone: '+1-555-0606',
        whatsappNumber: '+1-555-0606',
        company: 'BrightMedia',
        role: 'vendor',
        notes: 'Media buying vendor. Handles our paid social placements.',
        preferredChannel: 'email',
        lastContactedAt: new Date(now - 2 * dayMs),
        isFavorite: false,
        tags: 'Media,Vendor',
        organizationId: orgId,
      },
    }),
    // Influencer contacts
    ...(influencers.slice(0, 4).map((inf, i) =>
      db.communicationContact.create({
        data: {
          name: inf.name,
          email: inf.email || `${inf.username}@example.com`,
          phone: inf.phone || `+1-555-07${i + 1}`,
          whatsappNumber: inf.phone || `+1-555-07${i + 1}`,
          company: null,
          role: 'influencer',
          notes: `Contact for influencer ${inf.name} (${inf.platform})`,
          preferredChannel: 'whatsapp' as const,
          lastContactedAt: new Date(now - (i + 1) * dayMs),
          isFavorite: i === 0,
          tags: 'Influencer',
          influencerId: inf.id,
          organizationId: orgId,
        },
      })
    )),
  ])

  // ============================================
  // 3. Conversations with Messages
  // ============================================
  // Email conversation: TechCorp product launch discussion
  const emailConv1 = await db.conversation.create({
    data: {
      subject: 'TechCorp Product Launch - Content Calendar',
      type: 'email',
      status: 'active',
      priority: 'high',
      channel: 'email',
      clientId: techcorp?.id || null,
      campaignId: techcorpCampaign?.id || null,
      assignedToId: sarah?.id || null,
      lastMessageAt: new Date(now - 2 * hourMs),
      lastMessagePreview: 'Thanks for the updated timeline. We\'ll review and get back to you by EOD.',
      unreadCount: 2,
      tags: 'Product Launch,Urgent',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: null,
            senderName: 'Alex Thompson',
            senderEmail: 'alex.thompson@techcorp.io',
            recipientName: 'Sarah Chen',
            recipientEmail: 'sarah@vortexdigital.com',
            subject: 'TechCorp Product Launch - Content Calendar',
            body: 'Hi Sarah,\n\nWe\'re finalizing the product launch timeline and wanted to align on the content calendar. Can we schedule a call this week to go over the key dates and deliverables?\n\nWe have some new feature announcements that we\'d like to stagger across platforms.\n\nBest regards,\nAlex Thompson\nTechCorp',
            type: 'email',
            direction: 'inbound',
            status: 'read',
            isStarred: true,
            isRead: true,
            readAt: new Date(now - 47 * hourMs),
            deliveredAt: new Date(now - 48 * hourMs),
            openedAt: new Date(now - 47.5 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: sarah?.id || null,
            senderName: 'Sarah Chen',
            senderEmail: 'sarah@vortexdigital.com',
            recipientName: 'Alex Thompson',
            recipientEmail: 'alex.thompson@techcorp.io',
            subject: 'Re: TechCorp Product Launch - Content Calendar',
            body: 'Hi Alex,\n\nAbsolutely! I\'ve reviewed the feature list and drafted a preliminary content calendar. How does Thursday at 2 PM work for a call?\n\nI\'m thinking we can break the launch into 3 phases:\n1. Teaser content (Week 1-2)\n2. Feature deep-dives (Week 3-4)\n3. Customer testimonials (Week 5-6)\n\nLet me know your thoughts.\n\nBest,\nSarah',
            type: 'email',
            direction: 'outbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: null,
            deliveredAt: new Date(now - 24 * hourMs),
            openedAt: new Date(now - 23 * hourMs),
            repliedAt: new Date(now - 2 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Alex Thompson',
            senderEmail: 'alex.thompson@techcorp.io',
            recipientName: 'Sarah Chen',
            recipientEmail: 'sarah@vortexdigital.com',
            subject: 'Re: TechCorp Product Launch - Content Calendar',
            body: 'Hi Sarah,\n\nThanks for the updated timeline. We\'ll review and get back to you by EOD.\n\nThe 3-phase approach looks solid. One addition — we\'d like to add a live Q&A session in Week 3 for the developer community.\n\nTalk soon,\nAlex',
            type: 'email',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: false,
            readAt: null,
            deliveredAt: new Date(now - 2 * hourMs),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // WhatsApp conversation: FashionHub creative review
  const waConv1 = await db.conversation.create({
    data: {
      subject: null,
      type: 'whatsapp',
      status: 'active',
      priority: 'normal',
      channel: 'whatsapp',
      clientId: fashionhub?.id || null,
      campaignId: fashionCampaign?.id || null,
      assignedToId: priya?.id || null,
      lastMessageAt: new Date(now - 30 * 60000),
      lastMessagePreview: 'Love the new carousel designs! 💕 Can we add more pastel tones?',
      unreadCount: 1,
      tags: 'Creative Review',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: priya?.id || null,
            senderName: 'Priya Sharma',
            senderPhone: '+1-555-1001',
            recipientName: 'Sophia Martinez',
            recipientPhone: '+1-555-0202',
            body: 'Hi Sophia! 👋 The new summer collection content is ready for review. I\'ll send over the carousel designs in a sec.',
            type: 'whatsapp',
            direction: 'outbound',
            status: 'delivered',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 2 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Sophia Martinez',
            senderPhone: '+1-555-0202',
            recipientName: 'Priya Sharma',
            recipientPhone: '+1-555-1001',
            body: 'Omg yes please! 🎨 I\'ve been waiting for these. Quick question — did you go with the neon or pastel theme for the hero shots?',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: new Date(now - 1.5 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: priya?.id || null,
            senderName: 'Priya Sharma',
            senderPhone: '+1-555-1001',
            recipientName: 'Sophia Martinez',
            recipientPhone: '+1-555-0202',
            body: 'We went with pastel for the hero shots and neon for the BTS content. Best of both worlds! ✨ Sending now...',
            type: 'whatsapp',
            direction: 'outbound',
            status: 'delivered',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 1 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Sophia Martinez',
            senderPhone: '+1-555-0202',
            recipientName: 'Priya Sharma',
            recipientPhone: '+1-555-1001',
            body: 'Love the new carousel designs! 💕 Can we add more pastel tones?',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'delivered',
            isStarred: false,
            isRead: false,
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // WhatsApp conversation: AutoDrive campaign quick chat
  const waConv2 = await db.conversation.create({
    data: {
      subject: null,
      type: 'whatsapp',
      status: 'active',
      priority: 'urgent',
      channel: 'whatsapp',
      clientId: autodrive?.id || null,
      assignedToId: marcus?.id || null,
      lastMessageAt: new Date(now - 15 * 60000),
      lastMessagePreview: 'We need the EV comparison infographic ASAP 🚗⚡',
      unreadCount: 3,
      tags: 'Urgent,Campaign',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: null,
            senderName: 'David Park',
            senderPhone: '+1-555-0303',
            recipientName: 'Marcus Johnson',
            recipientPhone: '+1-555-1002',
            body: 'Hey Marcus! Quick question about the EV campaign timeline. Are we still on track for the launch next week?',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: new Date(now - 4 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: marcus?.id || null,
            senderName: 'Marcus Johnson',
            senderPhone: '+1-555-1002',
            recipientName: 'David Park',
            recipientPhone: '+1-555-0303',
            body: 'Hi David! Yes, we\'re on track. The video content is in final review and the social posts are scheduled. 📅',
            type: 'whatsapp',
            direction: 'outbound',
            status: 'delivered',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 3.5 * hourMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'David Park',
            senderPhone: '+1-555-0303',
            recipientName: 'Marcus Johnson',
            recipientPhone: '+1-555-1002',
            body: 'Perfect! One thing — our CEO wants to add a comparison chart. Can we get that designed by Thursday?',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'delivered',
            isStarred: false,
            isRead: false,
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'David Park',
            senderPhone: '+1-555-0303',
            recipientName: 'Marcus Johnson',
            recipientPhone: '+1-555-1002',
            body: 'We need the EV comparison infographic ASAP 🚗⚡',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'delivered',
            isStarred: true,
            isRead: false,
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // Email conversation: Proposal follow-up
  const emailConv2 = await db.conversation.create({
    data: {
      subject: 'Q3 Marketing Partnership Proposal',
      type: 'email',
      status: 'active',
      priority: 'normal',
      channel: 'email',
      assignedToId: sarah?.id || null,
      lastMessageAt: new Date(now - 1 * dayMs),
      lastMessagePreview: 'We\'d like to proceed with the partnership. Can we schedule a kickoff meeting?',
      unreadCount: 1,
      tags: 'Proposal,Partnership',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: sarah?.id || null,
            senderName: 'Sarah Chen',
            senderEmail: 'sarah@vortexdigital.com',
            recipientName: 'Raj Patel',
            recipientEmail: 'raj@innovateai.com',
            subject: 'Q3 Marketing Partnership Proposal',
            body: 'Dear Raj,\n\nFollowing our discussion at the Tech Summit last week, I\'m pleased to share our Q3 partnership proposal.\n\nThe proposal outlines a comprehensive marketing collaboration that leverages both our strengths in AI-driven content and your platform\'s reach.\n\nKey highlights:\n- Joint webinar series\n- Co-branded content creation\n- Cross-platform promotion\n- Shared analytics dashboard\n\nI\'d love to discuss this further at your convenience.\n\nBest regards,\nSarah Chen\nCEO, Vortex Digital',
            type: 'email',
            direction: 'outbound',
            status: 'read',
            isStarred: true,
            isRead: true,
            deliveredAt: new Date(now - 5 * dayMs),
            openedAt: new Date(now - 4.8 * dayMs),
            clickedAt: new Date(now - 4.5 * dayMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Raj Patel',
            senderEmail: 'raj@innovateai.com',
            recipientName: 'Sarah Chen',
            recipientEmail: 'sarah@vortexdigital.com',
            subject: 'Re: Q3 Marketing Partnership Proposal',
            body: 'Hi Sarah,\n\nThank you for the detailed proposal. We\'ve reviewed it with our team and are very interested in the joint webinar series and co-branded content.\n\nWe\'d like to proceed with the partnership. Can we schedule a kickoff meeting next week?\n\nBest,\nRaj Patel\nInnovateAI',
            type: 'email',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: false,
            readAt: null,
            deliveredAt: new Date(now - 1 * dayMs),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // Email conversation: Invoice reminder
  const emailConv3 = await db.conversation.create({
    data: {
      subject: 'Invoice #INV-2024-089 - Payment Reminder',
      type: 'email',
      status: 'active',
      priority: 'high',
      channel: 'email',
      clientId: foodvibe?.id || null,
      assignedToId: marcus?.id || null,
      lastMessageAt: new Date(now - 3 * dayMs),
      lastMessagePreview: 'Payment has been processed. Should reflect in your account within 2-3 business days.',
      unreadCount: 0,
      tags: 'Invoice,Payment',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: marcus?.id || null,
            senderName: 'Marcus Johnson',
            senderEmail: 'marcus.johnson@vortexdigital.com',
            recipientName: 'Emma Wilson',
            recipientEmail: 'emma@foodvibe.com',
            subject: 'Invoice #INV-2024-089 - Payment Reminder',
            body: 'Hi Emma,\n\nThis is a friendly reminder that invoice #INV-2024-089 for $4,500.00 was due on March 1st.\n\nIf you\'ve already processed the payment, please disregard this message. Otherwise, please let us know if you need any clarification on the invoice.\n\nThank you for your prompt attention.\n\nBest regards,\nMarcus Johnson\nVortex Digital',
            type: 'email',
            direction: 'outbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 7 * dayMs),
            openedAt: new Date(now - 6.5 * dayMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Emma Wilson',
            senderEmail: 'emma@foodvibe.com',
            recipientName: 'Marcus Johnson',
            recipientEmail: 'marcus.johnson@vortexdigital.com',
            subject: 'Re: Invoice #INV-2024-089 - Payment Reminder',
            body: 'Hi Marcus,\n\nApologies for the delay. Payment has been processed. Should reflect in your account within 2-3 business days.\n\nThanks for your patience.\n\nEmma',
            type: 'email',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: new Date(now - 2.5 * dayMs),
            deliveredAt: new Date(now - 3 * dayMs),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // Archived email conversation
  const emailConv4 = await db.conversation.create({
    data: {
      subject: 'Brand Guidelines Update - Q1',
      type: 'email',
      status: 'archived',
      priority: 'low',
      channel: 'email',
      clientId: fashionhub?.id || null,
      assignedToId: priya?.id || null,
      lastMessageAt: new Date(now - 14 * dayMs),
      lastMessagePreview: 'Updated guidelines look great. We\'ll implement them across all new content.',
      unreadCount: 0,
      tags: 'Brand,Guidelines',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: null,
            senderName: 'Sophia Martinez',
            senderEmail: 'sophia@fashionhub.com',
            recipientName: 'Priya Sharma',
            recipientEmail: 'priya.sharma@vortexdigital.com',
            subject: 'Brand Guidelines Update - Q1',
            body: 'Hi Priya,\n\nWe\'ve updated our brand guidelines for Q1. Key changes include:\n- New primary color palette\n- Updated logo usage rules\n- Fresh typography guidelines\n\nPlease ensure all future content follows the new guidelines.\n\nThanks,\nSophia',
            type: 'email',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: new Date(now - 20 * dayMs),
            deliveredAt: new Date(now - 21 * dayMs),
            openedAt: new Date(now - 20.5 * dayMs),
            organizationId: orgId,
          },
          {
            senderId: priya?.id || null,
            senderName: 'Priya Sharma',
            senderEmail: 'priya.sharma@vortexdigital.com',
            recipientName: 'Sophia Martinez',
            recipientEmail: 'sophia@fashionhub.com',
            subject: 'Re: Brand Guidelines Update - Q1',
            body: 'Hi Sophia,\n\nUpdated guidelines look great. We\'ll implement them across all new content.\n\nBest,\nPriya',
            type: 'email',
            direction: 'outbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 14 * dayMs),
            openedAt: new Date(now - 13.5 * dayMs),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // Closed WhatsApp conversation
  const waConv3 = await db.conversation.create({
    data: {
      subject: null,
      type: 'whatsapp',
      status: 'closed',
      priority: 'low',
      channel: 'whatsapp',
      clientId: techcorp?.id || null,
      lastMessageAt: new Date(now - 10 * dayMs),
      lastMessagePreview: '👍 All confirmed! See you at the event.',
      unreadCount: 0,
      tags: 'Event',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: null,
            senderName: 'Alex Thompson',
            senderPhone: '+1-555-0101',
            recipientName: 'Sarah Chen',
            recipientPhone: '+1-555-1003',
            body: 'Hi Sarah! Are we still good for the product demo event on the 15th? 🎯',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            readAt: new Date(now - 11 * dayMs),
            organizationId: orgId,
          },
          {
            senderId: sarah?.id || null,
            senderName: 'Sarah Chen',
            senderPhone: '+1-555-1003',
            recipientName: 'Alex Thompson',
            recipientPhone: '+1-555-0101',
            body: '👍 All confirmed! See you at the event.',
            type: 'whatsapp',
            direction: 'outbound',
            status: 'delivered',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 10 * dayMs),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  // Mixed conversation (email started, then WhatsApp follow-up)
  const mixedConv = await db.conversation.create({
    data: {
      subject: 'FoodVibe Recipe Series - Content Review',
      type: 'mixed',
      status: 'active',
      priority: 'normal',
      channel: 'email',
      clientId: foodvibe?.id || null,
      assignedToId: priya?.id || null,
      lastMessageAt: new Date(now - 45 * 60000),
      lastMessagePreview: 'Just checked the recipe photos — they look amazing! 📸',
      unreadCount: 1,
      tags: 'Content,Review',
      organizationId: orgId,
      messages: {
        create: [
          {
            senderId: priya?.id || null,
            senderName: 'Priya Sharma',
            senderEmail: 'priya.sharma@vortexdigital.com',
            recipientName: 'Emma Wilson',
            recipientEmail: 'emma@foodvibe.com',
            subject: 'FoodVibe Recipe Series - Content Review',
            body: 'Hi Emma,\n\nWe\'ve completed the first batch of recipe content for the series. There are 6 recipes ready for review:\n\n1. Lemon Herb Grilled Salmon\n2. Mediterranean Quinoa Bowl\n3. Avocado Toast with Poached Eggs\n4. Thai Green Curry\n5. Berry Smoothie Bowl\n6. Mushroom Risotto\n\nEach recipe includes step-by-step photos and a short video for social media.\n\nPlease review and share your feedback.\n\nBest,\nPriya',
            type: 'email',
            direction: 'outbound',
            status: 'read',
            isStarred: false,
            isRead: true,
            deliveredAt: new Date(now - 2 * dayMs),
            openedAt: new Date(now - 1.8 * dayMs),
            organizationId: orgId,
          },
          {
            senderId: null,
            senderName: 'Emma Wilson',
            senderPhone: '+1-555-0404',
            recipientName: 'Priya Sharma',
            recipientPhone: '+1-555-1004',
            body: 'Just checked the recipe photos — they look amazing! 📸 Quick note: can we adjust the lighting on the salmon photos? They look a bit dark.',
            type: 'whatsapp',
            direction: 'inbound',
            status: 'delivered',
            isStarred: false,
            isRead: false,
            deliveredAt: new Date(now - 45 * 60000),
            organizationId: orgId,
          },
        ],
      },
    },
  })

  return {
    templates: templates.length,
    contacts: contacts.length,
    conversations: 7,
  }
}

async function seedFinance(orgId: string, userId: string) {
  // Clean up existing finance data
  await db.journalEntryLine.deleteMany({ where: { organizationId: orgId } })
  await db.journalEntry.deleteMany({ where: { organizationId: orgId } })
  await db.account.deleteMany({ where: { organizationId: orgId } })
  await db.taxRate.deleteMany({ where: { organizationId: orgId } })

  // ─── Chart of Accounts ────────────────────────────────────────

  // ASSETS - Current Assets (parent)
  const currentAssets = await db.account.create({
    data: { code: '1000', name: 'Current Assets', type: 'asset', category: 'current_assets', description: 'Assets expected to be converted to cash within one year', normalBalance: 'debit', balance: 0, isActive: true, organizationId: orgId },
  })
  const cash = await db.account.create({ data: { code: '1100', name: 'Cash', type: 'asset', category: 'current_assets', description: 'Cash on hand and in bank accounts', normalBalance: 'debit', balance: 45000, isActive: true, parentId: currentAssets.id, organizationId: orgId } })
  const accountsReceivable = await db.account.create({ data: { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_assets', description: 'Amounts owed by customers', normalBalance: 'debit', balance: 28500, isActive: true, parentId: currentAssets.id, organizationId: orgId } })
  await db.account.create({ data: { code: '1300', name: 'Petty Cash', type: 'asset', category: 'current_assets', description: 'Small cash fund for minor expenses', normalBalance: 'debit', balance: 500, isActive: true, parentId: currentAssets.id, organizationId: orgId } })
  await db.account.create({ data: { code: '1400', name: 'Inventory', type: 'asset', category: 'current_assets', description: 'Goods available for sale', normalBalance: 'debit', balance: 12000, isActive: true, parentId: currentAssets.id, organizationId: orgId } })

  // ASSETS - Fixed Assets (parent)
  const fixedAssets = await db.account.create({
    data: { code: '1500', name: 'Fixed Assets', type: 'asset', category: 'fixed_assets', description: 'Long-term tangible assets', normalBalance: 'debit', balance: 0, isActive: true, organizationId: orgId },
  })
  await db.account.create({ data: { code: '1510', name: 'Office Equipment', type: 'asset', category: 'fixed_assets', description: 'Furniture, fixtures, and office equipment', normalBalance: 'debit', balance: 8500, isActive: true, parentId: fixedAssets.id, organizationId: orgId } })
  await db.account.create({ data: { code: '1520', name: 'Computers', type: 'asset', category: 'fixed_assets', description: 'Computer hardware and software', normalBalance: 'debit', balance: 15000, isActive: true, parentId: fixedAssets.id, organizationId: orgId } })
  await db.account.create({ data: { code: '1530', name: 'Vehicles', type: 'asset', category: 'fixed_assets', description: 'Company vehicles', normalBalance: 'debit', balance: 25000, isActive: true, parentId: fixedAssets.id, organizationId: orgId } })

  // LIABILITIES - Current Liabilities (parent)
  const currentLiabilities = await db.account.create({
    data: { code: '2000', name: 'Current Liabilities', type: 'liability', category: 'current_liabilities', description: 'Obligations due within one year', normalBalance: 'credit', balance: 0, isActive: true, organizationId: orgId },
  })
  await db.account.create({ data: { code: '2100', name: 'Accounts Payable', type: 'liability', category: 'current_liabilities', description: 'Amounts owed to vendors', normalBalance: 'credit', balance: 15000, isActive: true, parentId: currentLiabilities.id, organizationId: orgId } })
  await db.account.create({ data: { code: '2200', name: 'Accrued Expenses', type: 'liability', category: 'current_liabilities', description: 'Expenses incurred but not yet paid', normalBalance: 'credit', balance: 5000, isActive: true, parentId: currentLiabilities.id, organizationId: orgId } })
  await db.account.create({ data: { code: '2300', name: 'Tax Payable', type: 'liability', category: 'current_liabilities', description: 'Taxes owed to government', normalBalance: 'credit', balance: 3500, isActive: true, parentId: currentLiabilities.id, organizationId: orgId } })

  // LIABILITIES - Long-term Liabilities (parent)
  const longTermLiabilities = await db.account.create({
    data: { code: '2500', name: 'Long-term Liabilities', type: 'liability', category: 'long_term_liabilities', description: 'Obligations due beyond one year', normalBalance: 'credit', balance: 0, isActive: true, organizationId: orgId },
  })
  const bankLoan = await db.account.create({ data: { code: '2510', name: 'Bank Loan', type: 'liability', category: 'long_term_liabilities', description: 'Long-term bank loan', normalBalance: 'credit', balance: 50000, isActive: true, parentId: longTermLiabilities.id, organizationId: orgId } })

  // EQUITY (parent)
  const ownersEquity = await db.account.create({
    data: { code: '3000', name: "Owner's Equity", type: 'equity', category: 'equity', description: "Owner's interest in the business", normalBalance: 'credit', balance: 0, isActive: true, organizationId: orgId },
  })
  const ownersCapital = await db.account.create({ data: { code: '3100', name: "Owner's Capital", type: 'equity', category: 'equity', description: "Owner's investment in the business", normalBalance: 'credit', balance: 100000, isActive: true, parentId: ownersEquity.id, organizationId: orgId } })
  await db.account.create({ data: { code: '3200', name: 'Retained Earnings', type: 'equity', category: 'equity', description: 'Accumulated profits not distributed', normalBalance: 'credit', balance: 0, isActive: true, parentId: ownersEquity.id, organizationId: orgId } })

  // REVENUE (parent)
  const revenue = await db.account.create({
    data: { code: '4000', name: 'Revenue', type: 'revenue', category: 'revenue', description: 'Income from business operations', normalBalance: 'credit', balance: 0, isActive: true, organizationId: orgId },
  })
  const serviceRevenue = await db.account.create({ data: { code: '4100', name: 'Service Revenue', type: 'revenue', category: 'revenue', description: 'Revenue from services rendered', normalBalance: 'credit', balance: 15000, isActive: true, parentId: revenue.id, organizationId: orgId } })
  await db.account.create({ data: { code: '4200', name: 'Product Revenue', type: 'revenue', category: 'revenue', description: 'Revenue from product sales', normalBalance: 'credit', balance: 0, isActive: true, parentId: revenue.id, organizationId: orgId } })
  const consultingRevenue = await db.account.create({ data: { code: '4300', name: 'Consulting Revenue', type: 'revenue', category: 'revenue', description: 'Revenue from consulting services', normalBalance: 'credit', balance: 8000, isActive: true, parentId: revenue.id, organizationId: orgId } })

  // EXPENSE - Operating Expenses (parent)
  const operatingExpenses = await db.account.create({
    data: { code: '5000', name: 'Operating Expenses', type: 'expense', category: 'operating_expenses', description: 'Day-to-day operating costs', normalBalance: 'debit', balance: 0, isActive: true, organizationId: orgId },
  })
  const salaries = await db.account.create({ data: { code: '5100', name: 'Salaries', type: 'expense', category: 'operating_expenses', description: 'Employee salaries and wages', normalBalance: 'debit', balance: 12000, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })
  const rentExpense = await db.account.create({ data: { code: '5200', name: 'Rent', type: 'expense', category: 'operating_expenses', description: 'Office and facility rent', normalBalance: 'debit', balance: 5000, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })
  const utilities = await db.account.create({ data: { code: '5300', name: 'Utilities', type: 'expense', category: 'operating_expenses', description: 'Electricity, water, internet', normalBalance: 'debit', balance: 1200, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })
  const officeSupplies = await db.account.create({ data: { code: '5400', name: 'Office Supplies', type: 'expense', category: 'operating_expenses', description: 'Office consumables and supplies', normalBalance: 'debit', balance: 800, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })
  const marketing = await db.account.create({ data: { code: '5500', name: 'Marketing', type: 'expense', category: 'operating_expenses', description: 'Marketing and advertising costs', normalBalance: 'debit', balance: 3500, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })
  await db.account.create({ data: { code: '5600', name: 'Insurance', type: 'expense', category: 'operating_expenses', description: 'Business insurance premiums', normalBalance: 'debit', balance: 0, isActive: true, parentId: operatingExpenses.id, organizationId: orgId } })

  // EXPENSE - Cost of Goods Sold (parent)
  const cogs = await db.account.create({
    data: { code: '6000', name: 'Cost of Goods Sold', type: 'expense', category: 'cogs', description: 'Direct costs of producing goods', normalBalance: 'debit', balance: 0, isActive: true, organizationId: orgId },
  })
  await db.account.create({ data: { code: '6100', name: 'Materials', type: 'expense', category: 'cogs', description: 'Raw materials cost', normalBalance: 'debit', balance: 0, isActive: true, parentId: cogs.id, organizationId: orgId } })
  await db.account.create({ data: { code: '6200', name: 'Direct Labor', type: 'expense', category: 'cogs', description: 'Direct labor costs', normalBalance: 'debit', balance: 0, isActive: true, parentId: cogs.id, organizationId: orgId } })

  const totalAccounts = 28

  // ─── Tax Rates ────────────────────────────────────────────────
  await Promise.all([
    db.taxRate.create({ data: { name: 'Federal Income Tax', rate: 21, type: 'income', isActive: true, organizationId: orgId } }),
    db.taxRate.create({ data: { name: 'State Income Tax', rate: 8.84, type: 'income', isActive: true, organizationId: orgId } }),
    db.taxRate.create({ data: { name: 'Sales Tax', rate: 8.25, type: 'sales', isActive: true, organizationId: orgId } }),
    db.taxRate.create({ data: { name: 'Payroll Tax', rate: 7.65, type: 'payroll', isActive: true, organizationId: orgId } }),
    db.taxRate.create({ data: { name: 'VAT', rate: 20, type: 'vat', isActive: false, organizationId: orgId } }),
  ])

  // ─── Journal Entries ──────────────────────────────────────────

  // JE-001: Initial capital investment
  await db.journalEntry.create({
    data: {
      number: 'JE-001',
      date: new Date('2026-01-01'),
      description: 'Initial capital investment by owner',
      reference: 'CAP-001',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-01',
      totalDebit: 100000,
      totalCredit: 100000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: cash.id, debit: 100000, credit: 0, description: 'Cash received from owner', organizationId: orgId },
          { accountId: ownersCapital.id, debit: 0, credit: 100000, description: "Owner's capital contribution", organizationId: orgId },
        ],
      },
    },
  })

  // JE-002: Bank loan received
  await db.journalEntry.create({
    data: {
      number: 'JE-002',
      date: new Date('2026-01-05'),
      description: 'Bank loan received',
      reference: 'LOAN-001',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-01',
      totalDebit: 50000,
      totalCredit: 50000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: cash.id, debit: 50000, credit: 0, description: 'Cash received from bank loan', organizationId: orgId },
          { accountId: bankLoan.id, debit: 0, credit: 50000, description: 'Bank loan liability', organizationId: orgId },
        ],
      },
    },
  })

  // JE-003: Office rent payment
  await db.journalEntry.create({
    data: {
      number: 'JE-003',
      date: new Date('2026-01-10'),
      description: 'Office rent payment for January',
      reference: 'CHK-001',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-01',
      totalDebit: 5000,
      totalCredit: 5000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: rentExpense.id, debit: 5000, credit: 0, description: 'January rent expense', organizationId: orgId },
          { accountId: cash.id, debit: 0, credit: 5000, description: 'Cash paid for rent', organizationId: orgId },
        ],
      },
    },
  })

  // JE-004: Service revenue
  await db.journalEntry.create({
    data: {
      number: 'JE-004',
      date: new Date('2026-01-15'),
      description: 'Service revenue earned on account',
      reference: 'INV-SVC-001',
      source: 'invoice',
      status: 'posted',
      isAdjusting: false,
      period: '2026-01',
      totalDebit: 15000,
      totalCredit: 15000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: accountsReceivable.id, debit: 15000, credit: 0, description: 'Amount receivable from client', organizationId: orgId },
          { accountId: serviceRevenue.id, debit: 0, credit: 15000, description: 'Service revenue earned', organizationId: orgId },
        ],
      },
    },
  })

  // JE-005: Salary payment
  await db.journalEntry.create({
    data: {
      number: 'JE-005',
      date: new Date('2026-01-31'),
      description: 'Salary payment for January',
      reference: 'PAYROLL-001',
      source: 'payroll',
      status: 'posted',
      isAdjusting: false,
      period: '2026-01',
      totalDebit: 12000,
      totalCredit: 12000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: salaries.id, debit: 12000, credit: 0, description: 'January salaries expense', organizationId: orgId },
          { accountId: cash.id, debit: 0, credit: 12000, description: 'Cash paid for salaries', organizationId: orgId },
        ],
      },
    },
  })

  // JE-006: Client payment received
  await db.journalEntry.create({
    data: {
      number: 'JE-006',
      date: new Date('2026-02-05'),
      description: 'Client payment received',
      reference: 'RCPT-001',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-02',
      totalDebit: 15000,
      totalCredit: 15000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: cash.id, debit: 15000, credit: 0, description: 'Cash received from client', organizationId: orgId },
          { accountId: accountsReceivable.id, debit: 0, credit: 15000, description: 'Accounts receivable cleared', organizationId: orgId },
        ],
      },
    },
  })

  // JE-007: Office supplies purchase
  await db.journalEntry.create({
    data: {
      number: 'JE-007',
      date: new Date('2026-02-08'),
      description: 'Office supplies purchase',
      reference: 'CHK-002',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-02',
      totalDebit: 800,
      totalCredit: 800,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: officeSupplies.id, debit: 800, credit: 0, description: 'Office supplies purchased', organizationId: orgId },
          { accountId: cash.id, debit: 0, credit: 800, description: 'Cash paid for supplies', organizationId: orgId },
        ],
      },
    },
  })

  // JE-008: Marketing expense
  await db.journalEntry.create({
    data: {
      number: 'JE-008',
      date: new Date('2026-02-10'),
      description: 'Marketing expense - digital advertising',
      reference: 'CHK-003',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-02',
      totalDebit: 3500,
      totalCredit: 3500,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: marketing.id, debit: 3500, credit: 0, description: 'Digital advertising expense', organizationId: orgId },
          { accountId: cash.id, debit: 0, credit: 3500, description: 'Cash paid for marketing', organizationId: orgId },
        ],
      },
    },
  })

  // JE-009: Consulting revenue
  await db.journalEntry.create({
    data: {
      number: 'JE-009',
      date: new Date('2026-02-15'),
      description: 'Consulting revenue earned',
      reference: 'INV-CON-001',
      source: 'invoice',
      status: 'posted',
      isAdjusting: false,
      period: '2026-02',
      totalDebit: 8000,
      totalCredit: 8000,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: cash.id, debit: 8000, credit: 0, description: 'Cash received for consulting', organizationId: orgId },
          { accountId: consultingRevenue.id, debit: 0, credit: 8000, description: 'Consulting revenue earned', organizationId: orgId },
        ],
      },
    },
  })

  // JE-010: Utility payment
  await db.journalEntry.create({
    data: {
      number: 'JE-010',
      date: new Date('2026-02-20'),
      description: 'Utility payment for February',
      reference: 'CHK-004',
      source: 'manual',
      status: 'posted',
      isAdjusting: false,
      period: '2026-02',
      totalDebit: 1200,
      totalCredit: 1200,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: [
          { accountId: utilities.id, debit: 1200, credit: 0, description: 'February utilities expense', organizationId: orgId },
          { accountId: cash.id, debit: 0, credit: 1200, description: 'Cash paid for utilities', organizationId: orgId },
        ],
      },
    },
  })

  return { accounts: totalAccounts, taxRates: 5, journalEntries: 10 }
}

async function seedMissingModules(orgId: string) {
  const now = Date.now()
  const dayMs = 86400000

  // Get existing users and clients
  const users = await db.user.findMany({ where: { organizationId: orgId } })
  const clients = await db.client.findMany({ where: { organizationId: orgId } })
  const campaigns = await db.campaign.findMany({ where: { organizationId: orgId } })
  const contents = await db.content.findMany({ where: { organizationId: orgId } })

  if (users.length === 0 || clients.length === 0) {
    console.error('No users or clients found - cannot seed missing modules')
    return
  }

  const adminUser = users.find(u => u.role === 'admin') || users[0]
  const member1 = users.find(u => u.role === 'lead') || users[1] || users[0]
  const member2 = users.find(u => u.role === 'member') || users[2] || users[0]
  const member3 = users.length > 3 ? users[3] : users[0]
  const member4 = users.length > 4 ? users[4] : users[0]

  const client1 = clients[0] // TechCorp
  const client2 = clients.length > 1 ? clients[1] : clients[0] // FashionHub
  const client3 = clients.length > 2 ? clients[2] : clients[0] // FoodVibe
  const client4 = clients.length > 3 ? clients[3] : clients[0] // AutoDrive
  const client5 = clients.length > 4 ? clients[4] : clients[0] // WellnessCo

  const campaign1 = campaigns[0]
  const campaign2 = campaigns.length > 1 ? campaigns[1] : campaigns[0]

  // ============================================
  // 1. Influencers (5)
  // ============================================
  const influencers = await Promise.all([
    db.influencer.create({
      data: {
        name: 'StyleMaven',
        username: '@stylemaven',
        platform: 'instagram',
        followers: 1250000,
        engagementRate: 4.8,
        niche: 'fashion,lifestyle,luxury',
        email: 'collab@stylemaven.com',
        phone: '+1-555-2001',
        notes: 'Top-tier fashion influencer with strong engagement on Instagram. Great for luxury brand partnerships.',
        status: 'active',
        rate: 5000,
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2025-12-31'),
        organizationId: orgId,
        clientId: client2.id,
        campaignId: campaign2?.id || null,
      },
    }),
    db.influencer.create({
      data: {
        name: 'TechGuru Dan',
        username: '@techgurudan',
        platform: 'youtube',
        followers: 890000,
        engagementRate: 3.5,
        niche: 'technology,saas,enterprise',
        email: 'dan@techguru.io',
        phone: '+1-555-2002',
        notes: 'YouTube tech reviewer with strong B2B audience. Excellent for product demos and reviews.',
        status: 'active',
        rate: 3500,
        contractStart: new Date('2025-02-01'),
        contractEnd: new Date('2025-08-31'),
        organizationId: orgId,
        clientId: client1.id,
        campaignId: campaign1?.id || null,
      },
    }),
    db.influencer.create({
      data: {
        name: 'FoodieExplorer',
        username: '@foodieexplorer',
        platform: 'tiktok',
        followers: 2100000,
        engagementRate: 6.2,
        niche: 'food,cooking,lifestyle',
        email: 'hello@foodieexplorer.com',
        phone: '+1-555-2003',
        notes: 'Viral food content creator on TikTok. Known for recipe videos and restaurant reviews.',
        status: 'negotiating',
        rate: 4500,
        organizationId: orgId,
        clientId: client3.id,
      },
    }),
    db.influencer.create({
      data: {
        name: 'EcoDriver Sam',
        username: '@ecodriver_sam',
        platform: 'youtube',
        followers: 450000,
        engagementRate: 5.1,
        niche: 'ev,automotive,sustainability',
        email: 'sam@ecodriver.com',
        phone: '+1-555-2004',
        notes: 'EV enthusiast and sustainability advocate. Perfect for automotive green campaigns.',
        status: 'contacted',
        rate: 2500,
        organizationId: orgId,
        clientId: client4.id,
      },
    }),
    db.influencer.create({
      data: {
        name: 'WellnessWithMia',
        username: '@wellnesswithmia',
        platform: 'instagram',
        followers: 780000,
        engagementRate: 4.2,
        niche: 'wellness,fitness,mental-health',
        email: 'mia@wellnesswithmia.com',
        phone: '+1-555-2005',
        notes: 'Wellness and mindfulness advocate. Strong community engagement on Instagram.',
        status: 'prospect',
        rate: 2000,
        organizationId: orgId,
        clientId: client5.id,
      },
    }),
  ])

  // ============================================
  // 2. Invoices + InvoiceItems (5 invoices)
  // ============================================
  const invoiceData = [
    { number: 'INV-2025-001', clientId: client1.id, campaignId: campaign1?.id || null, status: 'paid', subtotal: 15000, tax: 1237.50, total: 16237.50, dueDate: new Date(now - 20 * dayMs), paidAt: new Date(now - 15 * dayMs), notes: 'TechCorp Spring Launch Campaign - Phase 1', items: [
      { description: 'Campaign Strategy & Planning', quantity: 1, rate: 5000, amount: 5000 },
      { description: 'Social Media Content Creation (10 posts)', quantity: 10, rate: 500, amount: 5000 },
      { description: 'Video Production (2 videos)', quantity: 2, rate: 2500, amount: 5000 },
    ]},
    { number: 'INV-2025-002', clientId: client2.id, campaignId: campaign2?.id || null, status: 'sent', subtotal: 8200, tax: 676.50, total: 8876.50, dueDate: new Date(now + 15 * dayMs), notes: 'FashionHub Summer Collection Campaign', items: [
      { description: 'Instagram Carousel Design (5 sets)', quantity: 5, rate: 800, amount: 4000 },
      { description: 'TikTok Video Production (3 reels)', quantity: 3, rate: 1200, amount: 3600 },
      { description: 'Influencer Coordination Fee', quantity: 1, rate: 600, amount: 600 },
    ]},
    { number: 'INV-2025-003', clientId: client3.id, campaignId: null, status: 'draft', subtotal: 4500, tax: 371.25, total: 4871.25, dueDate: null, notes: 'FoodVibe Recipe Series - Initial Phase', items: [
      { description: 'Recipe Card Design (6 cards)', quantity: 6, rate: 350, amount: 2100 },
      { description: 'Food Photography Session', quantity: 1, rate: 1500, amount: 1500 },
      { description: 'Social Media Copywriting', quantity: 1, rate: 900, amount: 900 },
    ]},
    { number: 'INV-2025-004', clientId: client4.id, campaignId: null, status: 'overdue', subtotal: 12000, tax: 990, total: 12990, dueDate: new Date(now - 10 * dayMs), notes: 'AutoDrive EV Campaign - overdue payment', items: [
      { description: 'YouTube Video Production (EV Range Explainer)', quantity: 1, rate: 5000, amount: 5000 },
      { description: 'Cross-platform Ad Creative (8 variants)', quantity: 8, rate: 500, amount: 4000 },
      { description: 'Campaign Analytics & Reporting', quantity: 1, rate: 3000, amount: 3000 },
    ]},
    { number: 'INV-2025-005', clientId: client1.id, campaignId: campaign1?.id || null, status: 'paid', subtotal: 6800, tax: 561, total: 7361, dueDate: new Date(now - 45 * dayMs), paidAt: new Date(now - 40 * dayMs), notes: 'TechCorp Product Launch - Additional Content', items: [
      { description: 'LinkedIn Article Writing (2 articles)', quantity: 2, rate: 1200, amount: 2400 },
      { description: 'Infographic Design (3 graphics)', quantity: 3, rate: 800, amount: 2400 },
      { description: 'Email Newsletter Design', quantity: 2, rate: 1000, amount: 2000 },
    ]},
  ]

  for (const inv of invoiceData) {
    const { items, ...invFields } = inv
    await db.invoice.create({
      data: {
        ...invFields,
        organizationId: orgId,
        invoiceItems: {
          create: items.map(item => ({
            ...item,
            organizationId: orgId,
          })),
        },
      },
    })
  }

  // ============================================
  // 3. TimeEntries (5)
  // ============================================
  await Promise.all([
    db.timeEntry.create({
      data: { description: 'Campaign strategy meeting with TechCorp', hours: 3.5, billable: true, date: new Date(now - 5 * dayMs), userId: adminUser.id, clientId: client1.id, campaignId: campaign1?.id || null, contentId: contents[0]?.id || null, organizationId: orgId },
    }),
    db.timeEntry.create({
      data: { description: 'FashionHub summer collection content review', hours: 2, billable: true, date: new Date(now - 3 * dayMs), userId: member1.id, clientId: client2.id, campaignId: campaign2?.id || null, contentId: contents[1]?.id || null, organizationId: orgId },
    }),
    db.timeEntry.create({
      data: { description: 'Video editing - TechCorp product demo', hours: 6, billable: true, date: new Date(now - 2 * dayMs), userId: member2.id, clientId: client1.id, campaignId: campaign1?.id || null, contentId: contents[2]?.id || null, organizationId: orgId },
    }),
    db.timeEntry.create({
      data: { description: 'Internal team planning session', hours: 1.5, billable: false, date: new Date(now - 1 * dayMs), userId: member3.id, clientId: null, campaignId: null, contentId: null, organizationId: orgId },
    }),
    db.timeEntry.create({
      data: { description: 'FoodVibe recipe card design and review', hours: 4, billable: true, date: new Date(now - 0.5 * dayMs), userId: member4.id, clientId: client3.id, campaignId: null, contentId: contents[3]?.id || null, organizationId: orgId },
    }),
  ])

  // ============================================
  // 4. Assets - Media (6)
  // ============================================
  await Promise.all([
    db.asset.create({
      data: { name: 'TechCorp Product Hero Image', type: 'image', url: '/assets/techcorp-hero.jpg', thumbnailUrl: '/assets/thumbs/techcorp-hero.jpg', size: 2400000, mimeType: 'image/jpeg', tags: 'hero,product,techcorp', folder: '/clients/techcorp', metadata: JSON.stringify({ width: 1920, height: 1080, orientation: 'landscape' }), organizationId: orgId, uploadedById: adminUser.id, clientId: client1.id },
    }),
    db.asset.create({
      data: { name: 'FashionHub Summer Lookbook', type: 'image', url: '/assets/fashionhub-lookbook.pdf', thumbnailUrl: '/assets/thumbs/fashionhub-lookbook.jpg', size: 15000000, mimeType: 'application/pdf', tags: 'lookbook,summer,fashionhub', folder: '/clients/fashionhub', metadata: JSON.stringify({ pages: 24, format: 'A4' }), organizationId: orgId, uploadedById: member1.id, clientId: client2.id },
    }),
    db.asset.create({
      data: { name: 'AutoDrive EV Promo Video', type: 'video', url: '/assets/autodrive-ev-promo.mp4', thumbnailUrl: '/assets/thumbs/autodrive-ev-promo.jpg', size: 85000000, mimeType: 'video/mp4', tags: 'promo,video,ev,autodrive', folder: '/clients/autodrive', metadata: JSON.stringify({ duration: 180, width: 1920, height: 1080, fps: 30 }), organizationId: orgId, uploadedById: member2.id, clientId: client4.id },
    }),
    db.asset.create({
      data: { name: 'Vortex Brand Guidelines 2025', type: 'brand-guide', url: '/assets/vortex-brand-guide.pdf', thumbnailUrl: null, size: 5200000, mimeType: 'application/pdf', tags: 'brand,guidelines,internal', folder: '/internal/brand', metadata: JSON.stringify({ pages: 32 }), organizationId: orgId, uploadedById: adminUser.id, clientId: null },
    }),
    db.asset.create({
      data: { name: 'FoodVibe Recipe Template', type: 'template', url: '/assets/foodvibe-template.psd', thumbnailUrl: '/assets/thumbs/foodvibe-template.jpg', size: 3200000, mimeType: 'image/vnd.adobe.photoshop', tags: 'template,recipe,foodvibe', folder: '/clients/foodvibe/templates', metadata: JSON.stringify({ width: 1080, height: 1080, layers: 12 }), organizationId: orgId, uploadedById: member3.id, clientId: client3.id },
    }),
    db.asset.create({
      data: { name: 'WellnessCo Meditation Audio', type: 'document', url: '/assets/wellnessco-meditation.mp3', thumbnailUrl: null, size: 12000000, mimeType: 'audio/mpeg', tags: 'audio,meditation,wellness', folder: '/clients/wellnessco', metadata: JSON.stringify({ duration: 300, bitrate: 320 }), organizationId: orgId, uploadedById: member4.id, clientId: client5.id },
    }),
  ])

  // ============================================
  // 5. BrandKits (3)
  // ============================================
  await Promise.all([
    db.brandKit.create({
      data: { name: 'TechCorp Primary Colors', type: 'color', value: JSON.stringify({ primary: '#1a56db', secondary: '#3b82f6', accent: '#60a5fa', dark: '#1e3a5f', light: '#dbeafe' }), clientId: client1.id, organizationId: orgId },
    }),
    db.brandKit.create({
      data: { name: 'TechCorp Typography', type: 'font', value: JSON.stringify({ heading: 'Inter Bold', body: 'Inter Regular', mono: 'JetBrains Mono', sizes: { h1: 48, h2: 36, h3: 28, body: 16 } }), clientId: client1.id, organizationId: orgId },
    }),
    db.brandKit.create({
      data: { name: 'FashionHub Brand Voice', type: 'voice', value: JSON.stringify({ tone: 'Aspirational yet approachable', personality: ['chic', 'confident', 'inclusive'], avoid: ['aggressive sales language', 'exclusionary terms'], tagline_style: 'Short & punchy' }), clientId: client2.id, organizationId: orgId },
    }),
  ])

  // ============================================
  // 6. Expenses (6)
  // ============================================
  await Promise.all([
    db.expense.create({
      data: { title: 'Adobe Creative Cloud Subscription', description: 'Monthly subscription for the design team - Photoshop, Illustrator, Premiere Pro', amount: 599.88, category: 'Software', date: new Date(now - 3 * dayMs), status: 'approved', receiptUrl: '/receipts/adobe-2025-03.pdf', submittedById: adminUser.id, approvedById: adminUser.id, approvedAt: new Date(now - 2 * dayMs), clientId: null, campaignId: null, organizationId: orgId },
    }),
    db.expense.create({
      data: { title: 'FoodVibe Photoshoot - Studio Rental', description: 'Half-day studio rental for FoodVibe recipe card photoshoot', amount: 1200, category: 'Production', date: new Date(now - 5 * dayMs), status: 'approved', receiptUrl: '/receipts/studio-rental.pdf', submittedById: member3.id, approvedById: adminUser.id, approvedAt: new Date(now - 4 * dayMs), clientId: client3.id, campaignId: null, organizationId: orgId },
    }),
    db.expense.create({
      data: { title: 'TechCorp Campaign - Paid Social Ads', description: 'LinkedIn and Twitter ad spend for TechCorp product launch campaign', amount: 3500, category: 'Advertising', date: new Date(now - 7 * dayMs), status: 'approved', receiptUrl: '/receipts/techcorp-ads.pdf', submittedById: member1.id, approvedById: adminUser.id, approvedAt: new Date(now - 6 * dayMs), clientId: client1.id, campaignId: campaign1?.id || null, organizationId: orgId },
    }),
    db.expense.create({
      data: { title: 'Team Lunch - Campaign Kickoff', description: 'Team lunch for the FashionHub summer campaign kickoff meeting', amount: 285.50, category: 'Meals', date: new Date(now - 2 * dayMs), status: 'pending', receiptUrl: '/receipts/team-lunch.pdf', submittedById: member2.id, clientId: client2.id, campaignId: campaign2?.id || null, organizationId: orgId },
    }),
    db.expense.create({
      data: { title: 'Stock Music License - Video Production', description: 'Annual stock music license for video content production', amount: 499, category: 'Software', date: new Date(now - 10 * dayMs), status: 'approved', receiptUrl: '/receipts/music-license.pdf', submittedById: member4.id, approvedById: adminUser.id, approvedAt: new Date(now - 9 * dayMs), clientId: null, campaignId: null, organizationId: orgId },
    }),
    db.expense.create({
      data: { title: 'AutoDrive EV - Location Scout Travel', description: 'Travel expenses for EV video shoot location scouting', amount: 750, category: 'Travel', date: new Date(now - 1 * dayMs), status: 'rejected', receiptUrl: '/receipts/travel-ev.pdf', submittedById: member2.id, approvedById: adminUser.id, approvedAt: new Date(now - 0.5 * dayMs), clientId: client4.id, campaignId: null, organizationId: orgId },
    }),
  ])

  // ============================================
  // 7. Products + Warehouses + StockMovements
  // ============================================
  const products = await Promise.all([
    db.product.create({
      data: { name: 'Vortex Branded T-Shirt', sku: 'VOR-TSH-001', description: 'Company branded cotton t-shirt for events', category: 'Merchandise', unit: 'pcs', unitPrice: 25, costPrice: 12, reorderLevel: 50, tags: 'merch,clothing,branded', isActive: true, organizationId: orgId },
    }),
    db.product.create({
      data: { name: 'Vortex Branded Notebook', sku: 'VOR-NBK-001', description: 'Premium hardcover notebook with Vortex branding', category: 'Merchandise', unit: 'pcs', unitPrice: 15, costPrice: 6, reorderLevel: 100, tags: 'merch,stationery,branded', isActive: true, organizationId: orgId },
    }),
    db.product.create({
      data: { name: 'Vortex Sticker Pack', sku: 'VOR-STK-001', description: 'Pack of 20 branded stickers for events and promotions', category: 'Merchandise', unit: 'pack', unitPrice: 8, costPrice: 2, reorderLevel: 200, tags: 'merch,sticker,promotional', isActive: true, organizationId: orgId },
    }),
    db.product.create({
      data: { name: 'Portable Power Bank', sku: 'VOR-PWR-001', description: '10000mAh power bank for client gifting', category: 'Gifts', unit: 'pcs', unitPrice: 35, costPrice: 18, reorderLevel: 30, tags: 'gift,electronics,client', isActive: true, organizationId: orgId },
    }),
    db.product.create({
      data: { name: 'Vortex Coffee Mug', sku: 'VOR-MUG-001', description: 'Ceramic mug with Vortex logo for office and client gifts', category: 'Merchandise', unit: 'pcs', unitPrice: 12, costPrice: 5, reorderLevel: 80, tags: 'merch,kitchen,branded', isActive: true, organizationId: orgId },
    }),
  ])

  const warehouses = await Promise.all([
    db.warehouse.create({
      data: { name: 'Main Office Storage', code: 'WH-MAIN', location: '123 Tech Ave, San Francisco, CA - Room B2', isDefault: true, isActive: true, organizationId: orgId },
    }),
    db.warehouse.create({
      data: { name: 'Event Supply Locker', code: 'WH-EVENT', location: '456 Market Blvd, San Jose, CA - Unit 7', isDefault: false, isActive: true, organizationId: orgId },
    }),
  ])

  // Create stock levels
  for (const product of products) {
    await db.stockLevel.create({
      data: { productId: product.id, warehouseId: warehouses[0].id, quantity: Math.floor(Math.random() * 100) + 50, reservedQuantity: Math.floor(Math.random() * 10), organizationId: orgId },
    })
    await db.stockLevel.create({
      data: { productId: product.id, warehouseId: warehouses[1].id, quantity: Math.floor(Math.random() * 50) + 20, reservedQuantity: Math.floor(Math.random() * 5), organizationId: orgId },
    })
  }

  // Stock movements (5)
  await Promise.all([
    db.stockMovement.create({
      data: { productId: products[0].id, warehouseId: warehouses[0].id, type: 'in', quantity: 100, reference: 'PO-2025-001', notes: 'Initial stock receipt from vendor', organizationId: orgId },
    }),
    db.stockMovement.create({
      data: { productId: products[1].id, warehouseId: warehouses[0].id, type: 'in', quantity: 200, reference: 'PO-2025-002', notes: 'Restock notebooks for Q2 events', organizationId: orgId },
    }),
    db.stockMovement.create({
      data: { productId: products[0].id, warehouseId: warehouses[1].id, type: 'transfer', quantity: 30, reference: 'TR-2025-001', notes: 'Transfer to event locker for TechCorp launch', organizationId: orgId },
    }),
    db.stockMovement.create({
      data: { productId: products[3].id, warehouseId: warehouses[0].id, type: 'out', quantity: 15, reference: 'SO-2025-001', notes: 'Client gift for AutoDrive partnership', organizationId: orgId },
    }),
    db.stockMovement.create({
      data: { productId: products[2].id, warehouseId: warehouses[1].id, type: 'out', quantity: 50, reference: 'SO-2025-002', notes: 'Event giveaway at FashionHub pop-up', organizationId: orgId },
    }),
  ])

  // ============================================
  // 8. Vendors (5)
  // ============================================
  const vendors = await Promise.all([
    db.vendor.create({
      data: { name: 'PrintMaster Inc.', email: 'orders@printmaster.com', phone: '+1-555-3001', address: '789 Industrial Pkwy, Oakland, CA', category: 'Printing', rating: 4.5, isActive: true, organizationId: orgId },
    }),
    db.vendor.create({
      data: { name: 'MerchWorld Suppliers', email: 'sales@merchworld.com', phone: '+1-555-3002', address: '321 Commerce St, Los Angeles, CA', category: 'Merchandise', rating: 4.2, isActive: true, organizationId: orgId },
    }),
    db.vendor.create({
      data: { name: 'CloudHost Solutions', email: 'support@cloudhost.io', phone: '+1-555-3003', address: '555 Data Center Dr, Seattle, WA', category: 'Technology', rating: 4.8, isActive: true, organizationId: orgId },
    }),
    db.vendor.create({
      data: { name: 'PixelForge Studios', email: 'hello@pixelforge.co', phone: '+1-555-3004', address: '200 Creative Ave, Portland, OR', category: 'Production', rating: 4.0, isActive: true, organizationId: orgId },
    }),
    db.vendor.create({
      data: { name: 'SwiftShip Logistics', email: 'logistics@swiftship.com', phone: '+1-555-3005', address: '888 Logistics Blvd, Reno, NV', category: 'Logistics', rating: 3.8, isActive: true, organizationId: orgId },
    }),
  ])

  // ============================================
  // 9. PurchaseOrders (3)
  // ============================================
  const po1 = await db.purchaseOrder.create({
    data: { number: 'PO-2025-001', vendorId: vendors[1].id, status: 'received', items: JSON.stringify([{ productId: products[0].id, name: products[0].name, quantity: 100, unitPrice: 12, total: 1200 }]), subtotal: 1200, tax: 99, total: 1299, orderDate: new Date(now - 15 * dayMs), expectedDate: new Date(now - 8 * dayMs), notes: 'Branded t-shirts for Q2 events', organizationId: orgId },
  })
  await db.purchaseOrderItem.create({
    data: { purchaseOrderId: po1.id, productId: products[0].id, quantity: 100, unitPrice: 12, total: 1200 },
  })

  const po2 = await db.purchaseOrder.create({
    data: { number: 'PO-2025-002', vendorId: vendors[1].id, status: 'ordered', items: JSON.stringify([{ productId: products[1].id, name: products[1].name, quantity: 200, unitPrice: 6, total: 1200 }]), subtotal: 1200, tax: 99, total: 1299, orderDate: new Date(now - 3 * dayMs), expectedDate: new Date(now + 5 * dayMs), notes: 'Notebook restock for Q2', organizationId: orgId },
  })
  await db.purchaseOrderItem.create({
    data: { purchaseOrderId: po2.id, productId: products[1].id, quantity: 200, unitPrice: 6, total: 1200 },
  })

  const po3 = await db.purchaseOrder.create({
    data: { number: 'PO-2025-003', vendorId: vendors[0].id, status: 'draft', items: JSON.stringify([{ productId: products[4].id, name: products[4].name, quantity: 150, unitPrice: 5, total: 750 }]), subtotal: 750, tax: 61.88, total: 811.88, orderDate: new Date(now), expectedDate: null, notes: 'Coffee mugs for new office', organizationId: orgId },
  })
  await db.purchaseOrderItem.create({
    data: { purchaseOrderId: po3.id, productId: products[4].id, quantity: 150, unitPrice: 5, total: 750 },
  })

  // ============================================
  // 10. ITAssets + AssetIssuances
  // ============================================
  const itAssets = await Promise.all([
    db.iTAsset.create({
      data: { assetTag: 'IT-LAP-001', name: 'MacBook Pro 14" M3', category: 'laptop', brand: 'Apple', model: 'MacBook Pro 14 M3', serialNumber: 'APL-MBP14-00123', specifications: JSON.stringify({ ram: '18GB', storage: '512GB SSD', cpu: 'Apple M3', screen: '14 inch Liquid Retina XDR', color: 'Space Black' }), purchaseDate: new Date('2024-06-15'), purchaseCost: 1999, warrantyExpiry: new Date('2027-06-15'), vendor: 'Apple Store', invoiceNumber: 'INV-APL-2024-001', condition: 'good', status: 'issued', assignedToId: adminUser.id, location: 'Office A', notes: 'Primary work laptop for CEO', organizationId: orgId },
    }),
    db.iTAsset.create({
      data: { assetTag: 'IT-LAP-002', name: 'MacBook Pro 16" M3 Pro', category: 'laptop', brand: 'Apple', model: 'MacBook Pro 16 M3 Pro', serialNumber: 'APL-MBP16-00456', specifications: JSON.stringify({ ram: '36GB', storage: '1TB SSD', cpu: 'Apple M3 Pro', screen: '16 inch Liquid Retina XDR', color: 'Space Black' }), purchaseDate: new Date('2024-08-01'), purchaseCost: 2799, warrantyExpiry: new Date('2027-08-01'), vendor: 'Apple Store', invoiceNumber: 'INV-APL-2024-002', condition: 'good', status: 'issued', assignedToId: member1.id, location: 'Office A', notes: 'Design team lead laptop', organizationId: orgId },
    }),
    db.iTAsset.create({
      data: { assetTag: 'IT-MON-001', name: 'Dell UltraSharp 27" 4K Monitor', category: 'monitor', brand: 'Dell', model: 'U2723QE', serialNumber: 'DLL-U27-00789', specifications: JSON.stringify({ resolution: '3840x2160', panel: 'IPS Black', ports: 'USB-C, HDMI, DP', size: '27 inch' }), purchaseDate: new Date('2024-07-10'), purchaseCost: 619, warrantyExpiry: new Date('2027-07-10'), vendor: 'Dell Direct', invoiceNumber: 'INV-DLL-2024-003', condition: 'good', status: 'issued', assignedToId: member1.id, location: 'Office A', notes: 'External monitor for design work', organizationId: orgId },
    }),
    db.iTAsset.create({
      data: { assetTag: 'IT-KEY-001', name: 'Logitech MX Keys S', category: 'keyboard', brand: 'Logitech', model: 'MX Keys S', serialNumber: 'LOG-MXK-01012', specifications: JSON.stringify({ layout: 'US QWERTY', connection: 'Bluetooth + USB', backlight: 'Smart illumination' }), purchaseDate: new Date('2024-09-01'), purchaseCost: 109, warrantyExpiry: new Date('2026-09-01'), vendor: 'Amazon', invoiceNumber: 'INV-AMZ-2024-010', condition: 'new', status: 'available', location: 'Store Room', notes: 'Spare keyboard in storage', organizationId: orgId },
    }),
    db.iTAsset.create({
      data: { assetTag: 'IT-MSE-001', name: 'Logitech MX Master 3S', category: 'mouse', brand: 'Logitech', model: 'MX Master 3S', serialNumber: 'LOG-MXM-01345', specifications: JSON.stringify({ dpi: 8000, connection: 'Bluetooth + USB', features: 'MagSpeed scroll, USB-C charging' }), purchaseDate: new Date('2024-09-01'), purchaseCost: 99, warrantyExpiry: new Date('2026-09-01'), vendor: 'Amazon', invoiceNumber: 'INV-AMZ-2024-011', condition: 'good', status: 'issued', assignedToId: member2.id, location: 'Remote', notes: 'Wireless mouse for content lead', organizationId: orgId },
    }),
    db.iTAsset.create({
      data: { assetTag: 'IT-HDP-001', name: 'Sony WH-1000XM5', category: 'headphone', brand: 'Sony', model: 'WH-1000XM5', serialNumber: 'SNY-WH5-01567', specifications: JSON.stringify({ type: 'Over-ear', features: 'ANC, 30hr battery, multipoint', color: 'Black' }), purchaseDate: new Date('2024-10-15'), purchaseCost: 349, warrantyExpiry: new Date('2026-10-15'), vendor: 'Best Buy', invoiceNumber: 'INV-BBY-2024-005', condition: 'good', status: 'available', location: 'Store Room', notes: 'Available for checkout - noise cancelling headphones', organizationId: orgId },
    }),
  ])

  // Asset Issuances (3)
  await Promise.all([
    db.assetIssuance.create({
      data: { assetId: itAssets[0].id, issuedToId: adminUser.id, issuedById: adminUser.id, issueDate: new Date('2024-06-16'), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'Daily work - primary laptop', notes: 'Issued on hire date', status: 'issued', organizationId: orgId },
    }),
    db.assetIssuance.create({
      data: { assetId: itAssets[1].id, issuedToId: member1.id, issuedById: adminUser.id, issueDate: new Date('2024-08-02'), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'Design team lead - high performance laptop', notes: 'Upgraded from previous model', status: 'issued', organizationId: orgId },
    }),
    db.assetIssuance.create({
      data: { assetId: itAssets[2].id, issuedToId: member1.id, issuedById: adminUser.id, issueDate: new Date('2024-07-11'), expectedReturnDate: null, actualReturnDate: null, returnCondition: null, issueCondition: 'new', purpose: 'External monitor for design work', notes: 'Paired with IT-LAP-002', status: 'issued', organizationId: orgId },
    }),
  ])

  // ============================================
  // 11. Notifications (5)
  // ============================================
  await Promise.all([
    db.notification.create({
      data: { title: 'New Approval Request', message: 'Marcus Williams requested approval for "TechCorp CEO Spotlight Interview"', type: 'approval', category: 'approval', isRead: false, actionUrl: '/approvals', userId: adminUser.id, organizationId: orgId },
    }),
    db.notification.create({
      data: { title: 'Invoice Overdue', message: 'Invoice INV-2025-004 for AutoDrive is overdue by 10 days', type: 'warning', category: 'invoice', isRead: false, actionUrl: '/invoices', userId: adminUser.id, organizationId: orgId },
    }),
    db.notification.create({
      data: { title: 'Content Published', message: 'Your post "TechCorp Feature Launch Thread" was published on Twitter', type: 'success', category: 'post', isRead: true, actionUrl: '/content', userId: member2.id, organizationId: orgId },
    }),
    db.notification.create({
      data: { title: 'New Comment on Content', message: 'Sarah Chen commented on "FashionHub Summer Sale Announcement"', type: 'mention', category: 'content', isRead: false, actionUrl: '/content', userId: member3.id, organizationId: orgId },
    }),
    db.notification.create({
      data: { title: 'System Update', message: 'VortexERP v2.5 has been deployed with new features. Check the changelog for details.', type: 'info', category: 'system', isRead: true, actionUrl: null, userId: adminUser.id, organizationId: orgId },
    }),
  ])

  console.log('Seed missing modules completed successfully')
}
