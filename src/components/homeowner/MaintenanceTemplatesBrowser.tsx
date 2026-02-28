import React, { useState } from 'react';
import {
    X,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Clock,
    Tag,
    Plus,
    ChevronRight,
    Wrench,
    Zap,
    Droplet,
    Home,
    Box,
    Leaf,
    AlertCircle
} from 'lucide-react';
import { MaintenanceTemplate, maintenanceTemplates, getTemplatesByCategory, getTemplatesBySeason } from './data/maintenanceTemplates';
import { MaintenanceTask } from './MaintenanceManagement';

interface MaintenanceTemplatesBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: MaintenanceTemplate) => void;
}

export function MaintenanceTemplatesBrowser({
    isOpen,
    onClose,
    onSelectTemplate
}: MaintenanceTemplatesBrowserProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [seasonFilter, setSeasonFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<MaintenanceTemplate | null>(null);

    if (!isOpen) return null;

    const filteredTemplates = maintenanceTemplates.filter(template => {
        const matchesSearch =
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
        const matchesSeason = seasonFilter === 'all' || template.season === seasonFilter;
        const matchesDifficulty = difficultyFilter === 'all' || template.diyDifficulty === difficultyFilter;

        return matchesSearch && matchesCategory && matchesSeason && matchesDifficulty;
    });

    const getCategoryIcon = (category: MaintenanceTask['category']) => {
        const iconClass = "w-5 h-5";
        switch (category) {
            case 'hvac': return <Zap className={iconClass} />;
            case 'plumbing': return <Droplet className={iconClass} />;
            case 'electrical': return <Zap className={iconClass} />;
            case 'appliance': return <Box className={iconClass} />;
            case 'exterior': return <Home className={iconClass} />;
            case 'interior': return <Home className={iconClass} />;
            default: return <Wrench className={iconClass} />;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'professional': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getFrequencyLabel = (frequency: string) => {
        const labels: Record<string, string> = {
            monthly: 'Monthly',
            quarterly: 'Every 3 Months',
            biannual: 'Twice Yearly',
            yearly: 'Annually',
            once: 'One-time'
        };
        return labels[frequency] || frequency;
    };

    const handleAddToSchedule = (template: MaintenanceTemplate) => {
        onSelectTemplate(template);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#374957] to-[#2c3a47] text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Maintenance Templates</h2>
                        <p className="text-gray-200 text-sm">Choose from {maintenanceTemplates.length} pre-built maintenance tasks</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
                        >
                            <option value="all">All Categories</option>
                            <option value="hvac">HVAC</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="appliance">Appliance</option>
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                            <option value="other">Other</option>
                        </select>
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy (DIY)</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="professional">Professional Only</option>
                        </select>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Wrench className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No templates found</p>
                            <p className="text-sm text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#DC5F12] hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    {/* Category Icon & Title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#FFE5D9] transition-colors">
                                            {getCategoryIcon(template.category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#374957] group-hover:text-[#DC5F12] transition-colors line-clamp-2">
                                                {template.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {template.description}
                                    </p>

                                    {/* Metadata */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{getFrequencyLabel(template.frequency)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            <span>£{template.estimatedCost.min}-£{template.estimatedCost.max}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{template.timeEstimate}</span>
                                        </div>
                                    </div>

                                    {/* Difficulty Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getDifficultyColor(template.diyDifficulty)}`}>
                                            {template.diyDifficulty === 'professional' ? 'Pro Only' : template.diyDifficulty.charAt(0).toUpperCase() + template.diyDifficulty.slice(1)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#DC5F12] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {filteredTemplates.length} of {maintenanceTemplates.length} templates
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Detail Header */}
                        <div className="bg-gradient-to-r from-[#DC5F12] to-[#f97316] text-white p-6 flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {getCategoryIcon(selectedTemplate.category)}
                                    <span className="text-sm font-medium opacity-90 capitalize">{selectedTemplate.category}</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{selectedTemplate.title}</h3>
                                <p className="text-white/90 text-sm">{selectedTemplate.description}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-4"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Key Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase">Frequency</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#374957]">{getFrequencyLabel(selectedTemplate.frequency)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase">Est. Cost</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#374957]">
                                        £{selectedTemplate.estimatedCost.min}-£{selectedTemplate.estimatedCost.max}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase">Time Needed</span>
                                    </div>
                                    <p className="text-lg font-bold text-[#374957]">{selectedTemplate.timeEstimate}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Wrench className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase">Difficulty</span>
                                    </div>
                                    <span className={`inline-block px-3 py-1 text-sm font-bold rounded-md border ${getDifficultyColor(selectedTemplate.diyDifficulty)}`}>
                                        {selectedTemplate.diyDifficulty === 'professional' ? 'Professional' : selectedTemplate.diyDifficulty.charAt(0).toUpperCase() + selectedTemplate.diyDifficulty.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Season */}
                            {selectedTemplate.season && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <Leaf className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900">Best Time</p>
                                            <p className="text-sm text-blue-700 capitalize">{selectedTemplate.season}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedTemplate.tags.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTemplate.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DIY Guide Link */}
                            {selectedTemplate.diyGuideId && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-green-900 mb-1">DIY Guide Available</p>
                                            <p className="text-sm text-green-700">Step-by-step instructions are available for this task</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detail Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => handleAddToSchedule(selectedTemplate)}
                                className="px-6 py-2.5 bg-[#DC5F12] text-white rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Add to Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
