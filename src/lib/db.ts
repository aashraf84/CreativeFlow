import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DATABASE_URL = "postgresql://neondb_owner:npg_9xpI3sXiwuVm@ep-raspy-voice-atuicub2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15&pool_timeout=15&connection_limit=5"

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma
