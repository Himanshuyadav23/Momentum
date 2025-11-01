# Quick Start Guide - Fix "Failed to connect to server"

## Problem
You're seeing: **"Failed to connect to server. Please check if the backend is running."**

## Solution

### Step 1: Start the Backend Server

**Option A: Using PowerShell Script (Easiest)**
1. Open PowerShell in the project root
2. Run:
   ```powershell
   .\start-backend.ps1
   ```

**Option B: Manual Start**
1. Open a **new terminal/PowerShell window**
2. Navigate to backend:
   ```powershell
   cd backend
   ```
3. Start the server:
   ```powershell
   npm run dev
   ```

### Step 2: Verify Backend is Running

1. Open your browser
2. Go to: `http://localhost:5000/health`
3. You should see JSON like:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "database": "Firebase Firestore (Connected)"
   }
   ```

### Step 3: Check Frontend Configuration

Make sure your frontend has the correct API URL:

1. Check `frontend/.env.local` or create it:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. Restart your frontend if you changed the .env file:
   ```powershell
   cd frontend
   npm run dev
   ```

## ✅ Success Indicators

When the backend is running correctly, you should see:
```
🚀 Server running on port 5000
📊 Environment: development
🌐 Frontend URL: http://localhost:3000
🔥 Database: Firebase Firestore
✅ Server is ready to accept connections
```

## 🔧 Common Issues

### Port 5000 already in use
- Change backend `.env`: `PORT=5001`
- Update frontend: `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- Restart both servers

### Backend crashes on start
- Check `.env` file has all required Firebase credentials
- Look at the error message in the terminal
- Make sure Firebase credentials are correct

### CORS errors
- Backend is configured for localhost:3000 and localhost:3001
- If your frontend runs on a different port, update `backend/src/server.ts`

## 📝 Important

**Keep the backend terminal window open** - the server must stay running for the frontend to work!

If you close the terminal, the backend stops and you'll get "Failed to connect" again.

