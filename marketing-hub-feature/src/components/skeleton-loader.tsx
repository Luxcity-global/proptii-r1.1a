import React from 'react';
import { cn } from './ui/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
);

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("rounded-lg border bg-card p-6", className)}>
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-2 w-full" />
    </div>
  </div>
);

// List skeleton
export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
    
    {/* Table */}
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
