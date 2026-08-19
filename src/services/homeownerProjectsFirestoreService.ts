import apiService from './api';

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

class HomeownerProjectsFirestoreService {
  async getProjects(userId: string): Promise<HomeProject[]> {
    try {
      const response = await apiService.get('/homeowner-projects');
      return response.projects || [];
    } catch {
      return [];
    }
  }

  subscribeToProjects(
    userId: string,
    callback: (projects: HomeProject[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isActive = true;

    const fetchProjects = async () => {
      if (!isActive) return;
      try {
        const projects = await this.getProjects(userId);
        if (isActive) callback(projects);
      } catch (err: any) {
        if (onError) onError(err);
      }
    };

    fetchProjects();
    return () => {
      isActive = false;
    };
  }

  async createProject(userId: string, project: Omit<HomeProject, 'id'>): Promise<string> {
    const data = await apiService.post('/homeowner-projects', project);
    return data.id;
  }

  async updateProject(projectId: string, updates: Partial<Omit<HomeProject, 'id'>>): Promise<void> {
    await apiService.put(`/homeowner-projects/${projectId}`, updates);
  }

  async deleteProject(projectId: string): Promise<void> {
    await apiService.delete(`/homeowner-projects/${projectId}`);
  }
}

export const homeownerProjectsFirestoreService = new HomeownerProjectsFirestoreService();
