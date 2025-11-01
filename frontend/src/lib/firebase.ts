import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

let app: FirebaseApp | null = null;
let _authInstance: Auth | null = null;
let _googleProviderInstance: GoogleAuthProvider | null = null;
let initializationAttempted = false;

// Lazy initialization function
const initializeFirebase = (): void => {
  // If already initialized, return
  if (_authInstance && _googleProviderInstance) {
    return;
  }

  // Prevent multiple initialization attempts if already tried and failed
  if (initializationAttempted && !_authInstance) {
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
    
    _authInstance = getAuth(app);
    _googleProviderInstance = new GoogleAuthProvider();
    
    console.log('✅ Firebase initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error);
  }
};

// Getter functions that ensure initialization and return real instances
const getAuthInstance = (): Auth => {
  initializeFirebase();
  if (!_authInstance) {
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    
    throw new Error(
      `Firebase not initialized. Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please configure these in your Vercel project settings (Settings → Environment Variables).`
    );
  }
  return _authInstance;
};

const getGoogleProviderInstance = (): GoogleAuthProvider => {
  initializeFirebase();
  if (!_googleProviderInstance) {
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    
    throw new Error(
      `Firebase not initialized. Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please configure these in your Vercel project settings (Settings → Environment Variables).`
    );
  }
  return _googleProviderInstance;
};

// Try to initialize immediately if we're in browser and have env vars
if (typeof window !== 'undefined') {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  
  if (apiKey && projectId && authDomain) {
    initializeFirebase();
  }
}

// Initialize immediately on client side if env vars are available
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
  } catch (e) {
    // Ignore - will initialize lazily
  }
}

// Export getter functions for accessing real instances (for Firebase functions)
// Named differently to avoid conflict with Firebase's getAuth function
export const getFirebaseAuth = () => getAuthInstance();
export const getFirebaseGoogleProvider = () => getGoogleProviderInstance();

// Export Proxy objects for property access and backward compatibility
// However, for Firebase functions like signInWithPopup, use getFirebaseAuth() instead
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    // If accessing 'getRealInstance' property, return the actual instance
    if (prop === 'getRealInstance') {
      return () => getAuthInstance();
    }
    const instance = getAuthInstance();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  has(_target, prop) {
    try {
      const instance = getAuthInstance();
      return prop in instance;
    } catch {
      return false;
    }
  },
  ownKeys() {
    const instance = getAuthInstance();
    return Object.keys(instance);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = getAuthInstance();
    return Object.getOwnPropertyDescriptor(instance, prop);
  },
  getPrototypeOf() {
    const instance = getAuthInstance();
    return Object.getPrototypeOf(instance);
  }
} as Auth);

export const googleProvider: GoogleAuthProvider = new Proxy({} as GoogleAuthProvider, {
  get(_target, prop) {
    // If accessing 'getRealInstance' property, return the actual instance
    if (prop === 'getRealInstance') {
      return () => getGoogleProviderInstance();
    }
    const instance = getGoogleProviderInstance();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  has(_target, prop) {
    try {
      const instance = getGoogleProviderInstance();
      return prop in instance;
    } catch {
      return false;
    }
  },
  getPrototypeOf() {
    const instance = getGoogleProviderInstance();
    return Object.getPrototypeOf(instance);
  }
} as GoogleAuthProvider);
export default app;
