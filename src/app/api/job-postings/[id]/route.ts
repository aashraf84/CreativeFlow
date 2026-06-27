import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.jobPosting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.type !== undefined) updateData.type = body.type
    if (body.location !== undefined) updateData.location = body.location
    if (body.salary_min !== undefined) updateData.salary_min = body.salary_min
    if (body.salary_max !== undefined) updateData.salary_max = body.salary_max
    if (body.description !== undefined) updateData.description = body.description
    if (body.requirements !== undefined) updateData.requirements = body.requirements
    if (body.status !== undefined) updateData.status = body.status
    if (body.postedDate !== undefined) updateData.postedDate = body.postedDate ? new Date(body.postedDate) : null
    if (body.closingDate !== undefined) updateData.closingDate = body.closingDate ? new Date(body.closingDate) : null
    if (body.applicants !== undefined) updateData.applicants = body.applicants

    const jobPosting = await db.jobPosting.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      },
    })

    return NextResponse.json(jobPosting)
  } catch (error) {
    console.error('JobPosting PUT error:', error)
    return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.jobPosting.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Job posting deleted' })
  } catch (error) {
    console.error('JobPosting DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete job posting' }, { status: 500 })
  }
}
