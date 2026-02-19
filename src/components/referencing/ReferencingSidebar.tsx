import React from 'react';
import { User, Briefcase, Home, DollarSign, Users, Check } from 'lucide-react';
import { FormSection } from '../../types/referencing';

interface ReferencingSidebarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

/**
 * Sidebar component for the referencing modal
 */
const ReferencingSidebar: React.FC<ReferencingSidebarProps> = ({
  currentStep,
  totalSteps,
  onStepClick,
  completedSteps
}) => {
  // Step configuration
  const steps = [
    { id: 1, name: 'Identity', icon: User, section: 'identity' as FormSection },
    { id: 2, name: 'Employment', icon: Briefcase, section: 'employment' as FormSection },
    { id: 3, name: 'Residential', icon: Home, section: 'residential' as FormSection },
    { id: 4, name: 'Financial', icon: DollarSign, section: 'financial' as FormSection },
    { id: 5, name: 'Guarantor', icon: Users, section: 'guarantor' as FormSection },
    { id: 6, name: 'Credit Check', icon: Check, section: 'creditCheck' as FormSection }
  ];
  
  return (
    <div className="w-64 bg-gray-50 py-6 px-4 border-r border-gray-200 h-full flex flex-col">
      <div className="mb-6 px-2">
        <p className="text-sm text-gray-600 mb-4">
          The referencing process verifies renter or buyer identity, financial status, and rental history.
        </p>
      </div>
      
      {/* Step navigation */}
      <ul className="space-y-1 flex-1">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = step.id <= Math.max(...completedSteps, currentStep);
          
          return (
            <li
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : isCompleted
                  ? 'text-green-700 hover:bg-green-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <step.icon
                  size={18}
                  className={
                    isActive
                      ? 'text-blue-700'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }
                />
                {isCompleted && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <span>{step.name}</span>
            </li>
          );
        })}
      </ul>
      
      {/* Progress bar */}
      <div className="mt-auto pt-6 px-2">
        <div className="text-sm text-gray-600 mb-2">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ReferencingSidebar; 