import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with full details
  console.error('🚨 Error Handler:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Firestore errors
  if ((err as any).code === 9 || (err as any).code === 'FAILED_PRECONDITION') {
    const message = 'Database index required. Please create the required Firestore index.';
    error = { message, statusCode: 503 } as AppError;
  }

  // Firestore permission errors
  if ((err as any).code === 7 || (err as any).code === 'PERMISSION_DENIED') {
    const message = 'Database permission denied. Please check your Firebase configuration.';
    error = { message, statusCode: 403 } as AppError;
  }

  // Firestore not found
  if ((err as any).code === 5 || (err as any).code === 'NOT_FOUND') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 } as AppError;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 } as AppError;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 } as AppError;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 } as AppError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 } as AppError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 } as AppError;
  }

  // Firebase not initialized
  if (err.message?.includes('Firebase Firestore not initialized')) {
    error = { 
      message: 'Database not available. Please check server logs.', 
      statusCode: 503 
    } as AppError;
  }

  // Don't expose stack traces in production
  const response: any = {
    success: false,
    error: error.message || 'Server Error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      code: (err as any).code,
      path: req.path
    };
  }

  res.status(error.statusCode || 500).json(response);
};



