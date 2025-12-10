import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  DollarSign,
  User,
  FileText,
  X
} from 'lucide-react';
import { MaintenanceTaskFormModal } from './MaintenanceTaskFormModal';

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
  vendor?: {
    id: string;
    name: string;
    contact?: string;
  };
  recurring?: {
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    nextDue?: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  notes?: string;
}

interface MaintenanceManagementProps {
  onBack: () => void;
  onViewTask: (task: MaintenanceTask) => void;
  onCreateTask: () => void;
  onEditTask: (task: MaintenanceTask) => void;
  onDeleteTask: (taskId: string) => void;
}

export function MaintenanceManagement({
  onBack,
  onViewTask,
  onCreateTask,
  onEditTask,
  onDeleteTask,
}: MaintenanceManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

  // Mock data - will be replaced with Firebase data
  const [tasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      title: 'HVAC Annual Service',
      description: 'Schedule annual maintenance for heating and cooling system',
      category: 'hvac',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-12-15',
      cost: 150,
      vendor: {
        id: 'v1',
        name: 'ABC Heating & Cooling',
        contact: '555-0101',
      },
      recurring: {
        frequency: 'yearly',
        nextDue: '2025-12-15',
      },
    },
    {
      id: '2',
      title: 'Gutter Cleaning',
      description: 'Clean gutters and downspouts before winter',
      category: 'exterior',
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-12-20',
      cost: 75,
    },
    {
      id: '3',
      title: 'Smoke Detector Check',
      description: 'Test all smoke detectors and replace batteries',
      category: 'electrical',
      priority: 'high',
      status: 'completed',
      dueDate: '2024-12-10',
      completedDate: '2024-12-10',
      cost: 25,
    },
    {
      id: '4',
      title: 'Water Leak Repair',
      description: 'Fix leaky faucet in master bathroom',
      category: 'plumbing',
      priority: 'urgent',
      status: 'in-progress',
      dueDate: '2024-12-12',
      vendor: {
        id: 'v2',
        name: 'Quick Fix Plumbing',
        contact: '555-0202',
      },
    },
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

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

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
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
        <button
          onClick={() => {
            setEditingTask(null);
            setIsFormModalOpen(true);
          }}
          className="bg-[#DC5F12] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all"
            />
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

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No tasks found</p>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new task</p>
            <button
              onClick={onCreateTask}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onViewTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-bold text-[#374957] group-hover:text-[#DC5F12] transition-colors">{task.title}</h3>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                    
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {getCategoryLabel(task.category)}
                    </span>

                    {task.cost && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>£{task.cost}</span>
                      </div>
                    )}

                    {task.vendor && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{task.vendor.name}</span>
                      </div>
                    )}

                    {task.recurring && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Recurring ({task.recurring.frequency})</span>
                      </div>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{task.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTask(task);
                      setIsFormModalOpen(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                    aria-label="Edit task"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Maintenance Task Form Modal */}
      <MaintenanceTaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={(taskData) => {
          if (editingTask) {
            onEditTask({ ...editingTask, ...taskData } as MaintenanceTask);
          } else {
            onCreateTask();
            // TODO: Create task with taskData
            console.log('Create task:', taskData);
          }
        }}
        initialTask={editingTask}
      />
    </div>
  );
}
