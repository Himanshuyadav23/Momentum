import { Request, Response } from 'express';
import { User } from '../models/User';
import { usersCollection, timeEntriesCollection, habitsCollection, expensesCollection, habitLogsCollection, firestoreHelpers } from '../services/firebase-db';

// Get system-wide statistics
export const getStats = async (req: Request, res: Response) => {
  try {
    // Get user count
    const totalUsers = await User.count();
    
    // Get admin count
    const adminSnapshot = await usersCollection().where('isAdmin', '==', true).get();
    const adminCount = adminSnapshot.size;

    // Get total time entries
    const timeEntriesSnapshot = await timeEntriesCollection().get();
    const totalTimeEntries = timeEntriesSnapshot.size;

    // Get total habits
    const habitsSnapshot = await habitsCollection().get();
    const totalHabits = habitsSnapshot.size;

    // Get total expenses
    const expensesSnapshot = await expensesCollection().get();
    const totalExpenses = expensesSnapshot.size;

    // Get total habit logs
    const habitLogsSnapshot = await habitLogsCollection().get();
    const totalHabitLogs = habitLogsSnapshot.size;

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsersSnapshot = await usersCollection()
      .where('createdAt', '>=', firestoreHelpers.dateToTimestamp(sevenDaysAgo))
      .get();
    const recentUsersCount = recentUsersSnapshot.size;

    // Get users with onboarding completed
    const onboardedSnapshot = await usersCollection().where('onboardingCompleted', '==', true).get();
    const onboardedCount = onboardedSnapshot.size;

    // Get active users (users with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Check time entries for active users
    const activeTimeEntries = await timeEntriesCollection()
      .where('createdAt', '>=', firestoreHelpers.dateToTimestamp(thirtyDaysAgo))
      .get();
    const activeUserIds = new Set(activeTimeEntries.docs.map(doc => doc.data().userId));
    
    // Check habit logs for active users
    const activeHabitLogs = await habitLogsCollection()
      .where('createdAt', '>=', firestoreHelpers.dateToTimestamp(thirtyDaysAgo))
      .get();
    activeHabitLogs.docs.forEach(doc => {
      activeUserIds.add(doc.data().userId);
    });
    
    // Check expenses for active users
    const activeExpenses = await expensesCollection()
      .where('createdAt', '>=', firestoreHelpers.dateToTimestamp(thirtyDaysAgo))
      .get();
    activeExpenses.docs.forEach(doc => {
      activeUserIds.add(doc.data().userId);
    });

    const activeUsersCount = activeUserIds.size;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminCount,
          regular: totalUsers - adminCount,
          recent: recentUsersCount,
          onboarded: onboardedCount,
          active: activeUsersCount
        },
        timeEntries: {
          total: totalTimeEntries
        },
        habits: {
          total: totalHabits
        },
        expenses: {
          total: totalExpenses
        },
        habitLogs: {
          total: totalHabitLogs
        }
      }
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to get admin statistics'
    });
  }
};

// Get all users with pagination
export const getUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const users = await User.findAll({ limit });

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      // Count user's time entries
      const timeEntriesCount = await timeEntriesCollection()
        .where('userId', '==', user.id)
        .get();
      
      // Count user's habits
      const habitsCount = await habitsCollection()
        .where('userId', '==', user.id)
        .get();
      
      // Count user's expenses
      const expensesCount = await expensesCollection()
        .where('userId', '==', user.id)
        .get();

      return {
        ...user,
        stats: {
          timeEntries: timeEntriesCount.size,
          habits: habitsCount.size,
          expenses: expensesCount.size
        }
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        total: await User.count()
      }
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to get users'
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const timeEntriesCount = await timeEntriesCollection()
      .where('userId', '==', user.id)
      .get();
    
    const habitsCount = await habitsCollection()
      .where('userId', '==', user.id)
      .get();
    
    const expensesCount = await expensesCollection()
      .where('userId', '==', user.id)
      .get();

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          stats: {
            timeEntries: timeEntriesCount.size,
            habits: habitsCount.size,
            expenses: expensesCount.size
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to get user'
    });
  }
};

// Update user (admin can update any user)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role, isAdmin, onboardingCompleted } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

    // If role is set to admin, also set isAdmin to true
    if (role === 'admin' && isAdmin !== false) {
      updateData.isAdmin = true;
    }

    const updatedUser = await User.update(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { user: updatedUser }
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to update user'
    });
  }
};

// Delete user (admin can delete any user)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === (req as any).user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const deleted = await User.delete(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to delete user'
    });
  }
};

