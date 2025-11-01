'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  Zap,
  BarChart3,
  Calendar as CalendarIcon
} from 'lucide-react';

interface TimeEntry {
  id: string;
  category: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isProductive: boolean;
  isActive: boolean;
}

interface TimeInsightsProps {
  entries: TimeEntry[];
  productiveTime: number;
  wastedTime: number;
  totalTime: number;
  productivityRatio: number;
}

export const TimeInsights: React.FC<TimeInsightsProps> = ({
  entries,
  productiveTime,
  wastedTime,
  totalTime,
  productivityRatio
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Calculate insights
  const completedEntries = entries.filter(e => !e.isActive && e.duration !== undefined);
  
  // Best productive hours
  const hourlyProductivity = completedEntries
    .filter(e => e.isProductive && e.startTime)
    .reduce((acc, entry) => {
      const hour = new Date(entry.startTime).getHours();
      if (!acc[hour]) {
        acc[hour] = { productive: 0, total: 0 };
      }
      acc[hour].productive += entry.duration || 0;
      acc[hour].total += entry.duration || 0;
      return acc;
    }, {} as Record<number, { productive: number; total: number }>);

  const bestHours = Object.entries(hourlyProductivity)
    .sort((a, b) => b[1].productive - a[1].productive)
    .slice(0, 3)
    .map(([hour]) => {
      const h = parseInt(hour);
      const period = h >= 12 ? (h === 12 ? '12pm' : `${h - 12}pm`) : `${h}am`;
      return period;
    });

  // Most productive day
  const dayProductivity = completedEntries
    .filter(e => e.isProductive)
    .reduce((acc, entry) => {
      const day = new Date(entry.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[day]) acc[day] = 0;
      acc[day] += entry.duration || 0;
      return acc;
    }, {} as Record<string, number>);

  const mostProductiveDay = Object.entries(dayProductivity)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // Productivity streak (days with productive time)
  const productiveDays = new Set(
    completedEntries
      .filter(e => e.isProductive && e.duration && e.duration > 0)
      .map(e => new Date(e.startTime).toDateString())
  );
  const streak = productiveDays.size;

  // Daily goal (8 hours productive = 480 minutes)
  const dailyGoal = 480; // 8 hours
  const goalProgress = Math.min((productiveTime / dailyGoal) * 100, 100);

  // Insights
  const insights: Array<{ type: 'positive' | 'warning' | 'info'; message: string; icon: React.ReactNode }> = [];

  if (productivityRatio >= 70) {
    insights.push({
      type: 'positive',
      message: `Excellent! You're maintaining a ${productivityRatio}% productivity ratio. Keep it up!`,
      icon: <Award className="h-4 w-4 text-green-400" />
    });
  } else if (productivityRatio >= 50) {
    insights.push({
      type: 'info',
      message: `Your productivity is at ${productivityRatio}%. Try to increase productive activities.`,
      icon: <TrendingUp className="h-4 w-4 text-yellow-400" />
    });
  } else {
    insights.push({
      type: 'warning',
      message: `Productivity is at ${productivityRatio}%. Focus on more productive tasks.`,
      icon: <TrendingUp className="h-4 w-4 text-red-400" />
    });
  }

  if (bestHours.length > 0) {
    insights.push({
      type: 'info',
      message: `Your most productive hours: ${bestHours.join(', ')}. Schedule important work during these times.`,
      icon: <Clock className="h-4 w-4 text-blue-400" />
    });
  }

  if (mostProductiveDay) {
    insights.push({
      type: 'positive',
      message: `${mostProductiveDay} is your most productive day. Plan important tasks then!`,
      icon: <CalendarIcon className="h-4 w-4 text-purple-400" />
    });
  }

  if (streak > 0) {
    insights.push({
      type: 'positive',
      message: `You've tracked productive time for ${streak} day${streak > 1 ? 's' : ''}! ${streak >= 7 ? '🔥 Amazing streak!' : 'Keep it going!'}`,
      icon: <Zap className="h-4 w-4 text-orange-400" />
    });
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Lightbulb className="h-5 w-5" />
          <span>Insights & Goals</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Goal */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Daily Productive Goal</span>
            </div>
            <span className="text-sm text-gray-400">
              {formatDuration(productiveTime)} / {formatDuration(dailyGoal)}
            </span>
          </div>
          <Progress value={goalProgress} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{Math.round(goalProgress)}% complete</span>
            <span>{formatDuration(Math.max(0, dailyGoal - productiveTime))} remaining</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-700 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">{streak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{completedEntries.length}</div>
            <div className="text-xs text-gray-400">Total Entries</div>
          </div>
        </div>

        {/* Best Hours */}
        {bestHours.length > 0 && (
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-medium text-gray-300">Peak Productive Hours</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {bestHours.map((hour, idx) => (
                <Badge key={idx} className="bg-green-600 text-white">
                  {hour}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Insights</span>
          </h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg flex items-start space-x-2 ${
                  insight.type === 'positive'
                    ? 'bg-green-900/30 border border-green-800'
                    : insight.type === 'warning'
                    ? 'bg-red-900/30 border border-red-800'
                    : 'bg-blue-900/30 border border-blue-800'
                }`}
              >
                {insight.icon}
                <p className="text-sm text-gray-300 flex-1">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

