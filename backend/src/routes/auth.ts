import express from 'express';
import { authenticate, getProfile } from '../controllers/authController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authenticate);

// GET /api/auth/profile
router.get('/profile', authMiddleware, getProfile);

export default router;



