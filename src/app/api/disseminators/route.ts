import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const teamId = searchParams.get('teamId')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status
    if (teamId) where.teamId = teamId

    const disseminators = await db.disseminator.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        team: { select: { id: true, name: true, type: true, color: true } },
        assignedTasks: {
          where: { status: { in: ['pending', 'in_progress'] } },
          select: { id: true, status: true, priority: true, dueDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const disseminatorsWithStats = disseminators.map((d) => {
      const activeTasks = d.assignedTasks.filter((t) => t.status === 'in_progress').length
      const pendingTasks = d.assignedTasks.filter((t) => t.status === 'pending').length
      return {
        ...d,
        platforms: d.platforms ? JSON.parse(d.platforms) : [],
        activeTaskCount: activeTasks,
        pendingTaskCount: pendingTasks,
        currentLoad: activeTasks + pendingTasks,
      }
    })

    return NextResponse.json({ disseminators: disseminatorsWithStats })
  } catch (error) {
    console.error('Disseminators GET error:', error)
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

    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if user already has a disseminator profile
    const existing = await db.disseminator.findUnique({
      where: { userId: body.userId },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This user already has a disseminator profile' },
        { status: 409 }
      )
    }

    const disseminator = await db.disseminator.create({
      data: {
        userId: body.userId,
        teamId: body.teamId || null,
        speciality: body.speciality || null,
        platforms: body.platforms ? JSON.stringify(body.platforms) : null,
        workloadCapacity: body.workloadCapacity ?? 10,
        status: body.status || 'active',
        notes: body.notes || null,
        organizationId: org.id,
      },
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
    }, { status: 201 })
  } catch (error) {
    console.error('Disseminators POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
