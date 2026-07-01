import { NextResponse } from 'next/server'

// ── Employee Login Authentication ───────────────────────────────────
// Authenticates against demo user accounts (employee credentials).
// Also accepts the super-admin credentials.
// Each employee has role-based permissions set via ROLE_DEFINITIONS in store.ts.

// Demo user accounts (mirrors src/lib/demo-data.ts userAccounts)
const EMPLOYEE_ACCOUNTS = [
  { userId: 'u1', username: 'sarah', password: 'CreativeFlow@2024', role: 'admin', email: 'sarah@creativeflow.com', name: 'Sarah Chen' },
  { userId: 'u2', username: 'mike', password: 'CreativeFlow@2024', role: 'manager', email: 'mike@creativeflow.com', name: 'Mike Ross' },
  { userId: 'u3', username: 'alex', password: 'CreativeFlow@2024', role: 'disseminator', email: 'alex@creativeflow.com', name: 'Alex Rivera' },
  { userId: 'u4', username: 'emma', password: 'CreativeFlow@2024', role: 'designer', email: 'emma@creativeflow.com', name: 'Emma Stone' },
  { userId: 'u5', username: 'james', password: 'CreativeFlow@2024', role: 'editor', email: 'james@creativeflow.com', name: 'James Wilson' },
  { userId: 'u6', username: 'lisa', password: 'CreativeFlow@2024', role: 'creative_lead', email: 'lisa@creativeflow.com', name: 'Lisa Park' },
  { userId: 'u7', username: 'david', password: 'CreativeFlow@2024', role: 'reviewer', email: 'david@creativeflow.com', name: 'David Kim' },
  { userId: 'u8', username: 'rachel', password: 'CreativeFlow@2024', role: 'approver', email: 'rachel@creativeflow.com', name: 'Rachel Green' },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email or username is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check super-admin credentials
    if (normalizedEmail === 'admin@creativeflow.ai' && password === 'Admin@7867') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'u1',
          email: 'admin@creativeflow.ai',
          name: 'Sarah Chen',
          avatar: null,
          role: 'admin',
          organizationId: 'org-1',
          organization: {
            id: 'org-1',
            name: 'CreativeFlow Digital',
            slug: 'creativeflow-digital',
            logo: null,
            plan: 'enterprise',
            tenantId: 'tenant-1',
          },
        },
      })
    }

    // Check employee credentials (match by email or username)
    const account = EMPLOYEE_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === normalizedEmail || a.username.toLowerCase() === normalizedEmail
    )

    if (account && account.password === password) {
      return NextResponse.json({
        success: true,
        user: {
          id: account.userId,
          email: account.email,
          name: account.name,
          avatar: null,
          role: account.role,
          organizationId: 'org-1',
          organization: {
            id: 'org-1',
            name: 'CreativeFlow Digital',
            slug: 'creativeflow-digital',
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
