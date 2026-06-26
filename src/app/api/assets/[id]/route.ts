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
    if (body.url !== undefined) updateData.url = body.url
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl
    if (body.size !== undefined) updateData.size = body.size
    if (body.mimeType !== undefined) updateData.mimeType = body.mimeType
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.folder !== undefined) updateData.folder = body.folder
    if (body.metadata !== undefined) updateData.metadata = typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata)
    if (body.clientId !== undefined) updateData.clientId = body.clientId

    const asset = await db.asset.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        client: { select: { id: true, name: true, logo: true, industry: true, status: true } },
      },
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Asset PUT error:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.asset.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Asset deleted' })
  } catch (error) {
    console.error('Asset DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
