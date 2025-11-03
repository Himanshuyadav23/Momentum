'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface ActivityHeatmapProps {
  activityData: { [date: string]: { hasTime: boolean; hasHabit: boolean; hasExpense: boolean; completed: boolean } };
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  activityData,
  currentStreak,
  longestStreak,
  totalDays
}) => {
  // Generate array of last 52 weeks (364 days) starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const days: Array<{ date: Date; dateStr: string; completed: boolean }> = [];
  for (let i = 363; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = activityData[dateStr];
    days.push({
      date,
      dateStr,
      completed: dayData?.completed || false
    });
  }

  // Group days into weeks (7 days per week)
  const weeks: Array<Array<typeof days[0]>> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get week day labels
  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getColorClass = (completed: boolean) => {
    if (completed) {
      return 'bg-green-500 hover:bg-green-600';
    }
    return 'bg-gray-700 hover:bg-gray-600';
  };

  const getTooltipText = (day: typeof days[0]) => {
    const dayData = activityData[day.dateStr];
    if (!dayData || !dayData.completed) {
      return `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: No activity`;
    }
    const parts = [];
    if (dayData.hasTime) parts.push('Time tracked');
    if (dayData.hasHabit) parts.push('Habit completed');
    if (dayData.hasExpense) parts.push('Expense logged');
    const allThree = dayData.hasTime && dayData.hasHabit && dayData.hasExpense;
    const status = allThree ? '✓ All activities completed' : 'Activity logged';
    return `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${status}\n${parts.join(', ')}`;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Activity Heatmap</span>
          <div className="flex items-center space-x-4 text-sm font-normal">
            {currentStreak > 0 && (
              <div className="flex items-center space-x-1 text-orange-400">
                <Flame className="h-4 w-4" />
                <span>{currentStreak} day streak</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{currentStreak}</div>
              <div className="text-xs text-gray-400">Current Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{longestStreak}</div>
              <div className="text-xs text-gray-400">Longest Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalDays}</div>
              <div className="text-xs text-gray-400">Total Days</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {/* Week day labels */}
            <div className="flex flex-col space-y-1 pr-2 flex-shrink-0">
              <div className="h-3"></div>
              {weekDayLabels.map((label, idx) => (
                <div key={idx} className="text-xs text-gray-400 h-3 flex items-center">
                  {idx % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex space-x-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col space-y-1">
                  {week.map((day, dayIdx) => (
                    <div
                      key={day.dateStr}
                      className={`w-3 h-3 rounded-sm transition-colors cursor-pointer ${getColorClass(day.completed)}`}
                      title={getTooltipText(day)}
                      data-date={day.dateStr}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-sm bg-gray-700"></div>
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              </div>
              <span>More</span>
            </div>
            <div className="text-gray-500">
              <span className="text-green-500">Green</span> = Activity logged (Time tracked, Habit completed, or Expense logged)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

