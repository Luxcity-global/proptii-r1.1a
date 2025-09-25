import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
  id?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
  id
}) => {
  return (
    <div
      id={id}
      role="alert"
      className={`text-red-500 text-sm ${className}`}
    >
      {message}
    </div>
  );
}; 