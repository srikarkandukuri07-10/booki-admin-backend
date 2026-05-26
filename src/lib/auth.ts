import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'booki_restaurant_secret_key_2026'
const COOKIE_NAME = 'admin_session'

export interface AdminPayload {
  id: string
  username: string
  name: string
  role: string
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch (error) {
    return null
  }
}

// Retrieves and validates session from cookies (works in Next.js Server Components and API Routes)
export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)
    
    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    return verifyToken(sessionCookie.value)
  } catch (error) {
    console.error('Error fetching admin session:', error)
    return null
  }
}

// Sets the http-only session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day in seconds
    path: '/',
  })
}

// Clears the session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
