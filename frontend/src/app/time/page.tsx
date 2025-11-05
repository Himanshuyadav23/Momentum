'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerWidget } from '@/components/time/TimerWidget';
import { TimeEntries } from '@/components/time/TimeEntries';
import { ManualTimeEntry } from '@/components/time/ManualTimeEntry';
import { TimeInsights } from '@/components/time/TimeInsights';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TimePage() {
  const { user, loading, updateUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProductiveHoursPrompt, setShowProductiveHoursPrompt] = useState(false);
  const [dailyProductiveHours, setDailyProductiveHours] = useState('');
  const [savingHours, setSavingHours] = useState(false);
  const [insightsData, setInsightsData] = useState<{
    entries: any[];
    productiveTime: number;
    wastedTime: number;
    totalTime: number;
    productivityRatio: number;
  }>({
    entries: [],
    productiveTime: 0,
    wastedTime: 0,
    totalTime: 0,
    productivityRatio: 0
  });

  const handleTimerUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if daily productive hours is not set
  React.useEffect(() => {
    if (user && !user.dailyProductiveHours) {
      setShowProductiveHoursPrompt(true);
    } else {
      setShowProductiveHoursPrompt(false);
    }
  }, [user]);

  const handleSaveProductiveHours = async () => {
    if (!dailyProductiveHours || parseFloat(dailyProductiveHours) <= 0 || parseFloat(dailyProductiveHours) > 24) {
      alert('Please enter a valid number of hours (1-24)');
      return;
    }

    try {
      setSavingHours(true);
      await updateUser({ dailyProductiveHours: parseFloat(dailyProductiveHours) });
      setShowProductiveHoursPrompt(false);
      setDailyProductiveHours('');
    } catch (error) {
      console.error('Failed to save daily productive hours:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSavingHours(false);
    }
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
          <p className="text-white">Please log in to access time tracking</p>
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
                <a href="/time" className="text-white font-medium">Time</a>
                <a href="/habits" className="text-gray-300 hover:text-white transition-colors">Habits</a>
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
        {/* Daily Productive Hours Prompt */}
        {showProductiveHoursPrompt && (
          <Card className="bg-yellow-900/20 border-yellow-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="h-5 w-5" />
                <span>Set Your Daily Productive Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300">
                  To help you track your productivity better, please tell us how many hours per day you aim to be productive.
                  We'll monitor how much time you use productively vs how much gets wasted.
                </p>
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="dailyProductiveHours" className="text-gray-300">Daily Productive Hours</Label>
                    <Input
                      id="dailyProductiveHours"
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      placeholder="e.g., 6"
                      value={dailyProductiveHours}
                      onChange={(e) => setDailyProductiveHours(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProductiveHours}
                    disabled={savingHours || !dailyProductiveHours}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {savingHours ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => setShowProductiveHoursPrompt(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <TimerWidget onTimerUpdate={handleTimerUpdate} />
            <ManualTimeEntry onEntryAdded={handleTimerUpdate} />
            <TimeEntries 
              refreshTrigger={refreshKey} 
              onDataUpdate={setInsightsData}
            />
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-8">
            <TimeInsights 
              entries={insightsData.entries} 
              productiveTime={insightsData.productiveTime} 
              wastedTime={insightsData.wastedTime} 
              totalTime={insightsData.totalTime}
              productivityRatio={insightsData.productivityRatio}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
