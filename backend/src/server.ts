import './loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import net from 'net';
import http from 'http';
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

export const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Security middleware
app.use(helmet());

// Rate limiting - more lenient in development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: process.env.NODE_ENV === 'production' 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') // 100 in production
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});
app.use(limiter);

// CORS configuration
// - Allow localhost in development
// - Allow Vercel preview/prod domains in production
// - If running on Vercel serverless, allow same-origin by default
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      vercelUrl
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // In Vercel serverless, allow whatever origin called this API (same-origin calls)
    if (process.env.VERCEL) {
      return callback(null, true);
    }
    // Allow requests with no origin (like curl) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
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
let isStarting = false;
let retryTimeout: NodeJS.Timeout | null = null;

// Check if port is available
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    testServer.listen(port, () => {
      testServer.once('close', () => resolve(true));
      testServer.close();
    });
    testServer.on('error', () => {
      resolve(false);
    });
  });
};

// Cleanup old server instance properly
const cleanupServer = async (): Promise<void> => {
  if (serverInstance) {
    return new Promise((resolve) => {
      try {
        if (typeof serverInstance.close === 'function') {
          serverInstance.close(() => {
            serverInstance = null;
            isServerRunning = false;
            resolve();
          });
          // Force close after 2 seconds if graceful close doesn't work
          setTimeout(() => {
            if (serverInstance) {
              try {
                serverInstance.close();
              } catch (e) {
                // Ignore errors during force close
              }
              serverInstance = null;
              isServerRunning = false;
            }
            resolve();
          }, 2000);
        } else {
          serverInstance = null;
          isServerRunning = false;
          resolve();
        }
      } catch (error) {
        serverInstance = null;
        isServerRunning = false;
        resolve();
      }
    });
  }
};

// Check if server is actually responding
const isServerResponding = async (): Promise<boolean> => {
  try {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${PORT}/health`, { timeout: 1000 }, (res: any) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
};

// Start server with automatic retry
const startServer = async (): Promise<void> => {
  // Prevent multiple simultaneous start attempts
  if (isStarting) {
    return;
  }

  // Prevent multiple server instances - check if server is actually running
  if (serverInstance && isServerRunning) {
    // Verify server is actually responding
    const responding = await isServerResponding();
    if (responding) {
      // Server is running and responding - don't retry
      return;
    } else {
      // Server instance exists but not responding - clean it up
      console.log('⚠️ Server instance exists but not responding. Cleaning up...');
      await cleanupServer();
    }
  }

  // If port is in use, check if it's our own server responding
  const portAvailable = await isPortAvailable(PORT);
  if (!portAvailable) {
    const responding = await isServerResponding();
    if (responding) {
      // Port is in use but it's our server responding - we're already running!
      console.log(`✅ Server is already running on port ${PORT} and responding`);
      isServerRunning = true;
      isStarting = false;
      // Clear any retry timeouts since we're already running
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      return;
    }
    // Port is in use but server not responding - might be another process
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error('   Please stop the other process or change PORT in .env');
    isStarting = false;
    
    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    // Retry in 10 seconds
    retryTimeout = setTimeout(() => {
      startServer();
    }, 10000);
    return;
  }

  isStarting = true;

  try {
    // Clean up old instance if it exists
    if (serverInstance) {
      console.log('🧹 Cleaning up old server instance...');
      await cleanupServer();
      // Wait a bit for port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }

    serverInstance = app.listen(PORT, () => {
      isServerRunning = true;
      isStarting = false;
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔥 Database: Firebase Firestore`);
      console.log(`✅ Server is ready to accept connections`);
      console.log(`💡 Server will automatically recover from errors`);
    });

    // Handle server errors gracefully - NEVER EXIT
    serverInstance.on('error', async (error: any) => {
      isServerRunning = false;
      isStarting = false;
      
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('   Please stop the other process or change PORT in .env');
        console.log('🔄 Will retry in 10 seconds...');
        
        // Clean up this instance
        await cleanupServer();
        
        // Clear any existing retry timeout
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
        
        retryTimeout = setTimeout(() => {
          startServer();
        }, 10000);
      } else {
        console.error('❌ Server error:', error.message);
        console.log('🔄 Will retry in 5 seconds...');
        
        // Clean up this instance
        await cleanupServer();
        
        // Clear any existing retry timeout
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
        
        retryTimeout = setTimeout(() => {
          startServer();
        }, 5000);
      }
    });

    // Keep server alive - restart on close
    serverInstance.on('close', () => {
      isServerRunning = false;
      isStarting = false;
      serverInstance = null;
      console.warn('⚠️ Server connection closed.');
      
      // Only auto-restart if not manually closed
      if (!retryTimeout) {
        console.log('🔄 Will attempt to restart in 3 seconds...');
        retryTimeout = setTimeout(() => {
          if (!isServerRunning && !isStarting) {
            startServer();
          }
        }, 3000);
      }
    });

    // Listen for connection errors
    serverInstance.on('clientError', (err: any) => {
      console.warn('⚠️ Client error (non-fatal):', err.message);
      // Don't crash - just log
    });

    return;
  } catch (error: any) {
    isServerRunning = false;
    isStarting = false;
    console.error('❌ Failed to start server:', error.message);
    console.error('   Error details:', error.stack);
    
    // Clean up if server instance was created
    await cleanupServer();
    
    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    // ALWAYS retry - never exit
    console.log('🔄 Will retry in 5 seconds...');
    retryTimeout = setTimeout(() => {
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
  
  // Clear any retry timeouts
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  isStarting = false;
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
  
  // Clear any retry timeouts
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  isStarting = false;
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Only start server if not in serverless environment (Vercel)
// Vercel provides VERCEL environment variable when running as serverless function
if (!process.env.VERCEL) {
  // Start the server with error recovery
  startServer().catch((error) => {
    console.error('❌ Fatal error starting server:', error);
    // ALWAYS retry - never give up
    console.log('🔄 Will retry in 5 seconds...');
    isStarting = false;
    
    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    retryTimeout = setTimeout(() => {
      startServer();
    }, 5000);
  });

  // Keep process alive and monitor health
  const keepAlive = () => {
    let lastHeartbeat = 0;
    
    // Periodic health check and status logging (less aggressive - every 30 seconds)
    setInterval(() => {
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      // Log heartbeat every 5 minutes
      const minutes = Math.floor(uptime / 60);
      if (minutes !== lastHeartbeat && minutes > 0 && minutes % 5 === 0) {
        lastHeartbeat = minutes;
        console.log(`💓 Server heartbeat - Uptime: ${minutes}m, Memory: ${heapUsedMB}MB`);
      }
      
      // Check if server is still running (only if we're not already starting)
      // Check less frequently - every 30 seconds instead of every second
      if (!isServerRunning && !isStarting && !serverInstance && !retryTimeout) {
        // Only attempt recovery if we've been down for more than 10 seconds
        if (uptime % 10 === 0) {
          console.warn('⚠️ Server appears to be down. Attempting recovery...');
          startServer();
        }
      }
      
      // Memory warning (over 500MB)
      if (heapUsedMB > 500) {
        console.warn(`⚠️ High memory usage: ${heapUsedMB}MB`);
      }
    }, 30000); // Check every 30 seconds instead of every second
  };

  // Keep process alive - prevent any automatic exits
  process.stdin.resume();
  
  // Handle any attempt to exit
  process.on('exit', (code) => {
    console.log(`⚠️ Process exiting with code ${code}`);
    // Clean up retry timeout if process is exiting
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  });

  keepAlive();
}
