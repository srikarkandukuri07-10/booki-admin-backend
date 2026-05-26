import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

let prismaInstance: PrismaClient | null = null

// Thread-safe runtime singleton instantiation using PostgreSQL driver adapter (Prisma 7 standard)
function getPrismaInstance(): PrismaClient {
  if (typeof window !== 'undefined') {
    throw new Error('Prisma Client cannot be instantiated on the client side.')
  }

  if (process.env.NODE_ENV === 'production') {
    if (!prismaInstance) {
      const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
      const adapter = new PrismaPg(pool)
      prismaInstance = new PrismaClient({ adapter })
    }
    return prismaInstance
  }

  // Preserve singleton across hot reloads in development
  const globalVar = globalThis as any
  if (!globalVar.prismaGlobal) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    globalVar.prismaGlobal = new PrismaClient({ adapter })
  }
  return globalVar.prismaGlobal
}

// Airtight ES6 Proxy for lazy-loaded instantiation
const db = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrismaInstance()
    const value = Reflect.get(instance, prop)
    
    // Correctly bind database methods to the active Prisma instance context
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})

export default db
