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
// Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
  const { id, targetId } = req.params;

  try {
    if (id === targetId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const user = await UserModel.findById(id);
    const target = await UserModel.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.following.includes(targetId as any)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    await UserModel.findByIdAndUpdate(id, { $push: { following: targetId } });
    await UserModel.findByIdAndUpdate(targetId, { $push: { followers: id } });

    res.json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  const { id, targetId } = req.params;

  try {
    if (id === targetId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const user = await UserModel.findById(id);
    const target = await UserModel.findById(targetId);

    if (!user || !target) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.following.includes(targetId as any)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    await UserModel.findByIdAndUpdate(id, { $pull: { following: targetId } });
    await UserModel.findByIdAndUpdate(targetId, { $pull: { followers: id } });

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friends list (mutual follows)
export const getFriends = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id)
      .select('following followers')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followingStr = user.following.map((id: any) => id.toString());
    const followersStr = user.followers.map((id: any) => id.toString());
    const friendIds = followingStr.filter((id: string) => followersStr.includes(id));

    const friends = await UserModel.find({ _id: { $in: friendIds } })
      .select('username elo avatar wins losses streak')
      .lean();

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Search users by username
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username query required' });
    }

    const users = await UserModel.find({
      username: { $regex: username, $options: 'i' }
    })
      .select('username elo avatar wins losses')
      .limit(10)
      .lean();

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};