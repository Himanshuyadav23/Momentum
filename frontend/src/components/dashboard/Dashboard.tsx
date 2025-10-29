'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { 
  Clock, 
  Target, 
  DollarSign, 
  Play, 
  Plus, 
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';

interface DashboardData {
  time: {
    productive: number;
    wasted: number;
    total: number;
  };
  habits: {
    completed: number;
    total: number;
    percentage: number;
  };
  expenses: {
    total: number;
    count: number;
  };
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchActiveTimer();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.getDashboardAnalytics();
      if (response.success && response.data) {
        const d: any = response.data;
        const normalized: DashboardData = {
          time: {
            productive: Number(d?.time?.productive ?? 0),
            wasted: Number(d?.time?.wasted ?? 0),
            total: Number(d?.time?.total ?? 0),
          },
          habits: {
            completed: Number(d?.habits?.completed ?? 0),
            total: Number(d?.habits?.total ?? 0),
            percentage: Number(d?.habits?.percentage ?? 0),
          },
          expenses: {
            total: Number(d?.expenses?.total ?? 0),
            count: Number(d?.expenses?.count ?? 0),
          },
        };
        setDashboardData(normalized);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const response = await apiClient.getActiveTimer();
      if (response.success && response.data) {
        const d: any = response.data;
        setActiveTimer(d?.activeEntry ?? null);
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
                <a href="/" className="text-white font-medium">Dashboard</a>
                <a href="/time" className="text-gray-300 hover:text-white transition-colors">Time</a>
                <a href="/habits" className="text-gray-300 hover:text-white transition-colors">Habits</a>
                <a href="/expenses" className="text-gray-300 hover:text-white transition-colors">Expenses</a>
                <a href="/analytics" className="text-gray-300 hover:text-white transition-colors">Analytics</a>
                <a href="/profile" className="text-gray-300 hover:text-white transition-colors">Profile</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
              <Button onClick={logout} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Timer */}
        {activeTimer && (
          <Card className="mb-6 border-gray-700 bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-white">{activeTimer.category}</p>
                    <p className="text-sm text-gray-300">{activeTimer.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Stop Timer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button className="h-20 flex flex-col items-center justify-center space-y-2 bg-white text-black hover:bg-gray-100">
            <Play className="w-6 h-6" />
            <span>Start Timer</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-gray-600 text-gray-300 hover:bg-gray-800">
            <Target className="w-6 h-6" />
            <span>Add Habit</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-gray-600 text-gray-300 hover:bg-gray-800">
            <DollarSign className="w-6 h-6" />
            <span>Add Expense</span>
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Time Tracking Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Time Today</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Productive</span>
                  <span className="font-medium text-white">
                    {dashboardData ? formatTime(dashboardData.time.productive) : '0h 0m'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-400">Wasted</span>
                  <span className="font-medium text-white">
                    {dashboardData ? formatTime(dashboardData.time.wasted) : '0h 0m'}
                  </span>
                </div>
                <Progress 
                  value={dashboardData && dashboardData.time.total > 0 
                    ? (dashboardData.time.productive / dashboardData.time.total) * 100 
                    : 0
                  } 
                  className="h-2"
                />
                <p className="text-xs text-gray-400">
                  {dashboardData && dashboardData.time.total > 0 
                    ? `${Math.round((dashboardData.time.productive / dashboardData.time.total) * 100)}% productive`
                    : 'No time tracked today'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Habits Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Habits Today</CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Completed</span>
                  <span className="font-medium text-white">
                    {dashboardData ? `${dashboardData.habits.completed}/${dashboardData.habits.total}` : '0/0'}
                  </span>
                </div>
                <Progress 
                  value={dashboardData ? dashboardData.habits.percentage : 0} 
                  className="h-2"
                />
                <p className="text-xs text-gray-400">
                  {dashboardData ? `${dashboardData.habits.percentage}% completion rate` : 'No habits set'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Expenses Today</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {dashboardData ? formatCurrency(dashboardData.expenses.total) : '$0.00'}
                </div>
                <p className="text-xs text-gray-400">
                  {dashboardData ? `${dashboardData.expenses.count} transactions` : 'No expenses today'}
                </p>
                {user?.weeklyBudget && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Weekly Budget</span>
                      <span className="text-white">{formatCurrency(user.weeklyBudget)}</span>
                    </div>
                    <Progress 
                      value={dashboardData ? (dashboardData.expenses.total / user.weeklyBudget) * 100 : 0} 
                      className="h-1 mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Calendar className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Your latest time entries and habits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Work Session</p>
                    <p className="text-xs text-gray-300">2h 30m • 2 hours ago</p>
                  </div>
                  <Badge variant="secondary" className="bg-gray-600 text-gray-200">Productive</Badge>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Morning Exercise</p>
                    <p className="text-xs text-gray-300">Completed • 3 hours ago</p>
                  </div>
                  <Badge variant="secondary" className="bg-gray-600 text-gray-200">Habit</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <BarChart3 className="h-5 w-5" />
                <span>Weekly Overview</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Your productivity this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Productive Time</span>
                  <span className="text-sm font-medium text-white">24h 15m</span>
                </div>
                <Progress value={75} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Habit Completion</span>
                  <span className="text-sm font-medium text-white">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Budget Used</span>
                  <span className="text-sm font-medium text-white">60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
