/**
 * Utilities for working with localStorage to persist form data
 */

/**
 * Save data to localStorage with a prefix to avoid collisions
 * 
 * @param key - The key to store the data under
 * @param data - The data to store
 * @param prefix - Optional prefix for the key
 */
export const saveToLocalStorage = <T>(
  key: string, 
  data: T, 
  prefix: string = 'proptii_'
): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(`${prefix}${key}`, serializedData);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Load data from localStorage
 * 
 * @param key - The key to retrieve data from
 * @param prefix - Optional prefix for the key
 * @returns The stored data or null if not found
 */
export const loadFromLocalStorage = <T>(
  key: string, 
  prefix: string = 'proptii_'
): T | null => {
  try {
    const serializedData = localStorage.getItem(`${prefix}${key}`);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Remove data from localStorage
 * 
 * @param key - The key to remove
 * @param prefix - Optional prefix for the key
 */
export const removeFromLocalStorage = (
  key: string, 
  prefix: string = 'proptii_'
): void => {
  try {
    localStorage.removeItem(`${prefix}${key}`);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Save a draft of form data with timestamp
 * 
 * @param formId - Identifier for the form
 * @param data - The form data to save
 * @param name - Optional name for the draft
 */
export const saveDraft = <T>(
  formId: string, 
  data: T, 
  name: string = 'Untitled Draft'
): void => {
  try {
    // Get existing drafts
    const draftsKey = `drafts_${formId}`;
    const existingDrafts = loadFromLocalStorage<Array<{
      id: string;
      name: string;
      data: T;
      timestamp: number;
    }>>(draftsKey) || [];
    
    // Create new draft
    const newDraft = {
      id: Date.now().toString(),
      name,
      data,
      timestamp: Date.now()
    };
    
    // Add to drafts and save
    existingDrafts.push(newDraft);
    saveToLocalStorage(draftsKey, existingDrafts);
    
    return;
  } catch (error) {
    console.error('Error saving draft:', error);
  }
};

/**
 * Get all drafts for a form
 * 
 * @param formId - Identifier for the form
 * @returns Array of drafts or empty array if none found
 */
export const getDrafts = <T>(formId: string): Array<{
  id: string;
  name: string;
  data: T;
  timestamp: number;
}> => {
  const draftsKey = `drafts_${formId}`;
  return loadFromLocalStorage<Array<{
    id: string;
    name: string;
    data: T;
    timestamp: number;
  }>>(draftsKey) || [];
};

/**
 * Get a specific draft by ID
 * 
 * @param formId - Identifier for the form
 * @param draftId - ID of the draft to retrieve
 * @returns The draft or null if not found
 */
export const getDraft = <T>(
  formId: string, 
  draftId: string
): { id: string; name: string; data: T; timestamp: number; } | null => {
  const drafts = getDrafts<T>(formId);
  return drafts.find(draft => draft.id === draftId) || null;
};

/**
 * Delete a draft
 * 
 * @param formId - Identifier for the form
 * @param draftId - ID of the draft to delete
 * @returns true if successful, false otherwise
 */
export const deleteDraft = (
  formId: string, 
  draftId: string
): boolean => {
  try {
    const draftsKey = `drafts_${formId}`;
    const drafts = loadFromLocalStorage<Array<{
      id: string;
      name: string;
      data: any;
      timestamp: number;
    }>>(draftsKey) || [];
    
    const filteredDrafts = drafts.filter(draft => draft.id !== draftId);
    
    if (filteredDrafts.length === drafts.length) {
      // No draft was removed
      return false;
    }
    
    saveToLocalStorage(draftsKey, filteredDrafts);
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}; 