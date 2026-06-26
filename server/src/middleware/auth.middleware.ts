import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../lib/ENV';
import { UserModel } from '../models/User.model';

const signToken = (id: string) =>
  jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Check duplicates
    const emailExists = await UserModel.findOne({ email });
    if (emailExists)
      return res.status(409).json({ message: 'Email already in use' });

    const usernameExists = await UserModel.findOne({ username });
    if (usernameExists)
      return res.status(409).json({ message: 'Username already taken' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await UserModel.create({
      username,
      email,
      password: passwordHash,
      elo: 1200,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        elo: user.elo,
        wins: user.wins,
        losses: user.losses,
        streak: user.streak,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    // Find user (email is lowercased by schema)
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        elo: user.elo,
        wins: user.wins,
        losses: user.losses,
        streak: user.streak,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};