'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { Target, Plus, CheckCircle, Calendar, Flame, X, RotateCcw } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: string;
}

interface HabitWithCompletion extends Habit {
  completedToday?: boolean;
  todayLogId?: string;
  recentCompletions?: number; // Completions in last 7 days
}

export const HabitList: React.FC = () => {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHabits();
      if (response.success && response.data) {
        const d: any = response.data;
        const list: Habit[] = Array.isArray(d?.habits)
          ? d.habits
          : Array.isArray(d)
            ? d
            : [];
        
        // Check which habits are completed today
        const habitsWithCompletion = await Promise.all(
          list.map(async (habit) => {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            
            try {
              const logsResponse = await apiClient.getHabitLogs(habit.id, {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString()
              });
              
              const todayLogs = logsResponse.success && logsResponse.data?.habitLogs 
                ? logsResponse.data.habitLogs 
                : [];
              
              // Get last 7 days completions for visualization
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);
              
              const weekLogsResponse = await apiClient.getHabitLogs(habit.id, {
                startDate: weekAgo.toISOString(),
                endDate: endOfDay.toISOString()
              });
              
              const weekLogs = weekLogsResponse.success && weekLogsResponse.data?.habitLogs 
                ? weekLogsResponse.data.habitLogs 
                : [];
              
              return {
                ...habit,
                completedToday: todayLogs.length > 0,
                todayLogId: todayLogs.length > 0 ? todayLogs[0].id : undefined,
                recentCompletions: weekLogs.length
              } as HabitWithCompletion;
            } catch (error) {
              console.error(`Error checking completion for habit ${habit.id}:`, error);
              return { ...habit, completedToday: false, recentCompletions: 0 } as HabitWithCompletion;
            }
          })
        );
        
        setHabits(habitsWithCompletion);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit?.completedToday) {
      alert('This habit is already completed today!');
      return;
    }
    
    try {
      setCompletingHabitId(habitId);
      const response = await apiClient.logHabit(habitId);
      if (response.success) {
        // Refresh habits to show updated streak
        await fetchHabits();
      }
    } catch (error: any) {
      console.error('Failed to complete habit:', error);
      alert(error.message || 'Failed to complete habit');
    } finally {
      setCompletingHabitId(null);
    }
  };
  
  const undoCompletion = async (habitId: string, logId: string) => {
    if (!confirm('Undo today\'s completion? This will remove the completion log.')) {
      return;
    }
    
    try {
      const response = await apiClient.deleteHabitLog(logId);
      if (response.success) {
        await fetchHabits();
      }
    } catch (error: any) {
      console.error('Failed to undo completion:', error);
      alert(error.message || 'Failed to undo completion');
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
              key={habit.id}
              className={`p-4 rounded-lg space-y-3 transition-all ${
                habit.completedToday 
                  ? 'bg-green-900/30 border-2 border-green-600' 
                  : 'bg-gray-700'
              }`}
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
                    {habit.completedToday && (
                      <Badge className="bg-green-600 text-white">
                        ✓ Done Today
                      </Badge>
                    )}
                  </div>
                  {habit.description && (
                    <p className="text-sm text-gray-300 mb-2">{habit.description}</p>
                  )}
                  
                  {/* Visual Calendar - Last 7 days */}
                  <div className="flex items-center space-x-1 mt-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dateKey = date.toISOString().split('T')[0];
                      
                      // Check if this date was completed (simplified - in full implementation would check logs)
                      // For now, we show completion based on today's status
                      const isCompleted = isToday && habit.completedToday;
                      
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center border transition-colors ${
                            isCompleted
                              ? 'bg-green-600 border-green-400 text-white'
                              : isToday
                              ? 'bg-gray-600 border-gray-500 text-gray-300'
                              : 'bg-gray-800 border-gray-700 text-gray-600'
                          }`}
                          title={`${date.toLocaleDateString()}${isCompleted ? ' - Completed' : ''}`}
                        >
                          {isToday ? 'T' : date.getDate()}
                        </div>
                      );
                    })}
                    <span className="text-xs text-gray-400 ml-2">
                      {habit.recentCompletions || 0}/7 days this week
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => deleteHabit(habit.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <X className="w-4 h-4" />
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

              {habit.completedToday ? (
                <Button
                  onClick={() => undoCompletion(habit.id, habit.todayLogId!)}
                  className="w-full bg-gray-600 text-white hover:bg-gray-500"
                  disabled={!habit.todayLogId}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Undo Completion
                </Button>
              ) : (
                <Button
                  onClick={() => completeHabit(habit.id)}
                  className="w-full bg-green-600 text-white hover:bg-green-500"
                  disabled={completingHabitId === habit.id}
                >
                  {completingHabitId === habit.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};



