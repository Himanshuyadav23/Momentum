'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { Plus, DollarSign } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR', // Default to INR
    category: '',
    description: '',
    date: ''
  });

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



