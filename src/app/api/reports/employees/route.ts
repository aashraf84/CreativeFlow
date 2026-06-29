import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/reports/employees
 *
 * Returns the full employee directory formatted for report rendering.
 * Includes summary breakdowns by status, department, and employment type.
 */
export async function GET() {
  try {
    const org = await db.organization.findFirst()
    if (!org) {
      return NextResponse.json({ data: [] })
    }

    const employees = await db.employee.findMany({
      where: { organizationId: org.id },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    const byStatus: Record<string, number> = {}
    const byDepartment: Record<string, number> = {}
    const byEmploymentType: Record<string, number> = {}

    const mapped = employees.map((e) => {
      const status = e.status || 'active'
      const dept = e.department?.name || 'Unassigned'
      const type = e.employmentType || 'full-time'

      byStatus[status] = (byStatus[status] || 0) + 1
      byDepartment[dept] = (byDepartment[dept] || 0) + 1
      byEmploymentType[type] = (byEmploymentType[type] || 0) + 1

      return {
        employeeId: e.employeeId,
        fullName: `${e.firstName} ${e.lastName}`.trim(),
        email: e.email,
        phone: e.phone,
        position: e.position,
        department: dept,
        employmentType: type,
        status,
        hireDate: e.hireDate.toISOString(),
      }
    })

    return NextResponse.json({
      data: {
        employees: mapped,
        total: mapped.length,
        byStatus,
        byDepartment,
        byEmploymentType,
      },
    })
  } catch (error) {
    console.error('Reports/Employees GET error:', error)
    return NextResponse.json({ data: [] })
  }
}
