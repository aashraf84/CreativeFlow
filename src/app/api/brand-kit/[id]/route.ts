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
    if (body.type !== undefined) updateData.type = body.type
    if (body.value !== undefined) updateData.value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value)
    if (body.clientId !== undefined) updateData.clientId = body.clientId

    const brandKit = await db.brandKit.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
    })

    return NextResponse.json({ brandKit })
  } catch (error) {
    console.error('BrandKit PUT error:', error)
    return NextResponse.json({ data: [] })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.brandKit.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Brand kit item deleted' })
  } catch (error) {
    console.error('BrandKit DELETE error:', error)
    return NextResponse.json({ data: [] })
  }
}
