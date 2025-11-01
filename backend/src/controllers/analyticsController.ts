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

const getPeriodReport = async (req: Request, res: Response, isMonthly: boolean = false) => {
  try {
    const userId = (req as any).user.id;
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (isMonthly) {
      // Monthly report - current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Weekly report - current week
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    }

    // Get period time entries
    const periodTimeEntries = await TimeEntry.findByUserId(userId, {
      startDate: startDate,
      endDate: endDate
    });

    // Get period habit logs
    const periodHabitLogs = await HabitLog.findByUserId(userId, {
      startDate: startDate,
      endDate: endDate
    });

    // Get period expenses
    const periodExpenses = await Expense.findByUserId(userId, {
      startDate: startDate,
      endDate: endDate
    });

    // Get habits for streaks
    const habits = await Habit.findByUserId(userId, true);

    // Calculate productive vs wasted time
    const productiveTime = periodTimeEntries
      .filter(entry => entry.isProductive)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    const wastedTime = periodTimeEntries
      .filter(entry => !entry.isProductive)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    const totalTime = productiveTime + wastedTime;

    // Calculate daily breakdowns
    const dailyTimeBreakdown: { [date: string]: number } = {};
    const dailyHabitBreakdown: { [date: string]: number } = {};
    const dailyExpenseBreakdown: { [date: string]: number } = {};

    // Initialize all days in period
    const daysInPeriod = isMonthly ? 31 : 7;
    for (let i = 0; i < daysInPeriod; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      // Stop if beyond end date
      if (date > endDate) break;
      const dateKey = date.toISOString().split('T')[0];
      dailyTimeBreakdown[dateKey] = 0;
      dailyHabitBreakdown[dateKey] = 0;
      dailyExpenseBreakdown[dateKey] = 0;
    }

    // Fill in actual data
    periodTimeEntries.forEach(entry => {
      const dateKey = entry.startTime.toISOString().split('T')[0];
      if (!dailyTimeBreakdown[dateKey]) dailyTimeBreakdown[dateKey] = 0;
      dailyTimeBreakdown[dateKey] += entry.duration || 0;
    });

    periodHabitLogs.forEach(log => {
      const dateKey = log.completedAt.toISOString().split('T')[0];
      if (!dailyHabitBreakdown[dateKey]) dailyHabitBreakdown[dateKey] = 0;
      dailyHabitBreakdown[dateKey] += 1;
    });

    periodExpenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      if (!dailyExpenseBreakdown[dateKey]) dailyExpenseBreakdown[dateKey] = 0;
      dailyExpenseBreakdown[dateKey] += expense.amount;
    });

    // Calculate category breakdowns
    const timeCategoryBreakdown: { [category: string]: number } = {};
    const expenseCategoryBreakdown: { [category: string]: number } = {};

    periodTimeEntries.forEach(entry => {
      timeCategoryBreakdown[entry.category] = (timeCategoryBreakdown[entry.category] || 0) + (entry.duration || 0);
    });

    periodExpenses.forEach(expense => {
      expenseCategoryBreakdown[expense.category] = (expenseCategoryBreakdown[expense.category] || 0) + expense.amount;
    });

    // Prepare habit streaks data
    const habitStreaks = habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      targetCount: habit.targetCount
    }));

    const totalExpenses = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const completedLogs = periodHabitLogs.length;

    const reportType = isMonthly ? 'monthlyReport' : 'weeklyReport';

    return res.status(200).json({
      success: true,
      data: {
        [reportType]: {
          period: isMonthly ? 'monthly' : 'weekly',
          // Time data
          time: {
            total: totalTime,
            productive: productiveTime,
            wasted: wastedTime,
            dailyBreakdown: dailyTimeBreakdown,
            categoryBreakdown: timeCategoryBreakdown
          },
          // Habits data
          habits: {
            totalHabits: habits.length,
            completedLogs: completedLogs,
            streaks: habitStreaks,
            dailyBreakdown: dailyHabitBreakdown
          },
          // Expenses data
          expenses: {
            total: totalExpenses,
            categoryBreakdown: expenseCategoryBreakdown,
            dailyBreakdown: dailyExpenseBreakdown
          },
          // Raw data for compatibility
          startDate: startDate,
          endDate: endDate,
          dailyTimeBreakdown: dailyTimeBreakdown,
          dailyHabitBreakdown: dailyHabitBreakdown,
          dailyExpenseBreakdown: dailyExpenseBreakdown,
          timeCategoryBreakdown: timeCategoryBreakdown,
          expenseCategoryBreakdown: expenseCategoryBreakdown,
          totalTime: totalTime,
          totalHabits: completedLogs,
          totalExpenses: totalExpenses
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
      
      const reportType = isMonthly ? 'monthlyReport' : 'weeklyReport';
      return res.status(200).json({
        success: true,
        data: {
          [reportType]: {
            period: isMonthly ? 'monthly' : 'weekly',
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
      message: `Failed to get ${isMonthly ? 'monthly' : 'weekly'} report`,
      error: details || err?.message
    });
  } catch (error) {
    console.error(`Get ${isMonthly ? 'monthly' : 'weekly'} report error:`, error);
    const err: any = error;
    return res.status(500).json({
      success: false,
      message: `Failed to get ${isMonthly ? 'monthly' : 'weekly'} report`,
      error: err?.message
    });
  }
};

export const getWeeklyReport = async (req: Request, res: Response) => {
  return getPeriodReport(req, res, false);
};

export const getMonthlyReport = async (req: Request, res: Response) => {
  return getPeriodReport(req, res, true);
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

    // Get habits for better analysis
    const habits = await Habit.findByUserId(userId, true);
    
    // Calculate habit completion rates (with target count support)
    const habitStats = habits.map(habit => {
      const habitLogsCount = habitLogs.filter(log => log.habitId === habit.id).length;
      const expectedCompletions = habit.targetCount * 30; // 30 days * target per day
      const completionRate = expectedCompletions > 0 ? (habitLogsCount / expectedCompletions) * 100 : 0;
      return {
        habit,
        logsCount: habitLogsCount,
        completionRate,
        streak: habit.currentStreak
      };
    });

    // Calculate productivity insights
    const productivityRatio = totalProductiveTime + totalWastedTime > 0 
      ? (totalProductiveTime / (totalProductiveTime + totalWastedTime)) * 100 
      : 0;
    
    const totalTime = totalProductiveTime + totalWastedTime;
    const averageDailyTimeMinutes = averageDailyTime;
    const averageDailyHours = averageDailyTimeMinutes / 60;

    // Calculate expense trends
    const expensesByDate = expenses.reduce((acc, exp) => {
      const dateKey = exp.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(exp);
      return acc;
    }, {} as { [key: string]: typeof expenses });

    const dailyExpenseAmounts = Object.values(expensesByDate).map(dayExps => 
      dayExps.reduce((sum, exp) => sum + exp.amount, 0)
    );
    const expenseTrend = dailyExpenseAmounts.length > 1 
      ? dailyExpenseAmounts.slice(-7).reduce((sum, amt) => sum + amt, 0) / 7 - 
        dailyExpenseAmounts.slice(0, 7).reduce((sum, amt) => sum + amt, 0) / 7
      : 0;

    // Generate actionable insights
    const recommendations: Array<{
      type: 'positive' | 'warning' | 'negative' | 'recommendation';
      category: 'productivity' | 'habits' | 'expenses' | 'overall';
      title: string;
      message: string;
      priority: number; // Higher = more important
    }> = [];

    // Productivity insights
    if (productivityRatio >= 70) {
      recommendations.push({
        type: 'positive',
        category: 'productivity',
        title: 'Excellent Productivity!',
        message: `You're maintaining a ${Math.round(productivityRatio)}% productivity ratio. You're spending more time on productive activities than distractions.`,
        priority: 8
      });
    } else if (productivityRatio >= 50) {
      recommendations.push({
        type: 'warning',
        category: 'productivity',
        title: 'Productivity Could Be Better',
        message: `Your productivity is at ${Math.round(productivityRatio)}%. Try to reduce wasted time and focus more on productive activities.`,
        priority: 7
      });
    } else if (productivityRatio > 0) {
      recommendations.push({
        type: 'negative',
        category: 'productivity',
        title: 'Low Productivity Detected',
        message: `Only ${Math.round(productivityRatio)}% of your tracked time is productive. Consider limiting distractions and focusing on meaningful work.`,
        priority: 9
      });
    }

    if (totalWastedTime > totalProductiveTime && totalTime > 0) {
      const wastedHours = Math.round(totalWastedTime / 60);
      recommendations.push({
        type: 'negative',
        category: 'productivity',
        title: 'High Wasted Time',
        message: `You've spent ${wastedHours} hours on non-productive activities. Try to minimize distractions and set specific goals for each day.`,
        priority: 8
      });
    }

    if (averageDailyHours < 2 && totalTime > 0) {
      recommendations.push({
        type: 'recommendation',
        category: 'productivity',
        title: 'Track More Time',
        message: `You're only tracking ${Math.round(averageDailyHours * 10) / 10} hours per day on average. Track more activities to get better insights.`,
        priority: 5
      });
    }

    // Habit insights
    const avgCompletionRate = habitStats.length > 0
      ? habitStats.reduce((sum, stat) => sum + stat.completionRate, 0) / habitStats.length
      : 0;

    if (avgCompletionRate >= 80 && habits.length > 0) {
      recommendations.push({
        type: 'positive',
        category: 'habits',
        title: 'Great Habit Consistency!',
        message: `You're completing ${Math.round(avgCompletionRate)}% of your habit targets. You're building strong routines!`,
        priority: 8
      });
    } else if (avgCompletionRate < 50 && habits.length > 0) {
      recommendations.push({
        type: 'negative',
        category: 'habits',
        title: 'Low Habit Completion Rate',
        message: `You're only completing ${Math.round(avgCompletionRate)}% of your habit targets. Try setting smaller, more achievable targets to build momentum.`,
        priority: 9
      });
    }

    const topStreakHabit = habitStats.sort((a, b) => b.streak - a.streak)[0];
    if (topStreakHabit && topStreakHabit.streak >= 7) {
      recommendations.push({
        type: 'positive',
        category: 'habits',
        title: '🔥 Amazing Streak!',
        message: `You've maintained a ${topStreakHabit.streak}-day streak on "${topStreakHabit.habit.name}". Keep it going!`,
        priority: 7
      });
    }

    const strugglingHabits = habitStats.filter(s => s.completionRate < 30 && s.habit.isActive);
    if (strugglingHabits.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'habits',
        title: 'Habits Need Attention',
        message: `${strugglingHabits.length} habit${strugglingHabits.length > 1 ? 's' : ''} ${strugglingHabits.length > 1 ? 'are' : 'is'} struggling (${strugglingHabits.map(h => h.habit.name).join(', ')}). Consider reducing their target count or focusing on one at a time.`,
        priority: 6
      });
    }

    if (habits.length === 0) {
      recommendations.push({
        type: 'recommendation',
        category: 'habits',
        title: 'Start Building Habits',
        message: `You don't have any habits yet. Create your first habit to start building consistency and achieving your goals!`,
        priority: 7
      });
    }

    // Expense insights
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgDailyExpense = averageDailyExpenses;

    if (expenseTrend > 0 && Math.abs(expenseTrend) > avgDailyExpense * 0.2) {
      recommendations.push({
        type: 'warning',
        category: 'expenses',
        title: 'Spending Trend Increasing',
        message: `Your spending has increased recently. Review your expenses and identify areas where you can cut back.`,
        priority: 7
      });
    }

    if (topExpenseCategory && topExpenseCategory[1] > totalExpenses * 0.4) {
      recommendations.push({
        type: 'warning',
        category: 'expenses',
        title: 'High Spending Concentration',
        message: `${topExpenseCategory[0]} accounts for ${Math.round((topExpenseCategory[1] / totalExpenses) * 100)}% of your spending. Consider if this aligns with your priorities.`,
        priority: 6
      });
    }

    if (avgDailyExpense > 0 && expenses.length > 7) {
      const weeklyAverage = avgDailyExpense * 7;
      recommendations.push({
        type: 'recommendation',
        category: 'expenses',
        title: 'Weekly Spending Overview',
        message: `You're spending an average of ₹${Math.round(avgDailyExpense)} per day (₹${Math.round(weeklyAverage)}/week). Set a weekly budget to stay on track.`,
        priority: 5
      });
    }

    // Overall balance insights
    const hasTimeTracking = totalTime > 0;
    const hasHabits = habits.length > 0;
    const hasExpenses = expenses.length > 0;

    if (hasTimeTracking && hasHabits && hasExpenses) {
      if (productivityRatio >= 60 && avgCompletionRate >= 70 && expenseTrend <= 0) {
        recommendations.push({
          type: 'positive',
          category: 'overall',
          title: '🌟 Well-Balanced Lifestyle!',
          message: `You're maintaining high productivity, consistent habits, and controlled spending. You're on the right track!`,
          priority: 9
        });
      }
    }

    if (hasTimeTracking && !hasHabits) {
      recommendations.push({
        type: 'recommendation',
        category: 'overall',
        title: 'Add Habits for Better Tracking',
        message: `You're tracking time but not habits. Add habits to build consistency and achieve your goals faster.`,
        priority: 6
      });
    }

    if (!hasTimeTracking && hasHabits) {
      recommendations.push({
        type: 'recommendation',
        category: 'overall',
        title: 'Start Time Tracking',
        message: `You have habits but aren't tracking time. Start tracking time to see how you spend your days and improve productivity.`,
        priority: 6
      });
    }

    // Sort recommendations by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);

    const insights = {
      productivity: {
        totalProductiveTime,
        totalWastedTime,
        productivityRatio,
        averageDailyTime,
        mostProductiveCategory: mostProductiveCategory ? {
          category: mostProductiveCategory[0],
          time: mostProductiveCategory[1]
        } : null,
        totalTime
      },
      expenses: {
        averageDailyExpenses,
        topExpenseCategory: topExpenseCategory ? {
          category: topExpenseCategory[0],
          amount: topExpenseCategory[1]
        } : null,
        totalExpenses,
        expenseTrend,
        expensePercentage: topExpenseCategory && totalExpenses > 0 
          ? (topExpenseCategory[1] / totalExpenses) * 100 
          : 0
      },
      habits: {
        totalHabitCompletions: habitLogs.length,
        averageDailyHabits: habitLogs.length / 30,
        averageCompletionRate: avgCompletionRate,
        totalHabits: habits.length,
        activeHabits: habits.filter(h => h.isActive).length,
        topStreak: topStreakHabit ? topStreakHabit.streak : 0,
        strugglingHabitsCount: strugglingHabits.length
      },
      recommendations // Add recommendations array
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


