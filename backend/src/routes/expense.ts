import express from 'express';
import { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense, 
  getExpenseStats 
} from '../controllers/expenseController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/expenses
router.get('/', asyncHandler(getExpenses));

// POST /api/expenses
router.post('/', asyncHandler(createExpense));

// PUT /api/expenses/:expenseId
router.put('/:expenseId', asyncHandler(updateExpense));

// DELETE /api/expenses/:expenseId
router.delete('/:expenseId', asyncHandler(deleteExpense));

// GET /api/expenses/stats
router.get('/stats', asyncHandler(getExpenseStats));

export default router;
