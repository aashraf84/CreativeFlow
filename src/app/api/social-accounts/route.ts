import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const socialAccounts = await db.socialAccount.findMany({
      where: { organizationId: org.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { platform: 'asc' },
    })

    // Group by platform for convenience
    const byPlatform = socialAccounts.reduce((acc, account) => {
      if (!acc[account.platform]) acc[account.platform] = []
      acc[account.platform].push(account)
      return acc
    }, {} as Record<string, typeof socialAccounts>)

    // Total followers
    const totalFollowers = socialAccounts.reduce((sum, account) => sum + account.followers, 0)

    return NextResponse.json({
      accounts: socialAccounts,
      byPlatform,
      totalFollowers,
      platformCount: Object.keys(byPlatform).length,
    })
  } catch (error) {
    console.error('Social Accounts GET error:', error)
    return NextResponse.json({ data: [] })
  }
}
