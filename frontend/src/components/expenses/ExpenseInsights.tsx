'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { TrendingUp, DollarSign, Calendar, PieChart, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        // Handle both { stats: {...} } and direct {...} formats
        const responseData = response.data as any;
        const insightsData = responseData.stats || responseData;
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Failed to fetch expense insights:', error);
      setInsights(null);
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

  const CURRENCY_SYMBOLS: { [key: string]: string } = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'د.إ',
    SAR: '﷼'
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    const currencyCode = currency || 'INR';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      // Fallback if currency code is invalid
      const symbol = CURRENCY_SYMBOLS[currencyCode] || '₹';
      return `${symbol}${amount.toFixed(2)}`;
    }
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
            <div className="text-2xl font-bold text-white">
              {formatCurrency(insights.totalAmount || 0, 'INR')}
            </div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{insights.expenseCount || 0}</div>
            <div className="text-sm text-gray-400">Transactions</div>
          </div>
        </div>

        {/* Budget Alert Card - Show only for weekly view */}
        {dateRange === 'week' && insights.budgetInfo && insights.budgetInfo.weeklyBudget && (
          <div className={`p-4 rounded-lg border-2 ${
            insights.budgetInfo.isOverBudget
              ? 'bg-red-900/30 border-red-500'
              : insights.budgetInfo.percentageUsed >= 80
              ? 'bg-yellow-900/30 border-yellow-500'
              : 'bg-green-900/30 border-green-500'
          }`}>
            <div className="flex items-start space-x-3">
              {insights.budgetInfo.isOverBudget ? (
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : insights.budgetInfo.percentageUsed >= 80 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Weekly Budget Status</h3>
                  <Badge className={
                    insights.budgetInfo.isOverBudget
                      ? 'bg-red-500'
                      : insights.budgetInfo.percentageUsed >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }>
                    {insights.budgetInfo.isOverBudget ? 'Over Budget' : 
                     insights.budgetInfo.percentageUsed >= 80 ? 'Warning' : 'On Track'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Budget:</span>
                    <span className="text-white font-medium">{formatCurrency(insights.budgetInfo.weeklyBudget, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Spent:</span>
                    <span className={`font-medium ${
                      insights.budgetInfo.isOverBudget ? 'text-red-300' : 'text-white'
                    }`}>
                      {formatCurrency(insights.budgetInfo.currentWeekSpending, 'INR')}
                    </span>
                  </div>
                  {insights.budgetInfo.isOverBudget ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Over Budget:</span>
                      <span className="text-red-300 font-bold">
                        {formatCurrency(insights.budgetInfo.overBudgetAmount, 'INR')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Remaining:</span>
                      <span className="text-green-300 font-medium">
                        {formatCurrency(insights.budgetInfo.remainingBudget, 'INR')}
                      </span>
                    </div>
                  )}
                  <Progress 
                    value={Math.min(insights.budgetInfo.percentageUsed, 100)} 
                    className={`h-3 ${
                      insights.budgetInfo.isOverBudget
                        ? 'bg-red-500'
                        : insights.budgetInfo.percentageUsed >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <div className="text-xs text-center text-gray-400">
                    {insights.budgetInfo.percentageUsed.toFixed(1)}% of budget used
                  </div>
                  {insights.budgetInfo.isOverBudget && (
                    <div className="mt-2 p-2 bg-red-950/50 rounded border border-red-500/50">
                      <p className="text-xs text-red-200">
                        ⚠️ You've exceeded your weekly budget by {formatCurrency(insights.budgetInfo.overBudgetAmount, 'INR')}. 
                        Consider reviewing your spending.
                      </p>
                    </div>
                  )}
                  {!insights.budgetInfo.isOverBudget && insights.budgetInfo.percentageUsed >= 80 && (
                    <div className="mt-2 p-2 bg-yellow-950/50 rounded border border-yellow-500/50">
                      <p className="text-xs text-yellow-200">
                        ⚠️ You're close to your weekly budget limit. Be mindful of your spending.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Average Daily Spending */}
        {insights.averageDaily > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {formatCurrency(insights.averageDaily || 0, 'INR')}
              </div>
              <div className="text-sm text-blue-200">Average per day</div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-500" />
            <span>Category Breakdown</span>
          </h3>
          
          <div className="space-y-3">
            {sortedCategories.slice(0, 5).map(([category, amount], index) => {
              const total = insights.totalAmount || 1;
              const percentage = ((amount as number) / total) * 100;
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
                      <div className="text-sm font-bold text-white">{formatCurrency(amount as number, 'INR')}</div>
                      <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {sortedCategories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No expenses in this period</p>
            )}
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
                  <div className="text-sm font-bold text-white">{formatCurrency(amount as number, 'INR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average per Transaction */}
        {insights.expenseCount > 0 && (
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {formatCurrency((insights.totalAmount || 0) / Math.max(insights.expenseCount || 1, 1), 'INR')}
              </div>
              <div className="text-sm text-gray-400">Average per transaction</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



