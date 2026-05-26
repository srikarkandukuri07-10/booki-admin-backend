// Load Next.js environment variables at the very first line of the process
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const keyPath = path.join(__dirname, 'key.pem')
const certPath = path.join(__dirname, 'cert.pem')

// 1. Programmatic local self-signed SSL Certificate Generation for Secure HTTPS Contexts
async function ensureSslCertificates() {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('🔑 Generating self-signed SSL Certificates for secure HTTPS...')
    const selfsigned = require('selfsigned')
    
    const attrs = [
      { name: 'commonName', value: '192.168.0.6' },
      { name: 'organizationName', value: 'LAmbre Rustic' }
    ]
    
    // Subject Alternative Names to cover localhost, 127.0.0.1, and the active local network IP
    const extensions = [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '192.168.0.6' }
        ]
      }
    ]
    
    const pems = await selfsigned.generate(attrs, {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions
    })
    
    fs.writeFileSync(keyPath, pems.private)
    fs.writeFileSync(certPath, pems.cert)
    console.log('✅ SSL Certificates generated and saved successfully!')
  }
}

ensureSslCertificates().then(() => {
  app.prepare().then(() => {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
  }

  const httpServer = createServer(options, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.IO with CORS support for Customer App Integration Readiness
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows access from any external frontend client
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)

    // Admins join the admin room to receive live order updates
    socket.on('join-admin-room', () => {
      socket.join('admin-room')
      console.log(`👤 Socket ${socket.id} joined admin-room`)
    })

    // Customers can join a specific order room to receive live updates about their specific order
    socket.on('join-order-room', (orderId) => {
      socket.join(`order-${orderId}`)
      console.log(`🍔 Socket ${socket.id} joined order room order-${orderId}`)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`)
    })
  })

  // Expose Socket.IO server globally so API routes can emit events
  global.io = io
  console.log('🚀 Socket.IO Server initialized and exposed globally')

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> 🚀 Secure HTTPS Server is running!`)
    console.log(`  - Local:   https://localhost:${port}`)
    console.log(`  - Network: https://192.168.0.6:${port} (for mobile testing)`)
  })
})
})
