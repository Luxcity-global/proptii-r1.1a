import { useState, useCallback } from 'react';

export interface UseBulkSelectionOptions {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function useBulkSelection<T extends { id: string }>(
  items: T[],
  options?: UseBulkSelectionOptions
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id];
      
      options?.onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [options]);

  const selectAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    setSelectedIds(allIds);
    options?.onSelectionChange?.(allIds);
  }, [items, options]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    options?.onSelectionChange?.([]);
  }, [options]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const isAllSelected = selectedIds.length === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const selectedItems = items.filter(item => selectedIds.includes(item.id));

  return {
    selectedIds,
    selectedItems,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    selectionCount: selectedIds.length,
  };
}
