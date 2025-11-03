import express from 'express';
import { getDashboardData, getWeeklyReport, getMonthlyReport, getInsights, getActivityHeatmap } from '../controllers/analyticsController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/analytics/dashboard
router.get('/dashboard', asyncHandler(getDashboardData));

// GET /api/analytics/weekly
router.get('/weekly', asyncHandler(getWeeklyReport));

// GET /api/analytics/monthly
router.get('/monthly', asyncHandler(getMonthlyReport));

// GET /api/analytics/insights
router.get('/insights', asyncHandler(getInsights));

// GET /api/analytics/heatmap
router.get('/heatmap', asyncHandler(getActivityHeatmap));

export default router;
