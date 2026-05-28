import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Reusable CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OPTIONS: Preflight CORS request handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

// GET: Fetch all active orders (Admin only)
export async function GET(req: NextRequest) {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // Optional filter by status

    const orders = await db.order.findMany({
      where: statusFilter ? { status: statusFilter as any } : undefined,
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, orders }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Fetch Orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// POST: Create a new order (Public Customer App Integration with Payload Resolution & CORS)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Support both "tableNumber" (internal schema) and "table" (expected external payload)
    const rawTable = body.table !== undefined ? body.table : body.tableNumber
    const { items } = body // items = Array of { name: string, quantity: number, note?: string }

    // 1. Payload validation
    if (rawTable === undefined || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Table identifier and order items list are required.' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const tableNumber = rawTable.toString()

    // 2. Resolve items by name and check availability
    const resolvedItems: Array<{
      menuItemId: string
      quantity: number
      price: number
      note: string | null
    }> = []
    let calculatedTotal = 0

    for (const item of items) {
      if (!item.name || !item.quantity) {
        return NextResponse.json(
          { error: 'Each order item must specify a "name" and "quantity".' },
          { status: 400, headers: CORS_HEADERS }
        )
      }

      // Query MenuItem by Name (case-insensitive exact match)
      let dbMenuItem = await db.menuItem.findFirst({
        where: {
          name: {
            equals: item.name.trim(),
            mode: 'insensitive',
          },
        },
        include: {
          category: true,
        },
      })

      // Fallback 1: Try case-insensitive contains match (e.g. "Chicken Biryani" matching "Hyderabadi Chicken Biryani")
      if (!dbMenuItem) {
        dbMenuItem = await db.menuItem.findFirst({
          where: {
            name: {
              contains: item.name.trim(),
              mode: 'insensitive',
            },
          },
          include: {
            category: true,
          },
        })
      }

      // Fallback 2: Check if any database item name is a substring of the queried name or vice-versa
      if (!dbMenuItem) {
        const allItems = await db.menuItem.findMany({
          include: { category: true },
        })
        const queryNameLower = item.name.trim().toLowerCase()
        dbMenuItem = allItems.find(dbItem => {
          const dbNameLower = dbItem.name.toLowerCase()
          return queryNameLower.includes(dbNameLower) || dbNameLower.includes(queryNameLower)
        }) || null
      }

      if (!dbMenuItem) {
        console.error(`❌ Order placement failed: Food item "${item.name}" was not found in the menu catalog.`)
        return NextResponse.json(
          { error: `Food item "${item.name}" was not found in the menu catalog.` },
          { status: 404, headers: CORS_HEADERS }
        )
      }

      if (!dbMenuItem.availability) {
        return NextResponse.json(
          { error: `"${dbMenuItem.name}" is currently sold out. Please remove it from your cart.` },
          { status: 400, headers: CORS_HEADERS }
        )
      }

      const quantity = parseInt(item.quantity, 10)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item "${item.name}".` },
          { status: 400, headers: CORS_HEADERS }
        )
      }

      calculatedTotal += dbMenuItem.price * quantity

      resolvedItems.push({
        menuItemId: dbMenuItem.id,
        quantity,
        price: dbMenuItem.price,
        note: item.note || item.customization || null, // Capture item-level customization notes
      })
    }

    // 3. Database transaction to create the Order and OrderItems
    const newOrder = await db.$transaction(async (tx) => {
      // Get the highest assigned tokenNumber to increment it sequentially
      const highestTokenOrder = await tx.order.findFirst({
        where: { tokenNumber: { not: null } },
        orderBy: { tokenNumber: 'desc' },
      })
      const nextToken = highestTokenOrder && highestTokenOrder.tokenNumber 
        ? highestTokenOrder.tokenNumber + 1 
        : 1

      const order = await tx.order.create({
        data: {
          tableNumber,
          notes: body.notes || body.orderNote || '', // Optional order-level notes
          total: calculatedTotal,
          status: 'NEW',
          tokenNumber: nextToken,
          items: {
            create: resolvedItems.map((ri) => ({
              menuItemId: ri.menuItemId,
              quantity: ri.quantity,
              price: ri.price,
              note: ri.note,
            })),
          },
        },
      })
      return order
    })

    // 4. Fetch the fully hydrated order details to broadcast via sockets
    const orderWithDetails = await db.order.findUnique({
      where: { id: newOrder.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    // 5. Trigger Socket.IO Realtime update to Admin Dashboard
    const io = (global as any).io
    if (io) {
      io.to('admin-room').emit('order-created', orderWithDetails)
      console.log(`📡 Realtime Socket Event: 'order-created' broadcasted to admin-room for Table ${tableNumber}`)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Order placed successfully', 
        order: orderWithDetails 
      }, 
      { status: 201, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Create Order API error:', error)
    return NextResponse.json(
      { error: 'Failed to place order due to internal server exception' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
