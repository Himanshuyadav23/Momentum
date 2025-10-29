'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { User, Save, Trash2, Download, Upload } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    timeCategories: [] as string[],
    weeklyBudget: '',
    income: ''
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        timeCategories: user.timeCategories || [],
        weeklyBudget: user.weeklyBudget?.toString() || '',
        income: user.income?.toString() || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {
        name: formData.name.trim(),
        timeCategories: formData.timeCategories
      };

      if (formData.weeklyBudget) {
        updateData.weeklyBudget = parseFloat(formData.weeklyBudget);
      }

      if (formData.income) {
        updateData.income = parseFloat(formData.income);
      }

      await updateUser(updateData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
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

  const addCategory = () => {
    if (newCategory.trim() && !formData.timeCategories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        timeCategories: [...prev.timeCategories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      timeCategories: prev.timeCategories.filter(c => c !== category)
    }));
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteAccount();
      alert('Account deleted successfully');
      // The auth context will handle the logout
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // This would typically fetch all user data and create a downloadable file
      alert('Data export feature coming soon!');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-300">Please log in to access profile settings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <User className="h-5 w-5" />
          <span>Profile Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-gray-600 border-gray-500 text-gray-400"
            />
            <p className="text-xs text-gray-400">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Time Categories</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                type="button"
                onClick={addCategory}
                className="bg-white text-black hover:bg-gray-100"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.timeCategories.map((category) => (
                <Badge key={category} variant="secondary" className="bg-gray-600 text-gray-200 flex items-center gap-1">
                  {category}
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weeklyBudget" className="text-gray-300">Weekly Budget (Optional)</Label>
              <Input
                id="weeklyBudget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.weeklyBudget}
                onChange={(e) => handleInputChange('weeklyBudget', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income" className="text-gray-300">Monthly Income (Optional)</Label>
              <Input
                id="income"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.income}
                onChange={(e) => handleInputChange('income', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        {/* Data Management */}
        <div className="border-t border-gray-700 pt-6 space-y-4">
          <h3 className="text-lg font-medium text-white">Data Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={exportData}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            
            <Button
              onClick={deleteAccount}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



