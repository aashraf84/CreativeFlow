import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (status) where.status = status
    if (type) where.type = type

    const approvals = await db.approval.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        content: { select: { id: true, title: true, type: true, stage: true } },
        post: { select: { id: true, content: true, platform: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('Approvals GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const approval = await db.approval.create({
      data: {
        type: body.type,
        status: 'pending',
        comment: body.comment || null,
        organizationId: org.id,
        contentId: body.contentId || null,
        postId: body.postId || null,
        requestedById: body.requestedById,
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        reviewedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        content: { select: { id: true, title: true, type: true, stage: true } },
        post: { select: { id: true, content: true, platform: true, status: true } },
      },
    })

    return NextResponse.json({ approval }, { status: 201 })
  } catch (error) {
    console.error('Approvals POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
