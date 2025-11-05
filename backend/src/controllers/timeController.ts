import { Request, Response } from 'express';
import { TimeEntry } from '../models/TimeEntry';

export const startTimer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { category, description, isProductive } = req.body;

    // Validate required fields
    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    console.log('Starting timer for user:', userId, { category, description, isProductive });

    // Stop any active timer first
    await TimeEntry.stopAllActiveByUserId(userId);

    // Create new time entry
    const timeEntry = await TimeEntry.create({
      userId,
      category: category.trim(),
      description: description.trim(),
      startTime: new Date(),
      isActive: true,
      isProductive: isProductive || false
    });

    console.log('Timer started successfully:', timeEntry.id);

    return res.status(201).json({
      success: true,
      data: { timeEntry }
    });
  } catch (error: any) {
    console.error('Start timer error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to start timer'
    });
  }
};

export const stopTimer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { timeEntryId } = req.params;

    const timeEntry = await TimeEntry.findById(timeEntryId);

    if (!timeEntry || timeEntry.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    if (!timeEntry.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Timer is not active'
      });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / (1000 * 60));

    const updatedTimeEntry = await TimeEntry.update(timeEntryId, {
      endTime,
      duration,
      isActive: false
    });

    return res.status(200).json({
      success: true,
      data: { timeEntry: updatedTimeEntry }
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stop timer'
    });
  }
};

export const getActiveTimer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const activeTimer = await TimeEntry.findActiveByUserId(userId);

    return res.status(200).json({
      success: true,
      data: { timeEntry: activeTimer }
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get active timer'
    });
  }
};

export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate, category, limit } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (category) options.category = category as string;
    if (limit) options.limit = parseInt(limit as string);

    const timeEntries = await TimeEntry.findByUserId(userId, options);

    return res.status(200).json({
      success: true,
      data: { timeEntries }
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    // Graceful fallback if Firestore composite index is missing
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex) {
      const match = details.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
      const indexUrl = match ? match[0] : undefined;
      return res.status(200).json({
        success: true,
        data: { timeEntries: [] },
        message: 'Missing Firestore index; returning empty results to keep UI responsive.',
        error: indexUrl ? `Create index: ${indexUrl}` : 'Create the required Firestore composite index for timeEntries.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get time entries'
    });
  }
};

export const addManualEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { category, description, startTime, endTime, isProductive } = req.body;

    // Validate required fields
    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time are required'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

    console.log('Adding manual time entry for user:', userId, {
      category,
      description,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      isProductive
    });

    const timeEntry = await TimeEntry.create({
      userId,
      category: category.trim(),
      description: description.trim(),
      startTime: start,
      endTime: end,
      duration,
      isActive: false,
      isProductive: isProductive || false
    });

    console.log('Manual time entry created successfully:', timeEntry.id);

    return res.status(201).json({
      success: true,
      data: { timeEntry }
    });
  } catch (error: any) {
    console.error('Add manual entry error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to add manual entry'
    });
  }
};

export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { timeEntryId } = req.params;
    const updateData = req.body;

    const timeEntry = await TimeEntry.findById(timeEntryId);

    if (!timeEntry || timeEntry.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    const updatedTimeEntry = await TimeEntry.update(timeEntryId, updateData);

    return res.status(200).json({
      success: true,
      data: { timeEntry: updatedTimeEntry }
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update time entry'
    });
  }
};

export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { timeEntryId } = req.params;

    const timeEntry = await TimeEntry.findById(timeEntryId);

    if (!timeEntry || timeEntry.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    const deleted = await TimeEntry.delete(timeEntryId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete time entry'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete time entry'
    });
  }
};


