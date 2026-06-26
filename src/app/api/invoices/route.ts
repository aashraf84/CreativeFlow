import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = { organizationId: org.id }
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()
    const invoice = await db.invoice.create({
      data: {
        number: body.number,
        clientId: body.clientId,
        campaignId: body.campaignId || null,
        status: body.status || 'draft',
        items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        total: body.total || 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        notes: body.notes || null,
        organizationId: org.id,
      },
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
