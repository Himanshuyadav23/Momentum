# Vercel Deployment Guide

## Environment Variables Setup

To deploy Momentum on Vercel, you need to configure environment variables for both the frontend and backend.

### Frontend Environment Variables (in Vercel)

Go to your Vercel project → Settings → Environment Variables and add:

#### Firebase Client Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Backend API URL
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```
Replace with your actual backend URL (e.g., Railway, Render, or another hosting service).

### Backend Environment Variables (on your backend hosting platform)

#### Firebase Admin SDK Configuration
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

#### JWT Secret
```
JWT_SECRET=your_jwt_secret_key
```

## Common Issues

### Error: "Cannot read properties of undefined (reading 'create')"

This error occurs when:
1. **Firebase environment variables are missing** - Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set in Vercel
2. **Backend Firebase Admin SDK not initialized** - Ensure all backend Firebase environment variables are configured
3. **Backend API URL is incorrect** - Verify `NEXT_PUBLIC_API_URL` points to your running backend

### How to Fix

1. **Check Vercel Environment Variables:**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
   - Check that `NEXT_PUBLIC_API_URL` is correct

2. **Check Backend Environment Variables:**
   - Log into your backend hosting platform (Railway, Render, etc.)
   - Verify all Firebase Admin SDK variables are set
   - Ensure `FIREBASE_PRIVATE_KEY` includes the `\n` characters (newlines)

3. **Redeploy:**
   - After adding/modifying environment variables, redeploy your Vercel project
   - Restart your backend server if needed

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Click on your web app to get the client config
6. For Admin SDK, go to Project Settings → Service Accounts
7. Click "Generate new private key" to download the service account JSON

## Deployment Steps

1. **Deploy Backend First:**
   - Deploy backend to Railway, Render, or another platform
   - Configure all backend environment variables
   - Note the backend URL

2. **Deploy Frontend to Vercel:**
   - Connect your GitHub repository to Vercel
   - Configure frontend environment variables
   - Set `NEXT_PUBLIC_API_URL` to your backend URL
   - Deploy

3. **Verify:**
   - Check Vercel deployment logs for any errors
   - Check backend logs for Firebase initialization messages
   - Test login functionality

## Troubleshooting

- **Build Errors:** Check Vercel build logs for missing environment variables
- **Runtime Errors:** Check browser console and Vercel function logs
- **Authentication Failures:** Verify Firebase credentials are correct
- **API Connection Issues:** Verify `NEXT_PUBLIC_API_URL` is accessible from the internet

