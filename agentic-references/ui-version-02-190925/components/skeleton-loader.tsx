import { Skeleton } from "./ui/skeleton";

export function KPICardSkeleton() {
  return (
    <div className="bg-card border border-border shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="hover:bg-lux-cream-50">
      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
      <td className="p-4"><Skeleton className="h-4 w-40" /></td>
      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
      <td className="p-4"><Skeleton className="h-4 w-12" /></td>
      <td className="p-4"><Skeleton className="h-4 w-8" /></td>
      <td className="p-4"><Skeleton className="h-4 w-12" /></td>
      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
      <td className="p-4"><Skeleton className="h-4 w-4" /></td>
    </tr>
  );
}