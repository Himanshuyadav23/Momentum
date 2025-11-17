'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { AddExpense } from '@/components/expenses/AddExpense';
import { ExpenseInsights } from '@/components/expenses/ExpenseInsights';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white">Please log in to access expense tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-white">Momentum</h1>
              <Navigation currentPage="expenses" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Expense */}
          <div className="lg:col-span-1">
            <AddExpense onExpenseAdded={handleExpenseUpdate} />
          </div>

          {/* Middle Column - Expense List */}
          <div className="lg:col-span-1">
            <ExpenseList refreshTrigger={refreshKey} />
          </div>

          {/* Right Column - Insights */}
          <div className="lg:col-span-1">
            <ExpenseInsights refreshKey={refreshKey} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
