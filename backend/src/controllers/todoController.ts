import { Request, Response } from 'express';
import { Todo } from '../models/Todo';

export const createTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, type, dueDate } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Todo title is required'
      });
    }

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Todo type must be daily, weekly, or monthly'
      });
    }

    const todo = await Todo.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      type,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isCompleted: false
    });

    return res.status(201).json({
      success: true,
      data: { todo }
    });
  } catch (error: any) {
    console.error('Create todo error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create todo',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const getTodos = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, isCompleted, startDate, endDate } = req.query;

    const options: any = {};
    if (type && ['daily', 'weekly', 'monthly'].includes(type as string)) {
      options.type = type as 'daily' | 'weekly' | 'monthly';
    }
    if (isCompleted !== undefined) {
      options.isCompleted = isCompleted === 'true';
    }
    if (startDate) {
      options.startDate = new Date(startDate as string);
    }
    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    const todos = await Todo.findByUserId(userId, options);

    return res.status(200).json({
      success: true,
      data: { todos }
    });
  } catch (error: any) {
    console.error('Get todos error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to fetch todos',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { title, description, type, isCompleted, dueDate } = req.body;

    // Verify todo exists and belongs to user
    const existingTodo = await Todo.findById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    if (existingTodo.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this todo'
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (type !== undefined) {
      if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Todo type must be daily, weekly, or monthly'
        });
      }
      updateData.type = type;
    }
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : undefined;

    const updatedTodo = await Todo.update(id, updateData);

    return res.status(200).json({
      success: true,
      data: { todo: updatedTodo }
    });
  } catch (error: any) {
    console.error('Update todo error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update todo',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Verify todo exists and belongs to user
    const existingTodo = await Todo.findById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    if (existingTodo.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this todo'
      });
    }

    await Todo.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete todo error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete todo',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const toggleTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Verify todo exists and belongs to user
    const existingTodo = await Todo.findById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    if (existingTodo.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this todo'
      });
    }

    const updatedTodo = await Todo.update(id, {
      isCompleted: !existingTodo.isCompleted
    });

    return res.status(200).json({
      success: true,
      data: { todo: updatedTodo }
    });
  } catch (error: any) {
    console.error('Toggle todo error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to toggle todo',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

