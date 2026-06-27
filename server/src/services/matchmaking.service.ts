import Question from '../models/Question.model';

export interface QueueEntry {
    socketId: string;
    userId: string;
    elo: number;
    topic: string;
    difficulty: string;
    company: string;
}

const ELO_RANGE = 200;

class MatchmakingService {
    private queue: QueueEntry[] = [];

    addToQueue(entry: QueueEntry): void {
        // Don't add the same user twice
        const already = this.queue.find(e => e.userId === entry.userId);
        if (already) return;
        this.queue.push(entry);
        console.log(`📋 Queue: ${this.queue.length} player(s) waiting`);
    }

    removeFromQueue(socketId: string): void {
        const before = this.queue.length;
        this.queue = this.queue.filter(e => e.socketId !== socketId);
        if (this.queue.length < before) {
            console.log(`🚪 Removed from queue. Queue: ${this.queue.length} player(s)`);
        }
    }

    findMatch(entry: QueueEntry): QueueEntry | null {
        const idx = this.queue.findIndex(
            e =>
                e.socketId !== entry.socketId &&
                e.userId !== entry.userId &&
                e.topic === entry.topic &&
                e.difficulty === entry.difficulty &&
                Math.abs(e.elo - entry.elo) <= ELO_RANGE
        );

        if (idx === -1) return null;

        const match = this.queue[idx];
        // Remove matched player from queue
        this.queue.splice(idx, 1);
        // Remove current player from queue
        this.removeFromQueue(entry.socketId);

        return match;
    }

    async getProblem(topic: string, difficulty: string, company: string) {
        const filter: Record<string, any> = { topic, difficulty };
        if (company && company !== 'Any') {
            filter.companies = company;
        }

        const questions = await Question.find(filter as any).lean();
        if (!questions.length) {
            const fallback = await Question.find({ topic, difficulty } as any).lean();
            if (!fallback.length) throw new Error(`No questions found for ${topic} ${difficulty}`);
            return fallback[Math.floor(Math.random() * fallback.length)];
        }

        return questions[Math.floor(Math.random() * questions.length)];
    }

    getQueueLength(): number {
        return this.queue.length;
    }
}

// Singleton — one instance shared across all socket events
export const matchmakingService = new MatchmakingService();