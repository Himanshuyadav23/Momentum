import { Request, Response } from 'express';
import { Expense } from '../models/Expense';

export const createExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, category, description, date, tags } = req.body;

    // Sanitize payload: Firestore rejects undefined fields like tags
    const expense = await Expense.create({
      userId,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      // Do not include tags at write time unless explicitly supported by schema
    });

    return res.status(201).json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate, category, limit } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (category) options.category = category as string;
    if (limit) options.limit = parseInt(limit as string);

    const expenses = await Expense.findByUserId(userId, options);

    return res.status(200).json({
      success: true,
      data: { expenses }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex) {
      const match = details.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
      const indexUrl = match ? match[0] : undefined;
      return res.status(200).json({
        success: true,
        data: { expenses: [] },
        message: 'Missing Firestore index; returning empty expenses.',
        error: indexUrl ? `Create index: ${indexUrl}` : 'Create the required Firestore composite index.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get expenses'
    });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { expenseId } = req.params;
    const updateData = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense || expense.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const updatedExpense = await Expense.update(expenseId, updateData);

    return res.status(200).json({
      success: true,
      data: { expense: updatedExpense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense || expense.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const deleted = await Expense.delete(expenseId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete expense'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

export const getExpenseStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await Expense.getExpenseStats(userId, start, end);

    return res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex) {
      const match = details.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
      const indexUrl = match ? match[0] : undefined;
      return res.status(200).json({
        success: true,
        data: { stats: { total: 0, byCategory: {}, byDay: {} } },
        message: 'Missing Firestore index; returning empty expense stats.',
        error: indexUrl ? `Create index: ${indexUrl}` : 'Create the required Firestore composite index.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get expense stats'
    });
  }
};


