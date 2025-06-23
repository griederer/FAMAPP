import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase-config.js';
import type { Todo } from '../types.js';

export class TodoService {
  private readonly collectionName = 'todos';

  async getAllTodos(): Promise<Todo[]> {
    try {
      const todosRef = collection(db, this.collectionName);
      const q = query(todosRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));
    } catch (error) {
      throw new Error(`Failed to get todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTodoById(id: string): Promise<Todo | null> {
    try {
      const todoDoc = await getDoc(doc(db, this.collectionName, id));
      
      if (!todoDoc.exists()) {
        return null;
      }
      
      return {
        id: todoDoc.id,
        ...todoDoc.data()
      } as Todo;
    } catch (error) {
      throw new Error(`Failed to get todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTodo(data: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo> {
    try {
      const todoData = {
        ...data,
        createdAt: Timestamp.now(),
        completed: data.completed || false,
        createdBy: data.createdBy || 'mcp-famapp'
      };

      const docRef = await addDoc(collection(db, this.collectionName), todoData);
      
      return {
        id: docRef.id,
        ...todoData,
        createdAt: new Date()
      } as unknown as Todo;
    } catch (error) {
      throw new Error(`Failed to create todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
    try {
      const todoRef = doc(db, this.collectionName, id);
      
      // Remove id from update data if present
      const { id: _, ...updateData } = data;
      
      // Add completion timestamp if marking as complete
      if (data.completed && !data.completedAt) {
        (updateData as any).completedAt = Timestamp.now();
      }
      
      await updateDoc(todoRef, updateData);
      
      // Return updated todo
      const updated = await this.getTodoById(id);
      if (!updated) {
        throw new Error('Todo not found after update');
      }
      
      return updated;
    } catch (error) {
      throw new Error(`Failed to update todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return true;
    } catch (error) {
      throw new Error(`Failed to delete todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTodosByAssignee(assignee: string): Promise<Todo[]> {
    try {
      const todosRef = collection(db, this.collectionName);
      const q = query(
        todosRef, 
        where('assignedTo', '==', assignee),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));
    } catch (error) {
      throw new Error(`Failed to get todos by assignee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPendingTodos(): Promise<Todo[]> {
    try {
      const todosRef = collection(db, this.collectionName);
      const q = query(
        todosRef, 
        where('completed', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Todo));
    } catch (error) {
      throw new Error(`Failed to get pending todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}