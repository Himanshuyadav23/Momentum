'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { Target, Flame, Calendar, TrendingUp } from 'lucide-react';

interface Habit {
  _id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
}

interface HabitStatsProps {
  refreshKey?: number;
}

export const HabitStats: React.FC<HabitStatsProps> = ({ refreshKey }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, [refreshKey]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHabits();
      if (response.success && response.data) {
        setHabits(response.data.habits);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHabits = habits.length;
  const activeHabits = habits.filter(habit => habit.isActive).length;
  const totalStreak = habits.reduce((sum, habit) => sum + habit.currentStreak, 0);
  const longestStreak = Math.max(...habits.map(habit => habit.longestStreak), 0);
  const avgStreak = totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0;

  const habitsByFrequency = habits.reduce((acc, habit) => {
    acc[habit.frequency] = (acc[habit.frequency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading habit stats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <TrendingUp className="h-5 w-5" />
          <span>Habit Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{totalHabits}</div>
            <div className="text-sm text-gray-400">Total Habits</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{activeHabits}</div>
            <div className="text-sm text-gray-400">Active Habits</div>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span>Streak Statistics</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-xl font-bold text-orange-400">{longestStreak}</div>
              <div className="text-xs text-gray-400">Longest Streak</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <div className="text-xl font-bold text-blue-400">{avgStreak}</div>
              <div className="text-xs text-gray-400">Average Streak</div>
            </div>
          </div>
        </div>

        {/* Frequency Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Frequency Breakdown</span>
          </h3>
          
          <div className="space-y-2">
            {Object.entries(habitsByFrequency).map(([frequency, count]) => (
              <div key={frequency} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="border-gray-500 text-gray-300"
                  >
                    {frequency}
                  </Badge>
                  <span className="text-sm text-gray-300">{count} habits</span>
                </div>
                <div className="w-20">
                  <Progress
                    value={(count / totalHabits) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Habits */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-500" />
            <span>Top Performing Habits</span>
          </h3>
          
          <div className="space-y-2">
            {habits
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .slice(0, 3)
              .map((habit, index) => (
                <div
                  key={habit._id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{habit.name}</p>
                      <p className="text-xs text-gray-400">{habit.frequency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-400">
                      {habit.currentStreak} days
                    </div>
                    <div className="text-xs text-gray-400">
                      Best: {habit.longestStreak}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


