import { create } from 'zustand'

export interface MenuItem {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  veg: boolean
  availability: boolean
  category?: {
    id: string
    name: string
  }
}

export interface OrderItem {
  id: string
  menuItemId: string
  menuItem: MenuItem
  quantity: number
  price: number
  note?: string | null
}

export interface Order {
  id: string
  tableNumber: string
  notes: string | null
  status: 'NEW' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  total: number
  items: OrderItem[]
  tokenNumber: number | null
  createdAt: string
  updatedAt: string
}

interface OrderStore {
  orders: Order[]
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  addOrder: (order: Order) => void
  updateOrderInState: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>
  playNotificationSound: () => void
}

// Highly reliable browser Web Audio API oscillator synthesizer
const playChime = () => {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Explicitly resume the context (crucial for modern browser user-gesture security check)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    // Play sound with detuned harmonic oscillators for a professional bell chime vibe
    const playTone = (freq: number, start: number, duration: number, type: 'sine' | 'triangle' = 'triangle') => {
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.type = type
      osc1.frequency.setValueAtTime(freq, start)
      
      // detuned secondary chorus oscillator for premium warmth
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 1.5, start) // Perfect fifth harmonic for clarity
      
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(freq + 4, start) // Detuned for warmth
      
      const maxVol = 0.08
      
      gain1.gain.setValueAtTime(0, start)
      gain1.gain.linearRampToValueAtTime(maxVol, start + 0.08)
      gain1.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      
      gain2.gain.setValueAtTime(0, start)
      gain2.gain.linearRampToValueAtTime(maxVol * 0.4, start + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.8)
      
      gain3.gain.setValueAtTime(0, start)
      gain3.gain.linearRampToValueAtTime(maxVol * 0.3, start + 0.06)
      gain3.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      
      osc1.start(start)
      osc1.stop(start + duration)
      osc2.start(start)
      osc2.stop(start + duration)
      osc3.start(start)
      osc3.stop(start + duration)
    }
    
    const now = ctx.currentTime
    // Professional ascending bell melody spanning exactly 4.0 seconds
    playTone(523.25, now, 1.6, 'triangle')        // C5 at 0.0s (Warm tone)
    playTone(659.25, now + 0.4, 1.6, 'triangle')  // E5 at 0.4s
    playTone(783.99, now + 0.8, 1.8, 'triangle')  // G5 at 0.8s
    playTone(1046.50, now + 1.2, 2.8, 'sine')     // C6 at 1.2s (Sparkling high chime)
    playTone(1318.51, now + 1.6, 2.4, 'sine')     // E6 at 1.6s (Sweet resolution chord)
  } catch (e) {
    console.error('Audio chime error:', e)
  }
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      
      if (data.success) {
        set({ orders: data.orders, isLoading: false })
      } else {
        set({ error: data.error || 'Failed to fetch orders', isLoading: false })
      }
    } catch (err) {
      set({ error: 'Failed to connect to the server', isLoading: false })
    }
  },

  addOrder: (order) => {
    const { orders } = get()
    // Avoid duplicates if socket triggers and fast fetches overlap
    if (orders.some((o) => o.id === order.id)) return

    set({ orders: [order, ...orders] })
    get().playNotificationSound()
  },

  updateOrderInState: (updatedOrder) => {
    const { orders } = get()
    set({
      orders: orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    })
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      
      if (data.success) {
        // Socket broadcast will also update, but we update locally immediately for optimistic UI
        get().updateOrderInState(data.order)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update status:', err)
      return false
    }
  },

  playNotificationSound: () => {
    playChime()
  },
}))
