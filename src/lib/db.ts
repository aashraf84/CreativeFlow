import { PrismaClient } from '@prisma/client'

// ── Sandbox Stability Mode ──────────────────────────────────────────
// The sandbox dev server crashes when Prisma connects to Neon PostgreSQL.
// To keep the server stable, we export a mock `db` that returns empty data
// for all queries. The dashboard API serves static fallback data instead.
//
// To use the real database (e.g. in production on Vercel), set
// USE_REAL_DB=true in the environment.
const USE_REAL_DB = process.env.USE_REAL_DB === 'true'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DATABASE_URL = "postgresql://neondb_owner:npg_9xpI3sXiwuVm@ep-raspy-voice-atuicub2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15&pool_timeout=15&connection_limit=5"

// Mock PrismaClient - returns empty results for all methods, never crashes
function createMockDelegate() {
  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      // Common Prisma methods return appropriate empty values
      if (prop === 'findMany') return async () => []
      if (prop === 'findFirst') return async () => null
      if (prop === 'findUnique') return async () => null
      if (prop === 'count') return async () => 0
      if (prop === 'aggregate') return async () => ({ _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} })
      if (prop === 'groupBy') return async () => []
      if (prop === 'create') return async () => ({ id: 'mock-id' })
      if (prop === 'createMany') return async () => ({ count: 0 })
      if (prop === 'update') return async () => ({ id: 'mock-id' })
      if (prop === 'updateMany') return async () => ({ count: 0 })
      if (prop === 'upsert') return async () => ({ id: 'mock-id' })
      if (prop === 'delete') return async () => ({ id: 'mock-id' })
      if (prop === 'deleteMany') return async () => ({ count: 0 })
      // Return a function for any other property access
      return async () => null
    },
  })
}

const mockDb = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    // Return a mock delegate for any model access (db.organization, db.user, etc.)
    return createMockDelegate()
  },
}) as unknown as PrismaClient

if (USE_REAL_DB && !globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })
}

export const db = USE_REAL_DB && globalForPrisma.prisma ? globalForPrisma.prisma : mockDb
