import express from 'express';
import { 
  startTimer, 
  stopTimer, 
  getActiveTimer, 
  getTimeEntries, 
  addManualEntry, 
  updateTimeEntry, 
  deleteTimeEntry 
} from '../controllers/timeController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/time/entries
router.get('/entries', asyncHandler(getTimeEntries));

// POST /api/time/start
router.post('/start', asyncHandler(startTimer));

// POST /api/time/stop/:timeEntryId
router.post('/stop/:timeEntryId', asyncHandler(stopTimer));

// POST /api/time/manual
router.post('/manual', asyncHandler(addManualEntry));

// GET /api/time/active
router.get('/active', asyncHandler(getActiveTimer));

// PUT /api/time/:timeEntryId
router.put('/:timeEntryId', asyncHandler(updateTimeEntry));

// DELETE /api/time/:timeEntryId
router.delete('/:timeEntryId', asyncHandler(deleteTimeEntry));

export default router;
