import { Request, Response } from 'express';
import { Expense } from '../models/Expense';

export const createExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, currency, category, description, date } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Default to INR if currency not provided
    const expenseCurrency = currency || 'INR';

    // Sanitize and create expense
    const expense = await Expense.create({
      userId,
      amount: parseFloat(amount),
      currency: expenseCurrency,
      category: category.trim(),
      description: description?.trim() || '',
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      success: true,
      data: { expense }
    });
  } catch (error: any) {
    console.error('Create expense error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create expense',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
      data: stats // Return stats directly, not wrapped in { stats }
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
        data: {
          totalAmount: 0,
          expenseCount: 0,
          categoryBreakdown: {},
          dailyBreakdown: {},
          averageDaily: 0
        },
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


