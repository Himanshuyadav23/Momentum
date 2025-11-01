'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Target, DollarSign, Clock } from 'lucide-react';

interface WeeklyReportProps {
  refreshKey?: number;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ refreshKey }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchReport();
  }, [refreshKey, period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = period === 'monthly' 
        ? await apiClient.getMonthlyReport()
        : await apiClient.getWeeklyAnalytics();
      if (response.success && response.data) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${period} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading weekly report...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No data available for weekly report</p>
            <p className="text-sm text-gray-500 mt-2">Start tracking time, habits, and expenses to see your weekly report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data from response - handle both old and new formats
  const timeData = reportData.time || {
    total: reportData.totalTime || 0,
    productive: 0,
    wasted: 0
  };

  const habitsData = reportData.habits || {
    totalHabits: 0,
    completedLogs: reportData.totalHabits || 0,
    streaks: []
  };

  const expensesData = reportData.expenses || {
    total: reportData.totalExpenses || 0,
    categoryBreakdown: reportData.expenseCategoryBreakdown || {}
  };

  // Calculate productive/wasted if not provided
  if (!timeData.productive && !timeData.wasted && timeData.total > 0) {
    // Fallback: assume 70% productive if not marked
    timeData.productive = Math.round(timeData.total * 0.7);
    timeData.wasted = timeData.total - timeData.productive;
  }

  // Prepare chart data
  const timeChartData = [
    { name: 'Productive', value: timeData.productive || 0, color: '#10B981' },
    { name: 'Wasted', value: timeData.wasted || 0, color: '#EF4444' }
  ].filter(item => item.value > 0); // Only show if there's data

  const expenseChartData = Object.entries(expensesData.categoryBreakdown || {}).map(([category, amount], index) => ({
    name: category,
    value: amount as number,
    color: COLORS[index % COLORS.length]
  }));

  const habitStreakData = (habitsData.streaks || []).map((habit: any, index: number) => ({
    name: habit.name || 'Unknown',
    streak: habit.currentStreak || 0,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5" />
            <span>{period === 'monthly' ? 'Monthly' : 'Weekly'} Report</span>
          </CardTitle>
          <div className="flex space-x-2">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                period === 'weekly'
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                period === 'monthly'
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{formatTime(timeData.total || 0)}</div>
            <div className="text-xs text-gray-400">Total Time</div>
            {timeData.total > 0 && (
              <div className="text-xs text-green-400 mt-1">
                {Math.round((timeData.productive / timeData.total) * 100)}% productive
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{habitsData.completedLogs || 0}</div>
            <div className="text-xs text-gray-400">Habits Done</div>
            {habitsData.totalHabits > 0 && (
              <div className="text-xs text-blue-400 mt-1">
                {habitsData.totalHabits} active
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <DollarSign className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{formatCurrency(expensesData.total || 0)}</div>
            <div className="text-xs text-gray-400">Total Spent</div>
            {expensesData.total > 0 && (
              <div className="text-xs text-yellow-400 mt-1">
                ₹{Math.round((expensesData.total || 0) / (period === 'monthly' ? 30 : 7))}/day avg
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">
              {habitStreakData.length > 0 
                ? Math.max(...habitStreakData.map((h: any) => h.streak))
                : 0}
            </div>
            <div className="text-xs text-gray-400">Top Streak</div>
          </div>
        </div>

        {/* Time Distribution Chart */}
        {timeChartData.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Time Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {timeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatTime(value), 'Time']}
                    contentStyle={{
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4">
              {timeChartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-300">{item.name}: {formatTime(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">No time tracking data this {period}</p>
            <p className="text-sm text-gray-500">Start tracking your time to see productivity insights</p>
          </div>
        )}

        {/* Habit Streaks Chart */}
        {habitStreakData.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Habit Streaks</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitStreakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Days']}
                    contentStyle={{
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Bar dataKey="streak" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <Target className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">No habits tracked this {period}</p>
            <p className="text-sm text-gray-500">Create habits to start building streaks</p>
          </div>
        )}

        {/* Expense Categories Chart */}
        {expenseChartData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Expense Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#374151',
                      border: '1px solid #6B7280',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {expenseChartData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-300 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Score */}
        {timeData.total > 0 && (
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round((timeData.productive / Math.max(timeData.total, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Productivity Score</div>
              <Progress 
                value={(timeData.productive / Math.max(timeData.total, 1)) * 100} 
                className="h-2 mt-2"
              />
              <div className="mt-2 text-xs text-gray-400">
                {formatTime(timeData.productive)} productive / {formatTime(timeData.total)} total
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



