import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let initializationAttempted = false;

// Lazy initialization function
const initializeFirebase = (): void => {
  // If already initialized, return
  if (authInstance && googleProviderInstance) {
    return;
  }

  // Prevent multiple initialization attempts
  if (initializationAttempted && !authInstance) {
    return;
  }
  initializationAttempted = true;

  // Check if Firebase environment variables are set
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  if (!apiKey || !projectId || !authDomain) {
    const missingVars = [];
    if (!apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    
    console.error('❌ Firebase environment variables not set:', missingVars.join(', '));
    console.error('   Authentication will not work. Please set these variables in Vercel environment settings.');
    // Don't throw error at module load - let it fail gracefully at runtime
    return;
  }

  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
    }
    
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    
    console.log('✅ Firebase initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error);
    // Don't throw - let it fail gracefully at runtime
  }
};

// Getter functions that initialize on first access
const getAuthInstance = (): Auth => {
  initializeFirebase();
  if (!authInstance) {
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    
    throw new Error(
      `Firebase not initialized. Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please configure these in your Vercel project settings (Settings → Environment Variables).`
    );
  }
  return authInstance;
};

const getGoogleProviderInstance = (): GoogleAuthProvider => {
  initializeFirebase();
  if (!googleProviderInstance) {
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    
    throw new Error(
      `Firebase not initialized. Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please configure these in your Vercel project settings (Settings → Environment Variables).`
    );
  }
  return googleProviderInstance;
};

// Export lazy getters using Proxy for backwards compatibility
// This allows existing code to use `auth` and `googleProvider` directly
// The Proxy intercepts property access and initializes Firebase on first use
export const auth = (() => {
  let instance: Auth | null = null;
  return new Proxy({} as Auth, {
    get(_, prop) {
      if (!instance) {
        instance = getAuthInstance();
      }
      const value = (instance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    }
  });
})();

export const googleProvider = (() => {
  let instance: GoogleAuthProvider | null = null;
  return new Proxy({} as GoogleAuthProvider, {
    get(_, prop) {
      if (!instance) {
        instance = getGoogleProviderInstance();
      }
      const value = (instance as any)[prop];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    }
  });
})();

export default (() => {
  initializeFirebase();
  return app;
})();


