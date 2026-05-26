import 'dotenv/config'
import { PrismaClient, OrderStatus, FeedbackValue } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Clean database
  await prisma.customerFeedback.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.admin.deleteMany()

  console.log('🧹 Cleaned existing database tables.')

  // 2. Create Admin
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Restaurant Manager',
      role: 'ADMIN',
    },
  })
  console.log(`👤 Created default admin: ${admin.username} (password: admin123)`)

  // 3. Create Categories
  const categoriesData = [
    { name: 'Starters' },
    { name: 'Main Course' },
    { name: 'Biryani' },
    { name: 'Desserts' },
    { name: 'Drinks' },
  ]

  const categories: Record<string, any> = {}
  for (const cat of categoriesData) {
    const createdCat = await prisma.menuCategory.create({
      data: cat,
    })
    categories[createdCat.name] = createdCat
    console.log(`📂 Created category: ${createdCat.name}`)
  }

  // 4. Create Menu Items
  const menuItemsData = [
    // Starters
    {
      name: 'Paneer Tikka',
      description: 'Cottage cheese cubes marinated in spices and grilled in tandoor.',
      price: 249.0,
      veg: true,
      availability: true,
      categoryName: 'Starters',
      image: '/uploads/paneer_tikka.jpg',
    },
    {
      name: 'Chicken 65',
      description: 'Spicy, deep-fried chicken cubes tempered with curry leaves and green chilies.',
      price: 289.0,
      veg: false,
      availability: true,
      categoryName: 'Starters',
      image: '/uploads/chicken_65.jpg',
    },
    {
      name: 'Crispy Corn',
      description: 'Deep fried corn kernels tossed with spices, onions, and bell peppers.',
      price: 199.0,
      veg: true,
      availability: true,
      categoryName: 'Starters',
      image: '/uploads/crispy_corn.jpg',
    },
    // Main Course
    {
      name: 'Butter Chicken',
      description: 'Tender tandoori chicken cooked in a rich, creamy tomato and butter gravy.',
      price: 349.0,
      veg: false,
      availability: true,
      categoryName: 'Main Course',
      image: '/uploads/butter_chicken.jpg',
    },
    {
      name: 'Kadai Paneer',
      description: 'Cottage cheese cooked in a spicy tomato-onion gravy with bell peppers.',
      price: 299.0,
      veg: true,
      availability: true,
      categoryName: 'Main Course',
      image: '/uploads/kadai_paneer.jpg',
    },
    {
      name: 'Dal Makhani',
      description: 'Black lentils slow cooked overnight with butter, cream, and spices.',
      price: 229.0,
      veg: true,
      availability: true,
      categoryName: 'Main Course',
      image: '/uploads/dal_makhani.jpg',
    },
    // Biryani
    {
      name: 'Hyderabadi Chicken Biryani',
      description: 'Basmati rice cooked on dum with marinated chicken, saffron, and aromatic spices.',
      price: 329.0,
      veg: false,
      availability: true,
      categoryName: 'Biryani',
      image: '/uploads/chicken_biryani.jpg',
    },
    {
      name: 'Special Paneer Biryani',
      description: 'Fragrant basmati rice layered with spiced cottage cheese cubes.',
      price: 279.0,
      veg: true,
      availability: true,
      categoryName: 'Biryani',
      image: '/uploads/paneer_biryani.jpg',
    },
    // Desserts
    {
      name: 'Gulab Jamun',
      description: 'Deep fried milk dumplings soaked in warm sugar syrup flavored with cardamom.',
      price: 99.0,
      veg: true,
      availability: true,
      categoryName: 'Desserts',
      image: '/uploads/gulab_jamun.jpg',
    },
    {
      name: 'Sizzling Brownie',
      description: 'Hot chocolate brownie served on a sizzler plate with vanilla ice cream and chocolate sauce.',
      price: 189.0,
      veg: true,
      availability: true,
      categoryName: 'Desserts',
      image: '/uploads/brownie.jpg',
    },
    // Drinks
    {
      name: 'Masala Shikanji',
      description: 'Traditional spiced lemonade refreshing drink cooked with roasted cumin.',
      price: 79.0,
      veg: true,
      availability: true,
      categoryName: 'Drinks',
      image: '/uploads/shikanji.jpg',
    },
    {
      name: 'Virgin Mojito',
      description: 'Refreshing carbonated mocktail with mint leaves, lime juice, and simple syrup.',
      price: 119.0,
      veg: true,
      availability: true,
      categoryName: 'Drinks',
      image: '/uploads/mojito.jpg',
    },
    {
      name: 'Creamy Mango Lassi',
      description: 'Traditional rich yogurt drink blended with sweet Alphonso mango pulp and cardamom.',
      price: 129.0,
      veg: true,
      availability: true,
      categoryName: 'Drinks',
      image: '/uploads/mojito.jpg',
    },
  ]

  const menuItems: Record<string, any> = {}
  for (const item of menuItemsData) {
    const { categoryName, ...rest } = item
    const menuItem = await prisma.menuItem.create({
      data: {
        ...rest,
        categoryId: categories[categoryName].id,
      },
    })
    menuItems[menuItem.name] = menuItem
    console.log(`🍔 Created menu item: ${menuItem.name} (${categoryName})`)
  }

  // 5. Create Mock Orders
  const order1 = await prisma.order.create({
    data: {
      tableNumber: '05',
      notes: 'Make it extra spicy, please.',
      status: OrderStatus.NEW,
      total: 638.0,
      items: {
        create: [
          { menuItemId: menuItems['Chicken 65'].id, quantity: 1, price: 289.0 },
          { menuItemId: menuItems['Butter Chicken'].id, quantity: 1, price: 349.0 },
        ],
      },
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  })

  const order2 = await prisma.order.create({
    data: {
      tableNumber: '12',
      notes: 'No ice in the mojito.',
      status: OrderStatus.PREPARING,
      total: 398.0,
      items: {
        create: [
          { menuItemId: menuItems['Crispy Corn'].id, quantity: 1, price: 199.0 },
          { menuItemId: menuItems['Special Paneer Biryani'].id, quantity: 1, price: 279.0 },
          { menuItemId: menuItems['Virgin Mojito'].id, quantity: 1, price: 119.0 },
        ],
      },
      createdAt: new Date(Date.now() - 18 * 60 * 1000),
    },
  })

  const order3 = await prisma.order.create({
    data: {
      tableNumber: '02',
      notes: 'Gulab jamun should be warm.',
      status: OrderStatus.READY,
      total: 348.0,
      items: {
        create: [
          { menuItemId: menuItems['Paneer Tikka'].id, quantity: 1, price: 249.0 },
          { menuItemId: menuItems['Gulab Jamun'].id, quantity: 1, price: 99.0 },
        ],
      },
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  })

  const order4 = await prisma.order.create({
    data: {
      tableNumber: '09',
      notes: '',
      status: OrderStatus.DELIVERED,
      total: 518.0,
      items: {
        create: [
          { menuItemId: menuItems['Hyderabadi Chicken Biryani'].id, quantity: 1, price: 329.0 },
          { menuItemId: menuItems['Sizzling Brownie'].id, quantity: 1, price: 189.0 },
        ],
      },
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  })

  console.log(`📝 Seeded 4 sample orders.`)

  // 6. Create Customer Feedback
  await prisma.customerFeedback.createMany({
    data: [
      { value: FeedbackValue.MUST_TRY, comment: 'Butter Chicken was absolutely legendary! Best tandoor flavor!', menuItemId: menuItems['Butter Chicken'].id, createdAt: new Date(Date.now() - 30 * 60 * 1000) },
      { value: FeedbackValue.VERY_TASTY, comment: 'Biryani rice was fragrant and the spices were perfect.', menuItemId: menuItems['Hyderabadi Chicken Biryani'].id, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { value: FeedbackValue.GOOD, comment: 'Paneer tikka was nice and soft. Enjoyed the green chutney.', menuItemId: menuItems['Paneer Tikka'].id, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { value: FeedbackValue.OK, comment: 'Virgin mojito had a bit too much sugar.', menuItemId: menuItems['Virgin Mojito'].id, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { value: FeedbackValue.MUST_TRY, comment: 'Sizzling brownie is a must have. Kids loved it!', menuItemId: menuItems['Sizzling Brownie'].id, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { value: FeedbackValue.VERY_TASTY, comment: 'Crispy corn is perfect for munching.', menuItemId: menuItems['Crispy Corn'].id, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) },
    ],
  })

  console.log(`⭐ Seeded customer feedback reviews.`)
  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
