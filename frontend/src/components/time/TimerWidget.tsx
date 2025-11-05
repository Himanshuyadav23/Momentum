'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Play, Pause, Square, Clock, CheckCircle } from 'lucide-react';

interface TimerWidgetProps {
  onTimerUpdate?: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ onTimerUpdate }) => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isProductive, setIsProductive] = useState(true);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && activeTimer) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer]);

  const fetchActiveTimer = async () => {
    try {
      const response = await apiClient.getActiveTimer();
      const d: any = response.data || {};
      const active = d.timeEntry || d.activeEntry || null;
      if (response.success && active) {
        setActiveTimer(active);
        setIsRunning(true);
        const startTime = new Date(active.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTime(elapsed);
        setCategory(active.category);
        setDescription(active.description);
        setIsProductive(active.isProductive);
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
    }
  };

  const startTimer = async () => {
    if (!category.trim() || !description.trim()) {
      alert('Please enter both category and description');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting timer with:', { category: category.trim(), description: description.trim(), isProductive });
      
      const response = await apiClient.startTimer({
        category: category.trim(),
        description: description.trim(),
        isProductive
      });

      console.log('Start timer response:', response);

      if (response.success) {
        const d: any = response.data || {};
        const timeEntry = d.timeEntry || d;
        console.log('Setting active timer:', timeEntry);
        setActiveTimer(timeEntry);
        setIsRunning(true);
        setTime(0);
        onTimerUpdate?.();
      } else {
        // Handle case where response.success is false
        const errorMessage = response.message || 'Failed to start timer';
        console.error('Start timer failed:', response);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to start timer - Error details:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error response:', error?.response);
      
      // Try to extract a backend error message
      let message = 'Failed to start timer';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      // Show more detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error object:', JSON.stringify(error, null, 2));
        alert(`${message}\n\nCheck console for details.`);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    try {
      setLoading(true);
      const response = await apiClient.stopTimer((activeTimer?.id || activeTimer?._id) as any);

      if (response.success) {
        setActiveTimer(null);
        setIsRunning(false);
        setTime(0);
        setCategory('');
        setDescription('');
        onTimerUpdate?.();
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
      alert('Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Clock className="h-5 w-5" />
          <span>Time Tracker</span>
          {isRunning && (
            <Badge className="bg-red-500 text-white animate-pulse">
              Running
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning ? (
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono font-bold text-white">
              {formatTime(time)}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">{category}</p>
              <p className="text-sm text-gray-300">{description}</p>
              <Badge 
                variant={isProductive ? "default" : "destructive"}
                className={isProductive ? "bg-green-600" : "bg-red-600"}
              >
                {isProductive ? 'Productive' : 'Wasted'}
              </Badge>
            </div>
            <Button
              onClick={stopTimer}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              {loading ? 'Stopping...' : 'Stop Timer'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              {user?.timeCategories && user.timeCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {user.timeCategories.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        category === cat
                          ? 'bg-white text-black border-white'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="category"
                placeholder="e.g., Work, Study"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Input
                id="description"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex items-center space-x-4">
              <Label className="text-gray-300">Type:</Label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsProductive(true)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    isProductive
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                  }`}
                >
                  Productive
                </button>
                <button
                  onClick={() => setIsProductive(false)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    !isProductive
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                  }`}
                >
                  Wasted
                </button>
              </div>
            </div>

            <Button
              onClick={startTimer}
              disabled={loading || !category.trim() || !description.trim()}
              className="w-full bg-white text-black hover:bg-gray-100"
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? 'Starting...' : 'Start Timer'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



