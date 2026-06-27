import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { matchmakingService, QueueEntry } from './services/matchmaking.service';
import {BattleModel} from './models/Battle.model';
import { authenticateSocket } from './middleware/auth.middleware';

export const initSocket = (io: Server) => {
  // JWT auth on every connection
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`✅ Socket connected — userId: ${userId}, socketId: ${socket.id}`);

    // ── PING TEST (keep from Day 8) ────────────────────────────
    socket.on('ping_test', (msg: string) => {
      console.log(`🏓 ping_test from ${userId}: ${msg}`);
      socket.emit('pong_test', {
        message: `Pong! You said: ${msg}`,
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // ── JOIN MATCHMAKING QUEUE ──────────────────────────────────
    socket.on('join_queue', async (data: {
      elo: number;
      topic: string;
      difficulty: string;
      company: string;
    }) => {
      console.log(`🔍 ${userId} joining queue — ${data.topic} ${data.difficulty}`);

      const entry: QueueEntry = {
        socketId: socket.id,
        userId,
        elo: data.elo,
        topic: data.topic,
        difficulty: data.difficulty,
        company: data.company ?? 'Any',
      };

      // Try to find an existing match first
      const opponent = matchmakingService.findMatch(entry);

      if (opponent) {
        // ── MATCH FOUND ──────────────────────────────────────
        const roomId = uuid();

        let problem;
        try {
          problem = await matchmakingService.getProblem(
            data.topic,
            data.difficulty,
            data.company
          );
        } catch (err) {
          console.error('❌ No problem found:', err);
          socket.emit('queue_error', { message: 'No questions available for that topic/difficulty. Try another.' });
          // Put opponent back in queue since match failed
          matchmakingService.addToQueue(opponent);
          return;
        }

        // Create battle record in MongoDB
        try {
          await BattleModel.create({
            roomId,
            player1: opponent.userId,
            player2: userId,
            problemId: problem._id,
            topic: data.topic,
            status: 'active',
            startedAt: new Date(),
          });
        } catch (err) {
          console.error('❌ Failed to create battle:', err);
        }

        // Payload sent to both players
        const sharedPayload = {
          roomId,
          problem: {
            _id: problem._id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            topic: problem.topic,
            examples: problem.examples,
            constraints: problem.constraints,
            starterCode: problem.starterCode,
            timeLimit: problem.timeLimit,
          },
        };

        // Notify player 1 (opponent — was already in queue)
        io.to(opponent.socketId).emit('match_found', {
          ...sharedPayload,
          opponent: { id: userId },
        });

        // Notify player 2 (current player — just joined)
        socket.emit('match_found', {
          ...sharedPayload,
          opponent: { id: opponent.userId },
        });

        console.log(`⚔️  Match found! Room: ${roomId} | ${opponent.userId} vs ${userId}`);

      } else {
        // ── NO MATCH YET — ADD TO QUEUE ──────────────────────
        matchmakingService.addToQueue(entry);
        socket.emit('queue_joined', {
          message: 'In queue. Searching for opponent...',
          topic: data.topic,
          difficulty: data.difficulty,
        });
      }
    });

    // ── LEAVE QUEUE (cancel matchmaking) ───────────────────────
    socket.on('leave_queue', () => {
      matchmakingService.removeFromQueue(socket.id);
      socket.emit('queue_left', { message: 'Left the queue.' });
      console.log(`🚶 ${userId} left the queue`);
    });

    // ── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      matchmakingService.removeFromQueue(socket.id);
      console.log(`❌ Socket disconnected — userId: ${userId}`);
    });
  });
};