import React, { useState, useEffect } from 'react';
import { Hammer, X } from 'lucide-react';
import { HomeProject } from './Projects';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<HomeProject, 'id'>) => void | Promise<void>;
  initialProject?: HomeProject | null;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
}: ProjectFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'improvement' as HomeProject['category'],
    status: 'planning' as HomeProject['status'],
    priority: 'medium' as HomeProject['priority'],
    targetDate: '',
    budget: '',
    contractorName: '',
    contractorContact: '',
    notes: '',
  });

  useEffect(() => {
    if (initialProject) {
      setFormData({
        name: initialProject.name,
        description: initialProject.description || '',
        category: initialProject.category,
        status: initialProject.status,
        priority: initialProject.priority,
        targetDate: initialProject.targetDate || '',
        budget: initialProject.budget?.toString() || '',
        contractorName: initialProject.contractor?.name || '',
        contractorContact: initialProject.contractor?.contact || '',
        notes: initialProject.notes || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'improvement',
        status: 'planning',
        priority: 'medium',
        targetDate: '',
        budget: '',
        contractorName: '',
        contractorContact: '',
        notes: '',
      });
    }
  }, [initialProject, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const project: Omit<HomeProject, 'id'> = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      status: formData.status,
      priority: formData.priority,
      targetDate: formData.targetDate || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      progress: formData.status === 'completed' ? 100 : formData.status === 'planning' ? 0 : (initialProject?.progress ?? 15),
      contractor: formData.contractorName
        ? {
            id: '',
            name: formData.contractorName,
            contact: formData.contractorContact || undefined,
          }
        : undefined,
      notes: formData.notes || undefined,
    };

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(project));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-[#DC5F12]/10 text-[#DC5F12] p-2 rounded-lg">
              <Hammer className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[#374957]">
              {initialProject ? 'Edit Project' : 'New Project'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              required
              placeholder="e.g., Kitchen Renovation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="project-description"
              placeholder="Add details about the project..."
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value as HomeProject['category'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="renovation">Renovation</option>
                <option value="repair">Repair</option>
                <option value="improvement">Improvement</option>
                <option value="landscaping">Landscaping</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as HomeProject['status'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as HomeProject['priority'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget (£)
            </label>
            <input
              id="budget"
              type="number"
              placeholder="0"
              min="0"
              step="1"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Contractor (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Contractor name"
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Contact info"
                value={formData.contractorContact}
                onChange={(e) => setFormData({ ...formData, contractorContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              placeholder="Any additional information..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent resize-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#DC5F12] hover:bg-[#c54f0f] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Saving...' : (initialProject ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
