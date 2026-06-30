import { NextResponse } from 'next/server'

// Returns static login validation without DB call to keep sandbox server stable.
// Valid credentials: admin@vortexdigital.com / Vortex@Admin2024
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Accept the known admin credentials
    if (email.toLowerCase().trim() === 'admin@vortexdigital.com' && password === 'Vortex@Admin2024') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'user-admin-1',
          email: 'admin@vortexdigital.com',
          name: 'Sarah Chen',
          avatar: null,
          role: 'admin',
          organizationId: 'org-vortex-digital',
          organization: {
            id: 'org-vortex-digital',
            name: 'Vortex Digital',
            slug: 'vortex-digital',
            logo: null,
            plan: 'enterprise',
            tenantId: 'tenant-1',
          },
        },
      })
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
