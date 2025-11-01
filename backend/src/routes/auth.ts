import express from 'express';
import { authenticate, getProfile } from '../controllers/authController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// POST /api/auth/login
router.post('/login', asyncHandler(authenticate));

// GET /api/auth/profile
router.get('/profile', authMiddleware, asyncHandler(getProfile));

export default router;



