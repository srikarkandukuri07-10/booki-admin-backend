import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: Fetch all categories with their menu items
// Supports query param "?public=true" to return only available items for the customer app
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isPublic = searchParams.get('public') === 'true'

    const categories = await db.menuCategory.findMany({
      include: {
        items: {
          include: {
            feedbacks: {
              select: {
                value: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Hydrate each item with feedbackStats
    const categoriesHydrated = categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const feedbacks = item.feedbacks || []
        const total = feedbacks.length
        
        let feedbackStats = null
        if (total > 0) {
          const counts = { MUST_TRY: 0, VERY_TASTY: 0, GOOD: 0, OK: 0 }
          feedbacks.forEach((f) => {
            if (f.value in counts) {
              counts[f.value as keyof typeof counts]++
            }
          })
          
          let highestRating: keyof typeof counts = 'MUST_TRY'
          let highestCount = 0
          for (const key in counts) {
            const val = key as keyof typeof counts
            if (counts[val] > highestCount) {
              highestCount = counts[val]
              highestRating = val
            }
          }
          
          const percentage = Math.round((highestCount / total) * 100)
          feedbackStats = {
            rating: highestRating,
            percentage,
            totalCount: total
          }
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          veg: item.veg,
          availability: item.availability,
          categoryId: item.categoryId,
          feedbackStats
        }
      })
    }))

    return NextResponse.json({ success: true, categories: categoriesHydrated })
  } catch (error) {
    console.error('Fetch Menu API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

// POST: Create a new menu item (Admin only)
export async function POST(req: NextRequest) {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, image, price, veg, availability, categoryId } = body

    // Validate inputs
    if (!name || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: 'Name, price, and categoryId are required' },
        { status: 400 }
      )
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await db.menuCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Selected menu category does not exist' },
        { status: 404 }
      )
    }

    // Create item
    const menuItem = await db.menuItem.create({
      data: {
        name,
        description: description || '',
        image: image || null,
        price: parsedPrice,
        veg: veg !== undefined ? Boolean(veg) : true,
        availability: availability !== undefined ? Boolean(availability) : true,
        categoryId,
      },
    })

    if ((global as any).io) {
      (global as any).io.emit('menu-updated');
      console.log('📡 Broadcasted menu-updated socket notification from POST!');
    }

    return NextResponse.json({ success: true, data: menuItem }, { status: 201 })
  } catch (error) {
    console.error('Create Menu Item API error:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
