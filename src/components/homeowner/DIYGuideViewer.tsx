import React, { useState } from 'react';
import {
    X,
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    Wrench,
    Package,
    Shield,
    Lightbulb,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    Phone
} from 'lucide-react';
import { DIYGuide, getGuideById } from './data/diyGuides';

interface DIYGuideViewerProps {
    guideId: string;
    isOpen: boolean;
    onClose: () => void;
    onFindPro?: () => void;
}

export function DIYGuideViewer({
    guideId,
    isOpen,
    onClose,
    onFindPro
}: DIYGuideViewerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const guide = getGuideById(guideId);

    if (!isOpen || !guide) return null;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800 border-green-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'hard': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const currentStepData = guide.steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === guide.steps.length - 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#374957] to-[#2c3a47] text-white p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Wrench className="w-5 h-5" />
                                <span className="text-sm font-medium opacity-90 capitalize">DIY Guide</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{guide.title}</h2>
                            <p className="text-white/90 text-sm">{guide.description}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-4"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium opacity-80">Time</span>
                            </div>
                            <p className="text-sm font-bold">{guide.estimatedTime}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium opacity-80">Cost</span>
                            </div>
                            <p className="text-sm font-bold">£{guide.estimatedCost.min}-£{guide.estimatedCost.max}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Wrench className="w-4 h-4" />
                                <span className="text-xs font-medium opacity-80">Difficulty</span>
                            </div>
                            <p className="text-sm font-bold capitalize">{guide.difficulty}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Overview Tab */}
                    {currentStep === -1 && (
                        <div className="p-6 space-y-6">
                            {/* Safety Warnings */}
                            {guide.safetyWarnings.length > 0 && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-red-900 mb-3">Safety First!</h3>
                                            <ul className="space-y-2">
                                                {guide.safetyWarnings.map((warning, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        <span>{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* When to Call a Pro */}
                            {guide.whenToCallPro.length > 0 && (
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-orange-900 mb-3">When to Call a Professional</h3>
                                            <ul className="space-y-2">
                                                {guide.whenToCallPro.map((reason, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                                                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        <span>{reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {onFindPro && (
                                                <button
                                                    onClick={onFindPro}
                                                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    Find a Professional
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tools Needed */}
                            {guide.toolsNeeded.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-blue-900 mb-3">Tools Needed</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {guide.toolsNeeded.map((tool, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm text-blue-800">
                                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                        <span>{tool}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Materials Needed */}
                            {guide.materialsNeeded.length > 0 && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <Package className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold text-purple-900 mb-3">Materials Needed</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {guide.materialsNeeded.map((material, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm text-purple-800">
                                                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                                        <span>{material}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Video Tutorial */}
                            {guide.videoUrl && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="w-5 h-5 text-gray-600" />
                                            <div>
                                                <h3 className="text-base font-bold text-gray-900">Video Tutorial</h3>
                                                <p className="text-sm text-gray-600">Watch a step-by-step video guide</p>
                                            </div>
                                        </div>
                                        <a
                                            href={guide.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                        >
                                            Watch Video
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step Content */}
                    {currentStep >= 0 && currentStepData && (
                        <div className="p-6 space-y-6">
                            {/* Step Header */}
                            <div className="bg-gradient-to-r from-[#DC5F12] to-[#f97316] text-white rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-2xl font-bold">{currentStepData.stepNumber}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm opacity-90 mb-1">Step {currentStepData.stepNumber} of {guide.steps.length}</p>
                                        <h3 className="text-xl font-bold">{currentStepData.title}</h3>
                                    </div>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                    <div
                                        className="bg-white rounded-full h-2 transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Step Description */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="text-gray-800 leading-relaxed text-lg">{currentStepData.description}</p>
                            </div>

                            {/* Warning */}
                            {currentStepData.warning && (
                                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-900 mb-1">Warning</p>
                                            <p className="text-sm text-red-800">{currentStepData.warning}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tip */}
                            {currentStepData.tip && (
                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900 mb-1">Pro Tip</p>
                                            <p className="text-sm text-blue-800">{currentStepData.tip}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Completion Message */}
                            {isLastStep && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-bold text-green-900 mb-2">Great Job!</h3>
                                            <p className="text-sm text-green-800 mb-4">
                                                You've completed all the steps. If everything went well, your task is complete!
                                            </p>
                                            <p className="text-sm text-green-700">
                                                Remember to mark this task as completed in your maintenance schedule.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentStep(Math.max(-1, currentStep - 1))}
                            disabled={currentStep === -1}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${currentStep === -1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {currentStep === 0 ? 'Overview' : 'Previous'}
                        </button>

                        {/* Step Indicator */}
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                                {currentStep === -1 ? 'Overview' : `Step ${currentStep + 1} of ${guide.steps.length}`}
                            </p>
                            <div className="flex gap-1 mt-2">
                                <div className={`w-2 h-2 rounded-full ${currentStep === -1 ? 'bg-[#DC5F12]' : 'bg-gray-300'}`} />
                                {guide.steps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${currentStep === index ? 'bg-[#DC5F12]' : currentStep > index ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Next Button */}
                        {currentStep < guide.steps.length - 1 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-5 py-2.5 bg-[#DC5F12] text-white rounded-lg font-semibold hover:bg-[#c54f0f] transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {currentStep === -1 ? 'Start Guide' : 'Next Step'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
