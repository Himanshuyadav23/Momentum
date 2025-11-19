'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2,
  Calendar,
  X
} from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
}

export const TodoWidget: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []); // Fetch all todos once on mount

  const fetchTodos = async () => {
    try {
      setLoading(true);
      // Fetch all todos without type filter - we'll filter on frontend
      const response = await apiClient.getTodos();
      console.log('Todos response:', response);
      if (response.success && response.data) {
        const data = response.data as any;
        const todosList = Array.isArray(data?.todos) ? data.todos : Array.isArray(data) ? data : [];
        
        // Normalize todos - ensure createdAt is a string and all fields are properly set
        const normalizedTodos = todosList.map((todo: any) => {
          // Handle createdAt - could be Date object, string, or timestamp
          let createdAtStr = new Date().toISOString();
          if (todo.createdAt) {
            if (typeof todo.createdAt === 'string') {
              createdAtStr = todo.createdAt;
            } else if (todo.createdAt instanceof Date) {
              createdAtStr = todo.createdAt.toISOString();
            } else if (todo.createdAt.toDate) {
              // Firestore timestamp
              createdAtStr = todo.createdAt.toDate().toISOString();
            } else {
              createdAtStr = new Date(todo.createdAt).toISOString();
            }
          }
          
          return {
            id: todo.id || '',
            title: todo.title || '',
            description: todo.description || undefined,
            type: (todo.type === 'daily' || todo.type === 'weekly' || todo.type === 'monthly') ? todo.type : 'daily',
            isCompleted: Boolean(todo.isCompleted),
            dueDate: todo.dueDate ? (typeof todo.dueDate === 'string' ? todo.dueDate : new Date(todo.dueDate).toISOString()) : undefined,
            createdAt: createdAtStr
          } as Todo;
        });
        
        console.log('Setting todos:', normalizedTodos.length, 'todos');
        console.log('Normalized todos:', normalizedTodos);
        setTodos(normalizedTodos);
      } else {
        console.warn('Todos response not successful:', response);
        setTodos([]);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newTodo: Todo = {
      id: tempId,
      title: newTodoTitle.trim(),
      description: newTodoDescription.trim() || undefined,
      type: activeTab,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    // Optimistically add the todo
    setTodos(prev => [...prev, newTodo]);
    setNewTodoTitle('');
    setNewTodoDescription('');
    setShowAddForm(false);

    try {
      const response = await apiClient.createTodo({
        title: newTodo.title,
        description: newTodo.description,
        type: activeTab
      });

      console.log('Create todo response:', response);

      if (response.success && response.data) {
        const createdTodo = (response.data as any).todo;
        if (createdTodo) {
          // Replace temp todo with real one from server
          setTodos(prev => prev.map(t => t.id === tempId ? {
            ...createdTodo,
            createdAt: createdTodo.createdAt || new Date().toISOString()
          } : t));
        } else {
          // If no todo in response, refetch all
          fetchTodos();
        }
      } else {
        // Remove optimistic todo on error
        setTodos(prev => prev.filter(t => t.id !== tempId));
        alert(response.message || 'Failed to create todo. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to create todo:', error);
      // Remove optimistic todo on error
      setTodos(prev => prev.filter(t => t.id !== tempId));
      alert(error.message || 'Failed to create todo. Please try again.');
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const response = await apiClient.toggleTodo(id);
      if (response.success) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      const response = await apiClient.deleteTodo(id);
      if (response.success) {
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      alert('Failed to delete todo. Please try again.');
    }
  };

  // Filter todos by active tab
  const filteredTodos = todos.filter(todo => {
    const matchesType = todo.type === activeTab;
    if (!matchesType) return false;
    return true;
  });
  const completedCount = filteredTodos.filter(t => t.isCompleted).length;
  const totalCount = filteredTodos.length;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Calendar className="h-5 w-5" />
              <span>To-Do List</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {completedCount}/{totalCount} completed
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-4">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Add Todo Form */}
        {showAddForm && (
          <form onSubmit={handleAddTodo} className="mb-4 p-3 bg-gray-700 rounded-lg space-y-2">
            <Input
              placeholder="Todo title..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              autoFocus
            />
            <Input
              placeholder="Description (optional)..."
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="flex space-x-2">
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Todo
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTodoTitle('');
                  setNewTodoDescription('');
                }}
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Todo List */}
        {loading && todos.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">Loading todos...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-8">
            <Circle className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No {activeTab} todos yet</p>
            <p className="text-gray-500 text-xs mt-1">Click "Add" to create your first todo</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTodos
              .sort((a, b) => {
                // Show incomplete todos first, then completed ones
                if (a.isCompleted !== b.isCompleted) {
                  return a.isCompleted ? 1 : -1;
                }
                // Within same completion status, sort by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  todo.isCompleted
                    ? 'bg-gray-700/50 opacity-75'
                    : 'bg-gray-700 hover:bg-gray-650'
                }`}
              >
                <button
                  onClick={() => handleToggleTodo(todo.id)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {todo.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 hover:text-green-400 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      todo.isCompleted
                        ? 'text-gray-400 line-through'
                        : 'text-white'
                    }`}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-xs text-gray-400 mt-1">{todo.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

