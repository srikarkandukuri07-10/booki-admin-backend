import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signToken, setSessionCookie, clearSessionCookie, getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch current logged-in admin session
export async function GET() {
  try {
    const session = await getAdminSession()

    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ authenticated: true, admin: session })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Auth GET error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Session check failed', details: message },
      { status: 500 }
    )
  }
}

// POST: Admin authentication login
export async function POST(req: NextRequest) {
  try {
    // 1. Validate DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('FATAL: DATABASE_URL environment variable is not set!')
      return NextResponse.json(
        { error: 'Server configuration error: DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // 2. Query database for admin
    let admin
    try {
      admin = await db.admin.findUnique({
        where: { username },
      })
    } catch (dbError: unknown) {
      const dbMessage = dbError instanceof Error ? dbError.message : String(dbError)
      console.error('Database query failed:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed. Check DATABASE_URL and ensure tables exist (run prisma db push).', details: dbMessage },
        { status: 500 }
      )
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // 3. Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // 4. Sign JWT token
    const payload = {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    }
    const token = signToken(payload)

    // 5. Save session in HTTP-Only cookie
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: message },
      { status: 500 }
    )
  }
}

// DELETE: Admin logout
export async function DELETE() {
  try {
    await clearSessionCookie()
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed', details: message },
      { status: 500 }
    )
  }
}
