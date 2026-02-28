import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/** Home project model - shared with Projects component */
export interface HomeProject {
  id: string;
  name: string;
  description?: string;
  category: 'renovation' | 'repair' | 'improvement' | 'landscaping' | 'other';
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  budget?: number;
  actualCost?: number;
  progress: number;
  contractor?: { id: string; name: string; contact?: string };
  notes?: string;
}

const COLLECTION_NAME = 'homeownerProjects';

interface HomeProjectFirestore {
  userId: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  budget?: number;
  actualCost?: number;
  progress: number;
  contractor?: { id: string; name: string; contact?: string };
  notes?: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

function toFirestore(project: Omit<HomeProject, 'id'>, userId: string): Omit<HomeProjectFirestore, 'createdAt' | 'updatedAt'> {
  const out: Omit<HomeProjectFirestore, 'createdAt' | 'updatedAt'> = {
    userId,
    name: project.name,
    category: project.category,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
  };
  if (project.description !== undefined) out.description = project.description;
  if (project.startDate !== undefined) out.startDate = project.startDate;
  if (project.targetDate !== undefined) out.targetDate = project.targetDate;
  if (project.completedDate !== undefined) out.completedDate = project.completedDate;
  if (project.budget !== undefined) out.budget = project.budget;
  if (project.actualCost !== undefined) out.actualCost = project.actualCost;
  if (project.contractor !== undefined) out.contractor = project.contractor;
  if (project.notes !== undefined) out.notes = project.notes;
  return out;
}

function fromFirestore(id: string, data: HomeProjectFirestore & { createdAt?: unknown; updatedAt?: unknown }): HomeProject {
  return {
    id,
    name: data.name,
    description: data.description,
    category: data.category as HomeProject['category'],
    status: data.status as HomeProject['status'],
    priority: data.priority as HomeProject['priority'],
    startDate: data.startDate,
    targetDate: data.targetDate,
    completedDate: data.completedDate,
    budget: data.budget,
    actualCost: data.actualCost,
    progress: data.progress ?? 0,
    contractor: data.contractor,
    notes: data.notes,
  };
}

class HomeownerProjectsFirestoreService {
  private collectionRef = collection(db, COLLECTION_NAME);

  subscribeToProjects(
    userId: string,
    callback: (projects: HomeProject[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(this.collectionRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const projects = snapshot.docs.map((d) =>
          fromFirestore(d.id, d.data() as HomeProjectFirestore)
        );
        projects.sort((a, b) => {
          const aDoc = snapshot.docs.find((d) => d.id === a.id);
          const bDoc = snapshot.docs.find((d) => d.id === b.id);
          const aTime = (aDoc?.data()?.createdAt as { toMillis?: () => number })?.toMillis?.() ?? new Date(a.targetDate || a.name).getTime();
          const bTime = (bDoc?.data()?.createdAt as { toMillis?: () => number })?.toMillis?.() ?? new Date(b.targetDate || b.name).getTime();
          return bTime - aTime;
        });
        callback(projects);
      },
      (error) => {
        console.error('HomeownerProjectsFirestoreService subscribe error:', error);
        if (onError) onError(error);
      }
    );
  }

  async createProject(userId: string, project: Omit<HomeProject, 'id'>): Promise<string> {
    const payload = {
      ...toFirestore(project, userId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(this.collectionRef, payload);
    return ref.id;
  }

  async updateProject(projectId: string, updates: Partial<Omit<HomeProject, 'id'>>): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, projectId);
    const payload: Record<string, unknown> = {};
    const keys: (keyof Omit<HomeProject, 'id'>)[] = ['name', 'description', 'category', 'status', 'priority', 'startDate', 'targetDate', 'completedDate', 'budget', 'actualCost', 'progress', 'contractor', 'notes'];
    for (const key of keys) {
      if (updates[key] !== undefined) payload[key] = updates[key];
    }
    payload.updatedAt = serverTimestamp();
    await updateDoc(ref, payload);
  }

  async deleteProject(projectId: string): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, projectId);
    await deleteDoc(ref);
  }
}

export const homeownerProjectsFirestoreService = new HomeownerProjectsFirestoreService();
