import { db } from '@/lib/db'

// Get or create the default tenant (for single-tenant mode / backward compatibility)
export async function getDefaultTenant() {
  let tenant = await db.tenant.findFirst({ where: { slug: 'default' } })
  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        name: 'Default Tenant',
        slug: 'default',
        plan: 'professional',
        status: 'active',
      },
    })
  }
  return tenant
}

// Get tenant by ID
export async function getTenantById(id: string) {
  return db.tenant.findUnique({ where: { id } })
}

// Get tenant by slug
export async function getTenantBySlug(slug: string) {
  return db.tenant.findUnique({ where: { slug } })
}

// Get the current organization (with tenant)
export async function getCurrentOrg() {
  const tenant = await getDefaultTenant()
  const org = await db.organization.findFirst({
    where: { tenantId: tenant.id },
  })
  if (!org) {
    // Create org for this tenant if it doesn't exist
    return db.organization.create({
      data: {
        name: 'CreativeFlow Digital',
        slug: 'creativeflow-digital',
        plan: 'professional',
        tenantId: tenant.id,
      },
    })
  }
  return org
}
