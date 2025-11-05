'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Clock, Calendar, Filter, Plus, TrendingUp, TrendingDown, BarChart3, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TimeInsights } from './TimeInsights';

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

interface TimeEntriesProps {
  refreshTrigger?: number;
  onDataUpdate?: (data: {
    entries: TimeEntry[];
    productiveTime: number;
    wastedTime: number;
    totalTime: number;
    productivityRatio: number;
  }) => void;
}

export const TimeEntries: React.FC<TimeEntriesProps> = ({ refreshTrigger = 0, onDataUpdate }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'productive' | 'wasted'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchTimeEntries();
  }, [dateRange, refreshTrigger]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString();

      console.log('Fetching time entries:', { dateRange, startDate, endDate });

      const response = await apiClient.getTimeEntries({
        startDate,
        endDate
      });

      console.log('Time entries response:', response);

      if (response.success && response.data) {
        const d: any = response.data;
        // Backend returns { data: { timeEntries: [...] } }
        const list: TimeEntry[] = Array.isArray(d?.timeEntries)
          ? d.timeEntries
          : Array.isArray(d?.entries)
            ? d.entries
            : Array.isArray(d)
              ? d
              : [];
        console.log('Setting time entries:', list.length, 'entries');
        setEntries(list);
      } else {
        console.warn('Time entries response not successful:', response);
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      setEntries([]);
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

  const filteredEntries = entries
    .filter(entry => {
      if (filter === 'all') return true;
      if (filter === 'productive') return entry.isProductive;
      if (filter === 'wasted') return !entry.isProductive;
      return true;
    })
    .sort((a, b) => {
      // Active entries first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      // Then by start time (newest first)
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

  // Only count completed entries (not active ones) in totals
  const completedEntries = filteredEntries.filter(entry => !entry.isActive && entry.duration !== undefined);
  const totalTime = completedEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const productiveTime = completedEntries
    .filter(entry => entry.isProductive)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const wastedTime = completedEntries
    .filter(entry => !entry.isProductive)
    .reduce((sum, entry) => sum + (entry.duration || 0), 0);
  
  // Calculate productivity ratio
  const productivityRatio = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
  
  // Category breakdown (only for completed entries)
  const categoryBreakdown = completedEntries.reduce((acc, entry) => {
    const cat = entry.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, productive: 0, wasted: 0, count: 0 };
    }
    acc[cat].total += entry.duration || 0;
    acc[cat].count += 1;
    if (entry.isProductive) {
      acc[cat].productive += entry.duration || 0;
    } else {
      acc[cat].wasted += entry.duration || 0;
    }
    return acc;
  }, {} as Record<string, { total: number; productive: number; wasted: number; count: number }>);

  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5); // Top 5 categories

  // Notify parent component of data updates
  useEffect(() => {
    if (onDataUpdate && !loading && entries.length >= 0) {
      onDataUpdate({
        entries,
        productiveTime,
        wastedTime,
        totalTime,
        productivityRatio
      });
    }
  }, [entries, productiveTime, wastedTime, totalTime, productivityRatio, loading, onDataUpdate]);

  const exportData = () => {
    const csv = [
      ['Category', 'Description', 'Start Time', 'End Time', 'Duration (minutes)', 'Type', 'Status'].join(','),
      ...filteredEntries.map(entry => [
        entry.category,
        `"${entry.description}"`,
        new Date(entry.startTime).toLocaleString(),
        entry.endTime ? new Date(entry.endTime).toLocaleString() : 'N/A',
        entry.duration || 'N/A',
        entry.isProductive ? 'Productive' : 'Wasted',
        entry.isActive ? 'Active' : 'Completed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-entries-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Clock className="h-5 w-5" />
            <span>Time Entries</span>
          </CardTitle>
          {filteredEntries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
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

          {/* Category Filter */}
          {sortedCategories.length > 0 && (
            <div className="flex space-x-1 flex-wrap gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                All Categories
              </button>
              {sortedCategories.map(([category]) => (
                <button
                  key={category}
                  onClick={() => {
                    // This would need category filter state, simplified for now
                  }}
                  className="px-2 py-1 text-xs rounded-md border bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400"
                  title={`Filter by ${category}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          {/* Main Stats */}
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

          {/* Productivity Ratio */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {productivityRatio >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : productivityRatio >= 50 ? (
                  <BarChart3 className="h-4 w-4 text-yellow-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm font-medium text-gray-300">Productivity Ratio</span>
              </div>
              <span className={`text-lg font-bold ${
                productivityRatio >= 70 ? 'text-green-400' : 
                productivityRatio >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {productivityRatio}%
              </span>
            </div>
            <Progress 
              value={productivityRatio} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Productive: {formatDuration(productiveTime)}</span>
              <span>Wasted: {formatDuration(wastedTime)}</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {sortedCategories.length > 0 && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="h-4 w-4 text-gray-300" />
                <h3 className="text-sm font-medium text-gray-300">Top Categories</h3>
              </div>
              <div className="space-y-2">
                {sortedCategories.map(([category, stats]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-medium">{category}</span>
                      <span className="text-gray-400">{formatDuration(stats.total)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div className="flex h-full">
                          {stats.productive > 0 && (
                            <div 
                              className="bg-green-500"
                              style={{ width: `${(stats.productive / stats.total) * 100}%` }}
                            />
                          )}
                          {stats.wasted > 0 && (
                            <div 
                              className="bg-red-500"
                              style={{ width: `${(stats.wasted / stats.total) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {stats.count} {stats.count === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                key={entry.id}
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
                    {entry.endTime && (
                      <span className="flex items-center space-x-1">
                        <span>→</span>
                        <span>{formatDateTime(entry.endTime)}</span>
                      </span>
                    )}
                    {entry.isActive ? (
                      <span className="flex items-center space-x-1 font-semibold text-orange-400 animate-pulse">
                        <Clock className="h-3 w-3" />
                        <span>Running...</span>
                      </span>
                    ) : entry.duration !== undefined ? (
                      <span className="flex items-center space-x-1 font-semibold">
                        <Clock className="h-3 w-3" />
                        <span className={entry.isProductive ? 'text-green-400' : 'text-red-400'}>
                          {formatDuration(entry.duration)}
                        </span>
                      </span>
                    ) : null}
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



