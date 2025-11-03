// Vercel serverless function wrapper for Express backend
import { Handler } from '@vercel/node';
import { app } from '../src/server';

// Export the Express app as a serverless function
// Note: Vercel sets VERCEL env var, so server startup code won't run
export default app as Handler;

