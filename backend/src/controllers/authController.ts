import { Request, Response } from 'express';
import { User } from '../models/User';
import { verifyFirebaseToken, getFirebaseUser } from '../services/firebase';
import { generateToken } from '../utils/jwt';

export const authenticate = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);
    const firebaseUser = await getFirebaseUser(decodedToken.uid);

    // Check if user exists in our database
    let user = await User.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        profilePicture: firebaseUser.photoURL || '',
        timeCategories: [],
        onboardingCompleted: false
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          timeCategories: user.timeCategories,
          weeklyBudget: user.weeklyBudget,
          income: user.income,
          onboardingCompleted: user.onboardingCompleted
        }
      }
    });
  } catch (error: any) {
    console.error('Authentication error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Authentication failed';
    if (error?.message?.includes('token')) {
      errorMessage = 'Invalid Firebase token';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return res.status(401).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          timeCategories: user.timeCategories,
          weeklyBudget: user.weeklyBudget,
          income: user.income,
          onboardingCompleted: user.onboardingCompleted
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};
