import express from 'express';
import { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense, 
  getExpenseStats 
} from '../controllers/expenseController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/expenses
router.get('/', getExpenses);

// POST /api/expenses
router.post('/', createExpense);

// PUT /api/expenses/:expenseId
router.put('/:expenseId', updateExpense);

// DELETE /api/expenses/:expenseId
router.delete('/:expenseId', deleteExpense);

// GET /api/expenses/stats
router.get('/stats', getExpenseStats);

export default router;
