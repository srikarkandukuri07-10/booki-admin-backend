import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function clearMenu() {
  console.log('🗑️  Starting menu cleanup...')

  // Delete in correct order (respect foreign key constraints)
  const fb = await prisma.customerFeedback.deleteMany()
  console.log(`  ✓ Deleted ${fb.count} customer feedback entries`)

  const oi = await prisma.orderItem.deleteMany()
  console.log(`  ✓ Deleted ${oi.count} order items`)

  const ord = await prisma.order.deleteMany()
  console.log(`  ✓ Deleted ${ord.count} orders`)

  const mi = await prisma.menuItem.deleteMany()
  console.log(`  ✓ Deleted ${mi.count} menu items`)

  const mc = await prisma.menuCategory.deleteMany()
  console.log(`  ✓ Deleted ${mc.count} menu categories`)

  console.log('\n✅ Database is now clean! Admin account is still intact.')
  console.log('   Ready for real menu data.')
}

clearMenu()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
