import { Request, Response } from 'express';
import { User } from '../models/User';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, timeCategories, weeklyBudget, income, dailyProductiveHours } = req.body;

    const updatedUser = await User.update(userId, {
      name,
      timeCategories,
      weeklyBudget,
      income,
      dailyProductiveHours
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          profilePicture: updatedUser.profilePicture,
          timeCategories: updatedUser.timeCategories,
          weeklyBudget: updatedUser.weeklyBudget,
          income: updatedUser.income,
          dailyProductiveHours: updatedUser.dailyProductiveHours,
          onboardingCompleted: updatedUser.onboardingCompleted
        }
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error?.message || String(error)
    });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { timeCategories, firstHabit, weeklyBudget, income, dailyProductiveHours } = req.body;

    const updatedUser = await User.update(userId, {
      timeCategories,
      weeklyBudget,
      income,
      dailyProductiveHours,
      onboardingCompleted: true
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          profilePicture: updatedUser.profilePicture,
          timeCategories: updatedUser.timeCategories,
          weeklyBudget: updatedUser.weeklyBudget,
          income: updatedUser.income,
          dailyProductiveHours: updatedUser.dailyProductiveHours,
          onboardingCompleted: updatedUser.onboardingCompleted
        }
      }
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding'
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const deleted = await User.delete(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};


