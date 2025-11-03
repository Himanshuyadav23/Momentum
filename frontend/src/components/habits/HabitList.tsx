'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { Target, Plus, CheckCircle, Calendar, Flame, X, RotateCcw, Edit, TrendingUp } from 'lucide-react';

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
  todayCompletionCount?: number; // How many times completed today
  recentCompletions?: number; // Completions in last 7 days
}

interface HabitListProps {
  refreshTrigger?: number;
}

export const HabitList: React.FC<HabitListProps> = ({ refreshTrigger = 0 }) => {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', targetCount: 1 });

  useEffect(() => {
    fetchHabits();
  }, [refreshTrigger]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      // Use optimized endpoint that includes completion status in single call
      const response = await apiClient.getHabits(true); // includeCompletion = true
      if (response.success && response.data) {
        const d: any = response.data;
        const list: HabitWithCompletion[] = Array.isArray(d?.habits)
          ? d.habits.map((h: any) => ({
              ...h,
              completedToday: h.completedToday || false,
              todayCompletionCount: h.todayCompletionCount || 0,
              todayLogId: h.todayLogId,
              recentCompletions: h.recentCompletions || 0
            }))
          : Array.isArray(d)
            ? d
            : [];
        
        setHabits(list);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      alert('Habit not found');
      return;
    }
    
    // Allow multiple completions up to target count
    if (habit.todayCompletionCount && habit.todayCompletionCount >= habit.targetCount) {
      alert(`You've already completed this habit ${habit.targetCount} time${habit.targetCount > 1 ? 's' : ''} today!`);
      return;
    }
    
    try {
      setCompletingHabitId(habitId);
      const response = await apiClient.logHabit(habitId);
      
      if (response.success) {
        // Refresh habits immediately to show updated status
        await fetchHabits();
      } else {
        // Handle non-success response
        const errorMsg = response.message || 'Failed to complete habit';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to complete habit:', error);
      
      // Extract better error message
      let errorMessage = 'Failed to complete habit';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setCompletingHabitId(null);
    }
  };
  
  const undoCompletion = async (habitId: string, logId?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const confirmMsg = habit.todayCompletionCount && habit.todayCompletionCount > 1
      ? `Undo last completion? (${habit.todayCompletionCount - 1}/${habit.targetCount} remaining)`
      : 'Undo today\'s completion? This will remove the completion log.';
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    try {
      // If we have a logId, use it; otherwise fetch today's logs and delete the most recent
      let logToDelete = logId;
      if (!logToDelete) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const logsResponse = await apiClient.getHabitLogs(habitId, {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        });
        
        if (logsResponse.success) {
          const logsData = logsResponse.data as any;
          if (logsData?.habitLogs?.length > 0) {
            // Get the most recent log (last one added today)
            const todayLogs = logsData.habitLogs;
            logToDelete = todayLogs[todayLogs.length - 1].id;
          }
        }
      }
      
      if (!logToDelete) {
        alert('No completion found to undo');
        return;
      }
      
      const response = await apiClient.deleteHabitLog(logToDelete);
      if (response.success) {
        await fetchHabits();
      }
    } catch (error: any) {
      console.error('Failed to undo completion:', error);
      alert(error.message || 'Failed to undo completion');
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This will also delete all completion logs.')) {
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

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditFormData({
      name: habit.name,
      description: habit.description || '',
      targetCount: habit.targetCount
    });
  };

  const cancelEdit = () => {
    setEditingHabit(null);
    setEditFormData({ name: '', description: '', targetCount: 1 });
  };

  const saveEdit = async () => {
    if (!editingHabit) return;

    if (!editFormData.name.trim()) {
      alert('Habit name is required');
      return;
    }

    try {
      const response = await apiClient.updateHabit(editingHabit.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        targetCount: editFormData.targetCount
      });

      if (response.success) {
        setEditingHabit(null);
        await fetchHabits();
      } else {
        alert(response.message || 'Failed to update habit');
      }
    } catch (error: any) {
      console.error('Failed to update habit:', error);
      alert(error?.message || 'Failed to update habit');
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
                    {habit.targetCount > 1 && (
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        Target: {habit.targetCount}/day
                      </Badge>
                    )}
                    {habit.completedToday ? (
                      <Badge className="bg-green-600 text-white">
                        ✓ Target Met ({habit.todayCompletionCount}/{habit.targetCount})
                      </Badge>
                    ) : habit.todayCompletionCount && habit.todayCompletionCount > 0 ? (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        {habit.todayCompletionCount}/{habit.targetCount} Today
                      </Badge>
                    ) : null}
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
                      
                      // For today, use current completion status
                      let completionStatus = 'none';
                      let completionCount = 0;
                      
                      if (isToday) {
                        completionCount = habit.todayCompletionCount || 0;
                        completionStatus = habit.completedToday ? 'complete' : (completionCount > 0 ? 'partial' : 'none');
                      }
                      // TODO: In full implementation, fetch logs for each day to show historical completion
                      
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center border transition-colors ${
                            completionStatus === 'complete'
                              ? 'bg-green-600 border-green-400 text-white'
                              : completionStatus === 'partial'
                              ? 'bg-yellow-600 border-yellow-400 text-white'
                              : isToday
                              ? 'bg-gray-600 border-gray-500 text-gray-300'
                              : 'bg-gray-800 border-gray-700 text-gray-600'
                          }`}
                          title={`${date.toLocaleDateString()}${completionStatus === 'complete' ? ' - Target met' : completionStatus === 'partial' ? ` - ${completionCount}/${habit.targetCount}` : ''}`}
                        >
                          {isToday ? 'T' : date.getDate()}
                        </div>
                      );
                    })}
                    <span className="text-xs text-gray-400 ml-2">
                      {habit.recentCompletions || 0} completions this week
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => startEdit(habit)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteHabit(habit.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Edit Modal */}
              {editingHabit && editingHabit.id === habit.id && (
                <div className="mt-3 p-4 bg-gray-900 rounded-lg border border-gray-600 space-y-3">
                  <h4 className="text-white font-medium mb-2">Edit Habit</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white"
                      placeholder="Habit name"
                    />
                    <input
                      type="text"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white"
                      placeholder="Description (optional)"
                    />
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-300">Target:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editFormData.targetCount}
                        onChange={(e) => setEditFormData({ ...editFormData, targetCount: parseInt(e.target.value) || 1 })}
                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={saveEdit}
                      className="flex-1 bg-green-600 text-white hover:bg-green-500"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

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

              {/* Today's Progress */}
              {habit.targetCount > 1 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Today's Progress</span>
                    <span>{habit.todayCompletionCount || 0}/{habit.targetCount}</span>
                  </div>
                  <Progress
                    value={((habit.todayCompletionCount || 0) / habit.targetCount) * 100}
                    className="h-2"
                  />
                </div>
              )}

              {/* Streak Progress */}
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
                <div className="space-y-2">
                  {habit.targetCount > 1 && habit.todayCompletionCount && habit.todayCompletionCount > 0 && (
                    <Button
                      onClick={() => undoCompletion(habit.id)}
                      className="w-full bg-gray-600 text-white hover:bg-gray-500"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Undo Last ({habit.todayCompletionCount}/{habit.targetCount})
                    </Button>
                  )}
                  {(!habit.todayCompletionCount || habit.todayCompletionCount === 1 || habit.targetCount === 1) && (
                    <Button
                      onClick={() => undoCompletion(habit.id, habit.todayLogId)}
                      className="w-full bg-gray-600 text-white hover:bg-gray-500"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Undo Completion
                    </Button>
                  )}
                  <p className="text-xs text-center text-green-400">
                    ✓ Target met! Streak will count today
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => completeHabit(habit.id)}
                  className="w-full bg-green-600 text-white hover:bg-green-500"
                  disabled={completingHabitId === habit.id || !!(habit.todayCompletionCount && habit.todayCompletionCount >= habit.targetCount)}
                >
                  {completingHabitId === habit.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {habit.todayCompletionCount && habit.todayCompletionCount > 0 
                        ? `Complete (${habit.todayCompletionCount}/${habit.targetCount})`
                        : 'Mark Complete'}
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



