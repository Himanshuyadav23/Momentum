'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { Plus, Target } from 'lucide-react';

interface CreateHabitProps {
  onHabitCreated?: () => void;
}

export const CreateHabit: React.FC<CreateHabitProps> = ({ onHabitCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly',
    targetCount: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.createHabit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        frequency: formData.frequency,
        targetCount: formData.targetCount
      });

      if (response.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          frequency: 'daily',
          targetCount: 1
        });
        onHabitCreated?.();
        alert('Habit created successfully!');
      }
    } catch (error) {
      console.error('Failed to create habit:', error);
      alert('Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Plus className="h-5 w-5" />
          <span>Create New Habit</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Habit Name</Label>
            <Input
              id="name"
              placeholder="e.g., Drink 8 glasses of water"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Add a description for your habit"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Frequency</Label>
            <div className="flex space-x-2">
              {['daily', 'weekly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleInputChange('frequency', freq)}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    formData.frequency === freq
                      ? 'bg-white text-black border-white'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCount" className="text-gray-300">
              Target Count ({formData.frequency === 'daily' ? 'per day' : 'per week'})
            </Label>
            <Input
              id="targetCount"
              type="number"
              min="1"
              max="10"
              value={formData.targetCount}
              onChange={(e) => handleInputChange('targetCount', parseInt(e.target.value) || 1)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            <Target className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Habit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};



