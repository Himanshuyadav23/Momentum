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
import { auth, googleProvider, getFirebaseAuth, getFirebaseGoogleProvider } from '@/lib/firebase';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  timeCategories: string[];
  weeklyBudget?: number;
  income?: number;
  dailyProductiveHours?: number;
  onboardingCompleted: boolean;
  role?: 'user' | 'admin';
  isAdmin?: boolean;
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
    let unsubscribe: (() => void) | null = null;

    try {
      // Get the real Auth instance for Firebase functions
      const authInstance = getFirebaseAuth();
      
      unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
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
              // Only clear user if it's a persistent error, not network issues
              if (!response.message?.includes('connect') && !response.message?.includes('network')) {
                setUser(null);
              }
            }
          } catch (error: any) {
            console.error('Auth state change error:', error);
            console.error('Error details:', {
              message: error?.message,
              stack: error?.stack,
              response: error?.response,
              isNetworkError: error?.isNetworkError
            });
            // Don't clear user on network errors - server might be temporarily unavailable
            // Only clear on authentication errors (401) or explicit auth failures
            if (error?.status === 401 || (error?.message && !error?.isNetworkError && !error?.message?.includes('connect'))) {
              setUser(null);
            }
            // Don't clear Firebase auth, just clear backend user on auth failures
          }
        } else {
          setUser(null);
          apiClient.clearToken();
        }
        
        setLoading(false);
      });
    } catch (error: any) {
      console.error('Firebase initialization error in AuthContext:', error);
      setLoading(false);
      // If Firebase is not configured, show error but don't crash
      if (error.message?.includes('Firebase not initialized') || error.message?.includes('Missing environment variables')) {
        console.error('Firebase is not configured. Please set environment variables in Vercel.');
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      // Get real instances for Firebase functions
      const authInstance = getFirebaseAuth();
      const providerInstance = getFirebaseGoogleProvider();
      
      const result = await signInWithPopup(authInstance, providerInstance);
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
      if (error?.isNetworkError || error.message?.includes('Failed to connect')) {
        throw new Error('Unable to connect to server. Please ensure the backend server is running and try again.');
      }
      if (error.message?.includes('Firebase not initialized') || error.message?.includes('Missing environment variables')) {
        throw new Error('Firebase is not configured. Please set environment variables in Vercel project settings.');
      }
      if (error?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Get real Auth instance
      const authInstance = getFirebaseAuth();
      
      const result = await signInWithEmailAndPassword(authInstance, email, password);
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
      if (error?.isNetworkError || error.message?.includes('Failed to connect')) {
        throw new Error('Unable to connect to server. Please ensure the backend server is running and try again.');
      }
      if (error.message?.includes('Firebase not initialized') || error.message?.includes('Missing environment variables')) {
        throw new Error('Firebase is not configured. Please set environment variables in Vercel project settings.');
      }
      if (error?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      // Get real Auth instance
      const authInstance = getFirebaseAuth();
      
      const result = await createUserWithEmailAndPassword(authInstance, email, password);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.login(idToken);
      if (response.success && response.data) {
        const d: any = response.data;
        setUser(d.user);
        apiClient.setToken(d.token);
      }
    } catch (error: any) {
      console.error('Email sign up error:', error);
      if (error.message?.includes('Firebase not initialized') || error.message?.includes('Missing environment variables')) {
        throw new Error('Firebase is not configured. Please set environment variables in Vercel project settings.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Get real Auth instance
      const authInstance = getFirebaseAuth();
      await signOut(authInstance);
      setUser(null);
      apiClient.clearToken();
    } catch (error: any) {
      console.error('Logout error:', error);
      if (error.message?.includes('Firebase not initialized') || error.message?.includes('Missing environment variables')) {
        // If Firebase is not configured, just clear local state
        setUser(null);
        apiClient.clearToken();
        return;
      }
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



