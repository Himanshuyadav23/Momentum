import { expensesCollection, firestoreHelpers } from '../services/firebase-db';

export interface IExpense {
  id: string;
  userId: string;
  amount: number;
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
    
    const expense: IExpense = {
      id,
      ...expenseData,
      createdAt: now,
      updatedAt: now
    };

    await expensesCollection.doc(id).set({
      ...expense,
      date: firestoreHelpers.dateToTimestamp(expense.date),
      createdAt: firestoreHelpers.dateToTimestamp(now),
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return expense;
  }

  static async findById(id: string): Promise<IExpense | null> {
    const doc = await expensesCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
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
    let query = expensesCollection.where('userId', '==', userId);

    if (options?.startDate) {
      query = query.where('date', '>=', firestoreHelpers.dateToTimestamp(options.startDate));
    }

    if (options?.endDate) {
      query = query.where('date', '<=', firestoreHelpers.dateToTimestamp(options.endDate));
    }

    if (options?.category) {
      query = query.where('category', '==', options.category);
    }

    query = query.orderBy('date', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: firestoreHelpers.timestampToDate(data.date),
        createdAt: firestoreHelpers.timestampToDate(data.createdAt),
        updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
      } as IExpense;
    });
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

    await expensesCollection.doc(id).update(updateFields);

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await expensesCollection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  static async getExpenseStats(userId: string, startDate: Date, endDate: Date): Promise<{
    totalAmount: number;
    categoryBreakdown: { [category: string]: number };
    dailyBreakdown: { [date: string]: number };
    averageDaily: number;
  }> {
    const expenses = await this.findByUserId(userId, { startDate, endDate });
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryBreakdown: { [category: string]: number } = {};
    const dailyBreakdown: { [date: string]: number } = {};
    
    expenses.forEach(expense => {
      // Category breakdown
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
      
      // Daily breakdown
      const dateKey = expense.date.toISOString().split('T')[0];
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + expense.amount;
    });
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaily = daysDiff > 0 ? totalAmount / daysDiff : 0;
    
    return {
      totalAmount,
      categoryBreakdown,
      dailyBreakdown,
      averageDaily
    };
  }
}