import { usersCollection, firestoreHelpers } from '../services/firebase-db';

export interface IUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  profilePicture?: string;
  timeCategories: string[];
  weeklyBudget?: number;
  income?: number;
  dailyProductiveHours?: number;
  onboardingCompleted: boolean;
  role?: 'user' | 'admin';
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  static async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      const id = firestoreHelpers.generateId();
      const now = new Date();
      
      const user: IUser = {
        id,
        ...userData,
        createdAt: now,
        updatedAt: now
      };

      await usersCollection().doc(id).set({
        ...user,
        createdAt: firestoreHelpers.dateToTimestamp(now),
        updatedAt: firestoreHelpers.dateToTimestamp(now)
      });

      return user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('not initialized')) {
        throw new Error('Database not initialized. Please check Firebase configuration and environment variables.');
      }
      throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
    }
  }

  static async findById(id: string): Promise<IUser | null> {
    const doc = await usersCollection().doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as IUser;
  }

  static async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    const snapshot = await usersCollection().where('firebaseUid', '==', firebaseUid).limit(1).get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      createdAt: firestoreHelpers.timestampToDate(data.createdAt),
      updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
    } as IUser;
  }

  static async update(id: string, updateData: Partial<Omit<IUser, 'id' | 'createdAt'>>): Promise<IUser | null> {
    const now = new Date();
    const docRef = usersCollection().doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return null;
    }

    const sanitized: Record<string, unknown> = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    });

    await docRef.update({
      ...sanitized,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    });

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await usersCollection().doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  static async findAll(options?: { limit?: number }): Promise<IUser[]> {
    try {
      let query = usersCollection().orderBy('createdAt', 'desc');
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: firestoreHelpers.timestampToDate(data.createdAt),
          updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
        } as IUser;
      });
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  static async count(): Promise<number> {
    try {
      const snapshot = await usersCollection().get();
      return snapshot.size;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
}