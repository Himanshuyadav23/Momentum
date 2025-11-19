import express from 'express';
import { 
  createTodo, 
  getTodos, 
  updateTodo, 
  deleteTodo,
  toggleTodo
} from '../controllers/todoController';
import { authenticate as authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/todos
router.post('/', asyncHandler(createTodo));

// GET /api/todos
router.get('/', asyncHandler(getTodos));

// PUT /api/todos/:id
router.put('/:id', asyncHandler(updateTodo));

// DELETE /api/todos/:id
router.delete('/:id', asyncHandler(deleteTodo));

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', asyncHandler(toggleTodo));

export default router;

