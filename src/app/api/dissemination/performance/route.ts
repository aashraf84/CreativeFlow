import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Overall stats
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      failedTasks,
      overdueTasks,
    ] = await Promise.all([
      db.disseminationTask.count({ where: { organizationId: org.id } }),
      db.disseminationTask.count({ where: { organizationId: org.id, status: 'completed' } }),
      db.disseminationTask.count({ where: { organizationId: org.id, status: 'pending' } }),
      db.disseminationTask.count({ where: { organizationId: org.id, status: 'in_progress' } }),
      db.disseminationTask.count({ where: { organizationId: org.id, status: 'failed' } }),
      db.disseminationTask.count({ where: { organizationId: org.id, status: 'overdue' } }),
    ])

    // Performance by disseminator
    const disseminators = await db.disseminator.findMany({
      where: { organizationId: org.id, status: 'active' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        assignedTasks: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            dueDate: true,
            startedAt: true,
            createdAt: true,
          },
        },
      },
    })

    // Calculate overall on-time rate and avg completion hours from disseminator data
    let totalCompletedOnTime = 0
    let totalCompleted = 0
    let totalAvgHours = 0
    let dissWithHours = 0

    const byDisseminator = disseminators.map((d) => {
      const total = d.assignedTasks.length
      const completed = d.assignedTasks.filter((t) => t.status === 'completed').length
      const completionRate = total > 0 ? completed / total : 0

      // On-time rate: completed tasks where completedAt <= dueDate
      const completedOnTime = d.assignedTasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.dueDate && t.completedAt <= t.dueDate
      ).length
      const onTimeRate = completed > 0 ? completedOnTime / completed : 0

      // Average completion hours for completed tasks
      const completedWithStart = d.assignedTasks.filter(
        (t) => t.status === 'completed' && t.startedAt && t.completedAt
      )
      const avgHours =
        completedWithStart.length > 0
          ? completedWithStart.reduce((sum, t) => {
              const hours = (t.completedAt!.getTime() - t.startedAt!.getTime()) / (1000 * 60 * 60)
              return sum + hours
            }, 0) / completedWithStart.length
          : 0

      // Accumulate for overall stats
      totalCompletedOnTime += completedOnTime
      totalCompleted += completed
      if (completedWithStart.length > 0) {
        totalAvgHours += avgHours
        dissWithHours++
      }

      return {
        id: d.id,
        name: d.user.name,
        tasks: total,
        completed,
        onTimeRate: Math.round(onTimeRate * 1000) / 1000,
        avgHours: Math.round(avgHours * 100) / 100,
        rating: d.rating ?? 0,
      }
    })

    // Calculate overall on-time rate
    const overallOnTimeRate = totalCompleted > 0 ? Math.round((totalCompletedOnTime / totalCompleted) * 1000) / 1000 : 0
    // Calculate overall avg completion hours
    const overallAvgCompletionHours = dissWithHours > 0 ? Math.round((totalAvgHours / dissWithHours) * 100) / 100 : 0

    // Total published posts
    const totalPublished = await db.post.count({
      where: { organizationId: org.id, status: 'published' },
    })

    // Platform breakdown: parse targetPlatforms from all tasks
    const allTasks = await db.disseminationTask.findMany({
      where: { organizationId: org.id },
      select: { targetPlatforms: true, status: true },
    })

    const platformStats: Record<string, { tasks: number; completed: number }> = {}
    for (const task of allTasks) {
      if (task.targetPlatforms) {
        try {
          const platforms: string[] = JSON.parse(task.targetPlatforms)
          for (const p of platforms) {
            if (!platformStats[p]) {
              platformStats[p] = { tasks: 0, completed: 0 }
            }
            platformStats[p].tasks++
            if (task.status === 'completed') {
              platformStats[p].completed++
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    const byPlatform = Object.entries(platformStats).map(([platform, stats]) => ({
      platform,
      tasks: stats.tasks,
      completed: stats.completed,
      completionRate: stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 1000) / 1000 : 0,
    }))

    // Weekly trend: tasks created and completed per day this week
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)

    const [createdThisWeek, completedThisWeek] = await Promise.all([
      db.disseminationTask.findMany({
        where: {
          organizationId: org.id,
          createdAt: { gte: startOfWeek },
        },
        select: { createdAt: true },
      }),
      db.disseminationTask.findMany({
        where: {
          organizationId: org.id,
          status: 'completed',
          completedAt: { gte: startOfWeek },
        },
        select: { completedAt: true },
      }),
    ])

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyTrend: { week: string; tasks: number; completed: number }[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      const key = dayNames[day.getDay()]
      weeklyTrend.push({ week: key, tasks: 0, completed: 0 })
    }

    for (const task of createdThisWeek) {
      if (task.createdAt) {
        const dayName = dayNames[task.createdAt.getDay()]
        const entry = weeklyTrend.find((w) => w.week === dayName)
        if (entry) entry.tasks++
      }
    }

    for (const task of completedThisWeek) {
      if (task.completedAt) {
        const dayName = dayNames[task.completedAt.getDay()]
        const entry = weeklyTrend.find((w) => w.week === dayName)
        if (entry) entry.completed++
      }
    }

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 1000 : 0,
        onTimeRate: overallOnTimeRate,
        avgCompletionHours: overallAvgCompletionHours,
        totalPublished,
      },
      byDisseminator,
      byPlatform,
      weeklyTrend,
    })
  } catch (error) {
    console.error('Dissemination Performance GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
