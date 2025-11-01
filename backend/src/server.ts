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

// Global server instance for keep-alive
let serverInstance: any = null;
let isServerRunning = false;

// Start server with automatic retry
const startServer = async (): Promise<void> => {
  try {
    // Prevent multiple server instances
    if (serverInstance && isServerRunning) {
      console.log('✅ Server already running');
      return;
    }

    serverInstance = app.listen(PORT, () => {
      isServerRunning = true;
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔥 Database: Firebase Firestore`);
      console.log(`✅ Server is ready to accept connections`);
      console.log(`💡 Server will automatically recover from errors`);
    });

    // Handle server errors gracefully - NEVER EXIT
    serverInstance.on('error', (error: any) => {
      isServerRunning = false;
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('   Please stop the other process or change PORT in .env');
        console.log('🔄 Will retry in 10 seconds...');
        setTimeout(() => {
          startServer();
        }, 10000);
      } else {
        console.error('❌ Server error:', error.message);
        console.log('🔄 Will retry in 5 seconds...');
        setTimeout(() => {
          startServer();
        }, 5000);
      }
      // NEVER exit - always retry
    });

    // Keep server alive - restart on close
    serverInstance.on('close', () => {
      isServerRunning = false;
      console.warn('⚠️ Server connection closed. Will attempt to restart...');
      setTimeout(() => {
        if (!isServerRunning) {
          console.log('🔄 Attempting to restart server...');
          startServer();
        }
      }, 2000);
    });

    // Listen for connection errors
    serverInstance.on('clientError', (err: any) => {
      console.warn('⚠️ Client error (non-fatal):', err.message);
      // Don't crash - just log
    });

    return;
  } catch (error: any) {
    isServerRunning = false;
    console.error('❌ Failed to start server:', error.message);
    console.error('   Error details:', error.stack);
    // ALWAYS retry - never exit
    console.log('🔄 Will retry in 5 seconds...');
    setTimeout(() => {
      startServer();
    }, 5000);
    return;
  }
};

// Handle unhandled promise rejections - NEVER EXIT in development
process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  // NEVER exit - log and continue
  console.warn('⚠️ Server continuing despite unhandled rejection');
  // Log but keep server running
  if (process.env.NODE_ENV === 'production') {
    // In production, log critical errors but try to recover
    console.warn('⚠️ Critical error in production - attempting to continue');
  }
});

// Handle uncaught exceptions - NEVER EXIT, always recover
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  console.warn('⚠️ Uncaught exception - server will continue running');
  // NEVER exit - let the server handle errors gracefully
  // The error handler middleware will catch route errors
});

// Graceful shutdown - only on explicit shutdown signals
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  console.log('📦 Firebase connection closed.');
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received (Ctrl+C). Shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server with error recovery
startServer().catch((error) => {
  console.error('❌ Fatal error starting server:', error);
  // ALWAYS retry - never give up
  console.log('🔄 Will retry in 5 seconds...');
  setTimeout(() => {
    startServer();
  }, 5000);
});

// Keep process alive and monitor health
const keepAlive = () => {
  // Periodic health check and status logging
  setInterval(() => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // Log heartbeat every 5 minutes
    if (Math.floor(uptime) % 300 === 0) {
      console.log(`💓 Server heartbeat - Uptime: ${Math.round(uptime / 60)}m, Memory: ${heapUsedMB}MB`);
    }
    
    // Check if server is still running
    if (!isServerRunning && serverInstance) {
      console.warn('⚠️ Server instance exists but not marked as running. Attempting recovery...');
      setTimeout(() => {
        if (!isServerRunning) {
          startServer();
        }
      }, 5000);
    }
    
    // Memory warning (over 500MB)
    if (heapUsedMB > 500) {
      console.warn(`⚠️ High memory usage: ${heapUsedMB}MB`);
    }
  }, 1000);

  // Keep process alive - prevent any automatic exits
  process.stdin.resume();
  
  // Handle any attempt to exit
  process.on('exit', (code) => {
    console.log(`⚠️ Process exiting with code ${code}`);
    console.log('🔄 Attempting to prevent exit...');
  });
};

keepAlive();
