import { ENV } from './lib/ENV'
import http from 'http'
import { Server } from 'socket.io'
import app from './app'
import { connectDB } from './config/db'
import { initSocket } from './socket'

const PORT = ENV.PORT;

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    methods: ['GET', 'POST']
  }
})

initSocket(io)

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}).catch(err => {
  console.error('DB connection failed:', err)
  process.exit(1)
})