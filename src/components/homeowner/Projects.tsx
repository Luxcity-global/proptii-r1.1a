import React, { useState } from 'react';
import { 
  Hammer, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

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
  progress: number; // 0-100
  contractor?: {
    id: string;
    name: string;
    contact?: string;
  };
  notes?: string;
}

interface ProjectsProps {
  onBack: () => void;
}

export function Projects({ onBack }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Mock data - will be replaced with Firebase data
  const [projects] = useState<HomeProject[]>([
    {
      id: '1',
      name: 'Kitchen Renovation',
      description: 'Complete kitchen remodel including new cabinets, countertops, and appliances',
      category: 'renovation',
      status: 'in-progress',
      priority: 'high',
      startDate: '2024-10-01',
      targetDate: '2025-02-01',
      budget: 25000,
      actualCost: 18500,
      progress: 65,
      contractor: {
        id: 'c1',
        name: 'Elite Home Renovations',
        contact: '555-0303',
      },
    },
    {
      id: '2',
      name: 'Bathroom Upgrade',
      description: 'Update master bathroom with new fixtures and tile',
      category: 'improvement',
      status: 'planning',
      priority: 'medium',
      targetDate: '2025-04-01',
      budget: 12000,
      progress: 15,
    },
    {
      id: '3',
      name: 'Deck Construction',
      description: 'Build new composite deck in backyard',
      category: 'improvement',
      status: 'completed',
      priority: 'low',
      startDate: '2024-06-01',
      completedDate: '2024-08-15',
      budget: 8000,
      actualCost: 7500,
      progress: 100,
      contractor: {
        id: 'c2',
        name: 'Outdoor Living Solutions',
        contact: '555-0404',
      },
    },
    {
      id: '4',
      name: 'Garden Landscaping',
      description: 'Redesign front yard with new plants and walkway',
      category: 'landscaping',
      status: 'on-hold',
      priority: 'low',
      targetDate: '2025-05-01',
      budget: 5000,
      progress: 0,
    },
  ]);

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

  return (
    <div className="p-6 space-y-6">
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
            // TODO: Open project creation modal
            console.log('Create new project');
          }}
          className="bg-[#DC5F12] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#c54f0f] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
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
        {filteredProjects.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Hammer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No projects found</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new project</p>
              <button
                onClick={() => console.log('Create project')}
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
                    onClick={() => console.log('Edit project:', project.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Edit project"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => console.log('Delete project:', project.id)}
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
    </div>
  );
}

