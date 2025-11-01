import express from 'express';
import { 
  createHabit, 
  getHabits, 
  updateHabit, 
  deleteHabit, 
  logHabit, 
  getHabitLogs, 
  deleteHabitLog 
} from '../controllers/habitController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/habits
router.get('/', asyncHandler(getHabits));

// POST /api/habits
router.post('/', asyncHandler(createHabit));

// PUT /api/habits/:habitId
router.put('/:habitId', asyncHandler(updateHabit));

// DELETE /api/habits/:habitId
router.delete('/:habitId', asyncHandler(deleteHabit));

// POST /api/habits/:habitId/log
router.post('/:habitId/log', asyncHandler(logHabit));

// GET /api/habits/:habitId/logs
router.get('/:habitId/logs', asyncHandler(getHabitLogs));

// DELETE /api/habits/logs/:logId
router.delete('/logs/:logId', asyncHandler(deleteHabitLog));

export default router;
