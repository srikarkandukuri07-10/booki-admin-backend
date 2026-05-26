import { NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/seed — Creates the default admin user if none exists
// Visit this URL once after deployment to set up the admin account
export async function GET() {
  try {
    // Check if any admin already exists
    const existingAdmin = await db.admin.findFirst()

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists. No action taken.',
        admin: {
          username: existingAdmin.username,
          name: existingAdmin.name,
        },
      })
    }

    // Create default admin
    const defaultPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    await db.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: '✅ Default admin created successfully!',
      credentials: {
        username: 'admin',
        password: defaultPassword,
      },
      note: 'IMPORTANT: Change the password after your first login!',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Seed API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed admin user',
        details: message,
      },
      { status: 500 }
    )
  }
}
