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
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    const result = dotenv.config({ path: p });
    if (!result.error) {
      loadedPath = p;
      break;
    }
  }
}

if (!loadedPath) {
  console.warn('⚠️  Could not find a .env file in expected locations:', candidatePaths);
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  console.log(`🔧 Loaded environment from: ${loadedPath}`);
  console.log(`🔧 FIREBASE_PROJECT_ID detected: ${projectId ? projectId : '(not set)'}`);
}


