'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Plus, Clock } from 'lucide-react';

interface ManualTimeEntryProps {
  onEntryAdded?: () => void;
}

export const ManualTimeEntry: React.FC<ManualTimeEntryProps> = ({ onEntryAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    startTime: '',
    endTime: '',
    isProductive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category.trim() || !formData.description.trim() || !formData.startTime || !formData.endTime) {
      alert('Please fill in all fields');
      return;
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      console.log('Adding manual time entry:', {
        category: formData.category.trim(),
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        isProductive: formData.isProductive
      });
      
      const response = await apiClient.addManualTimeEntry({
        category: formData.category.trim(),
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        isProductive: formData.isProductive
      });

      console.log('Manual time entry response:', response);

      if (response.success) {
        // Reset form
        setFormData({
          category: '',
          description: '',
          startTime: '',
          endTime: '',
          isProductive: true
        });
        
        // Trigger refresh of entries list
        onEntryAdded?.();
        alert('Time entry added successfully!');
      } else {
        // Handle case where response.success is false
        const errorMessage = response.message || 'Failed to add time entry';
        console.error('Add manual entry failed:', response);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to add time entry - Error details:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error response:', error?.response);
      
      // Try to extract a backend error message
      let message = 'Failed to add time entry';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      // Show more detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error object:', JSON.stringify(error, null, 2));
        alert(`${message}\n\nCheck console for details.`);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Plus className="h-5 w-5" />
          <span>Add Manual Time Entry</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Work, Study, Exercise"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Input
                id="description"
                placeholder="What did you work on?"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-gray-300">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-gray-300">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Type</Label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleInputChange('isProductive', true)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  formData.isProductive
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                Productive
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('isProductive', false)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  !formData.isProductive
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                Wasted
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const now = getCurrentDateTime();
                setFormData(prev => ({
                  ...prev,
                  startTime: now,
                  endTime: now
                }));
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Set to Now
            </Button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            {loading ? 'Adding...' : 'Add Time Entry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};



