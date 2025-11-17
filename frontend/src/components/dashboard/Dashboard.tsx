'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { 
  Clock, 
  Target, 
  DollarSign, 
  Calendar,
  BarChart3
} from 'lucide-react';
import { ActivityHeatmap } from './ActivityHeatmap';

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
  recentActivity?: Array<{
    type: 'time' | 'habit';
    id: string;
    title: string;
    subtitle: string;
    timeAgo: string;
    isProductive?: boolean;
    habitName?: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);

  useEffect(() => {
    // Fetch all data in parallel for faster loading
    Promise.all([
      fetchDashboardData(),
      fetchActiveTimer().catch(() => {
        // Silently handle errors - don't block dashboard from loading
      }),
      fetchHeatmapData().catch(() => {
        // Silently handle errors
      }),
      fetchWeeklyData().catch(() => {
        // Silently handle errors
      })
    ]);
  }, []);

  const fetchWeeklyData = async () => {
    try {
      const response = await apiClient.getWeeklyReport();
      if (response.success && response.data) {
        setWeeklyData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const response = await apiClient.getActivityHeatmap();
      if (response.success && response.data) {
        setHeatmapData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    }
  };

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
          recentActivity: d?.recentActivity || [],
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
    // Use INR if user has weekly budget set, otherwise default to USD
    const currency = user?.weeklyBudget ? 'INR' : 'USD';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
              <Navigation currentPage="dashboard" />
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

        {/* Activity Heatmap */}
        {heatmapData && (
          <div className="mb-8">
            <ActivityHeatmap
              activityData={heatmapData.activityData}
              currentStreak={heatmapData.currentStreak}
              longestStreak={heatmapData.longestStreak}
              totalDays={heatmapData.totalDays}
            />
          </div>
        )}

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
                  {dashboardData ? formatCurrency(dashboardData.expenses.total) : formatCurrency(0)}
                </div>
                <p className="text-xs text-gray-400">
                  {dashboardData && dashboardData.expenses.count > 0 
                    ? `${dashboardData.expenses.count} transaction${dashboardData.expenses.count !== 1 ? 's' : ''}` 
                    : 'No expenses today'}
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
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${activity.type === 'time' ? (activity.isProductive ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        <p className="text-xs text-gray-300">{activity.subtitle} • {activity.timeAgo}</p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                        {activity.type === 'time' ? (activity.isProductive ? 'Productive' : 'Wasted') : 'Habit'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No recent activity</p>
                    <p className="text-xs text-gray-500 mt-1">Start tracking time or completing habits to see activity here</p>
                  </div>
                )}
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
                {/* Productive Time */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Productive Time</span>
                    <span className="text-sm font-medium text-white">
                      {weeklyData?.time?.productive ? formatTime(weeklyData.time.productive) : '0h 0m'}
                    </span>
                  </div>
                  <Progress 
                    value={weeklyData?.time?.total > 0 
                      ? Math.min((weeklyData.time.productive / weeklyData.time.total) * 100, 100) 
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
                
                {/* Habit Completion */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Habit Completion</span>
                    <span className="text-sm font-medium text-white">
                      {weeklyData?.habits?.totalHabits > 0
                        ? `${Math.round((weeklyData.habits.completedLogs / Math.max(weeklyData.habits.totalHabits, 1)) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={weeklyData?.habits?.totalHabits > 0
                      ? Math.min((weeklyData.habits.completedLogs / Math.max(weeklyData.habits.totalHabits, 1)) * 100, 100)
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
                
                {/* Budget Used */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">Budget Used</span>
                    <span className="text-sm font-medium text-white">
                      {weeklyData?.expenses?.budgetInfo
                        ? `${Math.round(weeklyData.expenses.budgetInfo.percentageUsed)}%`
                        : user?.weeklyBudget && weeklyData?.expenses?.total
                        ? `${Math.round((weeklyData.expenses.total / user.weeklyBudget) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={weeklyData?.expenses?.budgetInfo
                      ? Math.min(weeklyData.expenses.budgetInfo.percentageUsed, 100)
                      : user?.weeklyBudget && weeklyData?.expenses?.total
                      ? Math.min((weeklyData.expenses.total / user.weeklyBudget) * 100, 100)
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};
