import React, { useState, useEffect } from 'react';
import { Wrench, X } from 'lucide-react';
import { MaintenanceTask } from './MaintenanceManagement';

interface MaintenanceTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<MaintenanceTask, 'id'>) => void;
  initialTask?: MaintenanceTask | null;
}

export function MaintenanceTaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}: MaintenanceTaskFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as MaintenanceTask['category'],
    priority: 'medium' as MaintenanceTask['priority'],
    status: 'pending' as MaintenanceTask['status'],
    dueDate: '',
    cost: '',
    vendorName: '',
    vendorContact: '',
    isRecurring: false,
    recurringFrequency: 'yearly' as 'monthly' | 'quarterly' | 'yearly' | 'custom',
    notes: '',
  });

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title,
        description: initialTask.description || '',
        category: initialTask.category,
        priority: initialTask.priority,
        status: initialTask.status,
        dueDate: initialTask.dueDate,
        cost: initialTask.cost?.toString() || '',
        vendorName: initialTask.vendor?.name || '',
        vendorContact: initialTask.vendor?.contact || '',
        isRecurring: !!initialTask.recurring,
        recurringFrequency: initialTask.recurring?.frequency || 'yearly',
        notes: initialTask.notes || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        cost: '',
        vendorName: '',
        vendorContact: '',
        isRecurring: false,
        recurringFrequency: 'yearly',
        notes: '',
      });
    }
  }, [initialTask, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const task: Omit<MaintenanceTask, 'id'> = {
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      vendor: formData.vendorName ? {
        id: '',
        name: formData.vendorName,
        contact: formData.vendorContact || undefined,
      } : undefined,
      recurring: formData.isRecurring ? {
        frequency: formData.recurringFrequency,
      } : undefined,
      notes: formData.notes || undefined,
    };

    onSubmit(task);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[#374957]">
              {initialTask ? 'Edit Maintenance Task' : 'Create Maintenance Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g., HVAC Annual Service"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Add details about the maintenance task..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaintenanceTask['category'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="appliance">Appliance</option>
                <option value="exterior">Exterior</option>
                <option value="interior">Interior</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenanceTask['priority'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost (£)
              </label>
              <input
                id="cost"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Vendor/Contractor (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Vendor name"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Contact info"
                  value={formData.vendorContact}
                  onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Recurring Task</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">This is a recurring task</span>
              </label>
            </div>
            {formData.isRecurring && (
              <select
                value={formData.recurringFrequency}
                onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as typeof formData.recurringFrequency })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              placeholder="Any additional information..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#DC5F12] hover:bg-[#c54f0f] text-white rounded-lg font-medium transition-colors"
            >
              {initialTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
