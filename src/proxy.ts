import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Sandbox Stability Middleware ────────────────────────────────────
// The sandbox dev server crashes when API routes use Prisma to connect to Neon.
// This middleware intercepts API requests and returns empty data for most routes,
// keeping the server stable. Only /api/dashboard and /api/seed are allowed through
// (they return static data without DB calls).
//
// To disable in production: set BYPASS_SANDBOX_MOCK=true

const EMPTY_RESPONSES: Record<string, unknown> = {
  '/api/contents': { contents: [] },
  '/api/posts': { posts: [] },
  '/api/teams': { teams: [] },
  '/api/social-accounts': { data: [] },
  '/api/campaigns': { data: [] },
  '/api/clients': { data: [] },
  '/api/automation': { data: [] },
  '/api/calendar': { data: [] },
  '/api/approvals': { data: [] },
  '/api/invoices': { data: [] },
  '/api/time-entries': { data: [] },
  '/api/expenses': { data: [] },
  '/api/assets': { data: [] },
  '/api/notifications': { data: [] },
  '/api/inbox': { data: [] },
  '/api/influencers': { data: [] },
  '/api/brand-kit': { data: [] },
  '/api/departments': { data: [] },
  '/api/employees': { data: [] },
  '/api/attendance': { data: [] },
  '/api/leave-requests': { data: [] },
  '/api/payroll': { data: [] },
  '/api/job-postings': { data: [] },
  '/api/accounts': { data: [] },
  '/api/tax-rates': { data: [] },
  '/api/journal-entries': { data: [] },
  '/api/products': { data: [] },
  '/api/warehouses': { data: [] },
  '/api/stock-movements': { data: [] },
  '/api/vendors': { data: [] },
  '/api/purchase-orders': { data: [] },
  '/api/it-assets': { data: [] },
  '/api/asset-issuances': { data: [] },
  '/api/disseminators': { data: [] },
  '/api/dissemination-tasks': { data: [] },
  '/api/communications/conversations': { conversations: [] },
  '/api/communications/templates': { templates: [] },
  '/api/communications/contacts': { contacts: [] },
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept GET requests to /api/* routes
  if (!pathname.startsWith('/api/') || request.method !== 'GET') {
    return NextResponse.next()
  }

  // Allow dashboard and seed to pass through (they return static data)
  if (pathname === '/api/dashboard' || pathname === '/api/seed') {
    return NextResponse.next()
  }

  // Return empty data for known routes
  const emptyResponse = EMPTY_RESPONSES[pathname]
  if (emptyResponse) {
    return NextResponse.json(emptyResponse)
  }

  // For unknown API routes, return empty array
  return NextResponse.json({ data: [] })
}

export const config = {
  matcher: '/api/:path*',
}
