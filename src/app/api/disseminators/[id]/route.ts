import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const disseminator = await db.disseminator.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
        assignedTasks: {
          where: { status: { in: ['pending', 'in_progress'] } },
          include: {
            content: { select: { id: true, title: true, type: true } },
            client: { select: { id: true, name: true, logo: true } },
            campaign: { select: { id: true, name: true, status: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    if (!disseminator) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const activeTaskCount = disseminator.assignedTasks.filter(
      (t) => t.status === 'in_progress'
    ).length
    const pendingTaskCount = disseminator.assignedTasks.filter(
      (t) => t.status === 'pending'
    ).length

    return NextResponse.json({
      disseminator: {
        ...disseminator,
        platforms: disseminator.platforms ? JSON.parse(disseminator.platforms) : [],
        assignedTasks: disseminator.assignedTasks.map((t) => ({
          ...t,
          targetPlatforms: t.targetPlatforms ? JSON.parse(t.targetPlatforms) : [],
          mediaUrls: t.mediaUrls ? JSON.parse(t.mediaUrls) : [],
        })),
        activeTaskCount,
        pendingTaskCount,
        currentLoad: activeTaskCount + pendingTaskCount,
      },
    })
  } catch (error) {
    console.error('Disseminator GET error:', error)
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

    const existing = await db.disseminator.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.teamId !== undefined) updateData.teamId = body.teamId || null
    if (body.speciality !== undefined) updateData.speciality = body.speciality
    if (body.platforms !== undefined) updateData.platforms = JSON.stringify(body.platforms)
    if (body.workloadCapacity !== undefined) updateData.workloadCapacity = body.workloadCapacity
    if (body.status !== undefined) updateData.status = body.status
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.totalTasksCompleted !== undefined) updateData.totalTasksCompleted = body.totalTasksCompleted
    if (body.totalPostsPublished !== undefined) updateData.totalPostsPublished = body.totalPostsPublished
    if (body.avgCompletionHours !== undefined) updateData.avgCompletionHours = body.avgCompletionHours
    if (body.onTimeRate !== undefined) updateData.onTimeRate = body.onTimeRate
    if (body.notes !== undefined) updateData.notes = body.notes

    const disseminator = await db.disseminator.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
      },
    })

    return NextResponse.json({
      disseminator: {
        ...disseminator,
        platforms: disseminator.platforms ? JSON.parse(disseminator.platforms) : [],
      },
    })
  } catch (error) {
    console.error('Disseminator PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.disseminator.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check for active tasks before deletion
    const activeTasks = await db.disseminationTask.count({
      where: {
        disseminatorId: id,
        status: { in: ['pending', 'in_progress'] },
      },
    })

    if (activeTasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete disseminator with active tasks. Reassign tasks first.' },
        { status: 400 }
      )
    }

    // Unassign completed/failed tasks before deleting
    await db.disseminationTask.updateMany({
      where: { disseminatorId: id },
      data: { disseminatorId: null },
    })

    await db.disseminator.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Disseminator deleted' })
  } catch (error) {
    console.error('Disseminator DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
