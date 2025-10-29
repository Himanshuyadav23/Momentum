'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Clock, Calendar, Filter, Plus } from 'lucide-react';

interface TimeEntry {
  _id: string;
  category: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  isProductive: boolean;
  isActive: boolean;
}

export const TimeEntries: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'productive' | 'wasted'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchTimeEntries();
  }, [dateRange]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString();

      const response = await apiClient.getTimeEntries({
        startDate,
        endDate
      });

      if (response.success && response.data) {
        setEntries(response.data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'productive') return entry.isProductive;
    if (filter === 'wasted') return !entry.isProductive;
    return true;
  });

  const totalTime = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const productiveTime = filteredEntries
    .filter(entry => entry.isProductive)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const wastedTime = filteredEntries
    .filter(entry => !entry.isProductive)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading time entries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Clock className="h-5 w-5" />
          <span>Time Entries</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex space-x-1">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  dateRange === range
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-1">
            {['all', 'productive', 'wasted'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  filter === type
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatDuration(totalTime)}</p>
            <p className="text-xs text-gray-400">Total Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{formatDuration(productiveTime)}</p>
            <p className="text-xs text-gray-400">Productive</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{formatDuration(wastedTime)}</p>
            <p className="text-xs text-gray-400">Wasted</p>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No time entries found</p>
              <p className="text-sm text-gray-500">Start tracking your time to see entries here</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-white">{entry.category}</h3>
                    <Badge
                      variant={entry.isProductive ? "default" : "destructive"}
                      className={entry.isProductive ? "bg-green-600" : "bg-red-600"}
                    >
                      {entry.isProductive ? 'Productive' : 'Wasted'}
                    </Badge>
                    {entry.isActive && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{entry.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateTime(entry.startTime)}</span>
                    </span>
                    {entry.duration && (
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(entry.duration)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};



