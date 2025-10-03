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

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/habits
router.get('/', getHabits);

// POST /api/habits
router.post('/', createHabit);

// PUT /api/habits/:habitId
router.put('/:habitId', updateHabit);

// DELETE /api/habits/:habitId
router.delete('/:habitId', deleteHabit);

// POST /api/habits/:habitId/log
router.post('/:habitId/log', logHabit);

// GET /api/habits/:habitId/logs
router.get('/:habitId/logs', getHabitLogs);

// DELETE /api/habits/logs/:logId
router.delete('/logs/:logId', deleteHabitLog);

export default router;
