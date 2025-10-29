import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Check if we have the required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('❌ FIREBASE_PROJECT_ID is not set. Please configure backend/.env before starting the server.');
      throw new Error('Missing FIREBASE_PROJECT_ID');
    } else {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });
    }

    console.log('✅ Firebase Admin SDK initialized');
  }
};

// Initialize Firebase on module load
initializeFirebase();

const db = admin.firestore();

// User Collection
export const usersCollection = db.collection('users');

// Time Entries Collection
export const timeEntriesCollection = db.collection('timeEntries');

// Habits Collection
export const habitsCollection = db.collection('habits');

// Habit Logs Collection
export const habitLogsCollection = db.collection('habitLogs');

// Expenses Collection
export const expensesCollection = db.collection('expenses');

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
    return admin.firestore().collection('_').doc().id;
  },

  // Batch operations
  batch: () => {
    return db.batch();
  }
};

export default db;


