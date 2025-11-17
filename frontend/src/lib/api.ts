// In Vercel, API routes are on the same domain, so use relative path
// In development or if explicit URL is set, use that
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api');

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
      
      // Handle rate limiting (429) - retry after delay
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retry once
        return this.request(endpoint, options);
      }
      
      // Handle network errors or non-json responses
      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear token but don't throw error - let caller handle
          this.clearToken();
          const error = new Error('Session expired. Please log in again.');
          (error as any).status = 401;
          throw error;
        }
        
        let errorMessage = `Request failed with status ${response.status}`;
        let errorData: any = null;
        try {
          const data = await response.json();
          errorData = data;
          errorMessage = data.message || data.error || errorMessage;
        } catch {
          // Response might not be JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch {
            // If we can't read the response, use default message
          }
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).response = { data: errorData };
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Handle network/fetch errors
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        console.error('API request failed - Network error. Is the backend server running?', error);
        const networkError = new Error('Failed to connect to server. Please check if the backend is running.');
        (networkError as any).isNetworkError = true;
        throw networkError;
      }
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
  async getHabits(includeCompletion?: boolean) {
    const queryParams = new URLSearchParams();
    if (includeCompletion) {
      queryParams.append('includeCompletion', 'true');
    }
    const query = queryParams.toString();
    return this.request(`/habits${query ? `?${query}` : ''}`);
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

  async deleteHabitLog(logId: string) {
    return this.request(`/habits/logs/${logId}`, {
      method: 'DELETE',
    });
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

  async createExpense(data: { amount: number; currency?: string; category: string; description?: string; date?: string }) {
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

  // Backwards-compat alias used by ExpenseInsights
  async getExpenseSummary(params?: { startDate?: string; endDate?: string }) {
    return this.getExpenseStats(params);
  }

  // Analytics endpoints
  async getDashboardAnalytics() {
    const res = await this.request('/analytics/dashboard');
    // Normalize backend shape { data: { dashboard: { ... } } } to frontend expectation
    if (res && (res as any).data && (res as any).data.dashboard) {
      const d: any = (res as any).data.dashboard;
      const totalTimeToday = Number(d.totalTimeToday ?? 0);
      const productiveTimeToday = Number(d.productiveTimeToday ?? 0);
      const wastedTimeToday = Number(d.wastedTimeToday ?? 0);
      const completedHabitsToday = Number(d.completedHabitsToday ?? 0);
      const totalHabits = Number(d.totalHabits ?? 0);
      const totalExpensesToday = Number(d.totalExpensesToday ?? 0);
      const expenseCountToday = Number(d.expenseCountToday ?? 0);
      const activeEntry = d.activeTimer ?? null;
      const recentActivity = d.recentActivity || [];

      const normalized = {
        success: true,
        data: {
          time: {
            productive: productiveTimeToday,
            wasted: wastedTimeToday,
            total: totalTimeToday,
          },
          habits: {
            completed: completedHabitsToday,
            total: totalHabits,
            percentage: totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0,
          },
          expenses: {
            total: totalExpensesToday,
            count: expenseCountToday,
          },
          activeEntry,
          recentActivity,
        },
      } as ApiResponse;
      return normalized;
    }
    return res;
  }

  async getWeeklyReport() {
    const res = await this.request('/analytics/weekly');
    // Transform response to match frontend expectations
    if (res.success && res.data) {
      const resData = res.data as any;
      const wr = resData.weeklyReport;
      if (wr) {
        return {
          success: true,
          data: {
            // New structured format (preferred)
            time: wr.time || {
              total: wr.totalTime || 0,
              productive: wr.productive || 0,
              wasted: wr.wasted || 0,
              dailyBreakdown: wr.dailyTimeBreakdown || {},
              categoryBreakdown: wr.timeCategoryBreakdown || {}
            },
            habits: wr.habits || {
              totalHabits: wr.totalHabits || 0,
              completedLogs: wr.completedLogs || 0,
              streaks: wr.streaks || [],
              dailyBreakdown: wr.dailyHabitBreakdown || {}
            },
            expenses: wr.expenses || {
              total: wr.totalExpenses || 0,
              categoryBreakdown: wr.expenseCategoryBreakdown || {},
              dailyBreakdown: wr.dailyExpenseBreakdown || {},
              budgetInfo: wr.budgetInfo || null
            },
            // Also include raw data for backwards compatibility
            ...wr
          }
        } as ApiResponse;
      }
    }
    return res;
  }

  // Backwards-compat alias used by WeeklyReport component
  async getWeeklyAnalytics() {
    return this.getWeeklyReport();
  }

  async getMonthlyReport() {
    const res = await this.request('/analytics/monthly');
    // Transform response to match frontend expectations
    if (res.success && res.data) {
      const resData = res.data as any;
      const mr = resData.monthlyReport;
      if (mr) {
        return {
          success: true,
          data: {
            // New structured format (preferred)
            time: mr.time || {
              total: mr.totalTime || 0,
              productive: 0,
              wasted: 0,
              dailyBreakdown: mr.dailyTimeBreakdown || {},
              categoryBreakdown: mr.timeCategoryBreakdown || {}
            },
            habits: mr.habits || {
              totalHabits: 0,
              completedLogs: mr.totalHabits || 0,
              streaks: [],
              dailyBreakdown: mr.dailyHabitBreakdown || {}
            },
            expenses: mr.expenses || {
              total: mr.totalExpenses || 0,
              categoryBreakdown: mr.expenseCategoryBreakdown || {},
              dailyBreakdown: mr.dailyExpenseBreakdown || {}
            },
            // Also include raw data for backwards compatibility
            ...mr
          }
        } as ApiResponse;
      }
    }
    return res;
  }

  async getActivityHeatmap() {
    return this.request('/analytics/heatmap');
  }

  async getInsights() {
    const res = await this.request('/analytics/insights');
    // Backend returns { data: { insights: { productivity: {...}, expenses: {...}, habits: {...}, recommendations: [...] } } }
    try {
      const raw = (res as any)?.data?.insights;
      if (!raw) return res;
      
      // If backend provides recommendations, use them directly
      if (raw.recommendations && Array.isArray(raw.recommendations)) {
        return {
          success: true,
          data: {
            insights: raw.recommendations.map((rec: any) => ({
              type: rec.type || 'recommendation',
              title: rec.title || '',
              message: rec.message || '',
              category: rec.category || 'overall',
              priority: rec.priority || 0
            }))
          }
        } as ApiResponse;
      }
      
      // Fallback: Generate basic insights if recommendations not available
      const items: Array<{ type: string; title: string; message: string }> = [];
      const ratio = Number(raw.productivity?.productivityRatio ?? 0);
      items.push({
        type: ratio >= 60 ? 'positive' : ratio >= 40 ? 'warning' : 'negative',
        title: 'Productivity ratio',
        message: `${Math.round(ratio)}% of tracked time was productive in the last 30 days.`,
      });
      if (raw.productivity?.mostProductiveCategory) {
        items.push({
          type: 'positive',
          title: 'Top productive category',
          message: `${raw.productivity.mostProductiveCategory.category} led with ${Math.round(raw.productivity.mostProductiveCategory.time)} minutes.`,
        });
      }
      if (raw.expenses?.topExpenseCategory) {
        items.push({
          type: 'warning',
          title: 'Top expense category',
          message: `${raw.expenses.topExpenseCategory.category} accounted for ₹${Math.round(raw.expenses.topExpenseCategory.amount)} spent.`,
        });
      }
      items.push({
        type: 'positive',
        title: 'Habit consistency',
        message: `Average of ${Math.round(Number(raw.habits?.averageDailyHabits ?? 0))} habits completed per day in the last 30 days.`,
      });

      return { success: true, data: { insights: items } } as ApiResponse;
    } catch {
      return res;
    }
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(params?: { limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async getAdminUser(userId: string) {
    return this.request(`/admin/users/${userId}`);
  }

  async updateAdminUser(userId: string, data: any) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Temporary admin promotion endpoint
  async promoteToAdmin(email: string, secretKey: string) {
    return this.request('/promote-admin', {
      method: 'POST',
      body: JSON.stringify({ email, secretKey }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
