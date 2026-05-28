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
    const setting = await db.systemSetting.findUnique({
      where: { key: 'current_running_token' }
    })

    const tokenVal = setting && setting.value ? parseInt(setting.value, 10) : 0
    const currentToken = isNaN(tokenVal) ? 0 : tokenVal

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
