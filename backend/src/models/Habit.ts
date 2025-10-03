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
    const id = firestoreHelpers.generateId();
    const now = new Date();
    
    const habit: IHabit = {
      id,
      ...habitData,
      createdAt: now,
      updatedAt: now
    };

    await habitsCollection.doc(id).set({
      ...habit,
      createdAt: firestoreHelpers.dateToTimestamp(now),
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return habit;
  }

  static async findById(id: string): Promise<IHabit | null> {
    const doc = await habitsCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as IHabit;
  }

  static async findByUserId(userId: string, activeOnly: boolean = true): Promise<IHabit[]> {
    let query = habitsCollection.where('userId', '==', userId);

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
  }

  static async update(id: string, updateData: Partial<Omit<IHabit, 'id' | 'createdAt'>>): Promise<IHabit | null> {
    const now = new Date();
    
    await habitsCollection.doc(id).update({
      ...updateData,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await habitsCollection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
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

    await habitLogsCollection.doc(id).set({
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
    let query = habitLogsCollection.where('habitId', '==', habitId);

    if (options?.startDate) {
      query = query.where('completedAt', '>=', firestoreHelpers.dateToTimestamp(options.startDate));
    }

    if (options?.endDate) {
      query = query.where('completedAt', '<=', firestoreHelpers.dateToTimestamp(options.endDate));
    }

    query = query.orderBy('completedAt', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt: firestoreHelpers.timestampToDate(data.completedAt),
        createdAt: firestoreHelpers.timestampToDate(data.createdAt)
      } as IHabitLog;
    });
  }

  static async findByUserId(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<IHabitLog[]> {
    let query = habitLogsCollection.where('userId', '==', userId);

    if (options?.startDate) {
      query = query.where('completedAt', '>=', firestoreHelpers.dateToTimestamp(options.startDate));
    }

    if (options?.endDate) {
      query = query.where('completedAt', '<=', firestoreHelpers.dateToTimestamp(options.endDate));
    }

    query = query.orderBy('completedAt', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt: firestoreHelpers.timestampToDate(data.completedAt),
        createdAt: firestoreHelpers.timestampToDate(data.createdAt)
      } as IHabitLog;
    });
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await habitLogsCollection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting habit log:', error);
      return false;
    }
  }
}