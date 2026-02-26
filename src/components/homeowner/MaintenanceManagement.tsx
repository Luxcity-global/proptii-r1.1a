import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  DollarSign,
  User,
  X,
  BookOpen,
  Phone,
  Sparkles
} from 'lucide-react';
import { MaintenanceTaskFormModal } from './MaintenanceTaskFormModal';
import { MaintenanceTemplatesBrowser } from './MaintenanceTemplatesBrowser';
import { DIYGuideViewer } from './DIYGuideViewer';
import { VendorSearch } from './VendorSearch';
import { MaintenanceTemplate } from './data/maintenanceTemplates';
import { diyGuides, getGuidesByCategory } from './data/diyGuides';
import { useAuth } from '../../contexts/AuthContext';
import {
  homeownerMaintenanceFirestoreService,
  type MaintenanceTask
} from '../../services/homeownerMaintenanceFirestoreService';
import { SignUpPromptModal } from '../onboarding/SignUpPromptModal';
import { savePendingMaintenanceTask } from '../../utils/homeownerPendingForm';
import { ContextualBanner } from '../getting-started';

export type { MaintenanceTask };

interface MaintenanceManagementProps {
  tasks: MaintenanceTask[];
  tasksLoading: boolean;
  onBack: () => void;
  onViewTask: (task: MaintenanceTask) => void;
  onCreateTask: () => void;
  onEditTask: (task: MaintenanceTask) => void;
  onDeleteTask: (taskId: string) => void;
  openVendorSearchOnMount?: boolean;
  openAddTaskModalOnMount?: boolean;
  /** Task data to restore after sign-in (from sessionStorage). */
  restoreTaskData?: Omit<MaintenanceTask, 'id'> | null;
  /** Called when restore data has been applied. */
  onRestoreConsumed?: () => void;
  /** Start the schedule-maintenance guide (from Getting Started). */
  onStartScheduleGuide?: () => void;
  /** Start the find-vendor guide (from Getting Started). */
  onStartFindVendorGuide?: () => void;
}

export function MaintenanceManagement({
  tasks,
  tasksLoading,
  onBack,
  onViewTask,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  openVendorSearchOnMount = false,
  openAddTaskModalOnMount = false,
  restoreTaskData,
  onRestoreConsumed,
  onStartScheduleGuide,
  onStartFindVendorGuide,
}: MaintenanceManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

  // New feature states
  const [isTemplatesBrowserOpen, setIsTemplatesBrowserOpen] = useState(false);
  const [isDIYGuideOpen, setIsDIYGuideOpen] = useState(false);
  const [currentGuideId, setCurrentGuideId] = useState<string | null>(null);
  const [isVendorSearchOpen, setIsVendorSearchOpen] = useState(false);
  const [vendorSearchCategory, setVendorSearchCategory] = useState<string>('other');
  const [showDIYGuidesGrid, setShowDIYGuidesGrid] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [taskDataToRestore, setTaskDataToRestore] = useState<Omit<MaintenanceTask, 'id'> | null>(null);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Open vendor search when navigating from "Find a vendor" onboarding option
  useEffect(() => {
    if (openVendorSearchOnMount) {
      setIsVendorSearchOpen(true);
    }
  }, [openVendorSearchOnMount]);

  // Listen for tour-triggered vendor search open/close
  useEffect(() => {
    const open = () => setIsVendorSearchOpen(true);
    const close = () => setIsVendorSearchOpen(false);
    window.addEventListener('homeowner-open-vendor-search', open);
    window.addEventListener('homeowner-close-vendor-search', close);
    return () => {
      window.removeEventListener('homeowner-open-vendor-search', open);
      window.removeEventListener('homeowner-close-vendor-search', close);
    };
  }, []);

  // Open add task modal when navigating from "Schedule maintenance" onboarding option
  useEffect(() => {
    if (openAddTaskModalOnMount) {
      setEditingTask(null);
      setIsFormModalOpen(true);
    }
  }, [openAddTaskModalOnMount]);

  // Restore pending task data after sign-in
  useEffect(() => {
    if (restoreTaskData) {
      setEditingTask(null);
      setTaskDataToRestore(restoreTaskData);
      setIsFormModalOpen(true);
      onRestoreConsumed?.();
    }
  }, [restoreTaskData, onRestoreConsumed]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleChangePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getStatusColor = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: MaintenanceTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: MaintenanceTask['category']) => {
    const labels: Record<MaintenanceTask['category'], string> = {
      hvac: 'HVAC',
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      appliance: 'Appliance',
      exterior: 'Exterior',
      interior: 'Interior',
      other: 'Other',
    };
    return labels[category];
  };

  const isOverdue = (dueDate: string, status: MaintenanceTask['status']) => {
    if (status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const handleOpenGuide = (guideId: string) => {
    setCurrentGuideId(guideId);
    setIsDIYGuideOpen(true);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {onStartScheduleGuide && (
        <ContextualBanner
          app="homeowner"
          stepId="scheduleMaintenance"
          message="Ready to schedule maintenance?"
          linkText="Start the 2-minute guide"
          onStartGuide={onStartScheduleGuide}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-2 transition-colors group"
          >
            <X className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-[#374957] mb-2">Maintenance Management</h1>
          <p className="text-gray-600">Track and manage all your home maintenance tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTemplatesBrowserOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Browse Templates
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsFormModalOpen(true);
            }}
            data-demo-homeowner-add-task="1"
            className="bg-[#DC5F12] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Maintenance Scheduler Card */}
        <button
          onClick={() => {
            // Ensure we're on the scheduled tasks view and open the scheduler popup
            setShowDIYGuidesGrid(false);
            setIsTemplatesBrowserOpen(true);
          }}
          data-demo-homeowner-templates="1"
          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#374957] mb-2">Maintenance Scheduler</h3>
              <p className="text-sm text-gray-600">
                Quickly browse 30+ pre-built maintenance tasks and add them to your schedule with one click.
              </p>
            </div>
          </div>
        </button>

        {/* DIY Guides Card */}
        <button
          onClick={() => {
            // Show DIY guides grid in place of the tasks table
            setShowDIYGuidesGrid(true);
          }}
          data-demo-homeowner-diy-guides="1"
          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#374957] mb-2">DIY Guides</h3>
              <p className="text-sm text-gray-600">
                Get step-by-step instructions for common home maintenance tasks with safety tips and tool lists.
              </p>
            </div>
          </div>
        </button>

        {/* Vendor Finder Card */}
        <button
          onClick={() => setIsVendorSearchOpen(true)}
          data-demo-homeowner-vendor-finder="1"
          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#374957] mb-2">Vendor Finder</h3>
              <p className="text-sm text-gray-600">
                Find trusted local tradespeople through our curated directory of UK trade platforms.
              </p>
            </div>
          </div>
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
                placeholder="Search tasks..."
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
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
              <option value="hvac">HVAC</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="appliance">Appliance</option>
              <option value="exterior">Exterior</option>
              <option value="interior">Interior</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table / DIY Guides Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {tasksLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-[#DC5F12] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading maintenance tasks...</p>
          </div>
        ) : showDIYGuidesGrid ? (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#374957]">
                DIY Maintenance Guides
              </h2>
              <p className="text-sm text-gray-600">
                Browse step-by-step guides for common home maintenance tasks.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diyGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => handleOpenGuide(guide.id)}
                  className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div>
                    <h3 className="text-base font-bold text-[#374957] mb-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {guide.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700">
                      <Wrench className="w-3 h-3" />
                      {getCategoryLabel(guide.category as any)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700">
                      <Clock className="w-3 h-3" />
                      {guide.estimatedTime}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700 capitalize">
                      {guide.difficulty} DIY
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No tasks found</p>
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your filters or create a new task
            </p>
            <button
              onClick={onCreateTask}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewTask(task)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold text-[#374957] flex items-center gap-2">
                          {task.title}
                          {isOverdue(task.dueDate, task.status) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold border border-red-200">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {getCategoryLabel(task.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {task.cost && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>£{task.cost}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {task.vendor && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{task.vendor.name}</span>
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setVendorSearchCategory(task.category);
                              setIsVendorSearchOpen(true);
                            }}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:text-green-700"
                            aria-label="Find a pro"
                            title="Find a professional"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const guides = getGuidesByCategory(
                                task.category as any
                              );
                              if (guides && guides.length > 0) {
                                setCurrentGuideId(guides[0].id);
                                setIsDIYGuideOpen(true);
                              } else {
                                alert(
                                  'No DIY guide available for this task category yet.'
                                );
                              }
                            }}
                            className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600 hover:text-purple-700"
                            aria-label="Get help"
                            title="DIY Guide"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsFormModalOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                            aria-label="Edit task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm('Are you sure you want to delete this task?')) return;
                              try {
                                await homeownerMaintenanceFirestoreService.deleteTask(task.id);
                                onDeleteTask(task.id);
                              } catch (err) {
                                console.error('Failed to delete task:', err);
                                alert('Failed to delete task. Please try again.');
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                            aria-label="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-semibold">
                  {filteredTasks.length === 0
                    ? 0
                    : (currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * pageSize, filteredTasks.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold">{filteredTasks.length}</span>{' '}
                tasks
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChangePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page{' '}
                  <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <button
                  onClick={() => handleChangePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Maintenance Task Form Modal */}
      <MaintenanceTaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTask(null);
          setTaskDataToRestore(null);
        }}
        onSubmit={async (taskData) => {
          if (!user?.id) {
            savePendingMaintenanceTask(taskData as Record<string, unknown>);
            setShowSignUpModal(true);
            throw new Error('User not authenticated');
          }
          if (editingTask) {
            await homeownerMaintenanceFirestoreService.updateTask(
              editingTask.id,
              taskData
            );
            onEditTask({ ...editingTask, ...taskData } as MaintenanceTask);
          } else {
            await homeownerMaintenanceFirestoreService.createTask(
              user.id,
              taskData
            );
            onCreateTask();
          }
          setIsFormModalOpen(false);
          setEditingTask(null);
          setTaskDataToRestore(null);
        }}
        initialTask={taskDataToRestore ? { ...taskDataToRestore, id: '' } : editingTask}
      />

      {/* Maintenance Templates Browser */}
      <MaintenanceTemplatesBrowser
        isOpen={isTemplatesBrowserOpen}
        onClose={() => setIsTemplatesBrowserOpen(false)}
        onSelectTemplate={async (template: MaintenanceTemplate) => {
          if (!user?.id) {
            const today = new Date();
            const dueDate = new Date(today);
            if (template.frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + 1);
            else if (template.frequency === 'quarterly') dueDate.setMonth(dueDate.getMonth() + 3);
            else if (template.frequency === 'biannual') dueDate.setMonth(dueDate.getMonth() + 6);
            else if (template.frequency === 'yearly') dueDate.setFullYear(dueDate.getFullYear() + 1);
            else dueDate.setMonth(dueDate.getMonth() + 1);
            const taskData: Omit<MaintenanceTask, 'id'> = {
              title: template.title,
              description: template.description,
              category: template.category,
              priority: template.priority,
              status: 'pending',
              dueDate: dueDate.toISOString().split('T')[0],
              cost: template.estimatedCost.min,
              recurring: template.frequency !== 'once' ? {
                frequency: template.frequency === 'biannual' ? 'custom' : template.frequency as 'monthly' | 'quarterly' | 'yearly',
                nextDue: dueDate.toISOString().split('T')[0]
              } : undefined
            };
            savePendingMaintenanceTask(taskData as Record<string, unknown>);
            setShowSignUpModal(true);
            throw new Error('User not authenticated');
          }
          const today = new Date();
          const dueDate = new Date(today);

          if (template.frequency === 'monthly') {
            dueDate.setMonth(dueDate.getMonth() + 1);
          } else if (template.frequency === 'quarterly') {
            dueDate.setMonth(dueDate.getMonth() + 3);
          } else if (template.frequency === 'biannual') {
            dueDate.setMonth(dueDate.getMonth() + 6);
          } else if (template.frequency === 'yearly') {
            dueDate.setFullYear(dueDate.getFullYear() + 1);
          } else {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }

          const taskData: Omit<MaintenanceTask, 'id'> = {
            title: template.title,
            description: template.description,
            category: template.category,
            priority: template.priority,
            status: 'pending',
            dueDate: dueDate.toISOString().split('T')[0],
            cost: template.estimatedCost.min,
            recurring: template.frequency !== 'once' ? {
              frequency: template.frequency === 'biannual' ? 'custom' : template.frequency as 'monthly' | 'quarterly' | 'yearly',
              nextDue: dueDate.toISOString().split('T')[0]
            } : undefined
          };

          try {
            await homeownerMaintenanceFirestoreService.createTask(user.id, taskData);
            setIsTemplatesBrowserOpen(false);
          } catch (err) {
            console.error('Failed to create task from template:', err);
            alert('Failed to add task. Please try again.');
          }
        }}
      />

      {/* DIY Guide Viewer */}
      {currentGuideId && (
        <DIYGuideViewer
          guideId={currentGuideId}
          isOpen={isDIYGuideOpen}
          onClose={() => {
            setIsDIYGuideOpen(false);
            setCurrentGuideId(null);
          }}
          onFindPro={() => {
            setIsDIYGuideOpen(false);
            setIsVendorSearchOpen(true);
          }}
        />
      )}

      {/* Vendor Search */}
      <VendorSearch
        isOpen={isVendorSearchOpen}
        onClose={() => setIsVendorSearchOpen(false)}
        category={vendorSearchCategory}
        onStartFindVendorGuide={onStartFindVendorGuide}
      />

      {/* Sign-up prompt when guest tries to save maintenance task */}
      <SignUpPromptModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        title="Sign in to save your maintenance task"
        reassurance="Create an account or sign in to save tasks and manage your home maintenance. Your progress won't be lost."
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
