import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { homeownerProjectsFirestoreService, type HomeProject } from '../services/homeownerProjectsFirestoreService';

export function useHomeownerProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = homeownerProjectsFirestoreService.subscribeToProjects(
      user.id,
      (loadedProjects) => {
        setProjects(loadedProjects);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading projects:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.id]);

  return { projects, loading };
}
