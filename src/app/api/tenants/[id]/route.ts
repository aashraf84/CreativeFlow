import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TenantParams {
  params: Promise<{ id: string }>
}

// GET /api/tenants/[id] - Get a specific tenant by ID
export async function GET(_request: Request, { params }: TenantParams) {
  try {
    const { id } = await params

    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            maxUsers: true,
            maxAccounts: true,
            createdAt: true,
            _count: {
              select: {
                users: true,
                clients: true,
                campaigns: true,
                contents: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            organizations: true,
            users: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenant GET error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// PUT /api/tenants/[id] - Update a tenant
export async function PUT(request: Request, { params }: TenantParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.tenant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
      }
      updateData.name = body.name.trim()
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || !body.slug.trim()) {
        return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
      }
      // Check slug uniqueness (excluding current tenant)
      const slugOwner = await db.tenant.findUnique({ where: { slug: body.slug.trim() } })
      if (slugOwner && slugOwner.id !== id) {
        return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
      }
      updateData.slug = body.slug.trim()
    }

    if (body.plan !== undefined) {
      const validPlans = ['starter', 'professional', 'enterprise']
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
      }
      updateData.plan = body.plan
    }

    if (body.status !== undefined) {
      const validStatuses = ['active', 'suspended', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
      }
      updateData.status = body.status
    }

    if (body.domain !== undefined) {
      updateData.domain = body.domain ? String(body.domain).trim() : null
    }

    if (body.settings !== undefined) {
      updateData.settings =
        body.settings === null
          ? null
          : typeof body.settings === 'string'
            ? body.settings
            : JSON.stringify(body.settings)
    }

    const tenant = await db.tenant.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            organizations: true,
            users: true,
          },
        },
      },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Tenant PUT error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

// DELETE /api/tenants/[id] - Delete a tenant (with all its data, cascade)
export async function DELETE(_request: Request, { params }: TenantParams) {
  try {
    const { id } = await params

    const existing = await db.tenant.findUnique({
      where: { id },
      include: {
        organizations: { select: { id: true } },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Cascade delete: remove all data belonging to the tenant's organizations,
    // then the organizations, then the users, then the tenant itself.
    // We use transaction so a partial failure rolls back everything.
    await db.$transaction(async (tx) => {
      const orgIds = existing.organizations.map((o) => o.id)

      if (orgIds.length > 0) {
        // Delete all org-scoped data in the correct foreign-key order
        await tx.journalEntryLine.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.journalEntry.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.invoiceItem.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.communicationMessage.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.conversation.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.communicationTemplate.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.communicationContact.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.brandKit.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.influencer.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.inboxMessage.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.notification.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.asset.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.timeEntry.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.invoice.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.approval.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.activityLog.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.comment.deleteMany({
          where: { content: { organizationId: { in: orgIds } } },
        })
        await tx.disseminationTask.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.disseminator.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.post.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.automationRule.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.socialAccount.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.content.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.campaign.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.client.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.teamMember.deleteMany({
          where: { team: { organizationId: { in: orgIds } } },
        })
        await tx.team.deleteMany({ where: { organizationId: { in: orgIds } } })

        // HR module (no organizationId on some, but employee/department/etc. do)
        await tx.payrollItem.deleteMany({
          where: { employee: { organizationId: { in: orgIds } } },
        })
        await tx.payrollRun.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.leaveRequest.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.employee.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.jobPosting.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.department.deleteMany({ where: { organizationId: { in: orgIds } } })

        // Finance / inventory
        await tx.expense.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.taxRate.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrder: { organizationId: { in: orgIds } } },
        })
        await tx.purchaseOrder.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.vendor.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.stockMovement.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.stockLevel.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.warehouse.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.product.deleteMany({ where: { organizationId: { in: orgIds } } })

        // IT assets
        await tx.assetIssuance.deleteMany({ where: { organizationId: { in: orgIds } } })
        await tx.iTAsset.deleteMany({ where: { organizationId: { in: orgIds } } })

        // Accounts / journal
        await tx.account.deleteMany({ where: { organizationId: { in: orgIds } } })

        // Delete users belonging to these orgs
        await tx.user.deleteMany({ where: { organizationId: { in: orgIds } } })

        // Finally, delete the organizations themselves
        await tx.organization.deleteMany({ where: { id: { in: orgIds } } })
      } else {
        // Even if no organizations, still delete users linked to this tenant
        await tx.user.deleteMany({ where: { tenantId: id } })
      }

      // Finally, delete the tenant
      await tx.tenant.delete({ where: { id } })
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant and all associated data deleted',
    })
  } catch (error) {
    console.error('Tenant DELETE error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
