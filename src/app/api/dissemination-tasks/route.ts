import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    const priority = searchParams.get('priority')
    const clientId = searchParams.get('clientId')
    const campaignId = searchParams.get('campaignId')
    const disseminatorId = searchParams.get('disseminatorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    if (campaignId) where.campaignId = campaignId
    if (disseminatorId) where.disseminatorId = disseminatorId

    // Auto-mark overdue tasks: tasks that are pending/in_progress with dueDate < now
    const now = new Date()
    await db.disseminationTask.updateMany({
      where: {
        organizationId: org.id,
        status: { in: ['pending', 'in_progress'] },
        dueDate: { lt: now },
      },
      data: { status: 'overdue' },
    })

    // Re-apply status filter if it was provided (overdue marking may have changed things)
    if (status) where.status = status

    const [tasks, total] = await Promise.all([
      db.disseminationTask.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
          disseminator: {
            select: {
              id: true,
              speciality: true,
              rating: true,
              workloadCapacity: true,
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          content: { select: { id: true, title: true, type: true, stage: true } },
          client: { select: { id: true, name: true, logo: true, industry: true } },
          campaign: { select: { id: true, name: true, status: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.disseminationTask.count({ where }),
    ])

    // Parse JSON fields for each task
    const tasksWithParsedFields = tasks.map((task) => ({
      ...task,
      targetPlatforms: task.targetPlatforms ? JSON.parse(task.targetPlatforms) : [],
      mediaUrls: task.mediaUrls ? JSON.parse(task.mediaUrls) : [],
      engagement: task.engagement ? JSON.parse(task.engagement) : null,
    }))

    return NextResponse.json({
      tasks: tasksWithParsedFields,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Dissemination Tasks GET error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const task = await db.disseminationTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        contentId: body.contentId || null,
        assigneeId: body.assigneeId || null,
        disseminatorId: body.disseminatorId || null,
        clientId: body.clientId || null,
        campaignId: body.campaignId || null,
        targetPlatforms: body.targetPlatforms ? JSON.stringify(body.targetPlatforms) : null,
        postContent: body.postContent || null,
        mediaUrls: body.mediaUrls ? JSON.stringify(body.mediaUrls) : null,
        hashtags: body.hashtags || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        assignedById: body.assignedById || null,
        assignedAt: body.assigneeId ? new Date() : null,
        organizationId: org.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        disseminator: {
          select: {
            id: true,
            speciality: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        content: { select: { id: true, title: true, type: true, stage: true } },
        client: { select: { id: true, name: true, logo: true, industry: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({
      task: {
        ...task,
        targetPlatforms: task.targetPlatforms ? JSON.parse(task.targetPlatforms) : [],
        mediaUrls: task.mediaUrls ? JSON.parse(task.mediaUrls) : [],
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Dissemination Tasks POST error:', error)
    return NextResponse.json({ data: [] })
  }
}
