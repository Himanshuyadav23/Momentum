'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Edit, Trash2, Shield, X, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'admin';
  isAdmin?: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  stats: {
    timeEntries: number;
    habits: number;
    expenses: number;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' as 'user' | 'admin', isAdmin: false });
  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAdminUsers({ limit: 100 });
      if (response.success && response.data) {
        const d: any = response.data;
        setUsers(d.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserWithStats) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      isAdmin: user.isAdmin || false
    });
  };

  const handleSave = async (userId: string) => {
    try {
      setSaving(true);
      const response = await apiClient.updateAdminUser(userId, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        isAdmin: editForm.isAdmin
      });

      if (response.success) {
        setEditingUser(null);
        await fetchUsers();
      } else {
        alert(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(error?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      const response = await apiClient.deleteAdminUser(userId);

      if (response.success) {
        await fetchUsers();
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error?.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5" />
            <span>User Management</span>
            <Badge variant="secondary" className="bg-gray-600 text-gray-200">
              {users.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-64"
              />
            </div>
            <Button
              onClick={fetchUsers}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Stats</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Joined</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        {editingUser === user.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white w-full"
                          />
                        ) : (
                          <span className="text-white">{user.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingUser === user.id ? (
                          <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white w-full"
                          />
                        ) : (
                          <span className="text-gray-300">{user.email}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingUser === user.id ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => {
                              const role = e.target.value as 'user' | 'admin';
                              setEditForm({ 
                                ...editForm, 
                                role,
                                isAdmin: role === 'admin'
                              });
                            }}
                            className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <Badge
                            variant={user.isAdmin ? "default" : "secondary"}
                            className={user.isAdmin ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-200"}
                          >
                            {user.isAdmin ? (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              'User'
                            )}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>{user.stats?.timeEntries || 0} time</span>
                          <span>{user.stats?.habits || 0} habits</span>
                          <span>{user.stats?.expenses || 0} expenses</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          {editingUser === user.id ? (
                            <>
                              <Button
                                onClick={() => handleSave(user.id)}
                                disabled={saving}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setEditingUser(null)}
                                disabled={saving}
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleEdit(user)}
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(user.id)}
                                disabled={deletingUserId === user.id}
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                {deletingUserId === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};









