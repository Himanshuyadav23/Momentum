'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function PromoteAdminPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !secretKey) {
      setResult({ success: false, message: 'Please fill in all fields' });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const response = await apiClient.promoteToAdmin(email, secretKey);
      
      if (response.success) {
        setResult({ success: true, message: response.message || 'Successfully promoted to admin!' });
        // Refresh the page after a delay to update auth state
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setResult({ success: false, message: response.message || 'Failed to promote to admin' });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error?.message || 'Failed to promote to admin. Check your secret key.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Shield className="h-5 w-5 text-purple-400" />
            <span>Promote to Admin</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-gray-300">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
              <p className="text-xs text-gray-400">
                Default key: momentum-admin-2024 (or check ADMIN_PROMOTION_KEY env variable)
              </p>
            </div>

            {result && (
              <div className={`p-3 rounded-lg flex items-start space-x-2 ${
                result.success 
                  ? 'bg-green-900/30 border border-green-800' 
                  : 'bg-red-900/30 border border-red-800'
              }`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                  {result.message}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Promoting...' : 'Promote to Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}









