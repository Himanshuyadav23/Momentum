import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export interface AdminRequest extends Request {
  user?: any;
}

export const requireAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Authentication required.' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not found.' 
      });
    }

    // Check if user is admin
    const isAdmin = user.isAdmin === true || user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Attach user to request for use in controllers
    req.user = user;
    return next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};









