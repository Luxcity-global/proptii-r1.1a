import React from 'react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { 
  Archive, 
  Download, 
  Trash2, 
  ChevronDown 
} from 'lucide-react';

export interface BulkActionsBarProps {
  selectedCount: number;
  selectedLabel: string; // e.g., "tenant", "landlord", "document", "property"
  onClearSelection: () => void;
  onArchive?: () => void;
  onExport?: (format: 'json' | 'csv' | 'excel' | 'pdf') => void;
  onDelete?: () => void;
  showArchive?: boolean;
  showExport?: boolean;
  showDelete?: boolean;
  exportFormats?: ('json' | 'csv' | 'excel' | 'pdf')[];
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  selectedLabel,
  onClearSelection,
  onArchive,
  onExport,
  onDelete,
  showArchive = true,
  showExport = true,
  showDelete = true,
  exportFormats = ['json', 'csv', 'excel', 'pdf'],
  className = ""
}: BulkActionsBarProps) {
  
  if (selectedCount === 0) return null;

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'json':
        return 'Export as JSON';
      case 'csv':
        return 'Export as CSV';
      case 'excel':
        return 'Export as Excel';
      case 'pdf':
        return 'Export as PDF';
      default:
        return `Export as ${format.toUpperCase()}`;
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedLabel}{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {showArchive && onArchive && (
            <Button variant="outline" size="sm" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          )}
          
          {showExport && onExport && exportFormats.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {exportFormats.map((format) => (
                  <DropdownMenuItem 
                    key={format}
                    onClick={() => onExport(format)}
                  >
                    {getFormatLabel(format)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {showDelete && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkActionsBar;
