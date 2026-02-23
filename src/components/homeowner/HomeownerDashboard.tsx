import React, { useState, useEffect } from 'react';
import { MainLayout, HomeownerNavigationScreen } from './MainLayout';
import { Dashboard } from './Dashboard';
import { MaintenanceManagement, MaintenanceTask } from './MaintenanceManagement';
import { MaintenanceTaskDetails } from './MaintenanceTaskDetails';
import { DocumentationHub, HomeDocument } from './DocumentationHub';
import { CommunicationHub, HomeownerMessage } from './CommunicationHub';
import { Projects } from './Projects';
import { HomeValue } from './HomeValue';
import { Settings } from './Settings';

interface HomeownerDashboardProps {
  onLogout?: () => void;
}

export function HomeownerDashboard({ onLogout }: HomeownerDashboardProps) {
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
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<HomeDocument | null>(null);

  // Clear initial screen after first load
  useEffect(() => {
    if (initialScreenRaw) {
      localStorage.removeItem('homeownerInitialScreen');
    }
  }, [initialScreenRaw]);

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
    // TODO: Confirm and delete task
    if (confirm('Are you sure you want to delete this task?')) {
      console.log('Delete task:', taskId);
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
          />
        );

      case 'maintenance':
        return (
          <MaintenanceManagement
            onBack={() => handleNavigate('dashboard')}
            onViewTask={handleViewTask}
            onCreateTask={handleCreateMaintenance}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            openVendorSearchOnMount={openVendorSearchOnMount}
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
            onBack={() => handleNavigate('dashboard')}
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
          />
        );
    }
  };

  return (
    <MainLayout
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
    >
      {renderScreen()}
    </MainLayout>
  );
}

