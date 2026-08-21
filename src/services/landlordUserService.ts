import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface LandlordUser {
  id: string;
  email: string;
  name: string;
  role: 'landlord' | 'agent';
  phone?: string;
  companyName?: string;
  companyProfile?: Record<string, unknown>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Service to manage and identify landlord/agent users
 */
class LandlordUserService {
  private readonly collectionName = 'landlordUsers';

  /**
   * Check if an email belongs to a landlord or agent
   */
  async isLandlordOrAgent(email: string): Promise<{ 
    isLandlord: boolean; 
    user?: LandlordUser;
    error?: string 
  }> {
    try {
      console.log('🔍 Checking if email is landlord/agent:', email);
      
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email.toLowerCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('ℹ️ Email not found in landlordUsers collection:', email);
        return { isLandlord: false };
      }
      
      const docData = querySnapshot.docs[0].data() as LandlordUser;
      const user: LandlordUser = {
        id: querySnapshot.docs[0].id,
        ...docData
      };
      
      console.log('✅ Found landlord/agent user:', user.name, '-', user.role);
      return { 
        isLandlord: true, 
        user 
      };
    } catch (error) {
      console.error('❌ Error checking landlord/agent status:', error);
      return { 
        isLandlord: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Register a new landlord or agent
   */
  async registerLandlordUser(userData: Omit<LandlordUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Registering landlord/agent user:', userData.email);
      
      // Check if user already exists
      const existingCheck = await this.isLandlordOrAgent(userData.email);
      if (existingCheck.isLandlord) {
        console.log('⚠️ User already registered:', userData.email);
        return {
          success: false,
          error: 'User already registered'
        };
      }
      
      // Create new document with auto-generated ID
      const userId = `landlord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.collectionName, userId);
      
      // Build landlord user object, omitting undefined fields
      const landlordUser: any = {
        id: userId,
        email: userData.email.toLowerCase(),
        name: userData.name,
        role: userData.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only add optional fields if they have values
      if (userData.phone) {
        landlordUser.phone = userData.phone;
      }
      if (userData.companyName) {
        landlordUser.companyName = userData.companyName;
      }
      if (userData.companyProfile) {
        landlordUser.companyProfile = userData.companyProfile;
      }
      
      await setDoc(docRef, landlordUser);
      
      console.log('✅ Landlord/agent user registered successfully:', userId);
      return {
        success: true,
        userId
      };
    } catch (error) {
      console.error('❌ Error registering landlord/agent user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get landlord user by email
   */
  async getLandlordUserByEmail(email: string): Promise<{
    success: boolean;
    user?: LandlordUser;
    error?: string;
  }> {
    try {
      const result = await this.isLandlordOrAgent(email);
      
      if (result.isLandlord && result.user) {
        return {
          success: true,
          user: result.user
        };
      } else {
        return {
          success: false,
          error: result.error || 'User not found'
        };
      }
    } catch (error) {
      console.error('❌ Error getting landlord user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all landlord/agent users
   */
  async getAllLandlordUsers(): Promise<{
    success: boolean;
    users?: LandlordUser[];
    error?: string;
  }> {
    try {
      console.log('🔄 Fetching all landlord/agent users...');
      
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const users: LandlordUser[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as LandlordUser;
        users.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log('✅ Fetched landlord/agent users:', users.length);
      return {
        success: true,
        users
      };
    } catch (error) {
      console.error('❌ Error fetching landlord users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateLandlordUser(
    email: string,
    updates: Partial<Pick<LandlordUser, 'name' | 'role' | 'phone' | 'companyName' | 'companyProfile'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.isLandlordOrAgent(email);
      if (!existing.isLandlord || !existing.user?.id) {
        return { success: false, error: 'User not found' };
      }

      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.companyName !== undefined) payload.companyName = updates.companyName;
      if (updates.companyProfile !== undefined) payload.companyProfile = updates.companyProfile;

      await updateDoc(doc(db, this.collectionName, existing.user.id), payload);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating landlord/agent user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async upsertLandlordUser(
    email: string,
    updates: Partial<Pick<LandlordUser, 'name' | 'role' | 'phone' | 'companyName' | 'companyProfile'>>
  ): Promise<{ success: boolean; error?: string; userId?: string }> {
    const existing = await this.isLandlordOrAgent(email);
    if (existing.isLandlord && existing.user?.id) {
      return this.updateLandlordUser(email, updates);
    }

    const name = updates.name?.trim();
    if (!name) {
      return { success: false, error: 'User not found' };
    }

    return this.registerLandlordUser({
      email,
      name,
      role: updates.role || 'landlord',
      phone: updates.phone,
      companyName: updates.companyName,
      companyProfile: updates.companyProfile,
    });
  }
}

export default new LandlordUserService();

