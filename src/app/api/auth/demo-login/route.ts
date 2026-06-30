import { NextResponse } from 'next/server'

// Returns static demo user data without any DB call to keep the sandbox server stable.
// In production (Vercel + Neon), this would query the database for the demo user.
export async function POST(_request: Request) {
  return NextResponse.json({
    success: true,
    user: {
      id: 'demo-user-1',
      email: 'demo@vortexdigital.com',
      name: 'Demo Viewer',
      avatar: null,
      role: 'demo',
      isDemo: true,
      organizationId: 'org-vortex-digital',
      organization: {
        id: 'org-vortex-digital',
        name: 'Vortex Digital',
        slug: 'vortex-digital',
        logo: null,
        plan: 'enterprise',
        tenantId: 'tenant-1',
      },
      permissions: { canCreate: false, canEdit: false, canDelete: false, canApprove: false, canPost: false }
    }
  })
}
