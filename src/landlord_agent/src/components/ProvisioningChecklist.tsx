import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ProvisioningTask } from '../App';
import { CheckCircle2, Circle, Plus, Trash2, ListChecks } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

interface ProvisioningChecklistProps {
  tasks: ProvisioningTask[];
  onTasksChange: (tasks: ProvisioningTask[]) => void;
}

const defaultTasks: Omit<ProvisioningTask, 'id'>[] = [
  { title: 'Cleaning completed', category: 'cleaning', completed: false, priority: 'high' },
  { title: 'All supplies stocked (toilet paper, towels, etc.)', category: 'supplies', completed: false, priority: 'high' },
  { title: 'Keys ready and accessible', category: 'supplies', completed: false, priority: 'high' },
  { title: 'Wi-Fi working and password available', category: 'maintenance', completed: false, priority: 'medium' },
  { title: 'Utilities checked (heating, water, electricity)', category: 'maintenance', completed: false, priority: 'medium' },
  { title: 'Property inspection completed', category: 'inspection', completed: false, priority: 'high' },
  { title: 'Photos updated if needed', category: 'documentation', completed: false, priority: 'low' },
];

export function ProvisioningChecklist({ tasks = [], onTasksChange }: ProvisioningChecklistProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other' as ProvisioningTask['category'],
    priority: 'medium' as ProvisioningTask['priority']
  });

  // Initialize with default tasks if empty
  React.useEffect(() => {
    if (tasks.length === 0) {
      const initializedTasks: ProvisioningTask[] = defaultTasks.map((task, index) => ({
        ...task,
        id: `task-${Date.now()}-${index}`
      }));
      onTasksChange(initializedTasks);
    }
  }, []);

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined
        };
      }
      return task;
    });
    onTasksChange(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onTasksChange(updatedTasks);
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: ProvisioningTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || undefined,
      category: newTask.category,
      completed: false,
      priority: newTask.priority
    };

    onTasksChange([...tasks, task]);
    setNewTask({ title: '', description: '', category: 'other', priority: 'medium' });
    setShowAddDialog(false);
  };

  const updateTaskNotes = (taskId: string, notes: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, notes: notes || undefined };
      }
      return task;
    });
    onTasksChange(updatedTasks);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      case 'supplies':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inspection':
        return 'bg-purple-100 text-purple-800';
      case 'documentation':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, ProvisioningTask[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Provisioning Checklist
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {completedCount} / {totalCount} completed ({completionPercentage}%)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                {category.replace('-', ' ')}
              </h3>
              <div className="space-y-2">
                {categoryTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-1"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          {task.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <p className="text-gray-700">{task.notes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getCategoryColor(task.category)} variant="outline">
                              {task.category}
                            </Badge>
                            {task.priority && (
                              <Badge className={getPriorityColor(task.priority)} variant="outline">
                                {task.priority} priority
                              </Badge>
                            )}
                            {task.completedAt && (
                              <span className="text-xs text-gray-500">
                                Completed: {task.completedAt.toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {!task.completed && (
                        <div className="mt-2">
                          <Textarea
                            placeholder="Add notes..."
                            value={task.notes || ''}
                            onChange={(e) => updateTaskNotes(task.id, e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Check smoke alarms"
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(value: any) => setNewTask({ ...newTask, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addTask} disabled={!newTask.title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

