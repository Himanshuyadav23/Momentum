'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { DollarSign, Calendar, Filter, Trash2, Edit, Search, Download, ArrowUpDown } from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  currency?: string;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
}

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

interface ExpenseListProps {
  refreshTrigger?: number;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ refreshTrigger = 0 }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchExpenses();
  }, [dateRange, refreshTrigger]);

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
        const d: any = response.data;
        const list: Expense[] = Array.isArray(d?.expenses)
          ? d.expenses
          : Array.isArray(d)
            ? d
            : [];
        setExpenses(list);
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(list.map((exp: Expense) => exp.category)));
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

  const getCurrencySymbol = (currency: string = 'INR') => {
    return CURRENCY_SYMBOLS[currency] || '₹';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    // Check if this week
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date >= weekAgo) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    // Otherwise return full date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const exportToCSV = () => {
    const csvHeaders = ['Date', 'Category', 'Description', 'Amount', 'Currency'];
    const csvRows = filteredExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      expense.description || '',
      expense.amount.toString(),
      expense.currency || 'INR'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  // Filter and sort expenses
  let filteredExpenses = expenses.filter(expense => {
    // Category filter
    if (filter !== 'all' && expense.category !== filter) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCategory = expense.category.toLowerCase().includes(query);
      const matchesDescription = expense.description?.toLowerCase().includes(query);
      const matchesAmount = expense.amount.toString().includes(query);
      if (!matchesCategory && !matchesDescription && !matchesAmount) {
        return false;
      }
    }
    return true;
  });

  // Sort expenses
  filteredExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Group expenses by currency for totals
  const totalsByCurrency = filteredExpenses.reduce((acc, expense) => {
    const currency = expense.currency || 'INR';
    acc[currency] = (acc[currency] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Get primary currency (most used or INR)
  const primaryCurrency = Object.keys(totalsByCurrency).length > 0
    ? Object.entries(totalsByCurrency).sort((a, b) => b[1] - a[1])[0][0]
    : 'INR';
  const totalAmount = totalsByCurrency[primaryCurrency] || 0;

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
        {/* Search and Export */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-white"
            />
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={filteredExpenses.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

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
          
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md border transition-colors whitespace-nowrap ${
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
                className={`px-3 py-1 text-sm rounded-md border transition-colors whitespace-nowrap ${
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

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ArrowUpDown className="w-4 h-4" />
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-white"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm hover:bg-gray-600 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount, primaryCurrency)}</p>
            <p className="text-sm text-gray-400">Total {dateRange} expenses</p>
            {Object.keys(totalsByCurrency).length > 1 && (
              <div className="mt-2 space-y-1">
                {Object.entries(totalsByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs text-gray-400">
                    {formatCurrency(amount, currency)} ({currency})
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? 'No expenses match your search' : expenses.length === 0 ? 'No expenses found' : 'No expenses match the current filters'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                >
                  Clear search
                </button>
              )}
              {expenses.length === 0 && (
                <p className="text-sm text-gray-500">Add your first expense to get started</p>
              )}
            </div>
          ) : (
            filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
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
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      {expense.currency && expense.currency !== 'INR' && (
                        <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                          {expense.currency}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => deleteExpense(expense.id)}
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



