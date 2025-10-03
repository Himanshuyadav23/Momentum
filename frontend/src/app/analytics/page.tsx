'use client';

import { useAuth } from '@/contexts/AuthContext';
import { WeeklyReport } from '@/components/analytics/WeeklyReport';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import { useState } from 'react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white">Please log in to access analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-white">Momentum</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
                <a href="/time" className="text-gray-300 hover:text-white transition-colors">Time</a>
                <a href="/habits" className="text-gray-300 hover:text-white transition-colors">Habits</a>
                <a href="/expenses" className="text-gray-300 hover:text-white transition-colors">Expenses</a>
                <a href="/analytics" className="text-white font-medium">Analytics</a>
                <a href="/profile" className="text-gray-300 hover:text-white transition-colors">Profile</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Weekly Report */}
          <div className="lg:col-span-2">
            <WeeklyReport refreshKey={refreshKey} />
          </div>

          {/* Right Column - Insights */}
          <div className="lg:col-span-1">
            <InsightsPanel refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}
