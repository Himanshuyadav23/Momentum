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

    // Check if already completed today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayLogs = await HabitLog.findByHabitId(habitId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    if (todayLogs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This habit is already completed today'
      });
    }

    const habitLog = await HabitLog.create({
      habitId,
      userId,
      completedAt: new Date(),
      notes
    });

    // Improved streak calculation
    // Get all logs ordered by date (newest first)
    const allLogs = await HabitLog.findByHabitId(habitId, {
      limit: 100 // Get last 100 logs for streak calculation
    });

    let newStreak = 0;
    let longestStreak = habit.longestStreak;
    
    if (allLogs.length > 0) {
      // Sort by date descending (newest first)
      allLogs.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
      // Calculate current streak
      let consecutiveDays = 1;
      let checkDate = new Date(allLogs[0].completedAt);
      checkDate.setHours(0, 0, 0, 0);
      
      for (let i = 1; i < allLogs.length; i++) {
        const logDate = new Date(allLogs[i].completedAt);
        logDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          consecutiveDays++;
          checkDate = logDate;
        } else if (daysDiff > 1) {
          break; // Gap in streak
        }
      }
      
      newStreak = consecutiveDays;
      longestStreak = Math.max(longestStreak, newStreak);
    } else {
      newStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
    }

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

    // Get the log to find habitId and verify ownership
    const habitLog = await HabitLog.findById(logId);
    
    if (!habitLog) {
      return res.status(404).json({
        success: false,
        message: 'Habit log not found'
      });
    }

    if (habitLog.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this log'
      });
    }

    const habitId = habitLog.habitId;

    // Delete the log
    const deleted = await HabitLog.delete(logId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete habit log'
      });
    }

    // Recalculate streak for the habit
    const habit = await Habit.findById(habitId);
    if (habit) {
      const allLogs = await HabitLog.findByHabitId(habitId, {
        limit: 100
      });

      let newStreak = 0;
      let longestStreak = habit.longestStreak;
      
      if (allLogs.length > 0) {
        allLogs.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
        
        let consecutiveDays = 1;
        let checkDate = new Date(allLogs[0].completedAt);
        checkDate.setHours(0, 0, 0, 0);
        
        for (let i = 1; i < allLogs.length; i++) {
          const logDate = new Date(allLogs[i].completedAt);
          logDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            consecutiveDays++;
            checkDate = logDate;
          } else if (daysDiff > 1) {
            break;
          }
        }
        
        newStreak = consecutiveDays;
      } else {
        newStreak = 0;
      }

      await Habit.update(habitId, {
        currentStreak: newStreak,
        longestStreak
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


