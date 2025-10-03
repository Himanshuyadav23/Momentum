'use client';

import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is not logged in, redirect to landing page
    if (!loading && !user) {
      window.location.href = '/landing';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!user.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return <Dashboard />;
}
