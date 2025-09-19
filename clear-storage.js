// Clear all referencing-related data from localStorage and IndexedDB
console.log('🧹 Clearing all referencing-related data...');

// Clear localStorage
const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('referencing_')) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`🗑️ Removed from localStorage: ${key}`);
});

console.log(`✅ Cleared ${keysToRemove.length} localStorage items`);

// Clear IndexedDB
const clearIndexedDB = async () => {
  try {
    // Delete the entire database
    const deleteRequest = indexedDB.deleteDatabase('ReferencingDB');
    
    deleteRequest.onsuccess = () => {
      console.log('🗑️ Cleared IndexedDB database: ReferencingDB');
      console.log('🔄 Please refresh the page and test the new IndexedDB implementation');
    };
    
    deleteRequest.onerror = () => {
      console.log('⚠️ Could not clear IndexedDB (may not exist yet)');
      console.log('🔄 Please refresh the page and test the new IndexedDB implementation');
    };
  } catch (error) {
    console.log('⚠️ IndexedDB not available:', error);
    console.log('🔄 Please refresh the page and test the new IndexedDB implementation');
  }
};

clearIndexedDB();
