# Momentum - Productivity & Habit Tracker

A comprehensive SaaS web application for tracking time, building habits, and managing expenses. Built with Next.js, Express, MongoDB, and Firebase Auth.

## 🚀 Features

### Core Modules
- **Time Tracking**: Start/stop timer with categories, manual entry, productivity insights
- **Habit Tracking**: Daily/weekly habits with streak tracking and progress visualization
- **Expense Tracking**: Quick expense logging with categories and budget insights
- **Analytics & Reports**: Weekly summaries, correlation insights, and productivity trends

### User Experience
- **Authentication**: Google OAuth + Email/Password via Firebase Auth
- **Onboarding**: 3-step setup wizard for time categories, first habit, and budget
- **Dashboard**: Daily snapshot with quick actions and progress cards
- **Mobile-First**: Responsive design optimized for mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Charts**: Recharts for analytics visualization
- **Authentication**: Firebase Auth
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK + JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Built-in Mongoose validation

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render/Heroku
- **Database**: MongoDB Atlas
- **Authentication**: Firebase

## 📦 Project Structure

```
momentum/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── onboarding/  # Onboarding wizard
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts
│   │   └── lib/             # Utilities and configurations
│   └── package.json
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Firebase project with Authentication enabled

### 1. Clone the Repository
```bash
git clone <repository-url>
cd momentum
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 4. Environment Configuration

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/momentum
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔧 Development

### Backend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📱 Features Overview

### Authentication & Onboarding
- Firebase Authentication with Google OAuth
- Email/Password authentication
- 3-step onboarding wizard
- User profile management

### Time Tracking
- Start/stop timer with categories
- Manual time entry
- Productivity vs wasted time tracking
- Weekly time summaries

### Habit Tracking
- Create daily/weekly habits
- Mark completion with streak tracking
- Progress visualization
- Habit logs and analytics

### Expense Tracking
- Quick expense logging
- Category-based organization
- Budget tracking and insights
- Weekly expense summaries

### Analytics & Insights
- Daily dashboard with key metrics
- Weekly productivity reports
- Correlation insights
- Progress visualization

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update MONGODB_URI in backend environment
3. Configure network access and database user

## 🔒 Security Features

- JWT-based authentication
- Firebase Admin SDK for token verification
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js for security headers

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/profile` - Get user profile

### User Management
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

### Time Tracking
- `GET /api/time/entries` - Get time entries
- `POST /api/time/start` - Start timer
- `POST /api/time/stop` - Stop timer
- `POST /api/time/manual` - Add manual entry
- `GET /api/time/active` - Get active timer

### Habit Tracking
- `GET /api/habits` - Get habits
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/complete` - Complete habit
- `GET /api/habits/:id/logs` - Get habit logs

### Expense Tracking
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/weekly` - Get weekly analytics
- `GET /api/analytics/insights` - Get insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@momentum.app or create an issue in the repository.

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Integration with calendar apps
- [ ] Habit reminders via push notifications
- [ ] Data export and backup
- [ ] Premium features and subscriptions


