import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEMO_DATA, FINANCIAL_REPORT_DATA, REPORT_DATA } from '@/lib/demo-data'

// ── Sandbox Stability Proxy ─────────────────────────────────────────
// The sandbox dev server crashes when API routes use Prisma to connect to Neon.
// This proxy intercepts ALL API requests (GET/POST/PUT/DELETE) and returns
// demo data or success responses, keeping the server stable and ALL buttons working.
//
// GET: Returns demo data from DEMO_DATA
// POST: Returns the request body as the "created" object (with generated ID + nested nulls)
// PUT: Returns the request body as the "updated" object
// DELETE: Returns { success: true }
//
// To use the real database: set USE_REAL_DB=true and remove this proxy.

// Generate a unique ID for created resources
function generateId(pathname: string): string {
  const prefix = pathname.split('/').pop() || 'obj'
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Ensure created objects have all nested fields that view components expect
// (prevents crashes when rendering cards that access .creator, .team, etc.)
function completeCreatedObject(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    // Nested user/object fields → null if not provided
    creator: body.creator ?? null,
    assignee: body.assignee ?? null,
    team: body.team ?? null,
    campaign: body.campaign ?? null,
    client: body.client ?? null,
    department: body.department ?? null,
    employee: body.employee ?? null,
    user: body.user ?? null,
    vendor: body.vendor ?? null,
    product: body.product ?? null,
    warehouse: body.warehouse ?? null,
    socialAccount: body.socialAccount ?? null,
    content: body.content ?? null,
    post: body.post ?? null,
    requestedBy: body.requestedBy ?? null,
    reviewedBy: body.reviewedBy ?? null,
    uploadedBy: body.uploadedBy ?? null,
    submittedBy: body.submittedBy ?? null,
    approvedBy: body.approvedBy ?? null,
    assignedTo: body.assignedTo ?? null,
    issuedTo: body.issuedTo ?? null,
    issuedBy: body.issuedBy ?? null,
    disseminator: body.disseminator ?? null,
    actor: body.actor ?? null,
    parent: body.parent ?? null,
    // Nested array fields → [] if not provided
    posts: body.posts ?? [],
    comments: body.comments ?? [],
    invoiceItems: body.invoiceItems ?? [],
    members: body.members ?? [],
    stockLevels: body.stockLevels ?? [],
    poItems: body.poItems ?? [],
    lines: body.lines ?? [],
    items: body.items ?? [],
    messages: body.messages ?? [],
    issuances: body.issuances ?? [],
    children: body.children ?? [],
    // Timestamps
    createdAt: body.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const method = request.method

  // Only intercept /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow auth POST routes to pass through (they return static data without DB)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow dashboard and seed GET to pass through (they return static data)
  if ((pathname === '/api/dashboard' || pathname === '/api/seed') && method === 'GET') {
    return NextResponse.next()
  }

  // Allow attendance-machine sync to pass through (simulated device API)
  if (pathname === '/api/attendance-machine/sync' && method === 'GET') {
    return NextResponse.next()
  }

  // Allow attendance bridge to pass through (receives data from local agent)
  if (pathname === '/api/attendance-bridge') {
    return NextResponse.next()
  }

  // ── GET: Return demo data ────────────────────────────────────────
  if (method === 'GET') {
    // Handle /api/financial-reports?type=... (query-param based)
    if (pathname === '/api/financial-reports') {
      const reportType = searchParams.get('type') || 'overview'
      const reportData = FINANCIAL_REPORT_DATA[reportType]
      if (reportData) {
        return NextResponse.json({ data: reportData })
      }
      return NextResponse.json({ data: [] })
    }

    // Handle /api/reports/* routes
    if (REPORT_DATA[pathname]) {
      return NextResponse.json(REPORT_DATA[pathname])
    }

    // Handle /api/influencers/web-search (POST only, but if GET, return empty)
    if (pathname === '/api/influencers/web-search') {
      return NextResponse.json({ results: [] })
    }

    // Handle /api/influencers/analytics
    if (pathname === '/api/influencers/analytics') {
      return NextResponse.json({
        totalInfluencers: 6,
        activeCollaborations: 4,
        avgEngagement: 4.65,
        totalReach: 3700000,
        avgRate: 6500,
        followerTiers: { micro: 2, macro: 4 },
        platformBreakdown: { instagram: 3, youtube: 2, tiktok: 1 },
      })
    }

    // Standard demo data lookup
    const demoResponse = DEMO_DATA[pathname]
    if (demoResponse) {
      return NextResponse.json(demoResponse)
    }

    // Handle /api/{resource}/{id} pattern (detail routes) — return first item from collection
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length === 3 && pathParts[0] === 'api') {
      const collectionPath = `/api/${pathParts[1]}`
      const collection = DEMO_DATA[collectionPath] as Record<string, unknown[]> | undefined
      if (collection) {
        // Find the item with matching id, or return first item
        const arrays = Object.values(collection).filter(Array.isArray) as unknown[][]
        if (arrays.length > 0 && arrays[0].length > 0) {
          const items = arrays[0] as Record<string, unknown>[]
          const item = items.find(i => i.id === pathParts[2]) || items[0]
          return NextResponse.json(item)
        }
      }
    }

    // For unknown GET routes, return empty array
    return NextResponse.json({ data: [] })
  }

  // ── POST: Create operation ───────────────────────────────────────
  if (method === 'POST') {
    // Handle /api/influencers/web-search
    if (pathname === '/api/influencers/web-search') {
      try {
        const body = await request.json()
        const query = body?.query || ''
        // Return mock web search results
        return NextResponse.json({
          results: query ? [
            { name: `${query} Official`, username: `@${query.toLowerCase().replace(/\s+/g, '_')}`, platform: 'instagram', followers: 125000, engagementRate: 4.2, niche: 'Lifestyle', url: 'https://instagram.com/' },
            { name: `${query} Fan Page`, username: `@${query.toLowerCase().replace(/\s+/g, '')}_fan`, platform: 'tiktok', followers: 89000, engagementRate: 5.8, niche: 'Entertainment', url: 'https://tiktok.com/' },
            { name: `${query} Reviews`, username: `@${query.toLowerCase().replace(/\s+/g, '_')}_reviews`, platform: 'youtube', followers: 210000, engagementRate: 3.5, niche: 'Reviews', url: 'https://youtube.com/' },
          ] : []
        })
      } catch {
        return NextResponse.json({ results: [] })
      }
    }

    try {
      const body = await request.json()
      const created = {
        id: generateId(pathname),
        ...completeCreatedObject(body),
      }
      return NextResponse.json(created, { status: 201 })
    } catch {
      return NextResponse.json(
        { id: generateId(pathname), success: true, createdAt: new Date().toISOString() },
        { status: 201 }
      )
    }
  }

  // ── PUT/PATCH: Update operation ──────────────────────────────────
  if (method === 'PUT' || method === 'PATCH') {
    try {
      const body = await request.json()
      const updated = {
        ...body,
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(updated)
    } catch {
      return NextResponse.json({ success: true, updatedAt: new Date().toISOString() })
    }
  }

  // ── DELETE: Delete operation ─────────────────────────────────────
  if (method === 'DELETE') {
    return NextResponse.json({ success: true, id: pathname.split('/').pop() })
  }

  // Fallback for other methods
  return NextResponse.json({ success: true })
}

export const config = {
  matcher: '/api/:path*',
}
