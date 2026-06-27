import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getFriends,
  searchUsers
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.patch('/:id', updateUserProfile);
router.post('/:id/follow/:targetId', followUser);
router.post('/:id/unfollow/:targetId', unfollowUser);
router.get('/:id/friends', getFriends);

export default router;