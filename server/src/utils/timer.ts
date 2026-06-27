import { Server } from 'socket.io';
import {BattleModel} from '../models/Battle.model';

// Stores active timers so we can clear them when a battle ends early
const activeTimers = new Map<string, NodeJS.Timeout>();

export const startTimer = (io: Server, roomId: string, seconds: number) => {
  // Clear any existing timer for this room (safety net)
  clearRoomTimer(roomId);

  let remaining = seconds;

  const interval = setInterval(async () => {
    remaining -= 1;

    // Broadcast remaining time every second
    io.to(roomId).emit('timer_tick', { remaining });

    // Time's up
    if (remaining <= 0) {
      clearRoomTimer(roomId);

      // Mark battle as completed with no winner (draw/timeout)
      await BattleModel.findOneAndUpdate(
        { roomId },
        { status: 'completed', endedAt: new Date() }
      );

      io.to(roomId).emit('time_up', {
        message: "Time's up! Battle ended.",
      });

      console.log(`⏰ Time up in room ${roomId}`);
    }
  }, 1000);

  activeTimers.set(roomId, interval);
};

export const clearRoomTimer = (roomId: string) => {
  const existing = activeTimers.get(roomId);
  if (existing) {
    clearInterval(existing);
    activeTimers.delete(roomId);
  }
};