import React from 'react';
import { 
  X, 
  Edit, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { MaintenanceTask } from './MaintenanceManagement';

interface MaintenanceTaskDetailsProps {
  task: MaintenanceTask;
  onClose: () => void;
  onEdit: () => void;
}

export function MaintenanceTaskDetails({ task, onClose, onEdit }: MaintenanceTaskDetailsProps) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#374957]">{task.title}</h1>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold text-[#374957]">Task Information</h2>
            </div>
            <div className="p-6 space-y-4">
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(task.status)}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Priority</h3>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </h3>
                  <p className="text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                {task.completedDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed Date
                    </h3>
                    <p className="text-gray-600">{new Date(task.completedDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {task.cost && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost
                  </h3>
                  <p className="text-lg font-semibold text-[#374957]">£{task.cost}</p>
                </div>
              )}

              {task.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service History */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold text-[#374957]">Service History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Mock service history - will be replaced with real data */}
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#374957]">Task completed</p>
                    <p className="text-sm text-gray-600">Completed on {new Date(task.completedDate || task.dueDate).toLocaleDateString()}</p>
                    {task.vendor && (
                      <p className="text-sm text-gray-500 mt-1">Service provided by {task.vendor.name}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">No previous service history</p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold text-[#374957]">Attachments</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#374957]">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.type}</p>
                      </div>
                      <button className="px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Information */}
          {task.vendor && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold text-[#374957]">Vendor Information</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Vendor Name
                  </h3>
                  <p className="text-[#374957] font-medium">{task.vendor.name}</p>
                </div>
                {task.vendor.contact && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Contact</h3>
                    <p className="text-gray-600">{task.vendor.contact}</p>
                  </div>
                )}
                <button className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Contact Vendor
                </button>
              </div>
            </div>
          )}

          {/* Recurring Information */}
          {task.recurring && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b p-6">
                <h2 className="text-xl font-semibold text-[#374957]">Recurring Task</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Frequency
                  </h3>
                  <p className="text-[#374957] font-medium capitalize">{task.recurring.frequency}</p>
                </div>
                {task.recurring.nextDue && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Next Due</h3>
                    <p className="text-gray-600">{new Date(task.recurring.nextDue).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold text-[#374957]">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-2">
              <button className="w-full px-4 py-2 text-left text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mark as Completed
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reschedule
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
