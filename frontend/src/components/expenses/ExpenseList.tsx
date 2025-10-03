'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { DollarSign, Calendar, Filter, Trash2, Edit } from 'lucide-react';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
}

export const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(dateRange);
      const endDate = new Date().toISOString();

      const response = await apiClient.getExpenses({
        startDate,
        endDate
      });

      if (response.success && response.data) {
        setExpenses(response.data.expenses);
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.expenses.map((exp: Expense) => exp.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await apiClient.deleteExpense(expenseId);
      if (response.success) {
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true;
    return expense.category === filter;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading expenses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <DollarSign className="h-5 w-5" />
          <span>Expense History</span>
          <Badge variant="secondary" className="bg-gray-600 text-gray-200">
            {filteredExpenses.length}
          </Badge>
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
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                filter === 'all'
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  filter === category
                    ? 'bg-white text-black border-white'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
            <p className="text-sm text-gray-400">Total {dateRange} expenses</p>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No expenses found</p>
              <p className="text-sm text-gray-500">Add your first expense to get started</p>
            </div>
          ) : (
            filteredExpenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-white">{expense.category}</h3>
                      <Badge variant="outline" className="border-gray-500 text-gray-300">
                        {formatDate(expense.date)}
                      </Badge>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-300 mb-1">{expense.description}</p>
                    )}
                    <p className="text-lg font-bold text-white">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => deleteExpense(expense._id)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};


