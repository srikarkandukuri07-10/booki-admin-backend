import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

// GET: Fetch order details and status (Publicly accessible for live tracking)
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        tableNumber: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    return NextResponse.json({ success: true, order }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Fetch Order API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// PATCH: Update order status (Admin only)
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body // Expected values: NEW, PREPARING, READY, DELIVERED, CANCELLED

    if (!status) {
      return NextResponse.json(
        { error: 'Order status is required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Verify order exists
    const order = await db.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // Update status
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: status as any,
      },
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

    // Handle token system automation
    const io = (global as any).io
    if (status === 'PREPARING' && updatedOrder.tokenNumber) {
      // Chef started preparing this order, set it as current running token
      await db.systemSetting.upsert({
        where: { key: 'current_running_token' },
        update: { value: updatedOrder.tokenNumber.toString() },
        create: { key: 'current_running_token', value: updatedOrder.tokenNumber.toString() }
      })
      if (io) {
        io.emit('current-token-updated', { currentToken: updatedOrder.tokenNumber })
      }
      console.log(`📡 Realtime Socket Event: 'current-token-updated' set to #${updatedOrder.tokenNumber} (Preparing order)`)
    } else if (status === 'DELIVERED' || status === 'READY') {
      // Chef finished preparing this order, find the next one in the queue
      const nextActiveOrder = await db.order.findFirst({
        where: {
          status: { in: ['NEW', 'PREPARING'] },
          tokenNumber: { not: null }
        },
        orderBy: { tokenNumber: 'asc' }
      })
      if (nextActiveOrder && nextActiveOrder.tokenNumber) {
        await db.systemSetting.upsert({
          where: { key: 'current_running_token' },
          update: { value: nextActiveOrder.tokenNumber.toString() },
          create: { key: 'current_running_token', value: nextActiveOrder.tokenNumber.toString() }
        })
        if (io) {
          io.emit('current-token-updated', { currentToken: nextActiveOrder.tokenNumber })
        }
        console.log(`📡 Realtime Socket Event: 'current-token-updated' set to #${nextActiveOrder.tokenNumber} (Next in queue)`)
      }
    }

    // Emit Socket.IO Realtime update to Admin Dashboard and Customer App
    if (io) {
      // 1. Notify other admin dashboard instances
      io.to('admin-room').emit('order-updated', updatedOrder)
      // 2. Notify the specific Customer App listening on this order's status
      io.to(`order-${id}`).emit('status-changed', { id, status: updatedOrder.status })
      console.log(`📡 Realtime Socket Event: 'order-updated' & 'status-changed' emitted for Order ${id} -> Status: ${status}`)
    }

    return NextResponse.json({ success: true, order: updatedOrder }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Update Order Status API error:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

type Props = {
  params: Promise<{ id: string }>
}
