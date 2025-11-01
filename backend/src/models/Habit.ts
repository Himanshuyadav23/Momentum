import { habitsCollection, habitLogsCollection, firestoreHelpers } from '../services/firebase-db';

export interface IHabit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabitLog {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  notes?: string;
  createdAt: Date;
}

export class Habit {
  static async create(habitData: Omit<IHabit, 'id' | 'createdAt' | 'updatedAt'>): Promise<IHabit> {
    try {
      const id = firestoreHelpers.generateId();
      const now = new Date();
      
      const habit: IHabit = {
        id,
        ...habitData,
        createdAt: now,
        updatedAt: now
      };

      await habitsCollection().doc(id).set({
        ...habit,
        createdAt: firestoreHelpers.dateToTimestamp(now),
        updatedAt: firestoreHelpers.dateToTimestamp(now)
      });

      return habit;
    } catch (error: any) {
      console.error('Error creating habit:', error);
      throw new Error(`Failed to create habit: ${error?.message || 'Unknown error'}`);
    }
  }

  static async findById(id: string): Promise<IHabit | null> {
    try {
      const doc = await habitsCollection().doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt: firestoreHelpers.timestampToDate(data.createdAt),
        updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
      } as IHabit;
    } catch (error: any) {
      console.error('Error finding habit by id:', error);
      return null;
    }
  }

  static async findByUserId(userId: string, activeOnly: boolean = true): Promise<IHabit[]> {
    try {
      let query = habitsCollection().where('userId', '==', userId);

      if (activeOnly) {
        query = query.where('isActive', '==', true);
      }

      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: firestoreHelpers.timestampToDate(data.createdAt),
          updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
        } as IHabit;
      });
    } catch (error: any) {
      console.error('Error finding habits by userId:', error);
      // Return empty array instead of throwing to prevent crashes
      if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
        console.warn('⚠️ Firestore index missing for Habit.findByUserId - returning empty array');
        return [];
      }
      throw new Error(`Failed to find habits: ${error?.message || 'Unknown error'}`);
    }
  }

  static async update(id: string, updateData: Partial<Omit<IHabit, 'id' | 'createdAt'>>): Promise<IHabit | null> {
    const now = new Date();
    
    await habitsCollection().doc(id).update({
      ...updateData,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await habitsCollection().doc(id).delete();
      return true;
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      console.error('Delete error details:', {
        message: error?.message,
        code: error?.code,
        id
      });
      throw new Error(`Failed to delete habit: ${error?.message || 'Unknown error'}`);
    }
  }
}

export class HabitLog {
  static async create(habitLogData: Omit<IHabitLog, 'id' | 'createdAt'>): Promise<IHabitLog> {
    const id = firestoreHelpers.generateId();
    const now = new Date();
    
    const habitLog: IHabitLog = {
      id,
      ...habitLogData,
      createdAt: now
    };

    await habitLogsCollection().doc(id).set({
      ...habitLog,
      completedAt: firestoreHelpers.dateToTimestamp(habitLog.completedAt),
      createdAt: firestoreHelpers.dateToTimestamp(now)
    });

    return habitLog;
  }

  static async findByHabitId(habitId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<IHabitLog[]> {
    try {
      let query = habitLogsCollection().where('habitId', '==', habitId);

      const hasStartDate = !!options?.startDate;
      const hasEndDate = !!options?.endDate;
      
      // If we have date filters, use them with orderBy
      // IMPORTANT: Only use ONE range operator in the query to avoid complex index requirements
      // We'll filter the second range in memory
      if (hasStartDate) {
        // Use >= in query (most common case - getting logs from a start date forward)
        query = query.where('completedAt', '>=', firestoreHelpers.dateToTimestamp(options.startDate!));
        // Must use orderBy with range queries - use 'asc' to match expected index
        query = query.orderBy('completedAt', 'asc');
      } else if (hasEndDate && !hasStartDate) {
        // Only endDate - use <= in query
        query = query.where('completedAt', '<=', firestoreHelpers.dateToTimestamp(options.endDate!));
        query = query.orderBy('completedAt', 'asc');
      } else {
        // No date filters - just order by date (descending for newest first)
        query = query.orderBy('completedAt', 'desc');
      }

      if (options?.limit && !hasStartDate && !hasEndDate) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      
      let results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: firestoreHelpers.timestampToDate(data.completedAt),
          createdAt: firestoreHelpers.timestampToDate(data.createdAt)
        } as IHabitLog;
      });
      
      // If we used 'asc' for index compatibility, reverse to get newest first
      if (hasStartDate || hasEndDate) {
        results = results.reverse();
      }
      
      // Apply date filters in memory as fallback (more reliable than query sometimes)
      if (hasStartDate || hasEndDate) {
        const start = options.startDate ? new Date(options.startDate).getTime() : 0;
        const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
        results = results.filter(log => {
          const logTime = log.completedAt.getTime();
          return logTime >= start && logTime <= end;
        });
      }
      
      // Sort by date descending (newest first)
      results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
      // Apply limit after filtering
      if (options?.limit && options.limit > 0) {
        return results.slice(0, options.limit);
      }
      
      return results;
    } catch (error: any) {
      // If index error, fall back to fetching all and filtering in memory
      if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
        console.warn('⚠️ Firestore index missing for HabitLog.findByHabitId - using fallback method');
        
        // Fallback: fetch all logs for habit, filter in memory
        const allQuery = habitLogsCollection().where('habitId', '==', habitId);
        const snapshot = await allQuery.get();
        
        let results = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            completedAt: firestoreHelpers.timestampToDate(data.completedAt),
            createdAt: firestoreHelpers.timestampToDate(data.createdAt)
          } as IHabitLog;
        });
        
        // Filter by date in memory
        if (options?.startDate || options?.endDate) {
          const start = options.startDate ? new Date(options.startDate).getTime() : 0;
          const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
          results = results.filter(log => {
            const logTime = log.completedAt.getTime();
            return logTime >= start && logTime <= end;
          });
        }
        
        // Sort by date descending (newest first)
        results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
        
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

  static async findByUserId(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<IHabitLog[]> {
    try {
      let query = habitLogsCollection().where('userId', '==', userId);

      // Build query based on what filters are provided
      const hasStartDate = !!options?.startDate;
      const hasEndDate = !!options?.endDate;
      
      // If we have date filters, use them with orderBy
      // Firestore requires orderBy when using range queries (>= or <=)
      // IMPORTANT: Only use ONE range operator in the query to avoid complex index requirements
      // We'll filter the second range in memory
      if (hasStartDate) {
        // Use >= in query (most common case - getting logs from a start date forward)
        query = query.where('completedAt', '>=', firestoreHelpers.dateToTimestamp(options.startDate!));
        // Must use orderBy with range queries - use 'asc' to match expected index
        query = query.orderBy('completedAt', 'asc');
      } else if (hasEndDate && !hasStartDate) {
        // Only endDate - use <= in query
        query = query.where('completedAt', '<=', firestoreHelpers.dateToTimestamp(options.endDate!));
        query = query.orderBy('completedAt', 'asc');
      } else {
        // No date filters - just order by date (descending for newest first)
        query = query.orderBy('completedAt', 'desc');
      }

      const snapshot = await query.get();
      
      let results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: firestoreHelpers.timestampToDate(data.completedAt),
          createdAt: firestoreHelpers.timestampToDate(data.createdAt)
        } as IHabitLog;
      });
      
      // If we used 'asc' for index compatibility, reverse to get newest first
      if (hasStartDate || hasEndDate) {
        results = results.reverse();
      }
      
      // Apply date filters in memory as fallback (more reliable than query sometimes)
      if (hasStartDate || hasEndDate) {
        const start = options.startDate ? new Date(options.startDate).getTime() : 0;
        const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
        results = results.filter(log => {
          const logTime = log.completedAt.getTime();
          return logTime >= start && logTime <= end;
        });
      }
      
      // Apply limit after filtering
      if (options?.limit && options.limit > 0) {
        return results.slice(0, options.limit);
      }
      
      return results;
    } catch (error: any) {
      // If index error, fall back to fetching all and filtering in memory
      if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
        console.warn('⚠️ Firestore index missing for HabitLog.findByUserId - using fallback method');
        
        // Fallback: fetch all logs for user, filter in memory
        const allQuery = habitLogsCollection().where('userId', '==', userId);
        const snapshot = await allQuery.get();
        
        let results = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            completedAt: firestoreHelpers.timestampToDate(data.completedAt),
            createdAt: firestoreHelpers.timestampToDate(data.createdAt)
          } as IHabitLog;
        });
        
        // Filter by date in memory
        if (options?.startDate || options?.endDate) {
          const start = options.startDate ? new Date(options.startDate).getTime() : 0;
          const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
          results = results.filter(log => {
            const logTime = log.completedAt.getTime();
            return logTime >= start && logTime <= end;
          });
        }
        
        // Sort by date descending (newest first)
        results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
        
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

  static async findById(id: string): Promise<IHabitLog | null> {
    try {
      const doc = await habitLogsCollection().doc(id).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data();
      if (!data) {
        return null;
      }
      return {
        id: doc.id,
        ...data,
        completedAt: firestoreHelpers.timestampToDate(data.completedAt),
        createdAt: firestoreHelpers.timestampToDate(data.createdAt)
      } as IHabitLog;
    } catch (error) {
      console.error('Error finding habit log:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await habitLogsCollection().doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting habit log:', error);
      return false;
    }
  }
}