import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Hardcode the Neon PostgreSQL URL so it NEVER depends on .env file
// which keeps getting reverted by git operations
const DATABASE_URL = "postgresql://neondb_owner:npg_9xpI3sXiwuVm@ep-raspy-voice-atuicub2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=5&pool_timeout=5"

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
