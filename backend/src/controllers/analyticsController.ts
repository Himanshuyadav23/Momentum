import { Request, Response } from 'express';
import { TimeEntry } from '../models/TimeEntry';
import { Habit, HabitLog } from '../models/Habit';
import { Expense } from '../models/Expense';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's time entries
    const todayTimeEntries = await TimeEntry.findByUserId(userId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Get active habits
    const habits = await Habit.findByUserId(userId, true);

    // Get today's habit logs
    const todayHabitLogs = await HabitLog.findByUserId(userId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Get today's expenses
    const todayExpenses = await Expense.findByUserId(userId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    // Calculate totals
    const totalTimeToday = todayTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalExpensesToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const completedHabitsToday = todayHabitLogs.length;

    return res.status(200).json({
      success: true,
      data: {
        dashboard: {
          totalTimeToday,
          totalExpensesToday,
          completedHabitsToday,
          totalHabits: habits.length,
          activeTimer: todayTimeEntries.find(entry => entry.isActive) || null
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const code = err?.code;
    
    // Log full error details for debugging
    console.error('Error code:', code);
    console.error('Error details:', details);
    
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex || code === 9) {
      const match = details?.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
      const indexUrl = match ? match[0] : undefined;
      
      console.warn('⚠️ Firestore index error detected. If indexes are enabled, try restarting the backend server.');
      
      return res.status(200).json({
        success: true,
        data: {
          dashboard: {
            totalTimeToday: 0,
            totalExpensesToday: 0,
            completedHabitsToday: 0,
            totalHabits: 0,
            activeTimer: null
          }
        },
        message: 'Firestore index required. If indexes are enabled, try restarting the backend server.',
        error: indexUrl ? `Index URL: ${indexUrl}` : 'Create the required Firestore composite index for habitLogs collection.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: details || err?.message
    });
  }
};

export const getWeeklyReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get weekly time entries
    const weeklyTimeEntries = await TimeEntry.findByUserId(userId, {
      startDate: startOfWeek,
      endDate: endOfWeek
    });

    // Get weekly habit logs
    const weeklyHabitLogs = await HabitLog.findByUserId(userId, {
      startDate: startOfWeek,
      endDate: endOfWeek
    });

    // Get weekly expenses
    const weeklyExpenses = await Expense.findByUserId(userId, {
      startDate: startOfWeek,
      endDate: endOfWeek
    });

    // Calculate daily breakdowns
    const dailyTimeBreakdown: { [date: string]: number } = {};
    const dailyHabitBreakdown: { [date: string]: number } = {};
    const dailyExpenseBreakdown: { [date: string]: number } = {};

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyTimeBreakdown[dateKey] = 0;
      dailyHabitBreakdown[dateKey] = 0;
      dailyExpenseBreakdown[dateKey] = 0;
    }

    // Fill in actual data
    weeklyTimeEntries.forEach(entry => {
      const dateKey = entry.startTime.toISOString().split('T')[0];
      dailyTimeBreakdown[dateKey] += entry.duration || 0;
    });

    weeklyHabitLogs.forEach(log => {
      const dateKey = log.completedAt.toISOString().split('T')[0];
      dailyHabitBreakdown[dateKey] += 1;
    });

    weeklyExpenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      dailyExpenseBreakdown[dateKey] += expense.amount;
    });

    // Calculate category breakdowns
    const timeCategoryBreakdown: { [category: string]: number } = {};
    const expenseCategoryBreakdown: { [category: string]: number } = {};

    weeklyTimeEntries.forEach(entry => {
      timeCategoryBreakdown[entry.category] = (timeCategoryBreakdown[entry.category] || 0) + (entry.duration || 0);
    });

    weeklyExpenses.forEach(expense => {
      expenseCategoryBreakdown[expense.category] = (expenseCategoryBreakdown[expense.category] || 0) + expense.amount;
    });

    return res.status(200).json({
      success: true,
      data: {
        weeklyReport: {
          startDate: startOfWeek,
          endDate: endOfWeek,
          dailyTimeBreakdown,
          dailyHabitBreakdown,
          dailyExpenseBreakdown,
          timeCategoryBreakdown,
          expenseCategoryBreakdown,
          totalTime: Object.values(dailyTimeBreakdown).reduce((sum, time) => sum + time, 0),
          totalHabits: Object.values(dailyHabitBreakdown).reduce((sum, habits) => sum + habits, 0),
          totalExpenses: Object.values(dailyExpenseBreakdown).reduce((sum, expenses) => sum + expenses, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const code = err?.code;
    
    console.error('Error code:', code);
    console.error('Error details:', details);
    
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex || code === 9) {
      const match = details?.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
      const indexUrl = match ? match[0] : undefined;
      
      console.warn('⚠️ Firestore index error detected. If indexes are enabled, try restarting the backend server.');
      
      return res.status(200).json({
        success: true,
        data: {
          weeklyReport: {
            startDate: null,
            endDate: null,
            dailyTimeBreakdown: {},
            dailyHabitBreakdown: {},
            dailyExpenseBreakdown: {},
            timeCategoryBreakdown: {},
            expenseCategoryBreakdown: {},
            totalTime: 0,
            totalHabits: 0,
            totalExpenses: 0
          }
        },
        message: 'Firestore index required. If indexes are enabled, try restarting the backend server.',
        error: indexUrl ? `Index URL: ${indexUrl}` : 'Create the required Firestore composite index.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get weekly report',
      error: details || err?.message
    });
  }
};

export const getInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get last 30 days of data
    const timeEntries = await TimeEntry.findByUserId(userId, {
      startDate: thirtyDaysAgo,
      endDate: today,
      limit: 1000
    });

    const habitLogs = await HabitLog.findByUserId(userId, {
      startDate: thirtyDaysAgo,
      endDate: today,
      limit: 1000
    });

    const expenses = await Expense.findByUserId(userId, {
      startDate: thirtyDaysAgo,
      endDate: today,
      limit: 1000
    });

    // Calculate insights
    const totalProductiveTime = timeEntries
      .filter(entry => entry.isProductive)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const totalWastedTime = timeEntries
      .filter(entry => !entry.isProductive)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const averageDailyTime = timeEntries.length > 0 
      ? timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 30 
      : 0;

    const averageDailyExpenses = expenses.length > 0
      ? expenses.reduce((sum, expense) => sum + expense.amount, 0) / 30
      : 0;

    const mostProductiveCategory = Object.entries(
      timeEntries
        .filter(entry => entry.isProductive)
        .reduce((acc, entry) => {
          acc[entry.category] = (acc[entry.category] || 0) + (entry.duration || 0);
          return acc;
        }, {} as { [key: string]: number })
    ).sort(([,a], [,b]) => b - a)[0];

    const topExpenseCategory = Object.entries(
      expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as { [key: string]: number })
    ).sort(([,a], [,b]) => b - a)[0];

    const insights = {
      productivity: {
        totalProductiveTime,
        totalWastedTime,
        productivityRatio: totalProductiveTime + totalWastedTime > 0 
          ? (totalProductiveTime / (totalProductiveTime + totalWastedTime)) * 100 
          : 0,
        averageDailyTime,
        mostProductiveCategory: mostProductiveCategory ? {
          category: mostProductiveCategory[0],
          time: mostProductiveCategory[1]
        } : null
      },
      expenses: {
        averageDailyExpenses,
        topExpenseCategory: topExpenseCategory ? {
          category: topExpenseCategory[0],
          amount: topExpenseCategory[1]
        } : null,
        totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0)
      },
      habits: {
        totalHabitCompletions: habitLogs.length,
        averageDailyHabits: habitLogs.length / 30
      }
    };

    return res.status(200).json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    const err: any = error;
    const details: string | undefined = err?.details || err?.message;
    const code = err?.code;
    
    console.error('Error code:', code);
    console.error('Error details:', details);
    
    const needsIndex = typeof details === 'string' && details.includes('requires an index');
    if (needsIndex || code === 9) {
      console.warn('⚠️ Firestore index error detected. If indexes are enabled, try restarting the backend server.');
      return res.status(200).json({
        success: true,
        data: {
          insights: {
            productivity: {
              totalProductiveTime: 0,
              totalWastedTime: 0,
              productivityRatio: 0,
              averageDailyTime: 0,
              mostProductiveCategory: null
            },
            expenses: {
              averageDailyExpenses: 0,
              topExpenseCategory: null,
              totalExpenses: 0
            },
            habits: {
              totalHabitCompletions: 0,
              averageDailyHabits: 0
            }
          }
        },
        message: 'Firestore index required. If indexes are enabled, try restarting the backend server.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: details || err?.message
    });
  }
};


