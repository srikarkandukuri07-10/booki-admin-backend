import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as bcrypt from 'bcryptjs'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // Check if an admin already exists
    const existing = await prisma.admin.findFirst()
    if (existing) {
      console.log('Admin user already exists, skipping seed.')
      return
    }

    const password = 'admin123'
    const hashed = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashed,
        name: 'Super Admin',
        role: 'ADMIN',
      },
    })

    console.log('✅ Default admin created:')
    console.log(`  username: ${admin.username}`)
    console.log(`  password: ${password}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
