import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { Server } from 'socket.io'
import app from './app'
import { connectDB } from './config/db'

const PORT = process.env.PORT || 5000

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id))
})

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}).catch(err => {
  console.error('DB connection failed:', err)
  process.exit(1)
})