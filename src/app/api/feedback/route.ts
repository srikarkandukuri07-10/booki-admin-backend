import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OPTIONS: Preflight CORS request handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

// GET: Fetch aggregated feedback analytics and text reviews (Admin only)
export async function GET() {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get total feedback count
    const totalCount = await db.customerFeedback.count()

    // 2. Get counts by rating value
    const ratingGroups = await db.customerFeedback.groupBy({
      by: ['value'],
      _count: {
        id: true,
      },
    })

    // Prepare percentages structure
    const initialCounts = {
      MUST_TRY: 0,
      VERY_TASTY: 0,
      GOOD: 0,
      OK: 0,
    }
    
    ratingGroups.forEach((group) => {
      if (group.value in initialCounts) {
        initialCounts[group.value as keyof typeof initialCounts] = group._count.id
      }
    })

    const percentages = {
      MUST_TRY: totalCount > 0 ? Math.round((initialCounts.MUST_TRY / totalCount) * 100) : 0,
      VERY_TASTY: totalCount > 0 ? Math.round((initialCounts.VERY_TASTY / totalCount) * 100) : 0,
      GOOD: totalCount > 0 ? Math.round((initialCounts.GOOD / totalCount) * 100) : 0,
      OK: totalCount > 0 ? Math.round((initialCounts.OK / totalCount) * 100) : 0,
    }

    // 3. Get recent detailed feedback reviews
    const recentFeedback = await db.customerFeedback.findMany({
      include: {
        menuItem: {
          select: {
            name: true,
            category: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // 4. Get most popular items based on positive feedback (MUST_TRY or VERY_TASTY)
    const positiveFeedbackGroups = await db.customerFeedback.groupBy({
      by: ['menuItemId'],
      where: {
        value: { in: ['MUST_TRY', 'VERY_TASTY'] },
        menuItemId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    const popularItemIds = positiveFeedbackGroups
      .map((group) => group.menuItemId)
      .filter((id): id is string => id !== null)

    const popularMenuItems = await db.menuItem.findMany({
      where: {
        id: { in: popularItemIds },
      },
      include: {
        category: true,
      },
    })

    // Combine menu items with their positive feedback count
    const popularItemsHydrated = positiveFeedbackGroups
      .map((group) => {
        const itemDetails = popularMenuItems.find((item) => item.id === group.menuItemId)
        if (!itemDetails) return null
        return {
          id: itemDetails.id,
          name: itemDetails.name,
          categoryName: itemDetails.category.name,
          price: itemDetails.price,
          veg: itemDetails.veg,
          image: itemDetails.image,
          positiveCount: group._count.id,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        ratingCounts: initialCounts,
        percentages,
        recentFeedback,
        popularItems: popularItemsHydrated,
      },
    })
  } catch (error) {
    console.error('Feedback Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate feedback analytics' },
      { status: 500 }
    )
  }
}

// POST: Submit a new customer review (Public Customer App Integration)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { value, comment, menuItemId, menuItemName } = body // value matches MUST_TRY, VERY_TASTY, GOOD, OK

    if (!value) {
      return NextResponse.json({ error: 'Feedback rating value is required' }, { status: 400, headers: CORS_HEADERS })
    }

    // Format value string to Prisma Enum representation
    // Map human readable values to database enum format
    let enumValue: any = null
    const valUpper = value.toString().toUpperCase().replace(/\s+/g, '_')
    
    if (valUpper === 'MUST_TRY' || value === 'Must Try') enumValue = 'MUST_TRY'
    else if (valUpper === 'VERY_TASTY' || value === 'Very Tasty') enumValue = 'VERY_TASTY'
    else if (valUpper === 'GOOD') enumValue = 'GOOD'
    else if (valUpper === 'OK') enumValue = 'OK'

    if (!enumValue) {
      return NextResponse.json(
        { error: 'Invalid feedback value. Must be one of: "Must Try", "Very Tasty", "Good", "OK"' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Resolve active database menu item ID
    let resolvedItemId: string | null = null

    if (menuItemId) {
      // 1. Try fetching by ID directly
      let item = null
      
      // Basic UUID structure validation to prevent Prisma crashes on static IDs (e.g. "start_01")
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(menuItemId)
      if (isUuid) {
        item = await db.menuItem.findUnique({
          where: { id: menuItemId },
        })
      }

      // 2. Fallback: Query by case-insensitive name if ID match failed
      if (!item && menuItemName) {
        item = await db.menuItem.findFirst({
          where: {
            name: {
              equals: menuItemName.trim(),
              mode: 'insensitive',
            },
          },
        })
      }

      if (!item) {
        return NextResponse.json({ error: 'Linked menu item not found' }, { status: 404, headers: CORS_HEADERS })
      }
      
      resolvedItemId = item.id // Ensure we bind the feedback to the correct database UUID!
    }

    // Save feedback
    const feedback = await db.customerFeedback.create({
      data: {
        value: enumValue,
        comment: comment || '',
        menuItemId: resolvedItemId,
      },
    })

    return NextResponse.json({ success: true, data: feedback }, { status: 201, headers: CORS_HEADERS })
  } catch (error) {
    console.error('Submit Feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
