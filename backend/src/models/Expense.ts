import { expensesCollection, firestoreHelpers } from '../services/firebase-db';

export interface IExpense {
  id: string;
  userId: string;
  amount: number;
  currency?: string; // Currency code (INR, USD, EUR, etc.)
  category: string;
  description: string;
  date: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Expense {
  static async create(expenseData: Omit<IExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<IExpense> {
    const id = firestoreHelpers.generateId();
    const now = new Date();
    
    // Ensure date is a Date object
    const expenseDate = expenseData.date instanceof Date 
      ? expenseData.date 
      : new Date(expenseData.date);
    
    // Default currency to INR if not provided
    const currency = expenseData.currency || 'INR';
    
    const expense: IExpense = {
      id,
      ...expenseData,
      currency,
      date: expenseDate,
      description: expenseData.description || '',
      createdAt: now,
      updatedAt: now
    };

    const firestoreData: any = {
      userId: expense.userId,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: firestoreHelpers.dateToTimestamp(expense.date),
      createdAt: firestoreHelpers.dateToTimestamp(now),
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    };

    await expensesCollection().doc(id).set(firestoreData);

    return expense;
  }

  static async findById(id: string): Promise<IExpense | null> {
    const doc = await expensesCollection().doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency || 'INR', // Default to INR for backward compatibility
      category: data.category,
      description: data.description || '',
      date: firestoreHelpers.timestampToDate(data.date),
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as IExpense;
  }

  static async findByUserId(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    limit?: number;
  }): Promise<IExpense[]> {
    try {
      let query = expensesCollection().where('userId', '==', userId);

      const hasStartDate = !!options?.startDate;
      const hasEndDate = !!options?.endDate;
      
      // If we have date filters, use them with orderBy
      // IMPORTANT: Only use ONE range operator in the query to avoid complex index requirements
      // We'll filter the second range in memory
      if (hasStartDate) {
        // Use >= in query (most common case - getting expenses from a start date forward)
        query = query.where('date', '>=', firestoreHelpers.dateToTimestamp(options.startDate!));
        // Must use orderBy with range queries - use 'asc' to match expected index
        query = query.orderBy('date', 'asc');
      } else if (hasEndDate && !hasStartDate) {
        // Only endDate - use <= in query
        query = query.where('date', '<=', firestoreHelpers.dateToTimestamp(options.endDate!));
        query = query.orderBy('date', 'asc');
      } else {
        // No date filters - just order by date (descending for newest first)
        query = query.orderBy('date', 'desc');
      }

      if (options?.category) {
        query = query.where('category', '==', options.category);
      }

      if (options?.limit && !hasStartDate && !hasEndDate) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      
      let results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          amount: data.amount,
          currency: data.currency || 'INR', // Default to INR for backward compatibility
          category: data.category,
          description: data.description || '',
          date: firestoreHelpers.timestampToDate(data.date),
          createdAt: firestoreHelpers.timestampToDate(data.createdAt),
          updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
        } as IExpense;
      });
      
      // If we used 'asc' for index compatibility, reverse to get newest first
      if (hasStartDate || hasEndDate) {
        results = results.reverse();
      }
      
      // Apply date filters in memory as fallback (more reliable than query sometimes)
      if (hasStartDate || hasEndDate) {
        const start = options.startDate ? new Date(options.startDate).getTime() : 0;
        const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
        results = results.filter(expense => {
          const expenseTime = expense.date.getTime();
          return expenseTime >= start && expenseTime <= end;
        });
      }
      
      // Filter by category in memory if needed (after date filtering)
      if (options?.category) {
        results = results.filter(expense => expense.category === options.category);
      }
      
      // Sort by date descending (newest first)
      results.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Apply limit after filtering
      if (options?.limit && options.limit > 0) {
        return results.slice(0, options.limit);
      }
      
      return results;
    } catch (error: any) {
      // If index error, fall back to fetching all and filtering in memory
      if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
        console.warn('⚠️ Firestore index missing for Expense.findByUserId - using fallback method');
        
        // Fallback: fetch all expenses for user, filter in memory
        const allQuery = expensesCollection().where('userId', '==', userId);
        const snapshot = await allQuery.get();
        
        let results = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            amount: data.amount,
            currency: data.currency || 'INR', // Default to INR for backward compatibility
            category: data.category,
            description: data.description || '',
            date: firestoreHelpers.timestampToDate(data.date),
            createdAt: firestoreHelpers.timestampToDate(data.createdAt),
            updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
          } as IExpense;
        });
        
        // Filter by date in memory
        if (options?.startDate || options?.endDate) {
          const start = options.startDate ? new Date(options.startDate).getTime() : 0;
          const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
          results = results.filter(expense => {
            const expenseTime = expense.date.getTime();
            return expenseTime >= start && expenseTime <= end;
          });
        }
        
        // Filter by category in memory
        if (options?.category) {
          results = results.filter(expense => expense.category === options.category);
        }
        
        // Sort by date descending (newest first)
        results.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        // Apply limit
        if (options?.limit && options.limit > 0) {
          return results.slice(0, options.limit);
        }
        
        return results;
      }
      
      // Re-throw if not an index error
      throw error;
    }
  }

  static async update(id: string, updateData: Partial<Omit<IExpense, 'id' | 'createdAt'>>): Promise<IExpense | null> {
    const now = new Date();
    const updateFields: any = {
      ...updateData,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    };

    if (updateData.date) {
      updateFields.date = firestoreHelpers.dateToTimestamp(updateData.date);
    }

    await expensesCollection().doc(id).update(updateFields);

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await expensesCollection().doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  static async getExpenseStats(userId: string, startDate: Date, endDate: Date): Promise<{
    totalAmount: number;
    expenseCount: number;
    categoryBreakdown: { [category: string]: number };
    dailyBreakdown: { [date: string]: number };
    averageDaily: number;
    currencyBreakdown?: { [currency: string]: number };
  }> {
    const expenses = await this.findByUserId(userId, { startDate, endDate });
    
    // Group by currency for proper totals
    const currencyBreakdown: { [currency: string]: { amount: number; count: number } } = {};
    const categoryBreakdown: { [category: string]: number } = {};
    const dailyBreakdown: { [date: string]: number } = {};
    
    expenses.forEach(expense => {
      const currency = expense.currency || 'INR';
      
      // Currency breakdown
      if (!currencyBreakdown[currency]) {
        currencyBreakdown[currency] = { amount: 0, count: 0 };
      }
      currencyBreakdown[currency].amount += expense.amount;
      currencyBreakdown[currency].count += 1;
      
      // Category breakdown (primary currency only for now)
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
      
      // Daily breakdown
      const dateKey = expense.date.toISOString().split('T')[0];
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + expense.amount;
    });
    
    // Get primary currency (most used)
    const primaryCurrency = Object.keys(currencyBreakdown).length > 0
      ? Object.entries(currencyBreakdown).sort((a, b) => b[1].amount - a[1].amount)[0][0]
      : 'INR';
    
    const totalAmount = currencyBreakdown[primaryCurrency]?.amount || 0;
    const expenseCount = expenses.length;
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaily = daysDiff > 0 ? totalAmount / daysDiff : 0;
    
    return {
      totalAmount,
      expenseCount,
      categoryBreakdown,
      dailyBreakdown,
      averageDaily,
      currencyBreakdown: Object.fromEntries(
        Object.entries(currencyBreakdown).map(([curr, data]) => [curr, data.amount])
      )
    };
  }
}