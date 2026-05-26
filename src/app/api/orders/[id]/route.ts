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

    // Emit Socket.IO Realtime update to Admin Dashboard and Customer App
    const io = (global as any).io
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
