import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

/**
 * A reusable progress bar component
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  className = ''
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm text-gray-600">{normalizedProgress}%</span>
        </div>
      )}
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${normalizedProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 