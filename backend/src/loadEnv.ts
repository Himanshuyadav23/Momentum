import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Try multiple likely locations to load backend/.env
const candidatePaths = [
  path.resolve(__dirname, '..', '.env'),           // backend/.env when __dirname is backend/src
  path.resolve(process.cwd(), 'backend', '.env'),  // repo-root/backend/.env when cwd is repo root
  path.resolve(process.cwd(), '.env'),             // fallback: cwd/.env
];

let loadedPath: string | null = null;
console.log('🔍 Searching for .env file...');
for (const p of candidatePaths) {
  console.log(`   Checking: ${p}`);
  if (fs.existsSync(p)) {
    console.log(`   ✅ Found: ${p}`);
    const result = dotenv.config({ path: p });
    if (!result.error) {
      loadedPath = p;
      console.log(`   ✅ Successfully loaded environment from: ${p}`);
      break;
    } else {
      console.error(`   ❌ Error loading .env from ${p}:`, result.error);
    }
  } else {
    console.log(`   ❌ Not found: ${p}`);
  }
}

if (!loadedPath) {
  console.warn('⚠️  Could not find a .env file in expected locations:', candidatePaths);
  console.warn('   Please create backend/.env with your Firebase credentials.');
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
  const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
  
  console.log(`✅ Loaded environment from: ${loadedPath}`);
  console.log(`   FIREBASE_PROJECT_ID: ${projectId ? projectId : '(NOT SET)'}`);
  console.log(`   FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? 'SET' : '(NOT SET)'}`);
  console.log(`   FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? process.env.FIREBASE_CLIENT_EMAIL : '(NOT SET)'}`);
  
  if (!projectId || !hasPrivateKey || !hasClientEmail) {
    console.warn('⚠️  Missing required Firebase environment variables!');
  }
}


