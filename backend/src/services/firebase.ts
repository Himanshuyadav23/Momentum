import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for Auth (separate from Firestore)
const initializeFirebaseAuth = () => {
  try {
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn('⚠️ FIREBASE_PROJECT_ID not set - Firebase Auth will not work');
        return false;
      }
      
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

      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        console.warn('⚠️ Firebase Auth credentials incomplete');
        return false;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });

      console.log('✅ Firebase Admin SDK (Auth) initialized');
      return true;
    }
    return true;
  } catch (error: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK (Auth):', error.message);
    return false;
  }
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    if (!admin.apps.length) {
      const initialized = initializeFirebaseAuth();
      if (!initialized) {
        throw new Error('Firebase Admin SDK not initialized. Please check your .env configuration.');
      }
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    try {
      const base64Payload = idToken.split('.')[1];
      const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const payload = JSON.parse(jsonPayload);
      const expectedProjectId = (admin.app().options as any)?.projectId || process.env.FIREBASE_PROJECT_ID;
      console.error('Firebase token verification failed. Details:', {
        expectedProjectId,
        token_aud: payload?.aud,
        token_iss: payload?.iss,
        token_sub: payload?.sub,
      });
    } catch (_) {
      // ignore decode errors
    }
    console.error('Firebase token verification error:', error);
    throw new Error(`Invalid Firebase token: ${error?.message || 'Token verification failed'}`);
  }
};

// Get user by Firebase UID
export const getFirebaseUser = async (uid: string) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error: any) {
    console.error('Firebase user fetch error:', error);
    
    // Check if it's a network/DNS error
    if (error?.code === 'app/network-error' || 
        error?.message?.includes('ENOTFOUND') || 
        error?.message?.includes('getaddrinfo') ||
        error?.errorInfo?.code === 'app/network-error') {
      throw new Error('Network error: Cannot connect to Firebase services. Please check your internet connection.');
    }
    
    // Check if it's an actual "user not found" error
    if (error?.code === 'auth/user-not-found' || error?.errorInfo?.code === 'auth/user-not-found') {
      throw new Error('User not found in Firebase');
    }
    
    // For other Firebase errors, pass through the original message
    throw new Error(error?.message || 'Failed to fetch user from Firebase');
  }
};

// Initialize Firebase on module load
const authInitialized = initializeFirebaseAuth();
if (!authInitialized && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ Firebase Auth may not work - credentials missing');
}

export default admin;



