// Clear all referencing-related data from localStorage
console.log('🧹 Clearing all referencing-related data from localStorage...');

const keysToRemove = [];

// Get all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    // Remove any keys that start with 'referencing_' (including double-prefixed ones)
    if (key.startsWith('referencing_')) {
      keysToRemove.push(key);
    }
  }
}

// Remove the keys
keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`🗑️ Removed: ${key}`);
});

console.log(`✅ Cleared ${keysToRemove.length} referencing-related items from localStorage`);
console.log('🔄 Please refresh the page and try uploading files again');
