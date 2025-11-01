import { Request, Response } from 'express';
import { Habit, HabitLog } from '../models/Habit';

export const createHabit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, frequency, targetCount } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Habit name is required'
      });
    }

    const habit = await Habit.create({
      userId,
      name: name.trim(),
      description: description?.trim() || '',
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
  } catch (error: any) {
    console.error('Create habit error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create habit',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
  const { habitId } = req.params;
  
  try {
    const userId = (req as any).user.id;

    if (!habitId) {
      return res.status(400).json({
        success: false,
        message: 'Habit ID is required'
      });
    }

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Delete associated habit logs first (in background, don't block on errors)
    try {
      const allLogs = await HabitLog.findByHabitId(habitId);
      const deletePromises = allLogs.map(log => 
        HabitLog.delete(log.id).catch(err => {
          console.warn(`Failed to delete habit log ${log.id}:`, err);
        })
      );
      await Promise.allSettled(deletePromises);
    } catch (logError: any) {
      console.warn('Error deleting habit logs (continuing with habit deletion):', logError);
      // Continue with habit deletion even if log deletion fails
    }

    // Delete the habit itself
    await Habit.delete(habitId);

    return res.status(200).json({
      success: true,
      message: 'Habit deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete habit error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      habitId: habitId || 'unknown'
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete habit',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const logHabit = async (req: Request, res: Response) => {
  const { habitId } = req.params;
  
  try {
    const userId = (req as any).user.id;
    const { notes } = req.body;

    const habit = await Habit.findById(habitId);

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // Check how many times completed today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayLogs = await HabitLog.findByHabitId(habitId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Allow multiple completions up to targetCount
    if (todayLogs.length >= habit.targetCount) {
      return res.status(400).json({
        success: false,
        message: `You've already completed this habit ${habit.targetCount} time${habit.targetCount > 1 ? 's' : ''} today (target: ${habit.targetCount})`
      });
    }

    const habitLog = await HabitLog.create({
      habitId,
      userId,
      completedAt: new Date(),
      notes
    });

    // Improved streak calculation with targetCount support
    // Get all logs ordered by date (newest first)
    const allLogs = await HabitLog.findByHabitId(habitId, {
      limit: 500 // Get more logs to calculate streaks properly
    });

    let newStreak = 0;
    let longestStreak = habit.longestStreak;
    
    if (allLogs.length > 0) {
      // Group logs by date
      const logsByDate = new Map<string, number>();
      allLogs.forEach(log => {
        const logDate = new Date(log.completedAt);
        logDate.setHours(0, 0, 0, 0);
        const dateKey = logDate.toISOString().split('T')[0];
        logsByDate.set(dateKey, (logsByDate.get(dateKey) || 0) + 1);
      });
      
      // Sort dates descending
      const sortedDates = Array.from(logsByDate.keys()).sort((a, b) => b.localeCompare(a));
      
      // Calculate streak - only count days where targetCount is met
      let consecutiveDays = 0;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const todayKey = todayDate.toISOString().split('T')[0];
      
      // Check if today meets target
      const todayCount = logsByDate.get(todayKey) || 0;
      if (todayCount >= habit.targetCount) {
        consecutiveDays = 1;
        
        // Count backwards for consecutive days that meet target
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDateKey = sortedDates[i - 1]; // Previous in sorted list (more recent)
          const prevDateKey = sortedDates[i]; // Next in sorted list (less recent)
          
          const currentDate = new Date(currentDateKey);
          const prevDate = new Date(prevDateKey);
          
          // Calculate if dates are exactly 1 day apart
          const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Dates are consecutive
            const prevCount = logsByDate.get(prevDateKey) || 0;
            if (prevCount >= habit.targetCount) {
              consecutiveDays++;
            } else {
              break; // Gap in streak - target not met
            }
          } else {
            break; // Gap in dates (more than 1 day apart)
          }
        }
      }
      
      newStreak = consecutiveDays;
      
      // Calculate longest streak
      let currentStreak = 0;
      let maxStreak = 0;
      for (let i = 0; i < sortedDates.length; i++) {
        const dateKey = sortedDates[i];
        const count = logsByDate.get(dateKey) || 0;
        
        if (count >= habit.targetCount) {
          if (i === 0) {
            currentStreak = 1;
          } else {
            const currentDate = new Date(dateKey);
            const prevDate = new Date(sortedDates[i - 1]);
            const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              // Consecutive day
              currentStreak++;
            } else {
              // Gap in dates
              currentStreak = 1;
            }
          }
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      longestStreak = Math.max(longestStreak, maxStreak, newStreak);
    }

    await Habit.update(habitId, {
      currentStreak: newStreak,
      longestStreak
    });

    return res.status(201).json({
      success: true,
      data: { habitLog }
    });
  } catch (error: any) {
    console.error('Log habit error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      habitId: habitId || 'unknown'
    });
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to log habit',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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

    // Recalculate streak for the habit (with targetCount support)
    const habit = await Habit.findById(habitId);
    if (habit) {
      const allLogs = await HabitLog.findByHabitId(habitId, {
        limit: 500
      });

      let newStreak = 0;
      let longestStreak = habit.longestStreak;
      
      if (allLogs.length > 0) {
        // Group logs by date
        const logsByDate = new Map<string, number>();
        allLogs.forEach(log => {
          const logDate = new Date(log.completedAt);
          logDate.setHours(0, 0, 0, 0);
          const dateKey = logDate.toISOString().split('T')[0];
          logsByDate.set(dateKey, (logsByDate.get(dateKey) || 0) + 1);
        });
        
        // Sort dates descending
        const sortedDates = Array.from(logsByDate.keys()).sort((a, b) => b.localeCompare(a));
        
        // Calculate streak - only count days where targetCount is met
        let consecutiveDays = 0;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const todayKey = todayDate.toISOString().split('T')[0];
        
        // Check if today meets target
        const todayCount = logsByDate.get(todayKey) || 0;
        if (todayCount >= habit.targetCount) {
          consecutiveDays = 1;
          
          // Count backwards for consecutive days that meet target
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDateKey = sortedDates[i];
            const prevDate = new Date(prevDateKey);
            const expectedPrevDate = new Date(sortedDates[i - 1]);
            expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
            
            // Check if dates are consecutive
            if (prevDate.toISOString().split('T')[0] === expectedPrevDate.toISOString().split('T')[0]) {
              const prevCount = logsByDate.get(prevDateKey) || 0;
              if (prevCount >= habit.targetCount) {
                consecutiveDays++;
              } else {
                break; // Gap in streak - target not met
              }
            } else {
              break; // Gap in dates
            }
          }
        }
        
        newStreak = consecutiveDays;
        
        // Calculate longest streak
        let currentStreak = 0;
        let maxStreak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
          const dateKey = sortedDates[i];
          const count = logsByDate.get(dateKey) || 0;
          
          if (count >= habit.targetCount) {
            if (i === 0) {
              currentStreak = 1;
            } else {
              const currentDate = new Date(dateKey);
              const prevDate = new Date(sortedDates[i - 1]);
              const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff === 1) {
                // Consecutive day
                currentStreak++;
              } else {
                // Gap in dates
                currentStreak = 1;
              }
            }
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
        
        longestStreak = Math.max(longestStreak, maxStreak, newStreak);
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


