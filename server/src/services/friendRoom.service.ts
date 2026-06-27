// server/src/services/friendRoom.service.ts

interface FriendRoom {
  roomCode: string;
  creatorId: string;
  creatorSocketId: string;
  topic: string;
  difficulty: string;
  company: string;
  createdAt: Date;
}

class FriendRoomService {
  private rooms: Map<string, FriendRoom> = new Map();

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) return this.generateCode();
    return code;
  }

  createRoom(data: Omit<FriendRoom, 'roomCode' | 'createdAt'>): string {
    const roomCode = this.generateCode();
    this.rooms.set(roomCode, {
      ...data,
      roomCode,
      createdAt: new Date(),
    });
    return roomCode;
  }

  getRoom(roomCode: string): FriendRoom | undefined {
    return this.rooms.get(roomCode);
  }

  deleteRoom(roomCode: string): void {
    this.rooms.delete(roomCode);
  }

  deleteBySocketId(socketId: string): void {
    for (const [code, room] of this.rooms.entries()) {
      if (room.creatorSocketId === socketId) {
        this.rooms.delete(code);
      }
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

export const friendRoomService = new FriendRoomService();