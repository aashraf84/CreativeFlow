import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEMO_DATA } from '@/lib/demo-data'

// ── Sandbox Stability Proxy ─────────────────────────────────────────
// The sandbox dev server crashes when API routes use Prisma to connect to Neon.
// This proxy intercepts API requests and returns demo data from the static
// DEMO_DATA store, keeping the server stable while showing full workflow.
//
// Only /api/dashboard and /api/seed are allowed through (they return static data).
// To use the real database: set USE_REAL_DB=true and remove this proxy.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept GET requests to /api/* routes
  if (!pathname.startsWith('/api/') || request.method !== 'GET') {
    return NextResponse.next()
  }

  // Allow dashboard and seed to pass through (they return static data without DB)
  if (pathname === '/api/dashboard' || pathname === '/api/seed') {
    return NextResponse.next()
  }

  // Return demo data for known routes
  const demoResponse = DEMO_DATA[pathname]
  if (demoResponse) {
    return NextResponse.json(demoResponse)
  }

  // For unknown API routes, return empty array
  return NextResponse.json({ data: [] })
}

export const config = {
  matcher: '/api/:path*',
}
