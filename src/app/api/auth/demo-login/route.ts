import { NextResponse } from 'next/server'

// Returns static demo user data without any DB call to keep the sandbox server stable.
// Demo mode logs in as Sarah Chen (admin) so the full workflow is visible.
// In production (Vercel + Neon), this would query the database for the demo user.
export async function POST(_request: Request) {
  return NextResponse.json({
    success: true,
    user: {
      id: 'u1',
      email: 'sarah@creativeflow.com',
      name: 'Sarah Chen',
      avatar: null,
      role: 'admin',
      isDemo: true,
      organizationId: 'org-1',
      organization: {
        id: 'org-1',
        name: 'CreativeFlow Digital',
        slug: 'creativeflow-digital',
        logo: null,
        plan: 'enterprise',
        tenantId: 'tenant-1',
      },
      permissions: { canCreate: true, canEdit: true, canDelete: true, canApprove: true, canPost: true }
    }
  })
}
