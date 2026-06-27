import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../lib/ENV';
import { Socket } from 'socket.io';

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('No token provided'));
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
    (socket as any).userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};
export interface AuthRequest extends Request {
  user?: { id: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};