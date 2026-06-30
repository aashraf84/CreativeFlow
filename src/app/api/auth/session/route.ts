import { NextResponse } from 'next/server'

// Returns static session data without DB call to keep sandbox server stable.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ authenticated: false })

    // Return a static authenticated session for any user ID
    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email: 'admin@vortexdigital.com',
        name: 'Sarah Chen',
        avatar: null,
        role: 'admin',
        isDemo: false,
        organizationId: 'org-vortex-digital',
        organization: {
          id: 'org-vortex-digital',
          name: 'Vortex Digital',
          slug: 'vortex-digital',
          logo: null,
          plan: 'enterprise',
          tenantId: 'tenant-1',
        },
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false, error: 'Failed to check session' }, { status: 500 })
  }
}
