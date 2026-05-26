import { io, Socket } from 'socket.io-client'

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

// Initialize the socket client instance lazily
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // We connect manually once the user has an active session
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// Client helper utility to register event listeners easily
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
    console.log('🔌 Socket.IO client connecting...')
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
    console.log('🔌 Socket.IO client disconnected.')
  }
}
