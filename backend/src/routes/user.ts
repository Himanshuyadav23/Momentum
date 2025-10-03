import express from 'express';
import { updateProfile, completeOnboarding, deleteAccount } from '../controllers/userController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// PUT /api/user/profile
router.put('/profile', updateProfile);

// POST /api/user/onboarding
router.post('/onboarding', completeOnboarding);

// DELETE /api/user/account
router.delete('/account', deleteAccount);

export default router;
