'use client';

import { useAuth } from '@/contexts/AuthContext';
import { HabitList } from '@/components/habits/HabitList';
import { CreateHabit } from '@/components/habits/CreateHabit';
import { HabitStats } from '@/components/habits/HabitStats';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HabitsPage() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleHabitUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

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
          <p className="text-white">Please log in to access habit tracking</p>
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
                <a href="/habits" className="text-white font-medium">Habits</a>
                <a href="/expenses" className="text-gray-300 hover:text-white transition-colors">Expenses</a>
                <a href="/analytics" className="text-gray-300 hover:text-white transition-colors">Analytics</a>
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
          {/* Left Column - Create Habit */}
          <div className="lg:col-span-1">
            <CreateHabit onHabitCreated={handleHabitUpdate} />
          </div>

          {/* Middle Column - Habit List */}
          <div className="lg:col-span-1">
            <HabitList refreshTrigger={refreshKey} />
          </div>

          {/* Right Column - Statistics */}
          <div className="lg:col-span-1">
            <HabitStats refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}
