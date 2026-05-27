'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { socket, connectSocket, disconnectSocket } from '@/lib/socket'
import { useOrderStore } from '@/store/useOrderStore'

const SocketContext = createContext<typeof socket | null>(null)

export const useSocket = () => {
  return useContext(SocketContext)
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const addOrder = useOrderStore((state) => state.addOrder)
  const updateOrderInState = useOrderStore((state) => state.updateOrderInState)

  useEffect(() => {
    // 1. Establish socket connection
    connectSocket()

    // 2. Join the admin updates room
    socket.emit('join-admin-room')

    // 3. Bind realtime websocket event listeners
    socket.on('order-created', (newOrder) => {
      console.log('📡 Realtime Event: order-created received', newOrder)
      addOrder(newOrder)
    })

    socket.on('order-updated', (updatedOrder) => {
      console.log('📡 Realtime Event: order-updated received', updatedOrder)
      updateOrderInState(updatedOrder)
    })

    socket.on('connect', () => {
      console.log('🔌 Realtime Socket.IO connected')
      socket.emit('join-admin-room')
    })

    socket.on('disconnect', () => {
      console.log('🔌 Realtime Socket.IO disconnected')
    })

    // Clean up connections on unmount
    return () => {
      socket.off('order-created')
      socket.off('order-updated')
      socket.off('connect')
      socket.off('disconnect')
      disconnectSocket()
    }
  }, [addOrder, updateOrderInState])

  // Background polling fallback for serverless environments (like Vercel) where WebSockets fail
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders')
        const data = await res.json()
        
        if (data.success && data.orders) {
          const currentOrders = useOrderStore.getState().orders
          const fetchedOrders = data.orders
          
          // Check if there are any brand new orders we don't have in state yet
          const hasNewIncomingOrders = fetchedOrders.some(
            (fo: any) => fo.status === 'NEW' && !currentOrders.some((co) => co.id === fo.id)
          )
          
          // Update the store silently (without loading triggers)
          useOrderStore.setState({ orders: fetchedOrders })
          
          // Trigger professional chime if a new order is received
          if (hasNewIncomingOrders) {
            useOrderStore.getState().playNotificationSound()
          }
        }
      } catch (err) {
        console.warn('📡 Realtime Background Poll failed:', err)
      }
    }, 5000) // Poll every 5 seconds for responsive live updates

    return () => clearInterval(pollInterval)
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
