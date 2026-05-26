import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file was uploaded' }, { status: 400 })
    }

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // 3. Generate sanitized, unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const fileName = `${uniqueSuffix}_${originalName}`

    // 4. Resolve path and ensure uploads folder exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      // Folder already exists or was created concurrently, safe to ignore
    }

    const filePath = join(uploadsDir, fileName)

    // 5. Write file
    await writeFile(filePath, buffer)
    console.log(`📁 File uploaded successfully: ${filePath}`)

    // 6. Return access URL
    const fileUrl = `/uploads/${fileName}`
    return NextResponse.json({ success: true, url: fileUrl })
  } catch (error) {
    console.error('File Upload API error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image file' },
      { status: 500 }
    )
  }
}
