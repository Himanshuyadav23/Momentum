import express from 'express';
import { getDashboardData, getWeeklyReport, getInsights } from '../controllers/analyticsController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/dashboard
router.get('/dashboard', getDashboardData);

// GET /api/analytics/weekly
router.get('/weekly', getWeeklyReport);

// GET /api/analytics/insights
router.get('/insights', getInsights);

export default router;
