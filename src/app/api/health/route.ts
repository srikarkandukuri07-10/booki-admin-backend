import { NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/health — Quick check that the server and database are working
export async function GET() {
  const checks: Record<string, string> = {
    server: 'ok',
    database: 'unknown',
    env_DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
    env_JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING (using fallback)',
  }

  try {
    // Try a simple database query
    const adminCount = await db.admin.count()
    checks.database = 'connected'
    checks.adminUsers = String(adminCount)

    if (adminCount === 0) {
      checks.warning = 'No admin users found! Visit /api/seed to create the default admin.'
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    checks.database = 'FAILED'
    checks.databaseError = message
  }

  const allOk = checks.database === 'connected' && checks.env_DATABASE_URL === 'set'

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'unhealthy', checks },
    { status: allOk ? 200 : 503 }
  )
}
