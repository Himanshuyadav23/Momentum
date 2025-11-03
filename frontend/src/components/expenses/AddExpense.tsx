'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { Plus, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AddExpenseProps {
  onExpenseAdded?: () => void;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Gas',
  'Coffee',
  'Subscriptions',
  'Other'
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
];

export const AddExpense: React.FC<AddExpenseProps> = ({ onExpenseAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<{ message: string; wouldExceed: boolean } | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR', // Default to INR
    category: '',
    description: '',
    date: ''
  });

  // Check budget when amount or date changes
  React.useEffect(() => {
    checkBudget();
  }, [formData.amount, formData.date, user?.weeklyBudget]);

  const checkBudget = async () => {
    if (!formData.amount || !user?.weeklyBudget) {
      setBudgetWarning(null);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setBudgetWarning(null);
      return;
    }

    // Check if the expense date is in the current week
    const expenseDate = formData.date ? new Date(formData.date) : new Date();
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Only check budget if expense is in current week
    if (expenseDate >= weekStart && expenseDate < weekEnd) {
      try {
        const startDate = weekStart.toISOString();
        const endDate = new Date().toISOString();

        const response = await apiClient.getExpenseSummary({
          startDate,
          endDate
        });

        if (response.success && response.data) {
          const responseData = response.data as any;
          const insightsData = responseData.stats || responseData;
          const currentWeekSpending = insightsData.totalAmount || 0;
          const newTotal = currentWeekSpending + amount;

          if (newTotal > user.weeklyBudget) {
            const overAmount = newTotal - user.weeklyBudget;
            setBudgetWarning({
              message: `Adding this expense will exceed your weekly budget by ${formatCurrency(overAmount)}.`,
              wouldExceed: true
            });
          } else if (newTotal > user.weeklyBudget * 0.8) {
            const remaining = user.weeklyBudget - newTotal;
            setBudgetWarning({
              message: `Adding this expense will use ${((newTotal / user.weeklyBudget) * 100).toFixed(1)}% of your weekly budget. Only ${formatCurrency(remaining)} remaining.`,
              wouldExceed: false
            });
          } else {
            setBudgetWarning(null);
          }
        }
      } catch (error) {
        // Silently fail budget check
        console.error('Budget check error:', error);
      }
    } else {
      setBudgetWarning(null);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = formData.currency || 'INR';
    const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₹';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category.trim()) {
      alert('Please enter amount and category');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Show confirmation if budget would be exceeded
    if (budgetWarning?.wouldExceed) {
      const confirmed = window.confirm(
        `⚠️ Warning: This expense will exceed your weekly budget!\n\n${budgetWarning.message}\n\nDo you still want to add this expense?`
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setLoading(true);
      const response = await apiClient.createExpense({
        amount,
        currency: formData.currency,
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date || undefined
      });

      if (response.success) {
        // Reset form (keep currency selection)
        setFormData({
          amount: '',
          currency: formData.currency, // Keep currency selection
          category: '',
          description: '',
          date: ''
        });
        setBudgetWarning(null);
        onExpenseAdded?.();
      } else {
        throw new Error(response.message || 'Failed to add expense');
      }
    } catch (error: any) {
      console.error('Failed to add expense:', error);
      alert(error?.message || 'Failed to add expense. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Plus className="h-5 w-5" />
          <span>Add Expense</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 font-semibold">
                  {CURRENCIES.find(c => c.code === formData.currency)?.symbol || '₹'}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-gray-300">Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-white"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleInputChange('category', category)}
                  className={`p-2 text-sm rounded-md border transition-colors ${
                    formData.category === category
                      ? 'bg-white text-black border-white'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <Input
              id="category"
              placeholder="Or enter custom category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What did you spend on?"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Budget Warning */}
          {budgetWarning && (
            <div className={`p-3 rounded-lg border ${
              budgetWarning.wouldExceed
                ? 'bg-red-900/30 border-red-500'
                : 'bg-yellow-900/30 border-yellow-500'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                  budgetWarning.wouldExceed ? 'text-red-400' : 'text-yellow-400'
                }`} />
                <p className={`text-sm ${
                  budgetWarning.wouldExceed ? 'text-red-200' : 'text-yellow-200'
                }`}>
                  {budgetWarning.message}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-300">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleInputChange('date', getCurrentDate())}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Set to Today
            </Button>
          </div>

          <Button
            type="submit"
            disabled={loading || !formData.amount || !formData.category.trim()}
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};



