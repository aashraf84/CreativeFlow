import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/departments/[id]
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.headId !== undefined) updateData.headId = body.headId || null
    if (body.color !== undefined) updateData.color = body.color

    const dept = await db.department.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: dept })
  } catch (error) {
    console.error('Department PUT error:', error)
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
  }
}

// DELETE /api/departments/[id]
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params

    // Check if department has employees
    const empCount = await db.employee.count({ where: { departmentId: id } })
    if (empCount > 0) {
      return NextResponse.json({
        error: `Cannot delete department with ${empCount} employee(s). Please reassign employees first.`
      }, { status: 400 })
    }

    await db.department.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Department DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
  }
}
