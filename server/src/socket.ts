import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { matchmakingService, QueueEntry } from './services/matchmaking.service';
import { BattleModel } from './models/Battle.model';
import { authenticateSocket } from './middleware/auth.middleware';
import { startTimer } from './utils/timer';
import { QuestionModel } from './models/Question.model';

export const initSocket = (io: Server) => {
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`✅ Socket connected — userId: ${userId}, socketId: ${socket.id}`);

    // ── PING TEST ───────────────────────────────────────────────
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

      const opponent = matchmakingService.findMatch(entry);

      if (opponent) {
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
          matchmakingService.addToQueue(opponent);
          return;
        }

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

        io.to(opponent.socketId).emit('match_found', {
          ...sharedPayload,
          opponent: { id: userId },
        });

        socket.emit('match_found', {
          ...sharedPayload,
          opponent: { id: opponent.userId },
        });

        console.log(`⚔️  Match found! Room: ${roomId} | ${opponent.userId} vs ${userId}`);

      } else {
        matchmakingService.addToQueue(entry);
        socket.emit('queue_joined', {
          message: 'In queue. Searching for opponent...',
          topic: data.topic,
          difficulty: data.difficulty,
        });
      }
    });

    // ── LEAVE QUEUE ─────────────────────────────────────────────
    socket.on('leave_queue', () => {
      matchmakingService.removeFromQueue(socket.id);
      socket.emit('queue_left', { message: 'Left the queue.' });
      console.log(`🚶 ${userId} left the queue`);
    });

    // ── JOIN BATTLE ROOM ────────────────────────────────────────
    socket.on('join_room', async ({ roomId }: { roomId: string }) => {
      socket.join(roomId);

      const room = io.sockets.adapter.rooms.get(roomId);
      const playerCount = room ? room.size : 0;

      console.log(`🏠 ${userId} joined room ${roomId} (${playerCount}/2 players)`);

      if (playerCount === 2) {
        const battle = await BattleModel.findOne({ roomId });
        if (!battle) return;

        // Import QuestionModel at the top of socket.ts
        const problem = await QuestionModel.findById(battle.problemId);
        if (!problem) return;

        const safeProblem = {
          id: problem._id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          topic: problem.topic,
          companies: problem.companies,
          examples: problem.examples,
          constraints: problem.constraints,
          starterCode: problem.starterCode,
          timeLimit: problem.timeLimit,
        };

        startTimer(io, roomId, problem.timeLimit || 1800);

        io.to(roomId).emit('battle_start', {
          problem: safeProblem,
          startedAt: Date.now(),
        });

        console.log(`⚔️  Battle started in room ${roomId}`);
      }
    });

    // ── CODE PROGRESS UPDATE ────────────────────────────────────
    socket.on('code_update', ({ roomId, lines }: { roomId: string; lines: number }) => {
      socket.to(roomId).emit('opponent_progress', { lines });
    });

    // ── SUBMIT SOLUTION ─────────────────────────────────────────
    socket.on('submit_solution', async ({
      roomId,
      code,
      language,
    }: {
      roomId: string;
      code: string;
      language: string;
    }) => {
      const battle = await BattleModel.findOne({ roomId });
      if (!battle || battle.status !== 'active') {
        socket.emit('submit_error', { message: 'Battle not active' });
        return;
      }

      const isPlayer1 = battle.player1.toString() === userId;
      const updateField = isPlayer1 ? 'player1Code' : 'player2Code';

      await BattleModel.findOneAndUpdate({ roomId }, { [updateField]: code });

      console.log(`📤 ${userId} submitted in room ${roomId} (${language})`);

      socket.emit('submission_received', {
        message: 'Code submitted. Judging in progress...',
        language,
      });
    });

    // ── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      matchmakingService.removeFromQueue(socket.id);
      console.log(`❌ Socket disconnected — userId: ${userId}`);
    });

  }); // ← connection block closes here
};