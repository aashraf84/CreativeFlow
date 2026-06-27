import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const taxRates = await db.taxRate.findMany({
      where: { organizationId: org.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: taxRates })
  } catch (error) {
    console.error('TaxRates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tax rates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const taxRate = await db.taxRate.create({
      data: {
        name: body.name,
        rate: body.rate,
        type: body.type,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: org.id,
      },
    })

    return NextResponse.json(taxRate, { status: 201 })
  } catch (error) {
    console.error('TaxRates POST error:', error)
    return NextResponse.json({ error: 'Failed to create tax rate' }, { status: 500 })
  }
}
