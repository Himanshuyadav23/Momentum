'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { useEffect } from 'react';

export default function AuthPage() {
  const { user } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}


