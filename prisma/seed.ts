import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in correct order (respecting foreign keys)
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
