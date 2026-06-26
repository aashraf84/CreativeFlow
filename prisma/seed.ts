import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.brandKit.deleteMany()
  await prisma.influencer.deleteMany()
  await prisma.inboxMessage.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.timeEntry.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.automationRule.deleteMany()
  await prisma.socialAccount.deleteMany()
  await prisma.content.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.client.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  console.log('✅ Cleared existing data')

  // ============================================
  // 1. Organization
  // ============================================
  const org = await prisma.organization.create({
    data: {
      name: 'Vortex Digital',
      slug: 'vortex-digital',
      logo: '/logo.svg',
      plan: 'professional',
      maxUsers: 25,
      maxAccounts: 50,
    },
  })
  console.log('✅ Created organization: Vortex Digital')

  // ============================================
  // 2. Users (8 total: 1 admin, 3 team leads, 4 members)
  // ============================================
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah.chen@vortexdigital.com',
        name: 'Sarah Chen',
        role: 'admin',
        organizationId: org.id,
        avatar: null,
      },
    }),
    prisma.user.create({
      data: {
        email: 'marcus.williams@vortexdigital.com',
        name: 'Marcus Williams',
        role: 'lead',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya.sharma@vortexdigital.com',
        name: 'Priya Sharma',
        role: 'lead',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jake.morrison@vortexdigital.com',
        name: 'Jake Morrison',
        role: 'lead',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'luna.rodriguez@vortexdigital.com',
        name: 'Luna Rodriguez',
        role: 'member',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.kim@vortexdigital.com',
        name: 'David Kim',
        role: 'member',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.thompson@vortexdigital.com',
        name: 'Emma Thompson',
        role: 'member',
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex.nakamura@vortexdigital.com',
        name: 'Alex Nakamura',
        role: 'member',
        organizationId: org.id,
      },
    }),
  ])

  const [sarah, marcus, priya, jake, luna, david, emma, alex] = users
  console.log('✅ Created 8 users')

  // ============================================
  // 3. Teams (6 teams)
  // ============================================
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Creatives',
        type: 'creatives',
        color: '#f59e0b',
        icon: 'lightbulb',
        description: 'Ideation and creative direction for all campaigns',
        organizationId: org.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Content',
        type: 'content',
        color: '#10b981',
        icon: 'pen-tool',
        description: 'Copywriting and content creation across all platforms',
        organizationId: org.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Design',
        type: 'design',
        color: '#8b5cf6',
        icon: 'palette',
        description: 'Visual design, graphics, and brand assets',
        organizationId: org.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Edit',
        type: 'edit',
        color: '#ef4444',
        icon: 'film',
        description: 'Video editing, post-production, and quality review',
        organizationId: org.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Archive',
        type: 'archive',
        color: '#6b7280',
        icon: 'archive',
        description: 'Content archiving and asset management',
        organizationId: org.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Dissemination',
        type: 'dissemination',
        color: '#3b82f6',
        icon: 'share-2',
        description: 'Scheduling, publishing, and distribution across platforms',
        organizationId: org.id,
      },
    }),
  ])

  const [creativesTeam, contentTeam, designTeam, editTeam, archiveTeam, disseminationTeam] = teams
  console.log('✅ Created 6 teams')

  // ============================================
  // Team Members
  // ============================================
  await Promise.all([
    // Creatives: Marcus (lead), Luna
    prisma.teamMember.create({ data: { userId: marcus.id, teamId: creativesTeam.id, role: 'lead' } }),
    prisma.teamMember.create({ data: { userId: luna.id, teamId: creativesTeam.id, role: 'member' } }),
    // Content: Priya (lead), David, Emma
    prisma.teamMember.create({ data: { userId: priya.id, teamId: contentTeam.id, role: 'lead' } }),
    prisma.teamMember.create({ data: { userId: david.id, teamId: contentTeam.id, role: 'member' } }),
    prisma.teamMember.create({ data: { userId: emma.id, teamId: contentTeam.id, role: 'member' } }),
    // Design: Jake (lead), Luna, Alex
    prisma.teamMember.create({ data: { userId: jake.id, teamId: designTeam.id, role: 'lead' } }),
    prisma.teamMember.create({ data: { userId: luna.id, teamId: designTeam.id, role: 'member' } }),
    prisma.teamMember.create({ data: { userId: alex.id, teamId: designTeam.id, role: 'member' } }),
    // Edit: Marcus (lead), David
    prisma.teamMember.create({ data: { userId: marcus.id, teamId: editTeam.id, role: 'lead' } }),
    prisma.teamMember.create({ data: { userId: david.id, teamId: editTeam.id, role: 'member' } }),
    // Archive: Emma
    prisma.teamMember.create({ data: { userId: emma.id, teamId: archiveTeam.id, role: 'lead' } }),
    // Dissemination: Alex (lead), Luna
    prisma.teamMember.create({ data: { userId: alex.id, teamId: disseminationTeam.id, role: 'lead' } }),
    prisma.teamMember.create({ data: { userId: luna.id, teamId: disseminationTeam.id, role: 'member' } }),
  ])
  console.log('✅ Created team memberships')

  // ============================================
  // 4. Clients (5)
  // ============================================
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'TechCorp',
        industry: 'Technology',
        website: 'https://techcorp.io',
        email: 'marketing@techcorp.io',
        phone: '+1-555-0101',
        status: 'active',
        organizationId: org.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'FashionHub',
        industry: 'Fashion & Retail',
        website: 'https://fashionhub.com',
        email: 'pr@fashionhub.com',
        phone: '+1-555-0202',
        status: 'active',
        organizationId: org.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'FoodVibe',
        industry: 'Food & Beverage',
        website: 'https://foodvibe.co',
        email: 'hello@foodvibe.co',
        phone: '+1-555-0303',
        status: 'active',
        organizationId: org.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'AutoDrive',
        industry: 'Automotive',
        website: 'https://autodrive.com',
        email: 'media@autodrive.com',
        phone: '+1-555-0404',
        status: 'active',
        organizationId: org.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'WellnessCo',
        industry: 'Health & Wellness',
        website: 'https://wellnessco.com',
        email: 'info@wellnessco.com',
        phone: '+1-555-0505',
        status: 'prospect',
        organizationId: org.id,
      },
    }),
  ])

  const [techcorp, fashionhub, foodvibe, autodrive, wellnessco] = clients
  console.log('✅ Created 5 clients')

  // ============================================
  // 5. Campaigns (4)
  // ============================================
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        name: 'TechCorp Spring Launch 2025',
        description: 'Full social media campaign for TechCorp\'s new SaaS product launch targeting enterprise clients',
        status: 'active',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-30'),
        budget: 45000,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.campaign.create({
      data: {
        name: 'FashionHub Summer Collection',
        description: 'Visual-first campaign for FashionHub\'s summer line across Instagram and TikTok',
        status: 'active',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-06-30'),
        budget: 32000,
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
    prisma.campaign.create({
      data: {
        name: 'FoodVibe Taste Stories',
        description: 'User-generated content campaign encouraging food lovers to share their taste stories',
        status: 'draft',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-07-31'),
        budget: 18000,
        clientId: foodvibe.id,
        organizationId: org.id,
      },
    }),
    prisma.campaign.create({
      data: {
        name: 'AutoDrive EV Revolution',
        description: 'Multi-platform campaign for AutoDrive\'s electric vehicle lineup launch',
        status: 'completed',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-01-31'),
        budget: 68000,
        clientId: autodrive.id,
        organizationId: org.id,
      },
    }),
  ])

  const [techcorpCampaign, fashionCampaign, foodvibeCampaign, autodriveCampaign] = campaigns
  console.log('✅ Created 4 campaigns')

  // ============================================
  // 6. Content Items (20+ across all pipeline stages)
  // ============================================
  const now = new Date()
  const dayMs = 86400000

  const contentItems = await Promise.all([
    // IDEA stage (4 items)
    prisma.content.create({
      data: {
        title: 'TechCorp CEO Spotlight Interview',
        description: 'Behind-the-scenes interview series with TechCorp leadership about the future of enterprise AI',
        type: 'video',
        stage: 'idea',
        priority: 'high',
        format: 'landscape',
        tags: 'interview,leadership,behind-the-scenes',
        dueDate: new Date(now.getTime() + 14 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: marcus.id,
        assigneeId: marcus.id,
        teamId: creativesTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub Summer Lookbook Reel',
        description: 'Fast-paced reel showcasing the top 10 summer looks from the new collection',
        type: 'reel',
        stage: 'idea',
        priority: 'medium',
        format: 'vertical',
        tags: 'lookbook,summer,fashion-reel',
        dueDate: new Date(now.getTime() + 10 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: luna.id,
        assigneeId: luna.id,
        teamId: creativesTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FoodVibe Recipe Card Series',
        description: 'Weekly recipe cards featuring seasonal ingredients for Instagram carousel posts',
        type: 'carousel',
        stage: 'idea',
        priority: 'medium',
        format: 'square',
        tags: 'recipe,seasonal,carousel',
        dueDate: new Date(now.getTime() + 7 * dayMs),
        organizationId: org.id,
        campaignId: foodvibeCampaign.id,
        creatorId: priya.id,
        assigneeId: priya.id,
        teamId: contentTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'AutoDrive Community Poll Series',
        description: 'Interactive LinkedIn polls about EV preferences and sustainability',
        type: 'post',
        stage: 'idea',
        priority: 'low',
        format: 'square',
        tags: 'poll,community,engagement',
        dueDate: new Date(now.getTime() + 21 * dayMs),
        organizationId: org.id,
        campaignId: autodriveCampaign.id,
        creatorId: emma.id,
        assigneeId: emma.id,
        teamId: contentTeam.id,
      },
    }),

    // DESIGN stage (4 items)
    prisma.content.create({
      data: {
        title: 'TechCorp Product Feature Infographic',
        description: 'Infographic breaking down the 5 key features of the new SaaS platform',
        type: 'graphic',
        stage: 'design',
        priority: 'high',
        format: 'landscape',
        tags: 'infographic,product-features,saas',
        dueDate: new Date(now.getTime() + 5 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: marcus.id,
        assigneeId: jake.id,
        teamId: designTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub Brand Story Carousel',
        description: '7-slide carousel telling the FashionHub sustainability story',
        type: 'carousel',
        stage: 'design',
        priority: 'high',
        format: 'square',
        tags: 'brand-story,sustainability,carousel',
        dueDate: new Date(now.getTime() + 3 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: priya.id,
        assigneeId: alex.id,
        teamId: designTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'WellnessCo Mindfulness Tips Graphic Set',
        description: 'Set of 5 daily mindfulness tip graphics for Instagram feed',
        type: 'graphic',
        stage: 'design',
        priority: 'medium',
        format: 'square',
        tags: 'mindfulness,wellness,daily-tips',
        dueDate: new Date(now.getTime() + 8 * dayMs),
        organizationId: org.id,
        creatorId: luna.id,
        assigneeId: jake.id,
        teamId: designTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'AutoDrive EV Comparison Chart',
        description: 'Visual comparison chart of AutoDrive EV models vs competitors',
        type: 'graphic',
        stage: 'design',
        priority: 'urgent',
        format: 'landscape',
        tags: 'comparison,ev,competitive',
        dueDate: new Date(now.getTime() + 2 * dayMs),
        organizationId: org.id,
        campaignId: autodriveCampaign.id,
        creatorId: marcus.id,
        assigneeId: luna.id,
        teamId: designTeam.id,
      },
    }),

    // EDIT stage (3 items)
    prisma.content.create({
      data: {
        title: 'TechCorp Platform Demo Video',
        description: '3-minute product demo video for LinkedIn and YouTube',
        type: 'video',
        stage: 'edit',
        priority: 'urgent',
        format: 'landscape',
        tags: 'demo,product,video',
        dueDate: new Date(now.getTime() + 1 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: marcus.id,
        assigneeId: david.id,
        teamId: editTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub BTS Fashion Show Reel',
        description: 'Behind-the-scenes reel from the summer fashion show photoshoot',
        type: 'reel',
        stage: 'edit',
        priority: 'high',
        format: 'vertical',
        tags: 'behind-the-scenes,fashion-show,reel',
        dueDate: new Date(now.getTime() + 4 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: luna.id,
        assigneeId: marcus.id,
        teamId: editTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FoodVibe Kitchen Stories Episode 3',
        description: 'Third episode of the Kitchen Stories video series featuring a local chef',
        type: 'video',
        stage: 'edit',
        priority: 'medium',
        format: 'landscape',
        tags: 'kitchen-stories,video-series,chef',
        dueDate: new Date(now.getTime() + 6 * dayMs),
        organizationId: org.id,
        campaignId: foodvibeCampaign.id,
        creatorId: priya.id,
        assigneeId: david.id,
        teamId: editTeam.id,
      },
    }),

    // REVIEW stage (3 items)
    prisma.content.create({
      data: {
        title: 'TechCorp Case Study Carousel',
        description: 'Client success story carousel for TechCorp enterprise solution',
        type: 'carousel',
        stage: 'review',
        priority: 'high',
        format: 'square',
        tags: 'case-study,success-story,enterprise',
        dueDate: new Date(now.getTime() - 1 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: priya.id,
        assigneeId: sarah.id,
        teamId: contentTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub Influencer Collaboration Post',
        description: 'Sponsored post with @StyleMaven featuring FashionHub summer accessories',
        type: 'post',
        stage: 'review',
        priority: 'high',
        format: 'square',
        tags: 'influencer,sponsored,accessories',
        dueDate: new Date(now.getTime() - 1 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: emma.id,
        assigneeId: priya.id,
        teamId: contentTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'AutoDrive Test Drive Story Series',
        description: '5-part Instagram story series of real customer test drive experiences',
        type: 'story',
        stage: 'review',
        priority: 'medium',
        format: 'vertical',
        tags: 'test-drive,stories,customer-experience',
        dueDate: new Date(now.getTime() - 2 * dayMs),
        organizationId: org.id,
        campaignId: autodriveCampaign.id,
        creatorId: david.id,
        assigneeId: jake.id,
        teamId: contentTeam.id,
      },
    }),

    // APPROVE stage (3 items)
    prisma.content.create({
      data: {
        title: 'TechCorp LinkedIn Thought Leadership Article',
        description: 'Long-form article on the future of cloud infrastructure for LinkedIn publishing',
        type: 'article',
        stage: 'approve',
        priority: 'medium',
        format: 'landscape',
        tags: 'thought-leadership,linkedin,cloud',
        dueDate: new Date(now.getTime() - 3 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: priya.id,
        assigneeId: sarah.id,
        teamId: contentTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub Summer Sale Announcement',
        description: 'Promotional graphics and copy for the 4th of July summer sale event',
        type: 'post',
        stage: 'approve',
        priority: 'urgent',
        format: 'square',
        tags: 'sale,promotion,summer',
        dueDate: new Date(now.getTime() - 1 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: emma.id,
        assigneeId: sarah.id,
        teamId: contentTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'WellnessCo 30-Day Challenge Graphic',
        description: 'Launch graphic for the 30-day wellness challenge community event',
        type: 'graphic',
        stage: 'approve',
        priority: 'medium',
        format: 'square',
        tags: 'challenge,community,wellness',
        dueDate: new Date(now.getTime() - 2 * dayMs),
        organizationId: org.id,
        creatorId: luna.id,
        assigneeId: sarah.id,
        teamId: designTeam.id,
      },
    }),

    // DISSEMINATE stage (3 items)
    prisma.content.create({
      data: {
        title: 'TechCorp Feature Launch Thread',
        description: 'Twitter/X thread announcing the top 5 new features of the platform',
        type: 'post',
        stage: 'disseminate',
        priority: 'high',
        format: 'landscape',
        tags: 'launch,thread,features',
        dueDate: new Date(now.getTime() - 5 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: david.id,
        assigneeId: alex.id,
        teamId: disseminationTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'FashionHub Style Guide TikTok',
        description: 'TikTok video showing 3 ways to style a summer outfit',
        type: 'video',
        stage: 'disseminate',
        priority: 'high',
        format: 'vertical',
        tags: 'style-guide,tiktok,outfit',
        dueDate: new Date(now.getTime() - 4 * dayMs),
        organizationId: org.id,
        campaignId: fashionCampaign.id,
        creatorId: luna.id,
        assigneeId: alex.id,
        teamId: disseminationTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'AutoDrive EV Range Explainer Video',
        description: 'Short-form explainer video about EV range and charging for YouTube Shorts',
        type: 'video',
        stage: 'disseminate',
        priority: 'medium',
        format: 'vertical',
        tags: 'ev-range,explainer,youtube-shorts',
        dueDate: new Date(now.getTime() - 6 * dayMs),
        organizationId: org.id,
        campaignId: autodriveCampaign.id,
        creatorId: david.id,
        assigneeId: luna.id,
        teamId: disseminationTeam.id,
      },
    }),

    // ARCHIVED stage (2 items - completed content)
    prisma.content.create({
      data: {
        title: 'AutoDrive Holiday Campaign Banner',
        description: 'Holiday season promotional banners across all platforms',
        type: 'graphic',
        stage: 'archived',
        priority: 'low',
        format: 'landscape',
        tags: 'holiday,promotional,banner',
        dueDate: new Date(now.getTime() - 30 * dayMs),
        publishedAt: new Date(now.getTime() - 35 * dayMs),
        organizationId: org.id,
        campaignId: autodriveCampaign.id,
        creatorId: jake.id,
        assigneeId: emma.id,
        teamId: archiveTeam.id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'TechCorp Year-in-Review Video',
        description: 'Annual recap video highlighting TechCorp milestones and achievements',
        type: 'video',
        stage: 'archived',
        priority: 'low',
        format: 'landscape',
        tags: 'year-in-review,recap,milestones',
        dueDate: new Date(now.getTime() - 60 * dayMs),
        publishedAt: new Date(now.getTime() - 55 * dayMs),
        organizationId: org.id,
        campaignId: techcorpCampaign.id,
        creatorId: marcus.id,
        assigneeId: emma.id,
        teamId: archiveTeam.id,
      },
    }),
  ])

  console.log(`✅ Created ${contentItems.length} content items`)

  // ============================================
  // 7. Social Accounts (12 across platforms)
  // ============================================
  const socialAccounts = await Promise.all([
    prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        accountId: 'ig_techcorp_official',
        username: '@techcorp',
        displayName: 'TechCorp Official',
        followers: 245000,
        isVerified: true,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        accountId: 'ig_fashionhub',
        username: '@fashionhub',
        displayName: 'FashionHub',
        followers: 890000,
        isVerified: true,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'facebook',
        accountId: 'fb_techcorp',
        username: 'TechCorp',
        displayName: 'TechCorp Inc.',
        followers: 180000,
        isVerified: true,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'facebook',
        accountId: 'fb_foodvibe',
        username: 'FoodVibe',
        displayName: 'FoodVibe',
        followers: 320000,
        isVerified: false,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'twitter',
        accountId: 'tw_techcorp',
        username: '@techcorp_io',
        displayName: 'TechCorp',
        followers: 95000,
        isVerified: true,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'twitter',
        accountId: 'tw_autodrive',
        username: '@autodrive_ev',
        displayName: 'AutoDrive',
        followers: 67000,
        isVerified: false,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'linkedin',
        accountId: 'li_techcorp',
        username: 'techcorp',
        displayName: 'TechCorp',
        followers: 420000,
        isVerified: true,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'linkedin',
        accountId: 'li_wellnessco',
        username: 'wellnessco',
        displayName: 'WellnessCo',
        followers: 28000,
        isVerified: false,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'tiktok',
        accountId: 'tt_fashionhub',
        username: '@fashionhub',
        displayName: 'FashionHub',
        followers: 1250000,
        isVerified: true,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'tiktok',
        accountId: 'tt_foodvibe',
        username: '@foodvibe',
        displayName: 'FoodVibe',
        followers: 560000,
        isVerified: false,
        isActive: true,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'youtube',
        accountId: 'yt_techcorp',
        username: 'TechCorp',
        displayName: 'TechCorp',
        followers: 78000,
        isVerified: true,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'youtube',
        accountId: 'yt_autodrive',
        username: 'AutoDrive',
        displayName: 'AutoDrive Official',
        followers: 145000,
        isVerified: false,
        isActive: true,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
  ])

  console.log(`✅ Created ${socialAccounts.length} social accounts`)

  // ============================================
  // 8. Posts (15+ across statuses)
  // ============================================
  const [
    igTechcorp, igFashionhub, fbTechcorp, fbFoodvibe,
    twTechcorp, twAutodrive, liTechcorp, liWellnessco,
    ttFashionhub, ttFoodvibe, ytTechcorp, ytAutodrive
  ] = socialAccounts

  const posts = await Promise.all([
    // Published posts (6)
    prisma.post.create({
      data: {
        content: '🚀 Exciting news! Our new enterprise platform just got 5 game-changing features. See what\'s new →',
        platform: 'instagram',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 7 * dayMs),
        publishedAt: new Date(now.getTime() - 7 * dayMs),
        engagement: JSON.stringify({ likes: 1240, comments: 89, shares: 234, saves: 156, impressions: 45000 }),
        socialAccountId: igTechcorp.id,
        contentId: contentItems[16].id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Summer vibes are here! ☀️ Swipe to see our top 10 looks from the new collection → #FashionHubSummer',
        platform: 'instagram',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 5 * dayMs),
        publishedAt: new Date(now.getTime() - 5 * dayMs),
        engagement: JSON.stringify({ likes: 8900, comments: 432, shares: 1200, saves: 2300, impressions: 350000 }),
        socialAccountId: igFashionhub.id,
        contentId: contentItems[17].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'The future of cloud computing is here. Our CEO shares insights on what enterprise AI means for your business. Read the full article on our blog.',
        platform: 'linkedin',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 3 * dayMs),
        publishedAt: new Date(now.getTime() - 3 * dayMs),
        engagement: JSON.stringify({ likes: 340, comments: 56, shares: 89, impressions: 28000 }),
        socialAccountId: liTechcorp.id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: '3 ways to style your summer outfit 🌴 Which one is your fave? #FashionHub #SummerStyle #OOTD',
        platform: 'tiktok',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 4 * dayMs),
        publishedAt: new Date(now.getTime() - 4 * dayMs),
        engagement: JSON.stringify({ likes: 45000, comments: 2100, shares: 8900, views: 890000 }),
        socialAccountId: ttFashionhub.id,
        contentId: contentItems[17].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: '🎄 Holiday season is here! Save big on AutoDrive this season. Visit autodrive.com for exclusive deals.',
        platform: 'facebook',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 35 * dayMs),
        publishedAt: new Date(now.getTime() - 35 * dayMs),
        engagement: JSON.stringify({ likes: 890, comments: 45, shares: 120, impressions: 65000 }),
        socialAccountId: fbTechcorp.id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'How far can an EV really go? We put our models to the test. Watch the full video on YouTube →',
        platform: 'twitter',
        status: 'published',
        scheduledAt: new Date(now.getTime() - 6 * dayMs),
        publishedAt: new Date(now.getTime() - 6 * dayMs),
        engagement: JSON.stringify({ likes: 234, comments: 18, retweets: 67, impressions: 45000 }),
        socialAccountId: twAutodrive.id,
        contentId: contentItems[18].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),

    // Scheduled posts (5)
    prisma.post.create({
      data: {
        content: '📣 New feature alert! Our platform now supports real-time collaboration. See it in action →',
        platform: 'twitter',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 1 * dayMs),
        socialAccountId: twTechcorp.id,
        contentId: contentItems[16].id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Summer Sale starts NOW! 🎉 Up to 50% off select items. Shop the collection → #FashionHubSale',
        platform: 'instagram',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 2 * dayMs),
        socialAccountId: igFashionhub.id,
        contentId: contentItems[15].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Wondering about EV range? Our latest explainer breaks down everything you need to know about going electric.',
        platform: 'youtube',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 3 * dayMs),
        socialAccountId: ytAutodrive.id,
        contentId: contentItems[18].id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Monday motivation! Start your week with these 3 simple mindfulness techniques 🧘‍♀️ #WellnessCo',
        platform: 'linkedin',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 4 * dayMs),
        socialAccountId: liWellnessco.id,
        contentId: contentItems[14].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Fresh recipes coming your way! 🍳 This week\'s seasonal special: Lemon Herb Grilled Salmon',
        platform: 'facebook',
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() + 5 * dayMs),
        socialAccountId: fbFoodvibe.id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),

    // Draft posts (4)
    prisma.post.create({
      data: {
        content: 'Behind the scenes of our product photoshoot 📸 Stay tuned for the full reveal!',
        platform: 'instagram',
        status: 'draft',
        socialAccountId: igFashionhub.id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Introducing Kitchen Stories: a new video series featuring local chefs and their signature dishes.',
        platform: 'tiktok',
        status: 'draft',
        socialAccountId: ttFoodvibe.id,
        contentId: contentItems[8].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Our 30-day wellness challenge starts soon! Are you ready? Sign up at wellnessco.com/challenge',
        platform: 'instagram',
        status: 'draft',
        socialAccountId: igFashionhub.id,
        contentId: contentItems[14].id,
        userId: luna.id,
        organizationId: org.id,
      },
    }),
    prisma.post.create({
      data: {
        content: 'Customer spotlight: How TechCorp helped Acme Inc reduce their infrastructure costs by 40%',
        platform: 'linkedin',
        status: 'draft',
        socialAccountId: liTechcorp.id,
        contentId: contentItems[10].id,
        userId: alex.id,
        organizationId: org.id,
      },
    }),
  ])

  console.log(`✅ Created ${posts.length} posts`)

  // ============================================
  // 9. Automation Rules (5)
  // ============================================
  const automations = await Promise.all([
    prisma.automationRule.create({
      data: {
        name: 'Auto-assign to Design Team',
        description: 'When content moves to design stage, automatically assign to the Design team lead',
        trigger: 'stage_change',
        conditions: JSON.stringify({ fromStage: 'idea', toStage: 'design' }),
        actions: JSON.stringify({ assignToTeam: 'design', notifyTeamLead: true }),
        isActive: true,
        organizationId: org.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: 'Content Review Reminder',
        description: 'Send a reminder when content has been in review stage for more than 48 hours',
        trigger: 'scheduled_time',
        conditions: JSON.stringify({ stage: 'review', hoursInStage: 48 }),
        actions: JSON.stringify({ sendReminder: true, escalateTo: 'admin' }),
        isActive: true,
        organizationId: org.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: 'Auto-archive Completed Campaigns',
        description: 'Move all content to archive when a campaign status changes to completed',
        trigger: 'stage_change',
        conditions: JSON.stringify({ campaignStatus: 'completed' }),
        actions: JSON.stringify({ moveContentToArchive: true }),
        isActive: true,
        organizationId: org.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: 'High Engagement Alert',
        description: 'Notify the team when a published post gets more than 1000 likes in the first hour',
        trigger: 'engagement_threshold',
        conditions: JSON.stringify({ metric: 'likes', threshold: 1000, timeWindow: '1h' }),
        actions: JSON.stringify({ notifyTeam: true, boostPost: true }),
        isActive: true,
        organizationId: org.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: 'New Content Welcome Message',
        description: 'Send a welcome message to the content creator when new content is created',
        trigger: 'content_created',
        conditions: JSON.stringify({ contentType: ['post', 'video', 'graphic'] }),
        actions: JSON.stringify({ sendMessage: true, assignDefaultTeam: true }),
        isActive: false,
        organizationId: org.id,
      },
    }),
  ])

  console.log(`✅ Created ${automations.length} automation rules`)

  // ============================================
  // 10. Comments on content items
  // ============================================
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        text: 'Great concept! Let\'s make sure we highlight the AI-powered features prominently.',
        contentId: contentItems[0].id,
        userId: sarah.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'I agree. Should we also include a demo snippet in the intro?',
        contentId: contentItems[0].id,
        userId: marcus.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'The color palette needs to match TechCorp\'s brand guidelines. Please use the updated brand kit.',
        contentId: contentItems[4].id,
        userId: sarah.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Updated the colors. Can you review the new version?',
        contentId: contentItems[4].id,
        userId: jake.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'This is urgent - the client wants it by Friday. Can we prioritize?',
        contentId: contentItems[7].id,
        userId: marcus.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Already on it. I\'ll have the first draft by tomorrow morning.',
        contentId: contentItems[7].id,
        userId: luna.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'The video needs better transitions between sections. Also, the audio levels are inconsistent.',
        contentId: contentItems[8].id,
        userId: marcus.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Good catch! I\'ll fix the transitions and normalize the audio.',
        contentId: contentItems[8].id,
        userId: david.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Client approved the draft copy. Ready for final review.',
        contentId: contentItems[10].id,
        userId: priya.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Looks great! Minor edits on slide 3 - the font size is too small.',
        contentId: contentItems[10].id,
        userId: sarah.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Need to get influencer approval before we publish this.',
        contentId: contentItems[11].id,
        userId: priya.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Influencer approved! We\'re good to go.',
        contentId: contentItems[11].id,
        userId: emma.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'The sale copy needs more urgency. Add countdown language.',
        contentId: contentItems[15].id,
        userId: sarah.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Updated with "Limited time only" and "Ends Sunday" messaging.',
        contentId: contentItems[15].id,
        userId: emma.id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Please schedule this for Monday 9AM EST.',
        contentId: contentItems[16].id,
        userId: alex.id,
      },
    }),
  ])

  console.log(`✅ Created ${comments.length} comments`)

  // ============================================
  // 11. Activity Log (30+ entries)
  // ============================================
  const activities = await Promise.all([
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'content',
        entityId: contentItems[0].id,
        details: JSON.stringify({ title: 'TechCorp CEO Spotlight Interview', stage: 'idea' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'content',
        entityId: contentItems[1].id,
        details: JSON.stringify({ title: 'FashionHub Summer Lookbook Reel', stage: 'idea' }),
        organizationId: org.id,
        actorId: luna.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[4].id,
        details: JSON.stringify({ title: 'TechCorp Product Feature Infographic', fromStage: 'idea', toStage: 'design' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.9 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'assigned',
        entity: 'content',
        entityId: contentItems[4].id,
        details: JSON.stringify({ title: 'TechCorp Product Feature Infographic', assignee: 'Jake Morrison' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.9 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[7].id,
        details: JSON.stringify({ title: 'AutoDrive EV Comparison Chart', fromStage: 'idea', toStage: 'design' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.8 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'content',
        entityId: contentItems[8].id,
        details: JSON.stringify({ title: 'TechCorp Platform Demo Video', stage: 'edit' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.7 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'commented',
        entity: 'content',
        entityId: contentItems[0].id,
        details: JSON.stringify({ title: 'TechCorp CEO Spotlight Interview', comment: 'Great concept!' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 1.5 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[10].id,
        details: JSON.stringify({ title: 'TechCorp Case Study Carousel', fromStage: 'edit', toStage: 'review' }),
        organizationId: org.id,
        actorId: priya.id,
        createdAt: new Date(now.getTime() - 1.4 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[11].id,
        details: JSON.stringify({ title: 'FashionHub Influencer Collaboration Post', fromStage: 'edit', toStage: 'review' }),
        organizationId: org.id,
        actorId: emma.id,
        createdAt: new Date(now.getTime() - 1.3 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[0].id,
        details: JSON.stringify({ platform: 'instagram', account: '@techcorp' }),
        organizationId: org.id,
        actorId: alex.id,
        createdAt: new Date(now.getTime() - 7 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[1].id,
        details: JSON.stringify({ platform: 'instagram', account: '@fashionhub' }),
        organizationId: org.id,
        actorId: luna.id,
        createdAt: new Date(now.getTime() - 5 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[2].id,
        details: JSON.stringify({ platform: 'linkedin', account: 'TechCorp' }),
        organizationId: org.id,
        actorId: alex.id,
        createdAt: new Date(now.getTime() - 3 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[3].id,
        details: JSON.stringify({ platform: 'tiktok', account: '@fashionhub' }),
        organizationId: org.id,
        actorId: luna.id,
        createdAt: new Date(now.getTime() - 4 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[13].id,
        details: JSON.stringify({ title: 'TechCorp LinkedIn Thought Leadership Article', fromStage: 'review', toStage: 'approve' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 1.2 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[14].id,
        details: JSON.stringify({ title: 'FashionHub Summer Sale Announcement', fromStage: 'review', toStage: 'approve' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 1.1 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[16].id,
        details: JSON.stringify({ title: 'TechCorp Feature Launch Thread', fromStage: 'approve', toStage: 'disseminate' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 1 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[17].id,
        details: JSON.stringify({ title: 'FashionHub Style Guide TikTok', fromStage: 'approve', toStage: 'disseminate' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 0.9 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'campaign',
        entityId: foodvibeCampaign.id,
        details: JSON.stringify({ name: 'FoodVibe Taste Stories', status: 'draft' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 3 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'updated',
        entity: 'campaign',
        entityId: techcorpCampaign.id,
        details: JSON.stringify({ name: 'TechCorp Spring Launch 2025', field: 'budget', value: 45000 }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 2.5 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'account',
        entityId: socialAccounts[0].id,
        details: JSON.stringify({ platform: 'instagram', username: '@techcorp' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 30 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'account',
        entityId: socialAccounts[1].id,
        details: JSON.stringify({ platform: 'instagram', username: '@fashionhub' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 30 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'assigned',
        entity: 'content',
        entityId: contentItems[5].id,
        details: JSON.stringify({ title: 'FashionHub Brand Story Carousel', assignee: 'Alex Nakamura' }),
        organizationId: org.id,
        actorId: jake.id,
        createdAt: new Date(now.getTime() - 1.6 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'commented',
        entity: 'content',
        entityId: contentItems[7].id,
        details: JSON.stringify({ title: 'AutoDrive EV Comparison Chart', comment: 'This is urgent!' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.5 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'commented',
        entity: 'content',
        entityId: contentItems[8].id,
        details: JSON.stringify({ title: 'TechCorp Platform Demo Video', comment: 'Needs better transitions' }),
        organizationId: org.id,
        actorId: marcus.id,
        createdAt: new Date(now.getTime() - 1.4 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[18].id,
        details: JSON.stringify({ title: 'AutoDrive EV Range Explainer Video', fromStage: 'approve', toStage: 'disseminate' }),
        organizationId: org.id,
        actorId: sarah.id,
        createdAt: new Date(now.getTime() - 0.8 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[15].id,
        details: JSON.stringify({ title: 'FashionHub Summer Sale Announcement', fromStage: 'design', toStage: 'approve' }),
        organizationId: org.id,
        actorId: jake.id,
        createdAt: new Date(now.getTime() - 0.7 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'content',
        entityId: contentItems[2].id,
        details: JSON.stringify({ title: 'FoodVibe Recipe Card Series', stage: 'idea' }),
        organizationId: org.id,
        actorId: priya.id,
        createdAt: new Date(now.getTime() - 0.6 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'created',
        entity: 'content',
        entityId: contentItems[3].id,
        details: JSON.stringify({ title: 'AutoDrive Community Poll Series', stage: 'idea' }),
        organizationId: org.id,
        actorId: emma.id,
        createdAt: new Date(now.getTime() - 0.5 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[6].id,
        details: JSON.stringify({ title: 'WellnessCo Mindfulness Tips Graphic Set', fromStage: 'idea', toStage: 'design' }),
        organizationId: org.id,
        actorId: luna.id,
        createdAt: new Date(now.getTime() - 0.4 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'updated',
        entity: 'content',
        entityId: contentItems[12].id,
        details: JSON.stringify({ title: 'AutoDrive Test Drive Story Series', field: 'priority', value: 'medium' }),
        organizationId: org.id,
        actorId: david.id,
        createdAt: new Date(now.getTime() - 0.3 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[4].id,
        details: JSON.stringify({ platform: 'facebook', account: 'TechCorp Inc.' }),
        organizationId: org.id,
        actorId: alex.id,
        createdAt: new Date(now.getTime() - 35 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'published',
        entity: 'post',
        entityId: posts[5].id,
        details: JSON.stringify({ platform: 'twitter', account: '@autodrive_ev' }),
        organizationId: org.id,
        actorId: luna.id,
        createdAt: new Date(now.getTime() - 6 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[19].id,
        details: JSON.stringify({ title: 'AutoDrive Holiday Campaign Banner', fromStage: 'disseminate', toStage: 'archived' }),
        organizationId: org.id,
        actorId: emma.id,
        createdAt: new Date(now.getTime() - 30 * dayMs),
      },
    }),
    prisma.activityLog.create({
      data: {
        action: 'moved',
        entity: 'content',
        entityId: contentItems[20].id,
        details: JSON.stringify({ title: 'TechCorp Year-in-Review Video', fromStage: 'disseminate', toStage: 'archived' }),
        organizationId: org.id,
        actorId: emma.id,
        createdAt: new Date(now.getTime() - 55 * dayMs),
      },
    }),
  ])

  console.log(`✅ Created ${activities.length} activity log entries`)

  // ============================================
  // 12. Approvals (5)
  // ============================================
  const approvals = await Promise.all([
    prisma.approval.create({
      data: {
        type: 'content_review',
        status: 'pending',
        organizationId: org.id,
        contentId: contentItems[10].id,
        requestedById: priya.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
    prisma.approval.create({
      data: {
        type: 'content_review',
        status: 'approved',
        comment: 'Great work! The copy is on-brand and compelling.',
        organizationId: org.id,
        contentId: contentItems[11].id,
        requestedById: emma.id,
        reviewedById: sarah.id,
        reviewedAt: new Date(now.getTime() - 1 * dayMs),
        createdAt: new Date(now.getTime() - 3 * dayMs),
      },
    }),
    prisma.approval.create({
      data: {
        type: 'post_publish',
        status: 'pending',
        organizationId: org.id,
        postId: posts[6].id,
        requestedById: alex.id,
        createdAt: new Date(now.getTime() - 0.5 * dayMs),
      },
    }),
    prisma.approval.create({
      data: {
        type: 'post_publish',
        status: 'rejected',
        comment: 'Needs more urgency in the CTA. Please revise before scheduling.',
        organizationId: org.id,
        postId: posts[7].id,
        requestedById: luna.id,
        reviewedById: sarah.id,
        reviewedAt: new Date(now.getTime() - 0.5 * dayMs),
        createdAt: new Date(now.getTime() - 1.5 * dayMs),
      },
    }),
    prisma.approval.create({
      data: {
        type: 'content_review',
        status: 'approved',
        comment: 'Approved with minor edits to slide 3.',
        organizationId: org.id,
        contentId: contentItems[13].id,
        requestedById: priya.id,
        reviewedById: sarah.id,
        reviewedAt: new Date(now.getTime() - 0.8 * dayMs),
        createdAt: new Date(now.getTime() - 2.5 * dayMs),
      },
    }),
  ])
  console.log(`✅ Created ${approvals.length} approvals`)

  // ============================================
  // 13. Invoices (4)
  // ============================================
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        number: 'INV-2025-001',
        clientId: techcorp.id,
        campaignId: techcorpCampaign.id,
        status: 'paid',
        items: JSON.stringify([
          { description: 'Social Media Management - March 2025', quantity: 1, rate: 5000, amount: 5000 },
          { description: 'Content Creation (8 posts)', quantity: 8, rate: 500, amount: 4000 },
          { description: 'Video Production (2 reels)', quantity: 2, rate: 1500, amount: 3000 },
        ]),
        subtotal: 12000,
        tax: 960,
        total: 12960,
        dueDate: new Date(now.getTime() - 10 * dayMs),
        paidAt: new Date(now.getTime() - 5 * dayMs),
        notes: 'Net 30 payment terms. Thank you for your business!',
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 30 * dayMs),
      },
    }),
    prisma.invoice.create({
      data: {
        number: 'INV-2025-002',
        clientId: fashionhub.id,
        campaignId: fashionCampaign.id,
        status: 'sent',
        items: JSON.stringify([
          { description: 'Social Media Strategy & Management - March 2025', quantity: 1, rate: 4500, amount: 4500 },
          { description: 'Instagram Content (12 posts + 6 stories)', quantity: 1, rate: 3600, amount: 3600 },
          { description: 'TikTok Content (4 videos)', quantity: 4, rate: 800, amount: 3200 },
        ]),
        subtotal: 11300,
        tax: 904,
        total: 12204,
        dueDate: new Date(now.getTime() + 20 * dayMs),
        notes: 'Payment due within 30 days of invoice date.',
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 10 * dayMs),
      },
    }),
    prisma.invoice.create({
      data: {
        number: 'INV-2025-003',
        clientId: autodrive.id,
        campaignId: autodriveCampaign.id,
        status: 'overdue',
        items: JSON.stringify([
          { description: 'Multi-platform Campaign Management', quantity: 1, rate: 8000, amount: 8000 },
          { description: 'Video Production (6 videos)', quantity: 6, rate: 2000, amount: 12000 },
          { description: 'Analytics & Reporting', quantity: 1, rate: 2500, amount: 2500 },
        ]),
        subtotal: 22500,
        tax: 1800,
        total: 24300,
        dueDate: new Date(now.getTime() - 15 * dayMs),
        notes: 'OVERDUE - Please remit payment immediately.',
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 45 * dayMs),
      },
    }),
    prisma.invoice.create({
      data: {
        number: 'INV-2025-004',
        clientId: foodvibe.id,
        status: 'draft',
        items: JSON.stringify([
          { description: 'Campaign Strategy Development', quantity: 1, rate: 3000, amount: 3000 },
          { description: 'Content Creation (6 posts)', quantity: 6, rate: 400, amount: 2400 },
        ]),
        subtotal: 5400,
        tax: 432,
        total: 5832,
        dueDate: null,
        notes: 'Draft - pending client approval before sending.',
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
  ])
  console.log(`✅ Created ${invoices.length} invoices`)

  // ============================================
  // 14. Time Entries (12)
  // ============================================
  const timeEntries = await Promise.all([
    prisma.timeEntry.create({
      data: {
        description: 'Drafted TechCorp case study carousel copy',
        hours: 3.5,
        billable: true,
        date: new Date(now.getTime() - 1 * dayMs),
        userId: priya.id,
        clientId: techcorp.id,
        campaignId: techcorpCampaign.id,
        contentId: contentItems[10].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Designed FashionHub brand story carousel slides',
        hours: 5,
        billable: true,
        date: new Date(now.getTime() - 1 * dayMs),
        userId: alex.id,
        clientId: fashionhub.id,
        campaignId: fashionCampaign.id,
        contentId: contentItems[5].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Edited TechCorp platform demo video',
        hours: 6,
        billable: true,
        date: new Date(now.getTime() - 2 * dayMs),
        userId: david.id,
        clientId: techcorp.id,
        campaignId: techcorpCampaign.id,
        contentId: contentItems[8].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Internal team standup and planning meeting',
        hours: 1,
        billable: false,
        date: new Date(now.getTime() - 2 * dayMs),
        userId: sarah.id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Created FashionHub summer sale graphics',
        hours: 4,
        billable: true,
        date: new Date(now.getTime() - 3 * dayMs),
        userId: luna.id,
        clientId: fashionhub.id,
        campaignId: fashionCampaign.id,
        contentId: contentItems[15].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Reviewed and approved pending content items',
        hours: 2,
        billable: false,
        date: new Date(now.getTime() - 3 * dayMs),
        userId: sarah.id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Scheduled and published Instagram posts for TechCorp',
        hours: 2.5,
        billable: true,
        date: new Date(now.getTime() - 4 * dayMs),
        userId: alex.id,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Wrote FoodVibe recipe card captions',
        hours: 3,
        billable: true,
        date: new Date(now.getTime() - 4 * dayMs),
        userId: priya.id,
        clientId: foodvibe.id,
        campaignId: foodvibeCampaign.id,
        contentId: contentItems[2].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Designed AutoDrive EV comparison chart',
        hours: 4.5,
        billable: true,
        date: new Date(now.getTime() - 5 * dayMs),
        userId: luna.id,
        clientId: autodrive.id,
        campaignId: autodriveCampaign.id,
        contentId: contentItems[7].id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Client call with TechCorp marketing team',
        hours: 1.5,
        billable: true,
        date: new Date(now.getTime() - 5 * dayMs),
        userId: marcus.id,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'WellnessCo brand guideline review',
        hours: 2,
        billable: false,
        date: new Date(now.getTime() - 6 * dayMs),
        userId: jake.id,
        clientId: wellnessco.id,
        organizationId: org.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        description: 'Edited FoodVibe Kitchen Stories episode 3',
        hours: 5.5,
        billable: true,
        date: new Date(now.getTime() - 6 * dayMs),
        userId: david.id,
        clientId: foodvibe.id,
        campaignId: foodvibeCampaign.id,
        contentId: contentItems[9].id,
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${timeEntries.length} time entries`)

  // ============================================
  // 15. Assets (10)
  // ============================================
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'TechCorp-Brand-Guide-2025.pdf',
        type: 'brand-guide',
        url: '/assets/techcorp-brand-guide-2025.pdf',
        thumbnailUrl: null,
        size: 4500000,
        mimeType: 'application/pdf',
        tags: 'brand,guidelines,techcorp',
        folder: '/TechCorp/Brand',
        metadata: JSON.stringify({ pages: 24 }),
        uploadedById: jake.id,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'FashionHub-Summer-Campaign-Template.psd',
        type: 'template',
        url: '/assets/fashionhub-summer-template.psd',
        thumbnailUrl: '/assets/thumbs/fashionhub-summer-template.png',
        size: 12800000,
        mimeType: 'image/vnd.adobe.photoshop',
        tags: 'template,summer,fashionhub',
        folder: '/FashionHub/Templates',
        metadata: JSON.stringify({ width: 1080, height: 1080, layers: 12 }),
        uploadedById: jake.id,
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Product-Demo-Raw-Footage.mp4',
        type: 'video',
        url: '/assets/techcorp-demo-raw.mp4',
        thumbnailUrl: '/assets/thumbs/techcorp-demo-raw.png',
        size: 256000000,
        mimeType: 'video/mp4',
        tags: 'video,raw-footage,techcorp',
        folder: '/TechCorp/Video',
        metadata: JSON.stringify({ duration: 180, resolution: '4K', fps: 30 }),
        uploadedById: marcus.id,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'FashionHub-Photoshoot-BTS.jpg',
        type: 'image',
        url: '/assets/fashionhub-bts.jpg',
        thumbnailUrl: '/assets/thumbs/fashionhub-bts.jpg',
        size: 3200000,
        mimeType: 'image/jpeg',
        tags: 'behind-the-scenes,photoshoot,fashionhub',
        folder: '/FashionHub/Photos',
        metadata: JSON.stringify({ width: 4032, height: 3024 }),
        uploadedById: luna.id,
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'AutoDrive-EV-Range-Infographic.png',
        type: 'image',
        url: '/assets/autodrive-ev-range.png',
        thumbnailUrl: '/assets/thumbs/autodrive-ev-range.png',
        size: 1800000,
        mimeType: 'image/png',
        tags: 'infographic,ev,autodrive',
        folder: '/AutoDrive/Graphics',
        metadata: JSON.stringify({ width: 1920, height: 1080 }),
        uploadedById: luna.id,
        clientId: autodrive.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'FoodVibe-Recipe-Card-Template.ai',
        type: 'template',
        url: '/assets/foodvibe-recipe-template.ai',
        thumbnailUrl: '/assets/thumbs/foodvibe-recipe-template.png',
        size: 8500000,
        mimeType: 'application/illustrator',
        tags: 'template,recipe,foodvibe',
        folder: '/FoodVibe/Templates',
        metadata: JSON.stringify({ width: 1080, height: 1080 }),
        uploadedById: jake.id,
        clientId: foodvibe.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'WellnessCo-Mindfulness-Graphics.zip',
        type: 'image',
        url: '/assets/wellnessco-mindfulness-set.zip',
        thumbnailUrl: '/assets/thumbs/wellnessco-mindfulness.png',
        size: 15000000,
        mimeType: 'application/zip',
        tags: 'wellness,graphics,pack',
        folder: '/WellnessCo/Graphics',
        metadata: JSON.stringify({ fileCount: 5, format: 'PNG' }),
        uploadedById: luna.id,
        clientId: wellnessco.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'TechCorp-CEO-Interview-B-Roll.mp4',
        type: 'video',
        url: '/assets/techcorp-ceo-broll.mp4',
        thumbnailUrl: '/assets/thumbs/techcorp-ceo-broll.png',
        size: 512000000,
        mimeType: 'video/mp4',
        tags: 'video,interview,b-roll,techcorp',
        folder: '/TechCorp/Video',
        metadata: JSON.stringify({ duration: 300, resolution: '4K', fps: 24 }),
        uploadedById: marcus.id,
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Social-Media-Icons-Set.svg',
        type: 'image',
        url: '/assets/social-icons-set.svg',
        thumbnailUrl: '/assets/thumbs/social-icons-set.png',
        size: 45000,
        mimeType: 'image/svg+xml',
        tags: 'icons,social-media,general',
        folder: '/Shared/Icons',
        metadata: JSON.stringify({ iconCount: 8 }),
        uploadedById: alex.id,
        organizationId: org.id,
      },
    }),
    prisma.asset.create({
      data: {
        name: 'FashionHub-Sale-Announcement-Template.psd',
        type: 'template',
        url: '/assets/fashionhub-sale-template.psd',
        thumbnailUrl: '/assets/thumbs/fashionhub-sale-template.png',
        size: 9500000,
        mimeType: 'image/vnd.adobe.photoshop',
        tags: 'template,sale,announcement,fashionhub',
        folder: '/FashionHub/Templates',
        metadata: JSON.stringify({ width: 1080, height: 1080, layers: 8 }),
        uploadedById: jake.id,
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${assets.length} assets`)

  // ============================================
  // 16. Notifications (8)
  // ============================================
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        title: 'Approval Required',
        message: 'Priya Sharma requested approval for "TechCorp Case Study Carousel"',
        type: 'approval',
        category: 'approval',
        isRead: false,
        actionUrl: '/approvals',
        userId: sarah.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Post Approval Needed',
        message: 'Alex Nakamura wants to publish a scheduled Twitter post for TechCorp',
        type: 'approval',
        category: 'approval',
        isRead: false,
        actionUrl: '/approvals',
        userId: sarah.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 0.5 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'You were mentioned',
        message: 'Sarah Chen mentioned you in a comment on "TechCorp CEO Spotlight Interview"',
        type: 'mention',
        category: 'content',
        isRead: false,
        userId: marcus.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1.5 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Content Overdue',
        message: '"FashionHub Summer Sale Announcement" is past its due date',
        type: 'warning',
        category: 'content',
        isRead: false,
        userId: sarah.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Invoice Overdue',
        message: 'Invoice INV-2025-003 for AutoDrive is overdue by 15 days',
        type: 'warning',
        category: 'invoice',
        isRead: false,
        userId: sarah.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'New Comment',
        message: 'Marcus Williams commented on "TechCorp Platform Demo Video"',
        type: 'info',
        category: 'content',
        isRead: true,
        userId: david.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1.4 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Post Published Successfully',
        message: 'Your Instagram post for @fashionhub was published successfully',
        type: 'success',
        category: 'post',
        isRead: true,
        userId: luna.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 5 * dayMs),
      },
    }),
    prisma.notification.create({
      data: {
        title: 'System Update',
        message: 'VortexERP has been updated to v2.5 with new invoicing and approval features',
        type: 'info',
        category: 'system',
        isRead: false,
        userId: sarah.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 0.1 * dayMs),
      },
    }),
  ])
  console.log(`✅ Created ${notifications.length} notifications`)

  // ============================================
  // 17. Inbox Messages (10)
  // ============================================
  const inboxMessages = await Promise.all([
    prisma.inboxMessage.create({
      data: {
        platform: 'instagram',
        senderName: 'jessica.style',
        senderAvatar: null,
        content: 'Love this summer collection! Where can I find the floral dress from slide 3? 🌸',
        type: 'comment',
        status: 'unread',
        postUrl: 'https://instagram.com/p/abc123',
        socialAccountId: igFashionhub.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 0.5 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'twitter',
        senderName: 'TechEnthusiast42',
        senderAvatar: null,
        content: '@techcorp_io Just saw your new feature announcement. When will the API be available for beta testing?',
        type: 'mention',
        status: 'unread',
        postUrl: 'https://twitter.com/techcorp_io/status/123456',
        socialAccountId: twTechcorp.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'linkedin',
        senderName: 'Michael Chang',
        senderAvatar: null,
        content: 'Hi, I\'m the Marketing Director at InnovateTech. We\'re interested in discussing a potential partnership. Could we schedule a call?',
        type: 'dm',
        status: 'unread',
        socialAccountId: liTechcorp.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'instagram',
        senderName: 'foodie_maria',
        senderAvatar: null,
        content: 'That salmon recipe looks incredible! Can you share the full ingredient list?',
        type: 'comment',
        status: 'unread',
        postUrl: 'https://instagram.com/p/def456',
        socialAccountId: igFashionhub.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 3 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'tiktok',
        senderName: 'dancedreams22',
        senderAvatar: null,
        content: 'OMG I need that outfit! Link please?? 🔥🔥',
        type: 'comment',
        status: 'read',
        postUrl: 'https://tiktok.com/@fashionhub/video/789',
        socialAccountId: ttFashionhub.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 4 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'instagram',
        senderName: 'fitness_pro_alex',
        senderAvatar: null,
        content: 'Your EV range explainer was super helpful! We shared it in our sustainability group.',
        type: 'reply',
        status: 'replied',
        postUrl: 'https://instagram.com/p/ghi789',
        socialAccountId: igTechcorp.id,
        organizationId: org.id,
        repliedAt: new Date(now.getTime() - 5 * dayMs),
        createdAt: new Date(now.getTime() - 6 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'facebook',
        senderName: 'Sarah M.',
        senderAvatar: null,
        content: 'Do you offer catering services for corporate events? Looking for options for our company retreat.',
        type: 'dm',
        status: 'unread',
        socialAccountId: fbFoodvibe.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 1.5 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'youtube',
        senderName: 'CarReviewKing',
        senderAvatar: null,
        content: 'Great video! Would love to see a comparison with the new Tesla Model 3. Keep up the great content!',
        type: 'comment',
        status: 'read',
        postUrl: 'https://youtube.com/watch?v=xyz123',
        socialAccountId: ytAutodrive.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 7 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'linkedin',
        senderName: 'Jennifer Adams',
        senderAvatar: null,
        content: 'Impressive case study! We\'re facing similar challenges at our company. Would love to connect.',
        type: 'comment',
        status: 'unread',
        socialAccountId: liTechcorp.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 0.2 * dayMs),
      },
    }),
    prisma.inboxMessage.create({
      data: {
        platform: 'instagram',
        senderName: 'sustainable_living_co',
        senderAvatar: null,
        content: 'Would you be interested in a collaboration? We love your brand\'s commitment to sustainability 🌿',
        type: 'dm',
        status: 'ignored',
        socialAccountId: igFashionhub.id,
        organizationId: org.id,
        createdAt: new Date(now.getTime() - 8 * dayMs),
      },
    }),
  ])
  console.log(`✅ Created ${inboxMessages.length} inbox messages`)

  // ============================================
  // 18. Influencers (5)
  // ============================================
  const influencers = await Promise.all([
    prisma.influencer.create({
      data: {
        name: 'Alexa Rivera',
        username: '@alexarivera',
        platform: 'instagram',
        followers: 245000,
        engagementRate: 4.2,
        niche: 'fitness,wellness,lifestyle',
        email: 'alexa@riveramgmt.com',
        phone: '+1-555-1001',
        notes: 'Great engagement on fitness and wellness content. Previously worked with Nike and Lululemon.',
        status: 'active',
        rate: 2500,
        contractStart: new Date('2025-01-01'),
        contractEnd: new Date('2025-06-30'),
        clientId: wellnessco.id,
        campaignId: null,
        organizationId: org.id,
      },
    }),
    prisma.influencer.create({
      data: {
        name: 'Marcus Tech',
        username: '@marcustech',
        platform: 'youtube',
        followers: 485000,
        engagementRate: 3.8,
        niche: 'tech,reviews,startups',
        email: 'marcus@techreviews.io',
        phone: null,
        notes: 'Top tech reviewer with strong enterprise audience. Ideal for B2B campaigns.',
        status: 'negotiating',
        rate: 5000,
        clientId: techcorp.id,
        campaignId: techcorpCampaign.id,
        organizationId: org.id,
      },
    }),
    prisma.influencer.create({
      data: {
        name: 'Sophia Chen',
        username: '@sophiachenstyle',
        platform: 'instagram',
        followers: 380000,
        engagementRate: 5.1,
        niche: 'fashion,beauty,ootd',
        email: 'sophia@stylemaven.co',
        phone: '+1-555-2002',
        notes: 'High engagement rate on fashion and style content. Previously collaborated with major fashion brands.',
        status: 'active',
        rate: 3000,
        contractStart: new Date('2025-02-01'),
        contractEnd: new Date('2025-08-31'),
        clientId: fashionhub.id,
        campaignId: fashionCampaign.id,
        organizationId: org.id,
      },
    }),
    prisma.influencer.create({
      data: {
        name: 'Jake Outdoor',
        username: '@jakeoutdoor',
        platform: 'tiktok',
        followers: 125000,
        engagementRate: 6.3,
        niche: 'fitness,outdoor,adventure',
        email: 'jake@outdooradventures.com',
        phone: null,
        notes: 'Growing TikTok presence with authentic outdoor and fitness content.',
        status: 'prospect',
        rate: null,
        clientId: null,
        campaignId: null,
        organizationId: org.id,
      },
    }),
    prisma.influencer.create({
      data: {
        name: 'Priya Foodie',
        username: '@priyafoodie',
        platform: 'instagram',
        followers: 92000,
        engagementRate: 7.1,
        niche: 'food,cooking,recipes',
        email: 'priya@foodiecreations.com',
        phone: '+1-555-3003',
        notes: 'Highest engagement rate in our network. Authentic home-cooking content with a warm, relatable style.',
        status: 'contacted',
        rate: 1500,
        clientId: foodvibe.id,
        campaignId: foodvibeCampaign.id,
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${influencers.length} influencers`)

  // ============================================
  // 19. Brand Kit Items (6)
  // ============================================
  const brandKits = await Promise.all([
    prisma.brandKit.create({
      data: {
        name: 'TechCorp Primary Blue',
        type: 'color',
        value: JSON.stringify({ hex: '#1E40AF', rgb: '30, 64, 175', cmyk: '100, 65, 0, 0' }),
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.brandKit.create({
      data: {
        name: 'TechCorp Secondary Teal',
        type: 'color',
        value: JSON.stringify({ hex: '#0D9488', rgb: '13, 148, 136', cmyk: '85, 0, 15, 0' }),
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.brandKit.create({
      data: {
        name: 'TechCorp Sans',
        type: 'font',
        value: JSON.stringify({ family: 'Inter', weights: ['400', '500', '600', '700'], fallback: 'system-ui, sans-serif' }),
        clientId: techcorp.id,
        organizationId: org.id,
      },
    }),
    prisma.brandKit.create({
      data: {
        name: 'FashionHub Logo',
        type: 'logo',
        value: JSON.stringify({ url: '/assets/fashionhub-logo.svg', format: 'SVG', variants: ['full', 'icon', 'mono'] }),
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
    prisma.brandKit.create({
      data: {
        name: 'FashionHub Coral',
        type: 'color',
        value: JSON.stringify({ hex: '#F97316', rgb: '249, 115, 22', cmyk: '0, 60, 90, 0' }),
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
    prisma.brandKit.create({
      data: {
        name: 'FashionHub Display',
        type: 'font',
        value: JSON.stringify({ family: 'Playfair Display', weights: ['400', '700'], fallback: 'Georgia, serif', usage: 'Headlines only' }),
        clientId: fashionhub.id,
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${brandKits.length} brand kit items`)

  console.log('🎉 Seeding complete!')
  console.log({
    organization: 1,
    users: users.length,
    teams: teams.length,
    clients: clients.length,
    campaigns: campaigns.length,
    content: contentItems.length,
    socialAccounts: socialAccounts.length,
    posts: posts.length,
    automations: automations.length,
    comments: comments.length,
    activities: activities.length,
    approvals: approvals.length,
    invoices: invoices.length,
    timeEntries: timeEntries.length,
    assets: assets.length,
    notifications: notifications.length,
    inboxMessages: inboxMessages.length,
    influencers: influencers.length,
    brandKits: brandKits.length,
  })
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
