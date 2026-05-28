import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

// GET handler to fetch the current running token
export async function GET() {
  try {
    // Check if there are any active orders currently in queue
    const activeOrdersCount = await db.order.count({
      where: { status: { in: ['NEW', 'PREPARING', 'READY'] } }
    })

    let currentToken = 0

    if (activeOrdersCount > 0) {
      // Active orders exist, read the saved setting
      const setting = await db.systemSetting.findUnique({
        where: { key: 'current_running_token' }
      })
      const tokenVal = setting && setting.value ? parseInt(setting.value, 10) : 0
      currentToken = isNaN(tokenVal) ? 0 : tokenVal
    } else {
      // Queue is empty, check idle duration since the last completed order
      const lastCompletedOrder = await db.order.findFirst({
        where: { status: { in: ['DELIVERED', 'CANCELLED'] } },
        orderBy: { updatedAt: 'desc' }
      })

      if (lastCompletedOrder) {
        const completedTime = new Date(lastCompletedOrder.updatedAt).getTime()
        const nowTime = Date.now()
        const diffMinutes = (nowTime - completedTime) / 60000

        if (diffMinutes >= 20) {
          // Idle for at least 20 minutes, reset setting in database
          await db.systemSetting.upsert({
            where: { key: 'current_running_token' },
            update: { value: '0' },
            create: { key: 'current_running_token', value: '0' }
          })
          
          // Broadcast the reset event to active sockets in real-time
          const io = (global as any).io
          if (io) {
            io.emit('current-token-updated', { currentToken: 0 })
          }
        }
      }
      
      // Always return 0 when there are no active orders in the queue
      currentToken = 0
    }

    return NextResponse.json({ success: true, currentToken }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Fetch running token API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current running token', currentToken: 0 },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// POST handler to update the current running token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { currentToken } = body

    if (currentToken === undefined || typeof currentToken !== 'number') {
      return NextResponse.json(
        { error: 'Invalid or missing currentToken' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Upsert the setting in the database
    const setting = await db.systemSetting.upsert({
      where: { key: 'current_running_token' },
      update: { value: currentToken.toString() },
      create: { key: 'current_running_token', value: currentToken.toString() }
    })

    // Broadcast the update in real-time to all connected customer and admin clients via Socket.IO
    const io = (global as any).io
    if (io) {
      io.emit('current-token-updated', { currentToken })
      console.log(`📡 Realtime Socket Event: 'current-token-updated' broadcasted for Token #${currentToken}`)
    }

    return NextResponse.json(
      { success: true, message: 'Current running token updated successfully', currentToken },
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Update running token API error:', error)
    return NextResponse.json(
      { error: 'Failed to update current running token' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
