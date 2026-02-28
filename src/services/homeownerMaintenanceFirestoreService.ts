import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/** Maintenance task model - shared with MaintenanceManagement */
export interface MaintenanceTask {
  id: string;
  title: string;
  description?: string;
  category: 'hvac' | 'plumbing' | 'electrical' | 'appliance' | 'exterior' | 'interior' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: string;
  completedDate?: string;
  cost?: number;
  vendor?: { id: string; name: string; contact?: string };
  recurring?: { frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom'; nextDue?: string };
  attachments?: Array<{ id: string; name: string; url: string; type: string }>;
  notes?: string;
}

const COLLECTION_NAME = 'homeownerMaintenanceTasks';

/** Firestore document shape for maintenance tasks */
interface MaintenanceTaskFirestore {
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  completedDate?: string;
  cost?: number;
  vendor?: { id: string; name: string; contact?: string };
  recurring?: { frequency: string; nextDue?: string };
  attachments?: Array<{ id: string; name: string; url: string; type: string }>;
  notes?: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

function toFirestore(task: Omit<MaintenanceTask, 'id'>, userId: string): Omit<MaintenanceTaskFirestore, 'createdAt' | 'updatedAt'> {
  const out: Omit<MaintenanceTaskFirestore, 'createdAt' | 'updatedAt'> = {
    userId,
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
  };
  if (task.description !== undefined) out.description = task.description;
  if (task.completedDate !== undefined) out.completedDate = task.completedDate;
  if (task.cost !== undefined) out.cost = task.cost;
  if (task.vendor !== undefined) out.vendor = task.vendor;
  if (task.recurring !== undefined) out.recurring = task.recurring;
  if (task.attachments !== undefined) out.attachments = task.attachments;
  if (task.notes !== undefined) out.notes = task.notes;
  return out;
}

function fromFirestore(id: string, data: MaintenanceTaskFirestore & { createdAt?: unknown; updatedAt?: unknown }): MaintenanceTask {
  return {
    id,
    title: data.title,
    description: data.description,
    category: data.category as MaintenanceTask['category'],
    priority: data.priority as MaintenanceTask['priority'],
    status: data.status as MaintenanceTask['status'],
    dueDate: data.dueDate,
    completedDate: data.completedDate,
    cost: data.cost,
    vendor: data.vendor,
    recurring: data.recurring as MaintenanceTask['recurring'],
    attachments: data.attachments,
    notes: data.notes,
  };
}

class HomeownerMaintenanceFirestoreService {
  private collectionRef = collection(db, COLLECTION_NAME);

  /**
   * Subscribe to real-time maintenance tasks for a homeowner.
   * Uses query without orderBy to avoid requiring a composite index (sorts in memory).
   */
  subscribeToTasks(
    userId: string,
    callback: (tasks: MaintenanceTask[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      this.collectionRef,
      where('userId', '==', userId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((d) =>
          fromFirestore(d.id, d.data() as MaintenanceTaskFirestore)
        );
        // Sort by createdAt desc if available, else by dueDate
        tasks.sort((a, b) => {
          const aDoc = snapshot.docs.find((d) => d.id === a.id);
          const bDoc = snapshot.docs.find((d) => d.id === b.id);
          const aTime = (aDoc?.data()?.createdAt as { toMillis?: () => number })?.toMillis?.() ?? new Date(a.dueDate).getTime();
          const bTime = (bDoc?.data()?.createdAt as { toMillis?: () => number })?.toMillis?.() ?? new Date(b.dueDate).getTime();
          return bTime - aTime;
        });
        callback(tasks);
      },
      (error) => {
        console.error('HomeownerMaintenanceFirestoreService subscribe error:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Create a new maintenance task
   */
  async createTask(
    userId: string,
    task: Omit<MaintenanceTask, 'id'>
  ): Promise<string> {
    const payload = {
      ...toFirestore(task, userId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(this.collectionRef, payload);
    return ref.id;
  }

  /**
   * Update an existing maintenance task
   */
  async updateTask(
    taskId: string,
    updates: Partial<Omit<MaintenanceTask, 'id'>>
  ): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, taskId);
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
    if (updates.completedDate !== undefined) payload.completedDate = updates.completedDate;
    if (updates.cost !== undefined) payload.cost = updates.cost;
    if (updates.vendor !== undefined) payload.vendor = updates.vendor;
    if (updates.recurring !== undefined) payload.recurring = updates.recurring;
    if (updates.attachments !== undefined) payload.attachments = updates.attachments;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    payload.updatedAt = serverTimestamp();
    await updateDoc(ref, payload);
  }

  /**
   * Delete a maintenance task
   */
  async deleteTask(taskId: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, taskId);
    await deleteDoc(ref);
  }

  /**
   * Fetch tasks once (non-realtime) - useful for initial load without subscription
   */
  async getTasks(userId: string): Promise<MaintenanceTask[]> {
    try {
      const q = query(
        this.collectionRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) =>
        fromFirestore(d.id, d.data() as MaintenanceTaskFirestore)
      );
    } catch (error: unknown) {
      // Fallback if composite index is missing
      if (
        (error as { code?: string })?.code === 'failed-precondition' ||
        (error as Error)?.message?.includes?.('index')
      ) {
        const q = query(
          this.collectionRef,
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map((d) =>
          fromFirestore(d.id, d.data() as MaintenanceTaskFirestore)
        );
        tasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        return tasks;
      }
      throw error;
    }
  }
}

export const homeownerMaintenanceFirestoreService =
  new HomeownerMaintenanceFirestoreService();
