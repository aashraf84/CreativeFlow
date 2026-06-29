import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const task = await db.disseminationTask.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        disseminator: {
          select: {
            id: true,
            speciality: true,
            rating: true,
            workloadCapacity: true,
            totalTasksCompleted: true,
            totalPostsPublished: true,
            avgCompletionHours: true,
            onTimeRate: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        content: { select: { id: true, title: true, type: true, stage: true } },
        client: { select: { id: true, name: true, logo: true, industry: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    return NextResponse.json({
      task: {
        ...task,
        targetPlatforms: task.targetPlatforms ? JSON.parse(task.targetPlatforms) : [],
        mediaUrls: task.mediaUrls ? JSON.parse(task.mediaUrls) : [],
        engagement: task.engagement ? JSON.parse(task.engagement) : null,
      },
    })
  } catch (error) {
    console.error('Dissemination Task GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const currentTask = await db.disseminationTask.findUnique({
      where: { id },
      select: { status: true, assigneeId: true, disseminatorId: true, startedAt: true },
    })
    if (!currentTask) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}

    // Basic field updates
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.contentId !== undefined) updateData.contentId = body.contentId || null
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId || null
    if (body.targetPlatforms !== undefined) updateData.targetPlatforms = JSON.stringify(body.targetPlatforms)
    if (body.postContent !== undefined) updateData.postContent = body.postContent
    if (body.mediaUrls !== undefined) updateData.mediaUrls = JSON.stringify(body.mediaUrls)
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags
    if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.completionNotes !== undefined) updateData.completionNotes = body.completionNotes
    if (body.engagement !== undefined) updateData.engagement = JSON.stringify(body.engagement)
    if (body.postId !== undefined) updateData.postId = body.postId
    if (body.assignedById !== undefined) updateData.assignedById = body.assignedById

    // Handle assignee changes
    if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId || null
      if (body.assigneeId && body.assigneeId !== currentTask.assigneeId) {
        updateData.assignedAt = new Date()
      }
    }

    // Handle disseminator changes
    if (body.disseminatorId !== undefined) {
      updateData.disseminatorId = body.disseminatorId || null
    }

    // Handle status transitions
    if (body.status && body.status !== currentTask.status) {
      updateData.status = body.status

      // When status changes to "in_progress": set startedAt
      if (body.status === 'in_progress' && !currentTask.startedAt) {
        updateData.startedAt = new Date()
      }

      // When status changes to "completed": set completedAt, update disseminator stats
      if (body.status === 'completed') {
        updateData.completedAt = new Date()

        // Update disseminator stats if disseminatorId exists
        const disseminatorId = body.disseminatorId ?? currentTask.disseminatorId
        if (disseminatorId) {
          const disseminator = await db.disseminator.findUnique({
            where: { id: disseminatorId },
          })
          if (disseminator) {
            const newTotalCompleted = disseminator.totalTasksCompleted + 1
            const newTotalPublished = disseminator.totalPostsPublished + 1

            // Calculate average completion hours
            let newAvgHours = disseminator.avgCompletionHours
            if (currentTask.startedAt) {
              const hoursElapsed = (Date.now() - currentTask.startedAt.getTime()) / (1000 * 60 * 60)
              newAvgHours = (disseminator.avgCompletionHours * disseminator.totalTasksCompleted + hoursElapsed) / newTotalCompleted
            }

            // Calculate on-time rate
            const currentTaskRecord = await db.disseminationTask.findUnique({
              where: { id },
              select: { dueDate: true },
            })
            let onTimeCount = Math.round(disseminator.onTimeRate * disseminator.totalTasksCompleted)
            if (currentTaskRecord?.dueDate && new Date() <= currentTaskRecord.dueDate) {
              onTimeCount += 1
            }
            const newOnTimeRate = newTotalCompleted > 0 ? onTimeCount / newTotalCompleted : 0

            await db.disseminator.update({
              where: { id: disseminatorId },
              data: {
                totalTasksCompleted: newTotalCompleted,
                totalPostsPublished: newTotalPublished,
                avgCompletionHours: Math.round(newAvgHours * 100) / 100,
                onTimeRate: Math.round(newOnTimeRate * 1000) / 1000,
              },
            })
          }
        }
      }

      // When status changes to "failed": set failureReason
      if (body.status === 'failed') {
        if (body.failureReason) {
          updateData.failureReason = body.failureReason
        }
      }
    }

    // Handle failureReason independently (not just on status change)
    if (body.failureReason !== undefined && body.status !== 'failed') {
      updateData.failureReason = body.failureReason
    }

    const task = await db.disseminationTask.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        disseminator: {
          select: {
            id: true,
            speciality: true,
            rating: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        content: { select: { id: true, title: true, type: true, stage: true } },
        client: { select: { id: true, name: true, logo: true, industry: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    // Auto-recalculate overdue status for pending/in_progress tasks
    if (task.status === 'pending' || task.status === 'in_progress') {
      if (task.dueDate && new Date(task.dueDate) < new Date()) {
        await db.disseminationTask.update({
          where: { id: task.id },
          data: { status: 'overdue' },
        })
      }
    }

    return NextResponse.json({
      task: {
        ...task,
        targetPlatforms: task.targetPlatforms ? JSON.parse(task.targetPlatforms) : [],
        mediaUrls: task.mediaUrls ? JSON.parse(task.mediaUrls) : [],
        engagement: task.engagement ? JSON.parse(task.engagement) : null,
      },
    })
  } catch (error) {
    console.error('Dissemination Task PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
