import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const teamId = searchParams.get('teamId')
    const campaignId = searchParams.get('campaignId')
    const assigneeId = searchParams.get('assigneeId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (stage) where.stage = stage
    if (type) where.type = type
    if (priority) where.priority = priority
    if (teamId) where.teamId = teamId
    if (campaignId) where.campaignId = campaignId
    if (assigneeId) where.assigneeId = assigneeId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const [contents, total] = await Promise.all([
      db.content.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          team: { select: { id: true, name: true, type: true, color: true } },
          campaign: { select: { id: true, name: true, status: true } },
          comments: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { posts: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.content.count({ where }),
    ])

    return NextResponse.json({
      contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Contents GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const content = await db.content.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type || 'post',
        stage: body.stage || 'idea',
        priority: body.priority || 'medium',
        format: body.format || null,
        tags: body.tags || null,
        metadata: body.metadata || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        organizationId: org.id,
        campaignId: body.campaignId || null,
        creatorId: body.creatorId || null,
        assigneeId: body.assigneeId || null,
        teamId: body.teamId || null,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    // Log activity
    if (body.creatorId) {
      await db.activityLog.create({
        data: {
          action: 'created',
          entity: 'content',
          entityId: content.id,
          details: JSON.stringify({ title: content.title, stage: content.stage }),
          organizationId: org.id,
          actorId: body.creatorId,
        },
      })
    }

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Contents POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
