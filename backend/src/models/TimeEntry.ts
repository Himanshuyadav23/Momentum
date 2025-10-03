import { timeEntriesCollection, firestoreHelpers } from '../services/firebase-db';

export interface ITimeEntry {
  id: string;
  userId: string;
  category: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  isActive: boolean;
  isProductive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TimeEntry {
  static async create(timeEntryData: Omit<ITimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITimeEntry> {
    const id = firestoreHelpers.generateId();
    const now = new Date();
    
    const timeEntry: ITimeEntry = {
      id,
      ...timeEntryData,
      createdAt: now,
      updatedAt: now
    };

    await timeEntriesCollection.doc(id).set({
      ...timeEntry,
      startTime: firestoreHelpers.dateToTimestamp(timeEntry.startTime),
      endTime: timeEntry.endTime ? firestoreHelpers.dateToTimestamp(timeEntry.endTime) : null,
      createdAt: firestoreHelpers.dateToTimestamp(now),
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return timeEntry;
  }

  static async findById(id: string): Promise<ITimeEntry | null> {
    const doc = await timeEntriesCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      startTime: firestoreHelpers.timestampToDate(data.startTime),
      endTime: data.endTime ? firestoreHelpers.timestampToDate(data.endTime) : undefined,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as ITimeEntry;
  }

  static async findByUserId(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    limit?: number;
  }): Promise<ITimeEntry[]> {
    let query = timeEntriesCollection.where('userId', '==', userId);

    if (options?.startDate) {
      query = query.where('startTime', '>=', firestoreHelpers.dateToTimestamp(options.startDate));
    }

    if (options?.endDate) {
      query = query.where('startTime', '<=', firestoreHelpers.dateToTimestamp(options.endDate));
    }

    if (options?.category) {
      query = query.where('category', '==', options.category);
    }

    query = query.orderBy('startTime', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: firestoreHelpers.timestampToDate(data.startTime),
        endTime: data.endTime ? firestoreHelpers.timestampToDate(data.endTime) : undefined,
        createdAt: firestoreHelpers.timestampToDate(data.createdAt),
        updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
      } as ITimeEntry;
    });
  }

  static async findActiveByUserId(userId: string): Promise<ITimeEntry | null> {
    const snapshot = await timeEntriesCollection
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      startTime: firestoreHelpers.timestampToDate(data.startTime),
      endTime: data.endTime ? firestoreHelpers.timestampToDate(data.endTime) : undefined,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as ITimeEntry;
  }

  static async update(id: string, updateData: Partial<Omit<ITimeEntry, 'id' | 'createdAt'>>): Promise<ITimeEntry | null> {
    const now = new Date();
    const updateFields: any = {
      ...updateData,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    };

    if (updateData.startTime) {
      updateFields.startTime = firestoreHelpers.dateToTimestamp(updateData.startTime);
    }

    if (updateData.endTime) {
      updateFields.endTime = firestoreHelpers.dateToTimestamp(updateData.endTime);
    }

    await timeEntriesCollection.doc(id).update(updateFields);

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await timeEntriesCollection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  }

  static async stopAllActiveByUserId(userId: string): Promise<void> {
    const snapshot = await timeEntriesCollection
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const batch = firestoreHelpers.batch();
    const now = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isActive: false,
        endTime: firestoreHelpers.dateToTimestamp(now),
        updatedAt: firestoreHelpers.dateToTimestamp(now)
      });
    });

    await batch.commit();
  }
}