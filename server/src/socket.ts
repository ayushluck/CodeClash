import { Server, Socket } from 'socket.io';
import { authenticateSocket } from './middleware/auth.middleware';

export const initSocket = (io: Server) => {
  // Auth middleware — runs before every connection
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`✅ Socket connected — userId: ${userId}, socketId: ${socket.id}`);

    // Test event — client sends ping, server replies pong
    socket.on('ping_test', (data: { message: string }) => {
      console.log(`📨 ping_test from ${userId}:`, data.message);
      socket.emit('pong_test', {
        message: `pong — server received: "${data.message}"`,
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected — userId: ${userId}, reason: ${reason}`);
    });
  });
};