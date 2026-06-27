import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const parentId = searchParams.get('parentId')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (type) where.type = type
    if (parentId) where.parentId = parentId
    if (searchParams.get('activeOnly') === 'true') where.isActive = true

    const accounts = await db.account.findMany({
      where,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true, balance: true } },
        _count: { select: { journalLines: true } },
      },
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
        description: body.description || null,
        normalBalance: body.normalBalance || 'debit',
        parentId: body.parentId || null,
        balance: body.balance || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, type: true, balance: true } },
        _count: { select: { journalLines: true } },
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Accounts POST error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
