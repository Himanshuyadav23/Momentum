const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(idToken: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // User endpoints
  async updateProfile(data: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeOnboarding(data: any) {
    return this.request('/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount() {
    return this.request('/user/account', {
      method: 'DELETE',
    });
  }

  // Time tracking endpoints
  async getTimeEntries(params?: { startDate?: string; endDate?: string; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    
    const query = queryParams.toString();
    return this.request(`/time/entries${query ? `?${query}` : ''}`);
  }

  async startTimer(data: { category: string; description: string; isProductive?: boolean }) {
    return this.request('/time/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async stopTimer(timeEntryId: string) {
    return this.request(`/time/stop/${timeEntryId}`, {
      method: 'POST',
    });
  }

  async addManualTimeEntry(data: {
    category: string;
    description: string;
    startTime: string;
    endTime: string;
    isProductive?: boolean;
  }) {
    return this.request('/time/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActiveTimer() {
    return this.request('/time/active');
  }

  // Habit endpoints
  async getHabits() {
    return this.request('/habits');
  }

  async createHabit(data: { name: string; description?: string; frequency?: string; targetCount?: number }) {
    return this.request('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHabit(id: string, data: any) {
    return this.request(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHabit(id: string) {
    return this.request(`/habits/${id}`, {
      method: 'DELETE',
    });
  }

  async logHabit(id: string, notes?: string) {
    return this.request(`/habits/${id}/log`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getHabitLogs(id: string, params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request(`/habits/${id}/logs${query ? `?${query}` : ''}`);
  }

  // Expense endpoints
  async getExpenses(params?: { startDate?: string; endDate?: string; category?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.category) queryParams.append('category', params.category);
    
    const query = queryParams.toString();
    return this.request(`/expenses${query ? `?${query}` : ''}`);
  }

  async createExpense(data: { amount: number; category: string; description?: string; date?: string }) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: any) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getExpenseStats(params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const query = queryParams.toString();
    return this.request(`/expenses/stats${query ? `?${query}` : ''}`);
  }

  // Analytics endpoints
  async getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  async getWeeklyReport() {
    return this.request('/analytics/weekly');
  }

  async getInsights() {
    return this.request('/analytics/insights');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
