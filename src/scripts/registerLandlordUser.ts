/**
 * Script to register landlord/agent users in Firestore
 * This script should be run to add landlord/agent accounts that can receive signed contracts
 * 
 * Usage in browser console:
 * 1. Navigate to your app
 * 2. Open browser console
 * 3. Copy and paste this script
 * 4. Call registerLandlordUser() with user details
 */

import landlordUserService from '../services/landlordUserService';

/**
 * Register a new landlord or agent user
 */
export async function registerLandlordUser(userData: {
  email: string;
  name: string;
  role: 'landlord' | 'agent';
  phone?: string;
  companyName?: string;
}) {
  try {
    console.log('🔄 Registering landlord/agent user...');
    console.log('📋 User data:', userData);
    
    const result = await landlordUserService.registerLandlordUser(userData);
    
    if (result.success) {
      console.log('✅ Successfully registered landlord/agent user:', result.userId);
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🏷️ Role:', userData.role);
      return {
        success: true,
        userId: result.userId,
        message: `Successfully registered ${userData.role}: ${userData.name} (${userData.email})`
      };
    } else {
      console.error('❌ Failed to register user:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('❌ Error registering user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if an email is registered as landlord/agent
 */
export async function checkLandlordUser(email: string) {
  try {
    console.log('🔍 Checking if email is registered as landlord/agent:', email);
    
    const result = await landlordUserService.isLandlordOrAgent(email);
    
    if (result.isLandlord && result.user) {
      console.log('✅ User is registered as landlord/agent:');
      console.log('   Name:', result.user.name);
      console.log('   Email:', result.user.email);
      console.log('   Role:', result.user.role);
      console.log('   ID:', result.user.id);
      return {
        isLandlord: true,
        user: result.user
      };
    } else {
      console.log('ℹ️ Email is not registered as landlord/agent');
      return {
        isLandlord: false
      };
    }
  } catch (error) {
    console.error('❌ Error checking user:', error);
    return {
      isLandlord: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all registered landlord/agent users
 */
export async function listAllLandlordUsers() {
  try {
    console.log('🔄 Fetching all landlord/agent users...');
    
    const result = await landlordUserService.getAllLandlordUsers();
    
    if (result.success && result.users) {
      console.log(`✅ Found ${result.users.length} landlord/agent user(s):`);
      result.users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
      });
      return {
        success: true,
        users: result.users
      };
    } else {
      console.log('⚠️ No landlord/agent users found');
      return {
        success: true,
        users: []
      };
    }
  } catch (error) {
    console.error('❌ Error listing users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Example usage (for browser console):
// 
// To register a new landlord:
// registerLandlordUser({
//   email: 'john.smith@proptii.com',
//   name: 'John Smith',
//   role: 'landlord',
//   phone: '+44 7911 123456',
//   companyName: 'Proptii Properties Ltd'
// });
//
// To check if an email is registered:
// checkLandlordUser('john.smith@proptii.com');
//
// To list all landlord/agent users:
// listAllLandlordUsers();

// If you want to use this directly in the browser console, expose these functions globally
if (typeof window !== 'undefined') {
  (window as any).registerLandlordUser = registerLandlordUser;
  (window as any).checkLandlordUser = checkLandlordUser;
  (window as any).listAllLandlordUsers = listAllLandlordUsers;
  
  console.log('✅ Landlord user management functions loaded!');
  console.log('📋 Available functions:');
  console.log('   - registerLandlordUser({ email, name, role, phone?, companyName? })');
  console.log('   - checkLandlordUser(email)');
  console.log('   - listAllLandlordUsers()');
}

