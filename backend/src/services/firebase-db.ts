import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let firebaseInitialized = false;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      console.log('🔧 Attempting to initialize Firebase Admin SDK...');
      console.log('🔧 Checking environment variables...');
      
      // Check if we have the required environment variables
      if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn('⚠️ FIREBASE_PROJECT_ID is not set.');
        console.warn('   Available env vars:', Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ') || 'NONE');
        console.warn('   Please configure backend/.env with Firebase credentials.');
        return false;
      }
      
      console.log(`✅ FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
      
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      };

      console.log(`🔧 Private key: ${serviceAccount.private_key ? 'SET (' + serviceAccount.private_key.substring(0, 20) + '...)' : 'NOT SET'}`);
      console.log(`🔧 Client email: ${serviceAccount.client_email || 'NOT SET'}`);

      // Validate required fields
      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        console.error('❌ Firebase credentials incomplete.');
        console.error('   Missing:', {
          private_key: !serviceAccount.private_key,
          client_email: !serviceAccount.client_email
        });
        return false;
      }

      console.log('🔧 Initializing Firebase Admin SDK...');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });

      db = admin.firestore();
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully!');
      return true;
    } else {
      console.log('✅ Firebase Admin SDK already initialized');
      db = admin.firestore();
      firebaseInitialized = true;
      return true;
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize Firebase:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Stack:', error.stack);
    console.warn('⚠️ Server will continue but database features will be unavailable.');
    return false;
  }
};

// Initialize Firebase on module load - but don't crash if it fails
// Also allow manual re-initialization
const initResult = initializeFirebase();
if (!initResult) {
  console.warn('⚠️ Firebase initialization failed on startup. Will retry on first database access.');
}

// Export function to manually retry initialization
export const retryFirebaseInit = () => {
  if (!firebaseInitialized) {
    console.log('🔄 Retrying Firebase initialization...');
    return initializeFirebase();
  }
  return true;
};

// Export with null checks and retry logic - NEVER throw, always retry
const getDb = () => {
  if (!db) {
    // Try to initialize again - maybe .env was loaded after module import
    console.log('⚠️ Firebase not initialized. Attempting to initialize...');
    const retried = initializeFirebase();
    if (!retried || !db) {
      // Try one more time after a short delay
      console.log('⚠️ Retrying Firebase initialization in 2 seconds...');
      setTimeout(() => {
        initializeFirebase();
      }, 2000);
      // Still return db if it exists, otherwise throw (but this should be caught)
      if (!db) {
        throw new Error('Firebase Firestore not initialized. Please check your .env configuration in backend/.env');
      }
    }
  }
  return db;
};

// User Collection
export const usersCollection = () => getDb().collection('users');

// Time Entries Collection
export const timeEntriesCollection = () => getDb().collection('timeEntries');

// Habits Collection
export const habitsCollection = () => getDb().collection('habits');

// Habit Logs Collection
export const habitLogsCollection = () => getDb().collection('habitLogs');

// Expenses Collection
export const expensesCollection = () => getDb().collection('expenses');

// Helper functions for Firestore operations
export const firestoreHelpers = {
  // Convert Firestore timestamp to Date
  timestampToDate: (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  },

  // Convert Date to Firestore timestamp
  dateToTimestamp: (date: Date) => {
    return admin.firestore.Timestamp.fromDate(date);
  },

  // Generate unique ID
  generateId: () => {
    return getDb().collection('_').doc().id;
  },

  // Batch operations
  batch: () => {
    return getDb().batch();
  }
};

export { getDb, firebaseInitialized };
export default () => getDb();


