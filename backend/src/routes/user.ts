import express from 'express';
import { updateProfile, completeOnboarding, deleteAccount } from '../controllers/userController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// PUT /api/user/profile
router.put('/profile', asyncHandler(updateProfile));

// POST /api/user/onboarding
router.post('/onboarding', asyncHandler(completeOnboarding));

// DELETE /api/user/account
router.delete('/account', asyncHandler(deleteAccount));

export default router;
