# Vercel Deployment Setup for Momentum

## Issue: "No Next.js version detected"

This error occurs because Vercel is looking in the root directory, but our Next.js app is in the `frontend/` subdirectory.

## Solution: Configure Root Directory in Vercel Dashboard

Follow these steps:

### Step 1: Open Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **Momentum** project

### Step 2: Configure Root Directory
1. Click on **Settings** (top navigation)
2. Go to **General** tab
3. Scroll down to **Root Directory** section
4. Click **Edit** or **Browse**
5. Enter: `frontend`
   - OR click **Browse** and navigate to select the `frontend` folder
6. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **...** (three dots) on the latest deployment
3. Select **Redeploy**
4. Make sure the deployment uses the updated Root Directory setting

### Step 4: Verify Environment Variables
While you're in Settings, also verify these environment variables are set:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (optional)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (optional)
- `NEXT_PUBLIC_FIREBASE_APP_ID` (optional)

**Location:** Settings → Environment Variables

### Alternative: If Root Directory setting doesn't appear
If you don't see the Root Directory option:
1. You might need to disconnect and reconnect the GitHub repository
2. When connecting, Vercel should detect the monorepo structure
3. You'll be prompted to select the framework directory during setup

## Project Structure
```
momentum/
├── backend/          # Backend Express API
├── frontend/         # Next.js app (THIS IS WHERE VERCEL SHOULD BUILD)
│   ├── package.json  # Contains Next.js dependency
│   └── next.config.js
└── vercel.json       # (Optional config file)
```

## After Configuration
Once Root Directory is set to `frontend`:
- ✅ Vercel will find `package.json` with Next.js dependency
- ✅ Build command will run from `frontend/` directory
- ✅ All Next.js files will be correctly located

