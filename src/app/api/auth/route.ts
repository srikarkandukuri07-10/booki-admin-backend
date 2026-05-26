import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { signToken, setSessionCookie, clearSessionCookie, getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch current logged-in admin session
export async function GET() {
  const session = await getAdminSession()
  
  if (!session) {
    return NextResponse.json(
      { authenticated: false, error: 'Not authenticated' },
      { status: 401 }
    )
  }

  return NextResponse.json({ authenticated: true, admin: session })
}

// POST: Admin authentication login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Query database for admin
    const admin = await db.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Sign JWT token
    const payload = {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    }
    const token = signToken(payload)

    // Save session in HTTP-Only cookie
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
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Admin logout
export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
