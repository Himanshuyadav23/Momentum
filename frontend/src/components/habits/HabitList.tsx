'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { Target, Plus, CheckCircle, Calendar, Flame } from 'lucide-react';

interface Habit {
  _id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: string;
}

export const HabitList: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

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

  const completeHabit = async (habitId: string) => {
    try {
      const response = await apiClient.completeHabit(habitId);
      if (response.success) {
        // Refresh habits to show updated streak
        fetchHabits();
      }
    } catch (error) {
      console.error('Failed to complete habit:', error);
      alert('Failed to complete habit');
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) {
      return;
    }

    try {
      const response = await apiClient.deleteHabit(habitId);
      if (response.success) {
        fetchHabits();
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
      alert('Failed to delete habit');
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading habits...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Target className="h-5 w-5" />
          <span>Your Habits</span>
          <Badge variant="secondary" className="bg-gray-600 text-gray-200">
            {habits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No habits yet</p>
            <p className="text-sm text-gray-500">Create your first habit to start tracking</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit._id}
              className="p-4 bg-gray-700 rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-white">{habit.name}</h3>
                    <Badge
                      variant="outline"
                      className="border-gray-500 text-gray-300"
                    >
                      {habit.frequency}
                    </Badge>
                  </div>
                  {habit.description && (
                    <p className="text-sm text-gray-300 mb-2">{habit.description}</p>
                  )}
                </div>
                <Button
                  onClick={() => deleteHabit(habit._id)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                >
                  Delete
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-300">
                    {habit.currentStreak} day streak
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Best: {habit.longestStreak} days
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Progress
                  value={(habit.currentStreak / Math.max(habit.longestStreak, 1)) * 100}
                  className="flex-1 h-2"
                />
                <span className="text-xs text-gray-400">
                  {Math.round((habit.currentStreak / Math.max(habit.longestStreak, 1)) * 100)}%
                </span>
              </div>

              <Button
                onClick={() => completeHabit(habit._id)}
                className="w-full bg-white text-black hover:bg-gray-100"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};


