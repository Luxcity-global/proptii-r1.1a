import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Hammer, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { ProjectFormModal } from './ProjectFormModal';
import { SignUpPromptModal } from '../onboarding/SignUpPromptModal';
import { savePendingProject } from '../../utils/homeownerPendingForm';
import { useAuth } from '../../contexts/AuthContext';
import { ContextualBanner } from '../getting-started';
import {
  homeownerProjectsFirestoreService,
  type HomeProject
} from '../../services/homeownerProjectsFirestoreService';

export type { HomeProject };

interface ProjectsProps {
  projects: HomeProject[];
  projectsLoading: boolean;
  onBack: () => void;
  openProjectFormModalOnMount?: boolean;
  /** Project data to restore after sign-in (from sessionStorage). */
  restoreProjectData?: Omit<HomeProject, 'id'> | null;
  /** Called when restore data has been applied. */
  onRestoreConsumed?: () => void;
  /** Start the create-project guide (from Getting Started). */
  onStartProjectGuide?: () => void;
}

export function Projects({ projects, projectsLoading, onBack, openProjectFormModalOnMount = false, restoreProjectData, onRestoreConsumed, onStartProjectGuide }: ProjectsProps) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [projectDataToRestore, setProjectDataToRestore] = useState<Omit<HomeProject, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<HomeProject | null>(null);

  // Open project form modal when navigating from "Create project" onboarding option
  useEffect(() => {
    if (openProjectFormModalOnMount) {
      setEditingProject(null);
      setIsFormModalOpen(true);
    }
  }, [openProjectFormModalOnMount]);

  // Restore pending project data after sign-in
  useEffect(() => {
    if (restoreProjectData) {
      setEditingProject(null);
      setProjectDataToRestore(restoreProjectData);
      setIsFormModalOpen(true);
      onRestoreConsumed?.();
    }
  }, [restoreProjectData, onRestoreConsumed]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: HomeProject['status']) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  const getCategoryLabel = (category: HomeProject['category']) => {
    const labels: Record<HomeProject['category'], string> = {
      renovation: 'Renovation',
      repair: 'Repair',
      improvement: 'Improvement',
      landscaping: 'Landscaping',
      other: 'Other',
    };
    return labels[category];
  };

  const getPriorityColor = (priority: HomeProject['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitProject = async (project: Omit<HomeProject, 'id'>) => {
    if (!user?.id) {
      savePendingProject(project as Record<string, unknown>);
      setShowSignUpModal(true);
      throw new Error('User not authenticated');
    }
    if (editingProject) {
      await homeownerProjectsFirestoreService.updateProject(editingProject.id, project);
    } else {
      await homeownerProjectsFirestoreService.createProject(user.id, project);
    }
    setEditingProject(null);
    setProjectDataToRestore(null);
    setIsFormModalOpen(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await homeownerProjectsFirestoreService.deleteProject(projectId);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {onStartProjectGuide && (
        <ContextualBanner
          app="homeowner"
          stepId="createProject"
          message="Ready to create a project?"
          linkText="Start the 2-minute guide"
          onStartGuide={onStartProjectGuide}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-[#374957] mb-2">Home Improvement Projects</h1>
          <p className="text-gray-600">Track and manage your home improvement projects</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setIsFormModalOpen(true);
          }}
          data-demo-homeowner-new-project="1"
          className="bg-[#DC5F12] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#c54f0f] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
            >
              <option value="all">All</option>
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
            >
              <option value="all">All</option>
              <option value="renovation">Renovation</option>
              <option value="repair">Repair</option>
              <option value="improvement">Improvement</option>
              <option value="landscaping">Landscaping</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsLoading ? (
          <div className="col-span-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-10 h-10 border-2 border-[#DC5F12] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Hammer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No projects found</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new project</p>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#374957] mb-2">{project.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setIsFormModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Edit project"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#DC5F12] h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {project.targetDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Target: {new Date(project.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      Budget: £{project.budget.toLocaleString()}
                      {project.actualCost && (
                        <span className="ml-1">
                          (Spent: £{project.actualCost.toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {project.contractor && (
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    <span>{project.contractor.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProject(null);
          setProjectDataToRestore(null);
        }}
        onSubmit={handleSubmitProject}
        initialProject={projectDataToRestore ? { ...projectDataToRestore, id: '' } : editingProject}
      />

      {/* Sign-up prompt when guest tries to save project */}
      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Sign in to save your project"
        reassurance="Create an account or sign in to save projects and manage your home improvements. Your progress won't be lost."
        onSignUpEmail={login}
        onSignUpSocial={login}
        showExploreFeaturesAsSecondary
        onExploreFeatures={() => {
          setShowSignUpModal(false);
          navigate('/homeowner-onboarding');
        }}
      />
    </div>
  );
}

