import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const rules = await db.automationRule.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON strings for convenience
    const parsedRules = rules.map((rule) => ({
      ...rule,
      conditions: rule.conditions ? JSON.parse(rule.conditions) : null,
      actions: rule.actions ? JSON.parse(rule.actions) : null,
    }))

    return NextResponse.json(parsedRules)
  } catch (error) {
    console.error('Automation GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (!body.name || !body.trigger) {
      return NextResponse.json(
        { error: 'Name and trigger are required' },
        { status: 400 }
      )
    }

    const rule = await db.automationRule.create({
      data: {
        name: body.name,
        description: body.description || null,
        trigger: body.trigger,
        conditions: body.conditions ? JSON.stringify(body.conditions) : '{}',
        actions: body.actions ? JSON.stringify(body.actions) : '{}',
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
    })

    return NextResponse.json({
      ...rule,
      conditions: rule.conditions ? JSON.parse(rule.conditions) : null,
      actions: rule.actions ? JSON.parse(rule.actions) : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Automation POST error:', error)
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 })
  }
}
