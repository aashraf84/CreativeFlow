import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const issuedToId = searchParams.get('issuedToId')
    const assetId = searchParams.get('assetId')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status
    if (issuedToId) where.issuedToId = issuedToId
    if (assetId) where.assetId = assetId

    const issuances = await db.assetIssuance.findMany({
      where,
      include: {
        asset: true,
        issuedTo: true,
        issuedBy: true,
      },
      orderBy: { issueDate: 'desc' },
    })

    return NextResponse.json({ data: issuances })
  } catch (error) {
    console.error('Asset Issuances GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch asset issuances' }, { status: 500 })
  }
}
