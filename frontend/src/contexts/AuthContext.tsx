'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  timeCategories: string[];
  weeklyBudget?: number;
  income?: number;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await apiClient.login(idToken);
          if (response.success && response.data) {
            const d: any = response.data;
            setUser(d.user);
            // Use backend JWT for subsequent API calls
            apiClient.setToken(d.token);
          } else {
            console.error('Login response failed:', response);
            setUser(null);
          }
        } catch (error: any) {
          console.error('Auth state change error:', error);
          console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            response: error?.response
          });
          setUser(null);
          // Don't clear Firebase auth, just clear backend user
        }
      } else {
        setUser(null);
        apiClient.clearToken();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.login(idToken);
      if (response.success && response.data) {
        const d: any = response.data;
        setUser(d.user);
        apiClient.setToken(d.token);
      } else {
        console.error('Login failed:', response);
        throw new Error(response.message || 'Failed to authenticate with backend');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      // Provide better error message
      if (error.message?.includes('Failed to connect')) {
        throw new Error('Backend server is not running. Please start the backend server.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.login(idToken);
      if (response.success && response.data) {
        const d: any = response.data;
        setUser(d.user);
        apiClient.setToken(d.token);
      } else {
        console.error('Login failed:', response);
        throw new Error(response.message || 'Failed to authenticate with backend');
      }
    } catch (error: any) {
      console.error('Email sign in error:', error);
      // Provide better error message
      if (error.message?.includes('Failed to connect')) {
        throw new Error('Backend server is not running. Please start the backend server.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.login(idToken);
      if (response.success && response.data) {
        const d: any = response.data;
        setUser(d.user);
        apiClient.setToken(d.token);
      }
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      apiClient.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile(userData);
      if (response.success && response.data) {
        const d: any = response.data;
        setUser(d.user);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



