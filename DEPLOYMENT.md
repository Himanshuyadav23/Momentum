# Deployment Guide for Momentum

This guide will help you deploy the Momentum productivity app to Vercel (frontend) and Render (backend).

## Prerequisites

1. **Firebase Project**: Set up a Firebase project with Authentication enabled
2. **MongoDB Atlas**: Create a MongoDB Atlas cluster
3. **GitHub Repository**: Push your code to GitHub
4. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
5. **Render Account**: Sign up at [render.com](https://render.com)

## Backend Deployment (Render)

### 1. Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder as the root directory

### 2. Configure Environment Variables

In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/momentum
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-url.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Build and Deploy

1. Set Build Command: `npm install && npm run build`
2. Set Start Command: `npm start`
3. Click "Create Web Service"
4. Wait for deployment to complete
5. Note the service URL (e.g., `https://momentum-backend.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set Root Directory to `frontend`

### 2. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

### 3. Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note the deployment URL (e.g., `https://momentum.vercel.app`)

## Firebase Configuration

### 1. Enable Authentication

1. Go to Firebase Console → Authentication
2. Enable Google and Email/Password providers
3. Add your domain to authorized domains

### 2. Get Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Use the values in your environment variables

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for development)

### 2. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

## Post-Deployment Steps

### 1. Update Backend Environment Variables

Update the `FRONTEND_URL` in your Render service to match your Vercel deployment URL.

### 2. Update Frontend Environment Variables

Update the `NEXT_PUBLIC_API_URL` in your Vercel project to match your Render service URL.

### 3. Test the Application

1. Visit your Vercel deployment URL
2. Try signing up with Google
3. Test the onboarding flow
4. Verify all features work correctly

## Custom Domain (Optional)

### Vercel Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Render Custom Domain

1. Go to Render Dashboard → Your Service → Settings → Custom Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Monitoring and Maintenance

### 1. Monitor Logs

- **Vercel**: Check function logs in the dashboard
- **Render**: Check service logs in the dashboard

### 2. Database Monitoring

- Monitor MongoDB Atlas for performance and usage
- Set up alerts for high usage

### 3. Performance Optimization

- Enable Vercel Analytics
- Monitor Core Web Vitals
- Optimize images and assets

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` is correctly set in backend
2. **Firebase Auth Errors**: Check Firebase configuration and domain settings
3. **Database Connection**: Verify MongoDB connection string and network access
4. **Build Failures**: Check build logs for missing dependencies or TypeScript errors

### Debug Steps

1. Check environment variables are correctly set
2. Verify all required services are running
3. Check browser console for client-side errors
4. Check server logs for backend errors

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Firebase Rules**: Configure proper security rules
3. **Rate Limiting**: Monitor and adjust rate limits as needed
4. **HTTPS**: Ensure all communications use HTTPS
5. **Database Security**: Use strong passwords and limit network access

## Scaling Considerations

1. **Database**: Consider upgrading MongoDB Atlas plan for production
2. **Backend**: Upgrade Render plan for better performance
3. **CDN**: Vercel automatically provides global CDN
4. **Monitoring**: Set up proper monitoring and alerting

## Backup and Recovery

1. **Database**: MongoDB Atlas provides automatic backups
2. **Code**: GitHub provides version control and backup
3. **Environment Variables**: Document all environment variables
4. **Deployment**: Keep deployment configurations in version control

## Support

For issues with:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Render**: Check [Render Documentation](https://render.com/docs)
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **MongoDB**: Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)


