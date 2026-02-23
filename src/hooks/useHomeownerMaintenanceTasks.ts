import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { homeownerMaintenanceFirestoreService, type MaintenanceTask } from '../services/homeownerMaintenanceFirestoreService';

export function useHomeownerMaintenanceTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setTasks([]);
      setLoading(false);
      if (import.meta.env.DEV) {
        console.log('[useHomeownerMaintenanceTasks] No user ID - tasks will be empty. Log in to see your tasks.');
      }
      return;
    }
    setLoading(true);
    if (import.meta.env.DEV) {
      console.log('[useHomeownerMaintenanceTasks] Subscribing for userId:', user.id);
    }
    const unsubscribe = homeownerMaintenanceFirestoreService.subscribeToTasks(
      user.id,
      (loadedTasks) => {
        if (import.meta.env.DEV) {
          console.log('[useHomeownerMaintenanceTasks] Received', loadedTasks.length, 'tasks for userId:', user.id);
        }
        setTasks(loadedTasks);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading maintenance tasks:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.id]);

  return { tasks, loading };
}
