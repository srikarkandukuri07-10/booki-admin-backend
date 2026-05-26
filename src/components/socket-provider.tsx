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

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
