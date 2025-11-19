import express from 'express';
import { User } from '../models/User';
import { usersCollection, firestoreHelpers } from '../services/firebase-db';

const router = express.Router();

// ONE-TIME ADMIN PROMOTION ENDPOINT
// This endpoint allows promoting a user to admin using a secret key
// Remove this route after promoting yourself to admin for security
router.post('/promote-admin', async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Secret key to prevent unauthorized access
    // Change this to a secure random string in production
    const ADMIN_PROMOTION_KEY = process.env.ADMIN_PROMOTION_KEY || 'momentum-admin-2024';

    if (secretKey !== ADMIN_PROMOTION_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const snapshot = await usersCollection().where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const user = {
      id: doc.id,
      ...data,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as any;

    // Promote to admin
    const updatedUser = await User.update(user.id, {
      role: 'admin',
      isAdmin: true
    });

    if (updatedUser) {
      return res.status(200).json({
        success: true,
        message: `Successfully promoted ${updatedUser.name} to admin!`,
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            isAdmin: updatedUser.isAdmin
          }
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  } catch (error: any) {
    console.error('Promote admin error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to promote user to admin'
    });
  }
});

export default router;









