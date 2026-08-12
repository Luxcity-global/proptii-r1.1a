import apiService from './api';

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

class HomeownerMaintenanceFirestoreService {
  async getTasks(userId: string): Promise<MaintenanceTask[]> {
    try {
      const response = await apiService.get('/homeowner-maintenance');
      return response.tasks || [];
    } catch {
      return [];
    }
  }

  subscribeToTasks(
    userId: string,
    callback: (tasks: MaintenanceTask[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isActive = true;
    let timer: any;

    const poll = async () => {
      if (!isActive) return;
      try {
        const tasks = await this.getTasks(userId);
        if (isActive) callback(tasks);
      } catch (err: any) {
        if (onError) onError(err);
      }
      if (isActive) {
        timer = setTimeout(poll, 15000);
      }
    };

    poll();
    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }

  async createTask(
    userId: string,
    task: Omit<MaintenanceTask, 'id'>
  ): Promise<string> {
    const data = await apiService.post('/homeowner-maintenance', task);
    return data.id;
  }

  async updateTask(
    taskId: string,
    updates: Partial<Omit<MaintenanceTask, 'id'>>
  ): Promise<void> {
    await apiService.put(`/homeowner-maintenance/${taskId}`, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiService.delete(`/homeowner-maintenance/${taskId}`);
  }
}

export const homeownerMaintenanceFirestoreService = new HomeownerMaintenanceFirestoreService();
