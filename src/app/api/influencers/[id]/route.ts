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
    if (body.name !== undefined) updateData.name = body.name
    if (body.username !== undefined) updateData.username = body.username
    if (body.platform !== undefined) updateData.platform = body.platform
    if (body.followers !== undefined) updateData.followers = body.followers
    if (body.engagementRate !== undefined) updateData.engagementRate = body.engagementRate
    if (body.niche !== undefined) updateData.niche = body.niche
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status
    if (body.rate !== undefined) updateData.rate = body.rate
    if (body.contractStart !== undefined) updateData.contractStart = body.contractStart ? new Date(body.contractStart) : null
    if (body.contractEnd !== undefined) updateData.contractEnd = body.contractEnd ? new Date(body.contractEnd) : null
    if (body.clientId !== undefined) updateData.clientId = body.clientId
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId

    const influencer = await db.influencer.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ influencer })
  } catch (error) {
    console.error('Influencer PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.influencer.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Influencer deleted' })
  } catch (error) {
    console.error('Influencer DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
