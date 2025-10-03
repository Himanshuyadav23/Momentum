'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';

interface ExpenseInsightsProps {
  refreshKey?: number;
}

export const ExpenseInsights: React.FC<ExpenseInsightsProps> = ({ refreshKey }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchInsights();
  }, [dateRange, refreshKey]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString();

      const response = await apiClient.getExpenseSummary({
        startDate,
        endDate
      });

      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch expense insights:', error);
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
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
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
            <p className="text-gray-300">Loading insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <PieChart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No expense data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryEntries = Object.entries(insights.categoryBreakdown || {});
  const sortedCategories = categoryEntries.sort(([,a], [,b]) => (b as number) - (a as number));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <TrendingUp className="h-5 w-5" />
          <span>Expense Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selector */}
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{formatCurrency(insights.totalAmount)}</div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{insights.expenseCount}</div>
            <div className="text-sm text-gray-400">Transactions</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            <span>Category Breakdown</span>
          </h3>
          
          <div className="space-y-3">
            {sortedCategories.slice(0, 5).map(([category, amount], index) => {
              const percentage = ((amount as number) / insights.totalAmount) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-300">{category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{formatCurrency(amount as number)}</div>
                      <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span>Top Spending Categories</span>
          </h3>
          
          <div className="space-y-2">
            {sortedCategories.slice(0, 3).map(([category, amount], index) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{category}</p>
                    <p className="text-xs text-gray-400">
                      {(((amount as number) / insights.totalAmount) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatCurrency(amount as number)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average per Transaction */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {formatCurrency(insights.totalAmount / Math.max(insights.expenseCount, 1))}
            </div>
            <div className="text-sm text-gray-400">Average per transaction</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


