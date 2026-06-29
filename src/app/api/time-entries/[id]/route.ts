import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.description !== undefined) updateData.description = body.description
    if (body.hours !== undefined) updateData.hours = body.hours
    if (body.billable !== undefined) updateData.billable = body.billable
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.clientId !== undefined) updateData.clientId = body.clientId
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId
    if (body.contentId !== undefined) updateData.contentId = body.contentId

    const timeEntry = await db.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error('TimeEntry PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.timeEntry.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Time entry deleted' })
  } catch (error) {
    console.error('TimeEntry DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
