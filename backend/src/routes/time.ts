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

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/time/entries
router.get('/entries', getTimeEntries);

// POST /api/time/start
router.post('/start', startTimer);

// POST /api/time/stop/:timeEntryId
router.post('/stop/:timeEntryId', stopTimer);

// POST /api/time/manual
router.post('/manual', addManualEntry);

// GET /api/time/active
router.get('/active', getActiveTimer);

// PUT /api/time/:timeEntryId
router.put('/:timeEntryId', updateTimeEntry);

// DELETE /api/time/:timeEntryId
router.delete('/:timeEntryId', deleteTimeEntry);

export default router;
