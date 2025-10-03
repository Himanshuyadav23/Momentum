import { Request, Response } from 'express';
import { Habit, HabitLog } from '../models/Habit';

export const createHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, frequency, targetCount } = req.body;

    const habit = await Habit.create({
      userId,
      name,
      description,
      frequency: frequency || 'daily',
      targetCount: targetCount || 1,
      currentStreak: 0,
      longestStreak: 0,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      data: { habit }
    });
  } catch (error) {
    console.error('Create habit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create habit'
    });
  }
};

export const getHabits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { activeOnly } = req.query;

    const habits = await Habit.findByUserId(userId, activeOnly !== 'false');

    return res.status(200).json({
      success: true,
      data: { habits }
    });
  } catch (error) {
    console.error('Get habits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get habits'
    });
  }
};

export const updateHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { habitId } = req.params;
    const updateData = req.body;

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const updatedHabit = await Habit.update(habitId, updateData);

    return res.status(200).json({
      success: true,
      data: { habit: updatedHabit }
    });
  } catch (error) {
    console.error('Update habit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update habit'
    });
  }
};

export const deleteHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { habitId } = req.params;

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const deleted = await Habit.delete(habitId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete habit'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Habit deleted successfully'
    });
  } catch (error) {
    console.error('Delete habit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete habit'
    });
  }
};

export const logHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { habitId } = req.params;
    const { notes } = req.body;

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const habitLog = await HabitLog.create({
      habitId,
      userId,
      completedAt: new Date(),
      notes
    });

    // Update habit streak (simplified logic)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await HabitLog.findByHabitId(habitId, {
      startDate: yesterday,
      endDate: today,
      limit: 2
    });

    let newStreak = habit.currentStreak;
    if (recentLogs.length > 0) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(habit.longestStreak, newStreak);

    await Habit.update(habitId, {
      currentStreak: newStreak,
      longestStreak
    });

    return res.status(201).json({
      success: true,
      data: { habitLog }
    });
  } catch (error) {
    console.error('Log habit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log habit'
    });
  }
};

export const getHabitLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { habitId } = req.params;
    const { startDate, endDate, limit } = req.query;

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (limit) options.limit = parseInt(limit as string);

    const habitLogs = await HabitLog.findByHabitId(habitId, options);

    return res.status(200).json({
      success: true,
      data: { habitLogs }
    });
  } catch (error) {
    console.error('Get habit logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get habit logs'
    });
  }
};

export const deleteHabitLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { logId } = req.params;

    const habitLog = await HabitLog.findByHabitId('', { limit: 1 }); // This needs to be fixed
    // For now, we'll implement a simpler approach

    const deleted = await HabitLog.delete(logId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete habit log'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Habit log deleted successfully'
    });
  } catch (error) {
    console.error('Delete habit log error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete habit log'
    });
  }
};


