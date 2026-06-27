import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status) where.status = status

    const jobPostings = await db.jobPosting.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: jobPostings })
  } catch (error) {
    console.error('JobPostings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const jobPosting = await db.jobPosting.create({
      data: {
        title: body.title,
        departmentId: body.departmentId,
        type: body.type || 'full-time',
        location: body.location || null,
        salary_min: body.salary_min || null,
        salary_max: body.salary_max || null,
        description: body.description,
        requirements: body.requirements || null,
        status: body.status || 'open',
        postedDate: body.postedDate ? new Date(body.postedDate) : null,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        applicants: body.applicants || 0,
        organizationId: org.id,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(jobPosting, { status: 201 })
  } catch (error) {
    console.error('JobPostings POST error:', error)
    return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 })
  }
}
