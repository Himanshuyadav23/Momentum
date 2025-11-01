import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Check if Firebase environment variables are set
const hasFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
                         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

if (hasFirebaseConfig) {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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
    
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    console.log('✅ Firebase initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error);
    throw new Error(`Firebase initialization failed: ${error.message}. Please check your environment variables.`);
  }
} else {
  const missingVars = [];
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  
  console.error('❌ Firebase environment variables not set:', missingVars.join(', '));
  console.error('   Authentication will not work. Please set these variables in Vercel environment settings.');
  
  // Throw error instead of creating mock objects to fail fast
  throw new Error(`Firebase configuration missing. Required environment variables: ${missingVars.join(', ')}. Please configure these in your Vercel project settings.`);
}

export { auth, googleProvider };
export default app;


