import { create } from 'zustand'

export interface MenuItem {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  veg: boolean
  availability: boolean
  categoryId: string
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuStore {
  categories: MenuCategory[]
  isLoading: boolean
  error: string | null
  fetchMenu: (isPublic?: boolean) => Promise<void>
  createMenuItem: (itemData: Omit<MenuItem, 'id'>) => Promise<boolean>
  updateMenuItem: (id: string, itemData: Partial<MenuItem>) => Promise<boolean>
  deleteMenuItem: (id: string) => Promise<{ success: boolean; error?: string }>
  toggleAvailability: (id: string, currentStatus: boolean) => Promise<boolean>
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchMenu: async (isPublic = false) => {
    set({ isLoading: true, error: null })
    try {
      const url = `/api/menu${isPublic ? '?public=true' : ''}`
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success) {
        set({ categories: data.categories, isLoading: false })
      } else {
        set({ error: data.error || 'Failed to fetch menu', isLoading: false })
      }
    } catch (err) {
      set({ error: 'Failed to connect to server', isLoading: false })
    }
  },

  createMenuItem: async (itemData) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })
      const data = await res.json()
      
      if (data.success) {
        await get().fetchMenu() // Refresh state
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to create menu item:', err)
      return false
    }
  },

  updateMenuItem: async (id, itemData) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })
      const data = await res.json()
      
      if (data.success) {
        await get().fetchMenu() // Refresh state
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update menu item:', err)
      return false
    }
  },

  deleteMenuItem: async (id) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (data.success) {
        await get().fetchMenu() // Refresh state
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (err) {
      console.error('Failed to delete menu item:', err)
      return { success: false, error: 'Failed to delete menu item' }
    }
  },

  toggleAvailability: async (id, currentStatus) => {
    try {
      // Optimistically toggle in UI
      const { categories } = get()
      const toggledCategories = categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === id ? { ...item, availability: !currentStatus } : item
        ),
      }))
      set({ categories: toggledCategories })

      const res = await fetch(`/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability: !currentStatus }),
      })
      const data = await res.json()
      
      if (!data.success) {
        // Rollback on failure
        await get().fetchMenu()
        return false
      }
      return true
    } catch (err) {
      console.error('Failed to toggle availability:', err)
      await get().fetchMenu() // Rollback
      return false
    }
  },
}))
