'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Check, Plus, X } from 'lucide-react';

const TIME_CATEGORIES = [
  'Work', 'Study', 'Exercise', 'Social', 'Entertainment', 
  'Reading', 'Coding', 'Design', 'Writing', 'Learning',
  'Family', 'Hobbies', 'Travel', 'Shopping', 'Cooking'
];

const HABIT_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();

  // Step 1: Time Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');

  // Step 2: First Habit
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [skipHabit, setSkipHabit] = useState(false);

  // Step 3: Budget/Income
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [income, setIncome] = useState('');
  const [skipBudget, setSkipBudget] = useState(false);

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories([...selectedCategories, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      const updateData: any = {
        onboardingCompleted: true,
        timeCategories: selectedCategories
      };

      if (!skipBudget) {
        if (weeklyBudget) updateData.weeklyBudget = parseFloat(weeklyBudget);
        if (income) updateData.income = parseFloat(income);
      }

      await updateUser(updateData);

      // TODO: Create first habit if not skipped
      if (!skipHabit && habitName.trim()) {
        // This would be handled by the habit creation API
        console.log('Creating first habit:', { habitName, habitDescription, habitFrequency });
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedCategories.length >= 3;
      case 2:
        return skipHabit || habitName.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <Card className="w-full max-w-2xl bg-card border-gray-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-white text-black'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {step < currentStep ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {currentStep === 1 && 'Set Up Your Time Categories'}
            {currentStep === 2 && 'Create Your First Habit'}
            {currentStep === 3 && 'Set Your Budget (Optional)'}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {currentStep === 1 && 'Choose at least 3 categories to track your time'}
            {currentStep === 2 && 'Start building good habits from day one'}
            {currentStep === 3 && 'Track your expenses and income for better insights'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Time Categories */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TIME_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      if (selectedCategories.includes(category)) {
                        removeCategory(category);
                      } else if (selectedCategories.length < 10) {
                        setSelectedCategories([...selectedCategories, category]);
                      }
                    }}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-white text-black border-white'
                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <Button onClick={addCustomCategory} size="sm" className="bg-white text-black hover:bg-gray-100">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Categories ({selectedCategories.length}/10)</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <button
                          onClick={() => removeCategory(category)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: First Habit */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="skipHabit"
                  checked={skipHabit}
                  onChange={(e) => setSkipHabit(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="skipHabit">Skip for now</Label>
              </div>

              {!skipHabit && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habitName">Habit Name</Label>
                    <Input
                      id="habitName"
                      placeholder="e.g., Drink 8 glasses of water"
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="habitDescription">Description (Optional)</Label>
                    <Input
                      id="habitDescription"
                      placeholder="Add a description for your habit"
                      value={habitDescription}
                      onChange={(e) => setHabitDescription(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <div className="flex space-x-2">
                      {HABIT_FREQUENCIES.map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => setHabitFrequency(freq.value)}
                          className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                            habitFrequency === freq.value
                              ? 'bg-white text-black border-white'
                              : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget/Income */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="skipBudget"
                  checked={skipBudget}
                  onChange={(e) => setSkipBudget(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="skipBudget">Skip for now</Label>
              </div>

              {!skipBudget && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyBudget">Weekly Budget (Optional)</Label>
                    <Input
                      id="weeklyBudget"
                      type="number"
                      placeholder="0.00"
                      value={weeklyBudget}
                      onChange={(e) => setWeeklyBudget(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income">Monthly Income (Optional)</Label>
                    <Input
                      id="income"
                      type="number"
                      placeholder="0.00"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-white text-black hover:bg-gray-100"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-100"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
