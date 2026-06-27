import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (type) where.type = type

    const accounts = await db.account.findMany({
      where,
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ data: accounts })
  } catch (error) {
    console.error('Accounts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const account = await db.account.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        category: body.category || null,
        balance: body.balance || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Accounts POST error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
