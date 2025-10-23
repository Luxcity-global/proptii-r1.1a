import React from 'react';
import { Check, MoreHorizontal } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep: number;
  totalSteps: number;
}

export function ProgressTracker({ steps, currentStep, totalSteps }: ProgressTrackerProps) {
  return (
    <div className="flex flex-col w-full">
      {/* Step Counter - Above the box */}
      <div className="mb-2 flex justify-start">
        <div className="text-sm">
          <span className="text-blue-600 font-semibold">{currentStep}</span>
          <span className="text-gray-500"> / {totalSteps}</span>
        </div>
      </div>

      {/* Progress Box */}
      <div className="bg-white border border-gray-200 px-8 py-3 w-full" style={{ borderRadius: '50px' }}>
        {/* Horizontal Progress Steps */}
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center" style={{ marginRight: index < steps.length - 1 ? '120px' : '0' }}>
              {/* Step Icon and Title */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  step.completed 
                    ? 'bg-orange-600' 
                    : step.active 
                      ? 'bg-white border-2' 
                      : 'bg-white border-2 border-gray-300'
                }`} style={step.completed ? { backgroundColor: '#DC5F12' } : step.active ? { borderColor: '#DC5F12' } : {}}>
                  {step.completed ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : step.active ? (
                    <MoreHorizontal className="w-4 h-4" style={{ color: '#DC5F12' }} />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                
              {/* Step Title */}
              <p className={`text-xs font-medium max-w-16 ${
                step.active 
                  ? 'text-blue-900' 
                  : step.completed 
                    ? 'text-gray-700' 
                    : 'text-gray-500'
              }`} style={step.completed ? { color: '#DC5F12' } : step.active ? { color: '#DC5F12' } : {}}>
                {step.title}
              </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

