import { todosCollection, firestoreHelpers } from '../services/firebase-db';

export interface ITodo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Todo {
  static async create(todoData: Omit<ITodo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITodo> {
    try {
      const id = firestoreHelpers.generateId();
      const now = new Date();
      
      const todo: ITodo = {
        id,
        ...todoData,
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      };

      await todosCollection().doc(id).set({
        ...todo,
        createdAt: firestoreHelpers.dateToTimestamp(now),
        updatedAt: firestoreHelpers.dateToTimestamp(now),
        dueDate: todo.dueDate ? firestoreHelpers.dateToTimestamp(todo.dueDate) : null,
        completedAt: null
      });

      return todo;
    } catch (error: any) {
      console.error('Error creating todo:', error);
      throw new Error(`Failed to create todo: ${error?.message || 'Unknown error'}`);
    }
  }

  static async findById(id: string): Promise<ITodo | null> {
    try {
      const doc = await todosCollection().doc(id).get();
      
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
        updatedAt: firestoreHelpers.timestampToDate(data.updatedAt),
        dueDate: data.dueDate ? firestoreHelpers.timestampToDate(data.dueDate) : undefined,
        completedAt: data.completedAt ? firestoreHelpers.timestampToDate(data.completedAt) : undefined
      } as ITodo;
    } catch (error: any) {
      console.error('Error finding todo by id:', error);
      return null;
    }
  }

  static async findByUserId(userId: string, options?: {
    type?: 'daily' | 'weekly' | 'monthly';
    isCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ITodo[]> {
    try {
      let query = todosCollection().where('userId', '==', userId);

      if (options?.type) {
        query = query.where('type', '==', options.type);
      }

      if (options?.isCompleted !== undefined) {
        query = query.where('isCompleted', '==', options.isCompleted);
      }

      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      
      let results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: firestoreHelpers.timestampToDate(data.createdAt),
          updatedAt: firestoreHelpers.timestampToDate(data.updatedAt),
          dueDate: data.dueDate ? firestoreHelpers.timestampToDate(data.dueDate) : undefined,
          completedAt: data.completedAt ? firestoreHelpers.timestampToDate(data.completedAt) : undefined
        } as ITodo;
      });

      // Filter by date range in memory if provided
      if (options?.startDate || options?.endDate) {
        const start = options.startDate ? new Date(options.startDate).getTime() : 0;
        const end = options.endDate ? new Date(options.endDate).getTime() : Number.MAX_SAFE_INTEGER;
        results = results.filter(todo => {
          const todoTime = todo.createdAt.getTime();
          return todoTime >= start && todoTime <= end;
        });
      }
      
      return results;
    } catch (error: any) {
      console.error('Error finding todos by userId:', error);
      if (error.code === 9 || error.code === 'FAILED_PRECONDITION') {
        console.warn('⚠️ Firestore index missing for Todo.findByUserId - returning empty array');
        return [];
      }
      throw new Error(`Failed to find todos: ${error?.message || 'Unknown error'}`);
    }
  }

  static async update(id: string, updateData: Partial<Omit<ITodo, 'id' | 'createdAt'>>): Promise<ITodo | null> {
    const now = new Date();
    const updatePayload: any = {
      ...updateData,
      updatedAt: firestoreHelpers.dateToTimestamp(now)
    };

    // Handle date fields
    if (updateData.dueDate !== undefined) {
      updatePayload.dueDate = updateData.dueDate ? firestoreHelpers.dateToTimestamp(updateData.dueDate) : null;
    }

    if (updateData.completedAt !== undefined) {
      updatePayload.completedAt = updateData.completedAt ? firestoreHelpers.dateToTimestamp(updateData.completedAt) : null;
    }

    // If marking as completed, set completedAt
    if (updateData.isCompleted === true && !updatePayload.completedAt) {
      updatePayload.completedAt = firestoreHelpers.dateToTimestamp(now);
    }

    // If marking as incomplete, clear completedAt
    if (updateData.isCompleted === false) {
      updatePayload.completedAt = null;
    }
    
    await todosCollection().doc(id).update(updatePayload);

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await todosCollection().doc(id).delete();
      return true;
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      throw new Error(`Failed to delete todo: ${error?.message || 'Unknown error'}`);
    }
  }
}

