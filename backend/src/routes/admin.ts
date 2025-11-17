import express from 'express';
import { 
  getStats, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/adminController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/admin/stats - Get system-wide statistics
router.get('/stats', asyncHandler(getStats));

// GET /api/admin/users - Get all users
router.get('/users', asyncHandler(getUsers));

// GET /api/admin/users/:userId - Get user by ID
router.get('/users/:userId', asyncHandler(getUserById));

// PUT /api/admin/users/:userId - Update user
router.put('/users/:userId', asyncHandler(updateUser));

// DELETE /api/admin/users/:userId - Delete user
router.delete('/users/:userId', asyncHandler(deleteUser));

export default router;








