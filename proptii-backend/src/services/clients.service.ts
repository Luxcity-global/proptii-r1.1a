import { Injectable, Logger } from '@nestjs/common';
import { getFirestore } from '../config/firestore.config';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  async getLandlords() {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      // Fetch users who are landlords
      const usersSnapshot = await db.collection('users').get();
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const landlords = allUsers.filter(u => u.role === 'landlord' || u.userType === 'landlord');

      // Fetch all properties to count how many properties each landlord has
      const propertiesSnapshot = await db.collection('native_properties').get();
      const allNativeProperties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const propertiesLegacySnapshot = await db.collection('properties').get();
      const allLegacyProperties = propertiesLegacySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const allProperties = [...allNativeProperties, ...allLegacyProperties];

      // Format the landlord data
      const formattedLandlords = landlords.map(landlord => {
        // Count properties owned by this landlord
        const landlordProperties = allProperties.filter(p => p.userId === landlord.id);
        const propertyCount = landlordProperties.length;
        
        // Count total tenants for this landlord
        const tenantsCount = allUsers.filter(u => 
            (u.role === 'tenant' || u.userType === 'tenant') && 
            (u.landlordId === landlord.id || landlordProperties.some(p => p.id === u.propertyId || p.tenantId === u.id))
        ).length;

        // Calculate total portfolio value (stubbed for now or derived from property prices if available)
        let totalValue = 0;
        landlordProperties.forEach(p => {
            const price = parseFloat(p.price || p.rentAmount || '0');
            if (!isNaN(price)) totalValue += price;
        });

        // Derive name and initials
        const name = landlord.name || landlord.displayName || landlord.firstName || 'Unknown Landlord';
        const parts = name.trim().split(/\\s+/);
        const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();

        return {
          id: landlord.id,
          name,
          email: landlord.email,
          phone: landlord.phone || landlord.phoneNumber || 'N/A',
          initials,
          propertyCount,
          activeTenants: tenantsCount,
          totalValue: totalValue > 0 ? `£${totalValue.toLocaleString()}` : '£0',
          status: 'Active',
          lastActive: landlord.lastLoginAt ? new Date(landlord.lastLoginAt.seconds * 1000).toLocaleDateString() : 'Recently',
          joinDate: landlord.createdAt ? new Date(landlord.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        };
      });

      return {
        success: true,
        data: formattedLandlords
      };

    } catch (error) {
      this.logger.error(`Failed to fetch landlords: ${error.message}`);
      throw error;
    }
  }

  async getTenantDetails(tenantId: string) {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    try {
      // Fetch the tenant from users collection
      const userDoc = await db.collection('users').doc(tenantId).get();
      if (!userDoc.exists) {
        throw new Error('Tenant not found');
      }
      
      const tenantData = userDoc.data() as any;
      
      // Fetch documents specifically for this tenant
      const documentsSnapshot = await db.collection('documents')
        .where('userId', '==', tenantId)
        .get();
        
      const documents = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));

      // Fetch the property if propertyId is available
      let propertyAddress = 'Not Assigned';
      let rentAmount = 0;
      let leaseStart = null;
      let leaseEnd = null;
      let depositAmount = 0;

      if (tenantData.propertyId) {
        const nativeProp = await db.collection('native_properties').doc(tenantData.propertyId).get();
        if (nativeProp.exists) {
          const p = nativeProp.data() as any;
          propertyAddress = p.address || propertyAddress;
          rentAmount = parseFloat(p.price || p.rentAmount || '0');
          depositAmount = rentAmount * 1.5; // Stubbed typical UK deposit
          // Try to get lease dates if available in the property or tenant data
          leaseStart = tenantData.leaseStart || p.leaseStart || new Date().toISOString();
          
          // Calculate lease end as 1 year from start if missing
          if (tenantData.leaseEnd) {
             leaseEnd = tenantData.leaseEnd;
          } else {
             const d = new Date(leaseStart);
             d.setFullYear(d.getFullYear() + 1);
             leaseEnd = d.toISOString();
          }
        }
      }

      // Format response
      return {
        success: true,
        data: {
          id: userDoc.id,
          name: tenantData.name || tenantData.displayName || tenantData.firstName || 'Unknown',
          email: tenantData.email,
          phone: tenantData.phone || tenantData.phoneNumber || 'N/A',
          avatar: tenantData.photoURL || null,
          status: tenantData.status || 'active',
          propertyAddress,
          rentAmount,
          depositAmount,
          leaseStart,
          leaseEnd,
          emergencyContact: tenantData.emergencyContact || {
            name: 'Not Provided',
            relationship: 'N/A',
            phone: 'N/A',
            email: 'N/A'
          },
          documents: documents.length > 0 ? documents : [
            {
              id: 'stub-doc-1',
              name: 'Tenancy Agreement',
              type: 'contract',
              url: '#', // In real life this would be the Azure Storage blob URL
              uploadDate: leaseStart || new Date().toISOString(),
              status: 'verified'
            }
          ],
          notes: tenantData.notes || ''
        }
      };

    } catch (error) {
      this.logger.error(`Failed to fetch tenant details: ${error.message}`);
      throw error;
    }
  }
}
