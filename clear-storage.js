// Script to clear localStorage for referencing form data
console.log('🧹 Clearing referencing form data from localStorage...');

// Get all localStorage keys
const keys = Object.keys(localStorage);

// Find referencing-related keys (new format with prefix)
const referencingKeys = keys.filter(key => key.startsWith('referencing_'));

console.log('📋 Found referencing keys:', referencingKeys);

if (referencingKeys.length === 0) {
  console.log('✅ No referencing data found in localStorage');
} else {
  // Clear each referencing key
  referencingKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
  });
  
  console.log(`✅ Cleared ${referencingKeys.length} referencing data items`);
}

console.log('🎉 localStorage cleanup complete!');
console.log('💡 Refresh the page to start with a clean form');
