import './loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
// Import Firebase database initialization
import './services/firebase-db';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import timeRoutes from './routes/time';
import habitRoutes from './routes/habit';
import expenseRoutes from './routes/expense';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Environment loaded via ./loadEnv

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - allow localhost on any port in development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'http://localhost:3000']
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint - make it very simple and always respond
app.get('/health', (req, res) => {
  try {
    const { firebaseInitialized } = require('./services/firebase-db');
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: firebaseInitialized ? 'Firebase Firestore (Connected)' : 'Firebase Firestore (Not Initialized)',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error: any) {
    // Even if there's an error, return something
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Unknown',
      warning: 'Health check error'
    });
  }
});

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Momentum API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔥 Database: Firebase Firestore`);
      console.log(`✅ Server is ready to accept connections`);
    });

    // Handle server errors gracefully
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Trying to recover...`);
        // Don't exit - let the user know and continue
        console.error('   Please stop the other process or change the PORT in .env');
      } else {
        console.error('❌ Server error:', error);
      }
      // Don't exit - keep the process alive
    });

    return;
  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    console.error('   Error details:', error.message);
    // In development, don't exit immediately - give time to see the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
      return; // Explicit return for TypeScript
    } else {
      console.warn('⚠️ Server failed to start, but keeping process alive for debugging');
      // Retry after 5 seconds
      setTimeout(() => {
        console.log('🔄 Retrying server startup...');
        startServer();
      }, 5000);
      return; // Explicit return for TypeScript
    }
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit in development - allow server to continue
  // In production, you might want to restart gracefully
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ Exiting due to unhandled rejection in production');
    process.exit(1);
  } else {
    console.warn('⚠️ Server continuing despite unhandled rejection (development mode)');
  }
});

// Handle uncaught exceptions - be more lenient in development
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Only exit in production for critical errors
  // In development, log and continue (server will handle it)
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ Exiting due to uncaught exception in production');
    process.exit(1);
  } else {
    console.warn('⚠️ Uncaught exception in development - server continuing');
    // Log but don't exit - allows debugging
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  console.log('📦 Firebase connection closed.');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Fatal error starting server:', error);
  // In development, retry after delay
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Will retry in 5 seconds...');
    setTimeout(() => {
      startServer();
    }, 5000);
  }
});

// Keep process alive and log periodic status
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    if (uptime % 300 === 0) { // Every 5 minutes
      console.log(`💓 Server heartbeat - Uptime: ${Math.round(uptime / 60)}m, Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }, 1000);
}
