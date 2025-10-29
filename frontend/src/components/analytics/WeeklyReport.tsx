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

  useEffect(() => {
    fetchWeeklyReport();
  }, [refreshKey]);

  const fetchWeeklyReport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getWeeklyAnalytics();
      if (response.success && response.data) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const timeChartData = [
    { name: 'Productive', value: reportData.time.productive, color: '#10B981' },
    { name: 'Wasted', value: reportData.time.wasted, color: '#EF4444' }
  ];

  const expenseChartData = Object.entries(reportData.expenses.categoryBreakdown || {}).map(([category, amount], index) => ({
    name: category,
    value: amount,
    color: COLORS[index % COLORS.length]
  }));

  const habitStreakData = reportData.habits.streaks.map((habit: any, index: number) => ({
    name: habit.name,
    streak: habit.currentStreak,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Calendar className="h-5 w-5" />
          <span>Weekly Report</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{formatTime(reportData.time.total)}</div>
            <div className="text-xs text-gray-400">Total Time</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{reportData.habits.completedLogs}</div>
            <div className="text-xs text-gray-400">Habits Done</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <DollarSign className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{formatCurrency(reportData.expenses.total)}</div>
            <div className="text-xs text-gray-400">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{reportData.habits.totalHabits}</div>
            <div className="text-xs text-gray-400">Active Habits</div>
          </div>
        </div>

        {/* Time Distribution Chart */}
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
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Streaks Chart */}
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
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {Math.round((reportData.time.productive / Math.max(reportData.time.total, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Productivity Score</div>
            <Progress 
              value={(reportData.time.productive / Math.max(reportData.time.total, 1)) * 100} 
              className="h-2 mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



