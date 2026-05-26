import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

// PUT: Update a menu item (Admin only)
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, image, price, veg, availability, categoryId } = body

    // Verify item exists
    const existingItem = await db.menuItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (price !== undefined) {
      const parsedPrice = parseFloat(price)
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
      }
      updateData.price = parsedPrice
    }
    if (veg !== undefined) updateData.veg = Boolean(veg)
    if (availability !== undefined) updateData.availability = Boolean(availability)
    
    if (categoryId !== undefined) {
      // Verify new category exists
      const category = await db.menuCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json({ error: 'Selected category does not exist' }, { status: 404 })
      }
      updateData.categoryId = categoryId
    }

    const updatedItem = await db.menuItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Update Menu Item API error:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a menu item (Admin only)
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    // Authenticate Admin
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify item exists
    const existingItem = await db.menuItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Delete item (uses Restrict on foreign key to prevent deleting items ordered in OrderItem table)
    try {
      await db.menuItem.delete({
        where: { id },
      })
    } catch (dbError: any) {
      if (dbError.code === 'P2003') {
        // Prisma foreign key constraint failure
        return NextResponse.json(
          { 
            error: 'Cannot delete item because it has been ordered before. Please disable its availability instead.',
            code: 'FOREIGN_KEY_CONSTRAINT'
          },
          { status: 400 }
        )
      }
      throw dbError;
    }

    return NextResponse.json({ success: true, message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Delete Menu Item API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
