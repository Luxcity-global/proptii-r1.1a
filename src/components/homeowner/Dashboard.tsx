import React from 'react';
import { 
  Wrench, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Plus,
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (screen: 'maintenance' | 'documents' | 'projects' | 'home-value') => void;
  onCreateMaintenance: () => void;
  onCreateProject: () => void;
  onUploadDocument: () => void;
}

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export function Dashboard({ 
  onNavigate, 
  onCreateMaintenance, 
  onCreateProject, 
  onUploadDocument 
}: DashboardProps) {
  // Mock data - will be replaced with real data from Firebase
  const stats: StatCard[] = [
    {
      title: 'Upcoming Maintenance',
      value: 3,
      subtitle: '2 due this week',
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => onNavigate('maintenance'),
    },
    {
      title: 'Active Projects',
      value: 2,
      subtitle: '1 in progress',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => onNavigate('projects'),
    },
    {
      title: 'Documents',
      value: 24,
      subtitle: '3 expiring soon',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => onNavigate('documents'),
    },
    {
      title: 'Home Value',
      value: '£425,000',
      subtitle: '+2.3% this year',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => onNavigate('home-value'),
    },
  ];

  const recentTasks = [
    { id: '1', title: 'HVAC Service', dueDate: '2024-12-15', priority: 'high', status: 'pending' },
    { id: '2', title: 'Gutter Cleaning', dueDate: '2024-12-20', priority: 'medium', status: 'pending' },
    { id: '3', title: 'Smoke Detector Check', dueDate: '2024-12-18', priority: 'high', status: 'completed' },
  ];

  const quickActions = [
    {
      title: 'Add Maintenance Task',
      description: 'Schedule a new maintenance task',
      icon: Wrench,
      onClick: onCreateMaintenance,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Start New Project',
      description: 'Track a home improvement project',
      icon: TrendingUp,
      onClick: onCreateProject,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Upload Document',
      description: 'Add warranty, receipt, or manual',
      icon: FileText,
      onClick: onUploadDocument,
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#374957] mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your home.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={stat.onClick}
            >
              <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-[#DC5F12] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-[#374957] mb-1">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#374957] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={action.onClick}
              >
                <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-[#DC5F12] transition-colors">
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#374957] mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-[#374957]">Upcoming Maintenance</h2>
            </div>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-[#374957]">{task.title}</h3>
                      {task.priority === 'high' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                          High
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#374957]">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#374957]">Maintenance completed</p>
                  <p className="text-xs text-gray-600">Smoke Detector Check - Dec 10</p>
                </div>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#374957]">Document uploaded</p>
                  <p className="text-xs text-gray-600">HVAC Warranty.pdf</p>
                </div>
                <span className="text-xs text-gray-500">3 days ago</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#374957]">Project started</p>
                  <p className="text-xs text-gray-600">Kitchen Renovation</p>
                </div>
                <span className="text-xs text-gray-500">5 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

