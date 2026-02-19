/**
 * Quick setup script for registering landlord/agent users
 * This can be imported and called during development/testing
 */

import landlordUserService from '../services/landlordUserService';

/**
 * Sample landlord users for testing
 */
export const sampleLandlordUsers = [
  {
    email: 'john.smith@proptii.com',
    name: 'John Smith',
    role: 'landlord' as const,
    phone: '+44 7911 123456',
    companyName: 'Smith Properties Ltd'
  },
  {
    email: 'jane.doe@proptii.com',
    name: 'Jane Doe',
    role: 'agent' as const,
    phone: '+44 7922 234567',
    companyName: 'Proptii Real Estate'
  },
  {
    email: 'michael.chen@proptii.com',
    name: 'Michael Chen',
    role: 'landlord' as const,
    phone: '+44 7933 345678',
    companyName: 'Chen Property Management'
  },
  {
    email: 'sarah.wilson@proptii.com',
    name: 'Sarah Wilson',
    role: 'agent' as const,
    phone: '+44 7944 456789',
    companyName: 'Wilson & Associates'
  }
];

/**
 * Setup all sample landlord users
 */
export async function setupAllLandlordUsers() {
  console.log('🔄 Setting up sample landlord/agent users...');
  
  const results = [];
  
  for (const userData of sampleLandlordUsers) {
    try {
      // Check if user already exists
      const existingCheck = await landlordUserService.isLandlordOrAgent(userData.email);
      
      if (existingCheck.isLandlord) {
        console.log(`ℹ️ User already registered: ${userData.email}`);
        results.push({
          email: userData.email,
          status: 'already_registered',
          name: userData.name
        });
        continue;
      }
      
      // Register new user
      const result = await landlordUserService.registerLandlordUser(userData);
      
      if (result.success) {
        console.log(`✅ Registered: ${userData.name} (${userData.email})`);
        results.push({
          email: userData.email,
          status: 'registered',
          name: userData.name,
          userId: result.userId
        });
      } else {
        console.error(`❌ Failed to register ${userData.email}:`, result.error);
        results.push({
          email: userData.email,
          status: 'failed',
          name: userData.name,
          error: result.error
        });
      }
    } catch (error) {
      console.error(`❌ Error registering ${userData.email}:`, error);
      results.push({
        email: userData.email,
        status: 'error',
        name: userData.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Summary
  const registered = results.filter(r => r.status === 'registered').length;
  const alreadyRegistered = results.filter(r => r.status === 'already_registered').length;
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  
  console.log('\n📊 Setup Summary:');
  console.log(`   ✅ Newly registered: ${registered}`);
  console.log(`   ℹ️ Already registered: ${alreadyRegistered}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📧 Total landlord/agent emails: ${sampleLandlordUsers.length}`);
  
  return {
    results,
    summary: {
      registered,
      alreadyRegistered,
      failed,
      total: sampleLandlordUsers.length
    }
  };
}

/**
 * Verify all sample users are registered
 */
export async function verifyLandlordUsers() {
  console.log('🔍 Verifying landlord/agent user setup...');
  
  const verifications = [];
  
  for (const userData of sampleLandlordUsers) {
    const result = await landlordUserService.isLandlordOrAgent(userData.email);
    
    if (result.isLandlord && result.user) {
      console.log(`✅ ${userData.email} - Registered as ${result.user.role}`);
      verifications.push({
        email: userData.email,
        registered: true,
        user: result.user
      });
    } else {
      console.log(`❌ ${userData.email} - Not registered`);
      verifications.push({
        email: userData.email,
        registered: false
      });
    }
  }
  
  const registeredCount = verifications.filter(v => v.registered).length;
  const notRegisteredCount = verifications.filter(v => !v.registered).length;
  
  console.log('\n📊 Verification Summary:');
  console.log(`   ✅ Registered: ${registeredCount}/${sampleLandlordUsers.length}`);
  console.log(`   ❌ Not registered: ${notRegisteredCount}`);
  
  return {
    verifications,
    allRegistered: notRegisteredCount === 0,
    registeredCount,
    notRegisteredCount
  };
}

/**
 * List all registered landlord/agent users with detailed info
 */
export async function listRegisteredLandlords() {
  console.log('📋 Listing all registered landlord/agent users...\n');
  
  const result = await landlordUserService.getAllLandlordUsers();
  
  if (result.success && result.users && result.users.length > 0) {
    console.log(`Found ${result.users.length} registered user(s):\n`);
    
    result.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏷️ Role: ${user.role}`);
      if (user.phone) console.log(`   📞 Phone: ${user.phone}`);
      if (user.companyName) console.log(`   🏢 Company: ${user.companyName}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log('');
    });
    
    return {
      success: true,
      users: result.users,
      count: result.users.length
    };
  } else {
    console.log('⚠️ No landlord/agent users found in database');
    return {
      success: true,
      users: [],
      count: 0
    };
  }
}

// Export for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).setupAllLandlordUsers = setupAllLandlordUsers;
  (window as any).verifyLandlordUsers = verifyLandlordUsers;
  (window as any).listRegisteredLandlords = listRegisteredLandlords;
  
  console.log('✅ Landlord setup utilities loaded!');
  console.log('📋 Available functions:');
  console.log('   - setupAllLandlordUsers() - Register all sample users');
  console.log('   - verifyLandlordUsers() - Check which users are registered');
  console.log('   - listRegisteredLandlords() - List all registered users');
}




