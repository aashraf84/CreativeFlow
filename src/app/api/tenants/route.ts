import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tenants - List all tenants
export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            organizations: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Tenants GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, plan, status, domain, settings } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }

    // Validate slug uniqueness
    const existingSlug = await db.tenant.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }

    // Validate plan
    const validPlans = ['starter', 'professional', 'enterprise']
    const finalPlan = validPlans.includes(plan) ? plan : 'starter'

    // Validate status
    const validStatuses = ['active', 'suspended', 'cancelled']
    const finalStatus = validStatuses.includes(status) ? status : 'active'

    const tenant = await db.tenant.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        plan: finalPlan,
        status: finalStatus,
        domain: domain ? String(domain).trim() : null,
        settings: settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null,
      },
      include: {
        _count: {
          select: {
            organizations: true,
            users: true,
          },
        },
      },
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
