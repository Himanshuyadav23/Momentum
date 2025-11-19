'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface NavigationProps {
  currentPage?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage }) => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  return (
    <nav className="hidden md:flex space-x-6">
      <a href="/" className={currentPage === 'dashboard' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Dashboard
      </a>
      <a href="/time" className={currentPage === 'time' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Time
      </a>
      <a href="/habits" className={currentPage === 'habits' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Habits
      </a>
      <a href="/expenses" className={currentPage === 'expenses' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Expenses
      </a>
      <a href="/analytics" className={currentPage === 'analytics' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Analytics
      </a>
      <a href="/profile" className={currentPage === 'profile' ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}>
        Profile
      </a>
      {isAdmin && (
        <a href="/admin" className={currentPage === 'admin' ? 'text-white font-medium' : 'text-purple-300 hover:text-purple-200 transition-colors flex items-center space-x-1'}>
          <Shield className="w-4 h-4" />
          <span>Admin</span>
        </a>
      )}
    </nav>
  );
};









