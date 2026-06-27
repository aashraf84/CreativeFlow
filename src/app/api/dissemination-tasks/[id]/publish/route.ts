import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
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
            totalTasksCompleted: true,
            totalPostsPublished: true,
            avgCompletionHours: true,
            onTimeRate: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Dissemination task not found' }, { status: 404 })
    }

    if (!task.assigneeId) {
      return NextResponse.json(
        { error: 'Task must have an assignee before publishing' },
        { status: 400 }
      )
    }

    // Parse target platforms
    const targetPlatforms: string[] = task.targetPlatforms
      ? JSON.parse(task.targetPlatforms)
      : []

    if (targetPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'Task must have at least one target platform' },
        { status: 400 }
      )
    }

    if (!task.postContent) {
      return NextResponse.json(
        { error: 'Task must have post content before publishing' },
        { status: 400 }
      )
    }

    // Find social accounts for the assignee on each target platform
    const socialAccounts = await db.socialAccount.findMany({
      where: {
        userId: task.assigneeId,
        isActive: true,
        platform: { in: targetPlatforms },
      },
    })

    if (socialAccounts.length === 0) {
      return NextResponse.json(
        { error: `No active social accounts found for assignee on platforms: ${targetPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    // Create a Post record for each platform that has a matching social account
    const createdPosts = []
    for (const account of socialAccounts) {
      const post = await db.post.create({
        data: {
          content: task.postContent,
          mediaUrls: task.mediaUrls || null,
          platform: account.platform,
          status: 'published',
          publishedAt: new Date(),
          scheduledAt: task.scheduledAt,
          socialAccountId: account.id,
          contentId: task.contentId || null,
          userId: task.assigneeId,
          organizationId: task.organizationId,
        },
        include: {
          socialAccount: { select: { id: true, platform: true, username: true, displayName: true } },
        },
      })
      createdPosts.push(post)
    }

    // Update task status to completed
    const now = new Date()
    await db.disseminationTask.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: now,
        postId: createdPosts.length > 0 ? createdPosts[0].id : null,
      },
    })

    // Update disseminator stats
    if (task.disseminator) {
      const newTotalCompleted = task.disseminator.totalTasksCompleted + 1
      const newTotalPublished = task.disseminator.totalPostsPublished + createdPosts.length

      // Calculate average completion hours
      let newAvgHours = task.disseminator.avgCompletionHours
      if (task.startedAt) {
        const hoursElapsed = (now.getTime() - task.startedAt.getTime()) / (1000 * 60 * 60)
        newAvgHours =
          (task.disseminator.avgCompletionHours * task.disseminator.totalTasksCompleted + hoursElapsed) /
          newTotalCompleted
      }

      // Calculate on-time rate
      let onTimeCount = Math.round(task.disseminator.onTimeRate * task.disseminator.totalTasksCompleted)
      if (task.dueDate && now <= task.dueDate) {
        onTimeCount += 1
      }
      const newOnTimeRate = newTotalCompleted > 0 ? onTimeCount / newTotalCompleted : 0

      await db.disseminator.update({
        where: { id: task.disseminator.id },
        data: {
          totalTasksCompleted: newTotalCompleted,
          totalPostsPublished: newTotalPublished,
          avgCompletionHours: Math.round(newAvgHours * 100) / 100,
          onTimeRate: Math.round(newOnTimeRate * 1000) / 1000,
        },
      })
    }

    return NextResponse.json({
      posts: createdPosts.map((p) => ({
        ...p,
        engagement: p.engagement ? JSON.parse(p.engagement) : null,
      })),
      taskId: id,
      publishedPlatforms: createdPosts.map((p) => p.platform),
    }, { status: 201 })
  } catch (error) {
    console.error('Dissemination Task Publish POST error:', error)
    return NextResponse.json({ error: 'Failed to publish dissemination task' }, { status: 500 })
  }
}
