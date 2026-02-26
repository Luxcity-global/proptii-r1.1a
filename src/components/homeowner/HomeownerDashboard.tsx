import React, { useState, useEffect, useRef } from 'react';
import { MainLayout, HomeownerNavigationScreen } from './MainLayout';
import { Dashboard } from './Dashboard';
import { MaintenanceManagement, MaintenanceTask } from './MaintenanceManagement';
import { MaintenanceTaskDetails } from './MaintenanceTaskDetails';
import { DocumentationHub, HomeDocument } from './DocumentationHub';
import { CommunicationHub, HomeownerMessage } from './CommunicationHub';
import { Projects } from './Projects';
import { HomeValue } from './HomeValue';
import { Settings } from './Settings';
import { useHomeownerMaintenanceTasks } from '../../hooks/useHomeownerMaintenanceTasks';
import { useHomeownerProjects } from '../../hooks/useHomeownerProjects';
import { useAuth } from '../../contexts/AuthContext';
import {
  consumePendingMaintenanceTask,
  consumePendingProject
} from '../../utils/homeownerPendingForm';
import type { HomeProject } from './Projects';
import { startScheduleMaintenanceTour } from '../../onboarding/homeowner/scheduleMaintenanceTour';
import { startCreateProjectTour } from '../../onboarding/homeowner/createProjectTour';
import { startFindVendorTour } from '../../onboarding/homeowner/findVendorTour';
import { GettingStartedHub } from '../getting-started';

interface HomeownerDashboardProps {
  onLogout?: () => void;
}

export function HomeownerDashboard({ onLogout }: HomeownerDashboardProps) {
  const { user } = useAuth();
  const prevUserRef = useRef<string | null>(null);
  const { tasks: maintenanceTasks, loading: maintenanceLoading } = useHomeownerMaintenanceTasks();
  const { projects: homeownerProjects, loading: projectsLoading } = useHomeownerProjects();

  const [restoreTaskData, setRestoreTaskData] = useState<Omit<MaintenanceTask, 'id'> | null>(null);
  const [restoreProjectData, setRestoreProjectData] = useState<Omit<HomeProject, 'id'> | null>(null);

  // Check for initial screen from localStorage (set by landing page buttons)
  const initialScreenRaw = localStorage.getItem('homeownerInitialScreen');
  const initialScreen = initialScreenRaw as HomeownerNavigationScreen | 'vendor-search' | null;
  const validScreens = ['maintenance', 'documents', 'projects', 'home-value', 'communication', 'settings'];
  const [currentScreen, setCurrentScreen] = useState<HomeownerNavigationScreen>(
    initialScreen === 'vendor-search'
      ? 'maintenance'
      : initialScreen && validScreens.includes(initialScreen)
        ? initialScreen
        : 'dashboard'
  );
  const openVendorSearchOnMount = initialScreen === 'vendor-search';
  const openAddTaskModalOnMount = initialScreen === 'maintenance';
  const openProjectFormModalOnMount = initialScreen === 'projects';
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  // Restore pending form data after sign-in
  useEffect(() => {
    const hadUser = prevUserRef.current;
    const hasUser = !!user?.id;
    prevUserRef.current = user?.id ?? null;

    if (!hadUser && hasUser) {
      const pendingTask = consumePendingMaintenanceTask();
      const pendingProject = consumePendingProject();
      if (pendingTask && typeof pendingTask === 'object') {
        setRestoreTaskData(pendingTask as Omit<MaintenanceTask, 'id'>);
        setCurrentScreen('maintenance');
      } else if (pendingProject && typeof pendingProject === 'object') {
        setRestoreProjectData(pendingProject as Omit<HomeProject, 'id'>);
        setCurrentScreen('projects');
      }
    }
  }, [user?.id]);
  const [selectedDocument, setSelectedDocument] = useState<HomeDocument | null>(null);

  // Clear initial screen after first load
  useEffect(() => {
    if (initialScreenRaw) {
      localStorage.removeItem('homeownerInitialScreen');
    }
  }, [initialScreenRaw]);

  // Start schedule maintenance tour when arriving with startScheduleMaintenanceTour=1
  // Clear params inside setTimeout so React Strict Mode (double effect run) doesn't cancel the tour
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('startScheduleMaintenanceTour') === '1';
      const fromStorage = localStorage.getItem('startScheduleMaintenanceTour') === '1';
      if (!fromUrl && !fromStorage) return;
      setCurrentScreen('dashboard');
      const t = setTimeout(() => {
        localStorage.removeItem('startScheduleMaintenanceTour');
        if (fromUrl) {
          params.delete('startScheduleMaintenanceTour');
          const newSearch = params.toString();
          window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
        }
        startScheduleMaintenanceTour(setCurrentScreen);
      }, 400);
      return () => clearTimeout(t);
    } catch (_) {}
  }, []);

  // Start create project tour when arriving with startCreateProjectTour=1
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('startCreateProjectTour') === '1';
      const fromStorage = localStorage.getItem('startCreateProjectTour') === '1';
      if (!fromUrl && !fromStorage) return;
      setCurrentScreen('dashboard');
      const t = setTimeout(() => {
        localStorage.removeItem('startCreateProjectTour');
        if (fromUrl) {
          params.delete('startCreateProjectTour');
          const newSearch = params.toString();
          window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
        }
        startCreateProjectTour(setCurrentScreen);
      }, 400);
      return () => clearTimeout(t);
    } catch (_) {}
  }, []);

  // Start find vendor tour when arriving with startFindVendorTour=1
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('startFindVendorTour') === '1';
      const fromStorage = localStorage.getItem('startFindVendorTour') === '1';
      if (!fromUrl && !fromStorage) return;
      setCurrentScreen('dashboard');
      const t = setTimeout(() => {
        localStorage.removeItem('startFindVendorTour');
        if (fromUrl) {
          params.delete('startFindVendorTour');
          const newSearch = params.toString();
          window.history.replaceState({}, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
        }
        startFindVendorTour(setCurrentScreen);
      }, 400);
      return () => clearTimeout(t);
    } catch (_) {}
  }, []);

  const handleNavigate = (screen: HomeownerNavigationScreen) => {
    setCurrentScreen(screen);
    setSelectedTask(null);
    setSelectedDocument(null);
  };

  const handleCreateMaintenance = () => {
    // Modal is handled in MaintenanceManagement component
    handleNavigate('maintenance');
  };

  const handleCreateProject = () => {
    // TODO: Navigate to projects page or open form
    handleNavigate('projects');
  };

  const handleUploadDocument = () => {
    // Modal is handled in DocumentationHub component
    handleNavigate('documents');
  };

  const handleViewTask = (task: MaintenanceTask) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: MaintenanceTask) => {
    // Modal is handled in MaintenanceManagement component
    console.log('Edit task:', task);
  };

  const handleDeleteTask = (taskId: string) => {
    // Close task details view if the deleted task was selected
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleViewDocument = (document: HomeDocument) => {
    setSelectedDocument(document);
    // TODO: Open document viewer or download
    console.log('View document:', document);
  };

  const handleDeleteDocument = (documentId: string) => {
    // TODO: Confirm and delete document
    if (confirm('Are you sure you want to delete this document?')) {
      console.log('Delete document:', documentId);
    }
  };

  const handleSendMessage = (message: Omit<HomeownerMessage, 'id' | 'timestamp'>) => {
    // TODO: Send message via Firebase
    console.log('Send message:', message);
  };

  const renderScreen = () => {
    if (selectedTask) {
      return (
        <MaintenanceTaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            handleEditTask(selectedTask);
            setSelectedTask(null);
          }}
        />
      );
    }

    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateMaintenance={handleCreateMaintenance}
            onCreateProject={handleCreateProject}
            onUploadDocument={handleUploadDocument}
            maintenanceTasks={maintenanceTasks}
            projects={homeownerProjects}
          />
        );

      case 'maintenance':
        return (
          <MaintenanceManagement
            tasks={maintenanceTasks}
            tasksLoading={maintenanceLoading}
            onBack={() => handleNavigate('dashboard')}
            onViewTask={handleViewTask}
            onCreateTask={handleCreateMaintenance}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            openVendorSearchOnMount={openVendorSearchOnMount}
            openAddTaskModalOnMount={openAddTaskModalOnMount}
            restoreTaskData={restoreTaskData}
            onRestoreConsumed={() => setRestoreTaskData(null)}
            onStartScheduleGuide={() => {
              setCurrentScreen('dashboard');
              setTimeout(() => startScheduleMaintenanceTour(setCurrentScreen), 400);
            }}
            onStartFindVendorGuide={() => {
              setCurrentScreen('dashboard');
              setTimeout(() => startFindVendorTour(setCurrentScreen), 400);
            }}
          />
        );

      case 'documents':
        return (
          <DocumentationHub
            onBack={() => handleNavigate('dashboard')}
            onUploadDocument={handleUploadDocument}
            onViewDocument={handleViewDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        );

      case 'communication':
        return (
          <CommunicationHub
            onBack={() => handleNavigate('dashboard')}
            onSendMessage={handleSendMessage}
          />
        );

      case 'projects':
        return (
          <Projects
            projects={homeownerProjects}
            projectsLoading={projectsLoading}
            onBack={() => handleNavigate('dashboard')}
            openProjectFormModalOnMount={openProjectFormModalOnMount}
            restoreProjectData={restoreProjectData}
            onRestoreConsumed={() => setRestoreProjectData(null)}
            onStartProjectGuide={() => {
              setCurrentScreen('dashboard');
              setTimeout(() => startCreateProjectTour(setCurrentScreen), 400);
            }}
          />
        );

      case 'home-value':
        return (
          <HomeValue
            onBack={() => handleNavigate('dashboard')}
          />
        );

      case 'settings':
        return (
          <Settings
            onBack={() => handleNavigate('dashboard')}
          />
        );

      default:
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onCreateMaintenance={handleCreateMaintenance}
            onCreateProject={handleCreateProject}
            onUploadDocument={handleUploadDocument}
            maintenanceTasks={maintenanceTasks}
            projects={homeownerProjects}
          />
        );
    }
  };

  return (
    <MainLayout
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
    >
      <div className="p-4 md:p-6">
        <GettingStartedHub
          app="homeowner"
          userName={user?.name}
          placement="top"
        />
        {renderScreen()}
      </div>
    </MainLayout>
  );
}

