# Full Deployment on Vercel Guide

Now you can deploy **BOTH** frontend and backend on Vercel! 🎉

## What Changed?

1. **Created `vercel.json`** - Configures Vercel to build both frontend and backend
2. **Created `backend/api/index.ts`** - Serverless function wrapper for Express backend
3. **Updated `backend/src/server.ts`** - Conditionally starts server only when NOT in Vercel (serverless mode)
4. **Updated `frontend/src/lib/api.ts`** - Auto-detects if running on Vercel and uses relative API paths

## How It Works

### Traditional Deployment (Render/Railway)
- Backend runs as a continuous Express server
- Frontend calls backend via `NEXT_PUBLIC_API_URL`

### Vercel Serverless Deployment
- Frontend runs as Next.js on Vercel
- Backend runs as serverless functions on Vercel
- All under the same domain (e.g., `yourapp.vercel.app`)
- API routes accessible at `/api/*`

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository: `Himanshuyadav23/Momentum`
4. **IMPORTANT**: Leave Root Directory as **root** (don't set it to `frontend`)
   - Vercel will handle routing via `vercel.json`

### 2. Install Vercel Build Dependencies

Vercel will automatically install dependencies, but make sure:
- `@vercel/node` is in your package.json (we installed it at root level)

### 3. Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

#### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### Backend Firebase Admin SDK (Required)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

#### JWT Secret (Required)
```
JWT_SECRET=your-super-secret-jwt-key-generate-a-random-one
```

#### Optional (for custom API URL)
```
# Leave this UNset for Vercel deployment - it will auto-detect and use relative paths
# NEXT_PUBLIC_API_URL=/api
```

### 4. Build Settings

Vercel will auto-detect from `vercel.json`:
- **Build Command**: Auto-detected
- **Output Directory**: Auto-detected
- **Install Command**: `npm install` (will install at root, then frontend, then backend)

### 5. Deploy!

Click **"Deploy"** and wait for:
1. Frontend build to complete
2. Backend serverless function build to complete
3. Routes to be configured

## How Routes Work

- `yourdomain.vercel.app/` → Frontend (Next.js)
- `yourdomain.vercel.app/api/auth/login` → Backend (Express serverless)
- `yourdomain.vercel.app/api/time/entries` → Backend (Express serverless)
- All other routes → Frontend

## Benefits of Full Vercel Deployment

✅ **Single Domain** - Everything on one domain  
✅ **No CORS Issues** - Same origin for frontend and backend  
✅ **Automatic HTTPS** - Vercel provides SSL  
✅ **Edge Network** - Global CDN for both frontend and API  
✅ **Easy Environment Variables** - All in one place  
✅ **Auto-deployments** - On every git push  

## Limitations

⚠️ **Serverless Functions**:
- 10-60 second execution limit (Hobby plan: 10s, Pro: 60s)
- Cold starts possible on first request
- Not ideal for WebSockets or long-polling

⚠️ **Free Tier**:
- 100GB bandwidth/month
- 1000 serverless function invocations/day
- Hobby plan limitations

## Monitoring

Check deployment logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on a deployment to see logs
3. Check both frontend and backend build logs

## Troubleshooting

### Issue: "Cannot find module @vercel/node"
**Solution**: Make sure `@vercel/node` is installed. Run:
```bash
npm install --save-dev @vercel/node
```

### Issue: API routes return 404
**Solution**: Check that `vercel.json` routes are correct and backend builds successfully

### Issue: Backend errors
**Solution**: Check environment variables are all set, especially Firebase Admin SDK variables

### Issue: Frontend can't connect to backend
**Solution**: In Vercel deployment, don't set `NEXT_PUBLIC_API_URL` - let it auto-detect relative paths

## Switching Between Deployments

If you want to use separate backend (Render/Railway) instead:

1. Set `NEXT_PUBLIC_API_URL` in Vercel to your backend URL
2. Remove or comment out the backend build in `vercel.json`
3. Redeploy

The code automatically detects which mode it's in!

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Connect to Vercel
3. ✅ Set environment variables
4. ✅ Deploy!
5. ✅ Test all endpoints
6. ✅ Configure custom domain (optional)

Happy deploying! 🚀

