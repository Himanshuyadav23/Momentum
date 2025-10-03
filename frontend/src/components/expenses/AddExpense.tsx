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

export const AddExpense: React.FC<AddExpenseProps> = ({ onExpenseAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
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
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date || undefined
      });

      if (response.success) {
        // Reset form
        setFormData({
          amount: '',
          category: '',
          description: '',
          date: ''
        });
        onExpenseAdded?.();
        alert('Expense added successfully!');
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense');
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
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-300">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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


