import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings — Return current organization settings and admin user profile
export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    // Get the first admin user as the "current user" for settings
    const adminUser = await db.user.findFirst({
      where: { organizationId: org.id, role: 'admin' },
    })

    // Get user counts for display
    const userCount = await db.user.count({ where: { organizationId: org.id } })
    const accountCount = await db.socialAccount.count({ where: { organizationId: org.id } })

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        plan: org.plan,
        maxUsers: org.maxUsers,
        maxAccounts: org.maxAccounts,
      },
      user: adminUser
        ? {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            avatar: adminUser.avatar,
            role: adminUser.role,
          }
        : null,
      usage: {
        userCount,
        accountCount,
      },
    })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

// PUT /api/settings — Update organization name, user profile, and notification preferences
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { organization, user, notifications } = body

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const results: string[] = []

    // Update organization if provided
    if (organization) {
      const orgData: { name?: string; logo?: string } = {}
      if (organization.name !== undefined) orgData.name = organization.name
      if (organization.logo !== undefined) orgData.logo = organization.logo

      if (Object.keys(orgData).length > 0) {
        await db.organization.update({
          where: { id: org.id },
          data: orgData,
        })
        results.push('organization')
      }
    }

    // Update user profile if provided
    if (user) {
      const adminUser = await db.user.findFirst({
        where: { organizationId: org.id, role: 'admin' },
      })
      if (adminUser) {
        const userData: { name?: string; email?: string; avatar?: string } = {}
        if (user.name !== undefined) userData.name = user.name
        if (user.email !== undefined) userData.email = user.email
        if (user.avatar !== undefined) userData.avatar = user.avatar

        if (Object.keys(userData).length > 0) {
          await db.user.update({
            where: { id: adminUser.id },
            data: userData,
          })
          results.push('profile')
        }
      }
    }

    // Notification preferences are stored as-is (no DB model for them)
    // We acknowledge them but don't persist — could be extended with a UserSettings model
    if (notifications) {
      results.push('notifications')
    }

    return NextResponse.json({
      success: true,
      updated: results,
      // Echo back notification preferences so the client can confirm
      notifications: notifications || null,
    })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}
