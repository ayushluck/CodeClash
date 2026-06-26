import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel } from '../models/User.model';
import { BattleModel } from '../models/Battle.model';

// GET /api/users/:id
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id)
      .select('-password -__v')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get last 10 battles
    const battles = await BattleModel.find({
      $or: [{ player1: user._id }, { player2: user._id }],
      status: 'completed',
    })
      .sort({ endedAt: -1 })
      .limit(10)
      .select('topic status winnerId p1EloChange p2EloChange endedAt player1 player2')
      .lean();

    res.json({ user, battles });
  } catch (err) {
    console.error('getUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/users/:id
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Users can only update their own profile
    if (req.user!.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { username, avatar } = req.body;
    const updates: any = {};

    if (username) {
      // Check if username is taken by someone else
      const existing = await UserModel.findOne({ username });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      updates.username = username;
    }

    if (avatar) updates.avatar = avatar;

    const updated = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, select: '-password -__v' }
    );

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({ user: updated });
  } catch (err) {
    console.error('updateUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const users = await UserModel.find()
      .sort({ elo: -1 })
      .limit(50)
      .select('username elo wins losses streak avatar')
      .lean();

    // Add rank number
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};