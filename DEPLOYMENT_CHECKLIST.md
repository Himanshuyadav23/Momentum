# 🚀 Vercel Deployment Checklist

## ✅ Step 1: Connect Repository to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (or create account with GitHub)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select: **`Himanshuyadav23/Momentum`**
5. Click **"Import"**

## ✅ Step 2: Configure Project Settings

### IMPORTANT: Root Directory
- **DO NOT** set Root Directory to `frontend`
- **Leave it as root** (empty/default)
- Vercel will use `vercel.json` to handle routing

### Build Settings (Auto-detected)
- **Framework Preset**: Next.js
- **Root Directory**: (leave empty - defaults to root)
- **Build Command**: (auto-detected from vercel.json)
- **Output Directory**: (auto-detected)
- **Install Command**: `npm install`

## ✅ Step 3: Add Environment Variables

Click **"Environment Variables"** and add these:

### Firebase Client Configuration (NEXT_PUBLIC_*)

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Firebase Admin SDK (for Backend)

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### JWT Secret

```
JWT_SECRET=your-super-secret-random-string-min-32-characters
```

**Generate a secure JWT secret:**
```bash
# Run this command to generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional: For Custom Backend URL
```
# Leave this UNset if deploying everything on Vercel
# NEXT_PUBLIC_API_URL=/api
```

## ✅ Step 4: Deploy

1. Review all settings
2. Click **"Deploy"**
3. Wait for build to complete (usually 2-5 minutes)

## ✅ Step 5: Verify Deployment

After deployment:

1. **Frontend**: Visit `https://your-project.vercel.app`
2. **Backend API**: Test `https://your-project.vercel.app/api/health`
3. **Test Login**: Try logging in with Firebase Auth
4. **Check Logs**: Go to Deployments → Click deployment → View logs

## 📋 Where to Find Firebase Config

### Client Config (NEXT_PUBLIC_*)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click gear icon → Project Settings
4. Scroll to "Your apps" section
5. Click on your web app (or create one)
6. Copy config values

### Admin SDK Config
1. Firebase Console → Project Settings
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download JSON file
5. Extract values from JSON:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key_id` → FIREBASE_PRIVATE_KEY_ID
   - `private_key` → FIREBASE_PRIVATE_KEY (keep quotes and \n)
   - `client_email` → FIREBASE_CLIENT_EMAIL
   - `client_id` → FIREBASE_CLIENT_ID
   - `auth_uri` → FIREBASE_AUTH_URI
   - `token_uri` → FIREBASE_TOKEN_URI

## 🔍 Troubleshooting

### Build Fails
- Check logs in Vercel dashboard
- Verify all environment variables are set
- Check that `@vercel/node` is in package.json dependencies

### API Routes Return 404
- Verify `vercel.json` exists in root
- Check backend build logs
- Ensure `backend/api/index.ts` exists

### Firebase Auth Errors
- Verify all NEXT_PUBLIC_FIREBASE_* variables are set
- Check Firebase console for authorized domains
- Add your Vercel domain to Firebase authorized domains

### Backend Errors
- Check all Firebase Admin SDK variables are set
- Verify FIREBASE_PRIVATE_KEY has proper formatting (with \n)
- Check JWT_SECRET is set

## 📞 Need Help?

1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables match your Firebase project
4. Ensure Firebase project has Authentication enabled

## 🎉 Success!

Once deployed, your app will be live at:
- **Frontend & Backend**: `https://your-project.vercel.app`
- **API Endpoints**: `https://your-project.vercel.app/api/*`

Happy deploying! 🚀

