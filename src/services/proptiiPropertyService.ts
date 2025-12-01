import { collection, getDocs, query, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Property } from '../hooks/useSearchBackend';
import landlordUserService from './landlordUserService';

interface FirestoreProperty {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms?: number;
  squareFootage?: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation';
  amenities: string[];
  notes: string;
  photos: Array<{
    id: string;
    url: string;
    filename: string;
    room?: string;
    isCover: boolean;
  }>;
  documents: any[];
  createdAt: Timestamp | Date;
  userId?: string;
  ownerEmail?: string; // Email of the property owner (if stored)
}

/**
 * Parse address into components (street, city, postcode)
 */
function parseAddress(address: string): { street: string; city: string; postcode: string } {
  // Try to extract postcode (UK format: letters, numbers, space, letters)
  const postcodeMatch = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
  const postcode = postcodeMatch ? postcodeMatch[1].trim() : '';
  
  // Remove postcode from address to get street and city
  let addressWithoutPostcode = address.replace(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i, '').trim();
  
  // Try to split by comma - usually format is "Street, City, Postcode"
  const parts = addressWithoutPostcode.split(',').map(p => p.trim()).filter(Boolean);
  
  let street = address;
  let city = '';
  
  if (parts.length >= 2) {
    street = parts[0];
    city = parts.slice(1).join(', ');
  } else if (parts.length === 1) {
    street = parts[0];
    city = parts[0]; // Use same as street if no city specified
  }
  
  return { street, city, postcode };
}

/**
 * Transform Firestore property to search Property format
 */
async function transformProperty(firestoreProperty: FirestoreProperty): Promise<Property> {
  // Validate required fields with better error messages and defaults
  if (!firestoreProperty.address) {
    console.warn(`⚠️ [ProptiiProperty] Property ${firestoreProperty.id} missing address, skipping`);
    throw new Error('Property missing required field: address');
  }
  if (!firestoreProperty.type) {
    console.warn(`⚠️ [ProptiiProperty] Property ${firestoreProperty.id} (${firestoreProperty.address}) missing type, using default 'property'`);
    firestoreProperty.type = 'property'; // Provide default instead of throwing
  }
  if (typeof firestoreProperty.rent !== 'number' || firestoreProperty.rent <= 0) {
    console.warn(`⚠️ [ProptiiProperty] Property ${firestoreProperty.id} (${firestoreProperty.address}) has invalid rent: ${firestoreProperty.rent}, skipping`);
    throw new Error(`Property missing or invalid rent field: ${firestoreProperty.rent}`);
  }
  if (typeof firestoreProperty.bedrooms !== 'number' || firestoreProperty.bedrooms < 0) {
    console.warn(`⚠️ [ProptiiProperty] Property ${firestoreProperty.id} (${firestoreProperty.address}) has invalid bedrooms: ${firestoreProperty.bedrooms}, using default 0`);
    firestoreProperty.bedrooms = 0; // Provide default instead of throwing
  }

  const coverPhoto = firestoreProperty.photos?.find(p => p.isCover) || firestoreProperty.photos?.[0];
  const imageUrls = firestoreProperty.photos?.map(p => p.url).filter(Boolean) || [];
  
  // If no photos, use a placeholder
  if (imageUrls.length === 0) {
    imageUrls.push('/images/property-placeholder.jpg');
  }

  // Format price
  const price = `£${firestoreProperty.rent.toLocaleString()} pcm`;

  // Create title from address and type
  const title = `${firestoreProperty.type} in ${firestoreProperty.address}`;

  // Parse address
  const addressParts = parseAddress(firestoreProperty.address);

  // Create description from notes (amenities will be shown separately)
  const description = firestoreProperty.notes || 'Beautiful property available for rent.';

  // Fetch landlord/agent user information
  // Priority order:
  // 1. ownerEmail field in property document (if set) - HIGHEST PRIORITY
  // 2. userId as email (if userId contains @)
  // 3. userId lookup in landlordUsers collection by document ID
  // 4. localStorage auth state (if userId matches)
  // 5. Direct Firestore document lookup by userId
  let agentInfo = {
    id: '',
    name: 'Proptii Property',
    email: 'info@proptii.com', // Default fallback
    phone: '',
    company: 'Proptii',
  };

  // PRIORITY 1: Check if property document has ownerEmail stored directly (HIGHEST PRIORITY)
  if (firestoreProperty.ownerEmail) {
    console.log('✅ [ProptiiProperty] PRIORITY 1: Found ownerEmail in property document:', firestoreProperty.ownerEmail);
    agentInfo.email = firestoreProperty.ownerEmail.toLowerCase().trim();
    agentInfo.name = 'Property Owner'; // Set default name
    
    // Try to get full details from landlordUsers collection
    try {
      const lookupResult = await landlordUserService.getLandlordUserByEmail(firestoreProperty.ownerEmail);
      if (lookupResult.success && lookupResult.user) {
        agentInfo = {
          id: lookupResult.user.id,
          name: lookupResult.user.name || 'Property Owner',
          email: lookupResult.user.email || firestoreProperty.ownerEmail.toLowerCase().trim(),
          phone: lookupResult.user.phone || '',
          company: lookupResult.user.companyName || lookupResult.user.name || 'Proptii',
        };
        console.log('✅ [ProptiiProperty] Enriched agent info from landlordUsers:', {
          email: agentInfo.email,
          name: agentInfo.name,
          company: agentInfo.company
        });
      } else {
        // Even if not in landlordUsers, use the ownerEmail we found
        agentInfo.name = 'Property Owner';
        agentInfo.email = firestoreProperty.ownerEmail.toLowerCase().trim();
        console.log('✅ [ProptiiProperty] Using ownerEmail from property (not in landlordUsers):', agentInfo.email);
      }
    } catch (lookupError) {
      console.warn('⚠️ [ProptiiProperty] Error looking up ownerEmail in landlordUsers, using ownerEmail directly:', lookupError);
      agentInfo.name = 'Property Owner';
      agentInfo.email = firestoreProperty.ownerEmail.toLowerCase().trim();
    }
  }
  
  // PRIORITY 2: If no ownerEmail, try to find email from userId
  if (firestoreProperty.userId && agentInfo.email === 'info@proptii.com') {
    const userId = firestoreProperty.userId;
    console.log('🔍 [ProptiiProperty] PRIORITY 2: Looking up landlord/agent for userId:', userId);
    // PRIORITY 2a: If userId is an email address, use it directly as the email
    // This handles the case where properties are created with email as userId fallback
    if (userId.includes('@')) {
      console.log('📧 [ProptiiProperty] userId appears to be an email, using it directly:', userId);
      agentInfo.email = userId.toLowerCase().trim();
      agentInfo.id = userId; // Use email as ID if no document ID found
      agentInfo.name = 'Property Owner';
      
      // Try to enrich with landlordUsers data
      try {
        const lookupResult = await landlordUserService.getLandlordUserByEmail(userId.toLowerCase().trim());
        if (lookupResult.success && lookupResult.user) {
          agentInfo = {
            id: lookupResult.user.id,
            name: lookupResult.user.name || 'Property Owner',
            email: lookupResult.user.email || userId.toLowerCase().trim(),
            phone: lookupResult.user.phone || '',
            company: lookupResult.user.companyName || lookupResult.user.name || 'Proptii',
          };
          console.log('✅ [ProptiiProperty] Enriched agent info from landlordUsers (userId as email):', agentInfo.email);
        }
      } catch (emailLookupError) {
        console.log('ℹ️ [ProptiiProperty] Could not enrich email from landlordUsers, using userId email directly');
      }
    }
    // PRIORITY 3: Try to get email from localStorage auth state (if userId is Firebase Auth UID)
    else if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('proptii_auth_state');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Check if the stored user ID matches our userId
          const storedUserId = parsed?.user?.id || parsed?.user?.localAccountId || parsed?.user?.homeAccountId;
          if (storedUserId === userId && parsed?.user?.email) {
            console.log('✅ [ProptiiProperty] Found email from localStorage auth state:', parsed.user.email);
            agentInfo.email = parsed.user.email.toLowerCase().trim();
            agentInfo.name = parsed.user.name || 'Property Owner';
            // Try to enrich with landlordUsers data
            const lookupResult = await landlordUserService.getLandlordUserByEmail(agentInfo.email);
            if (lookupResult.success && lookupResult.user) {
              agentInfo = {
                id: lookupResult.user.id,
                name: lookupResult.user.name || agentInfo.name,
                email: lookupResult.user.email || agentInfo.email,
                phone: lookupResult.user.phone || '',
                company: lookupResult.user.companyName || lookupResult.user.name || 'Proptii',
              };
            }
          }
        }
      } catch (localStorageError) {
        console.log('ℹ️ [ProptiiProperty] Could not get email from localStorage:', localStorageError);
      }
    }
    
    try {
      // Strategy 1: Query all landlordUsers to get full user details (name, phone, company)
      console.log('🔍 [ProptiiProperty] Strategy 1: Querying all landlordUsers for additional details...');
      const allUsersResult = await landlordUserService.getAllLandlordUsers();
      
      if (allUsersResult.success && allUsersResult.users && allUsersResult.users.length > 0) {
        console.log(`📋 [ProptiiProperty] Found ${allUsersResult.users.length} landlordUsers in collection`);
        
        // Try multiple matching strategies to find the user
        let matchedUser = null;
        
        // Match by document ID (exact)
        matchedUser = allUsersResult.users.find(u => u.id === userId);
        if (matchedUser) {
          console.log('✅ [ProptiiProperty] Found by document ID:', matchedUser.email);
        }
        
        // Match by email (case-insensitive) - userId might be an email
        if (!matchedUser && userId.includes('@')) {
          const userIdLower = userId.toLowerCase().trim();
          matchedUser = allUsersResult.users.find(u => 
            u.email?.toLowerCase().trim() === userIdLower
          );
          if (matchedUser) {
            console.log('✅ [ProptiiProperty] Found by email match:', matchedUser.email);
          }
        }
        
        // Match by partial email (in case of formatting differences)
        if (!matchedUser && userId.includes('@')) {
          const userIdLower = userId.toLowerCase().trim();
          matchedUser = allUsersResult.users.find(u => {
            const userEmailLower = u.email?.toLowerCase().trim();
            return userEmailLower && (
              userEmailLower === userIdLower ||
              userEmailLower.includes(userIdLower) ||
              userIdLower.includes(userEmailLower)
            );
          });
          if (matchedUser) {
            console.log('✅ [ProptiiProperty] Found by partial email match:', matchedUser.email);
          }
        }
        
        if (matchedUser) {
          // Found user in landlordUsers - use their full details
          // IMPORTANT: Always use matchedUser.email if available, never fallback to default
          const foundEmail = matchedUser.email || (agentInfo.email !== 'info@proptii.com' ? agentInfo.email : null);
          if (!foundEmail) {
            console.warn('⚠️ [ProptiiProperty] Matched user has no email field:', matchedUser);
          }
          agentInfo = {
            id: matchedUser.id,
            name: matchedUser.name || 'Proptii Property',
            email: foundEmail || 'info@proptii.com', // Only use default if truly no email found
            phone: matchedUser.phone || '',
            company: matchedUser.companyName || matchedUser.name || 'Proptii',
          };
          console.log('✅ [ProptiiProperty] Successfully set agent info from landlordUsers:', {
            name: agentInfo.name,
            email: agentInfo.email,
            company: agentInfo.company
          });
        } else {
          // User not found in landlordUsers, but we have email from userId
          if (userId.includes('@')) {
            console.log('ℹ️ [ProptiiProperty] User not in landlordUsers, but using email from userId:', userId);
            agentInfo.email = userId.toLowerCase().trim();
            agentInfo.name = 'Property Owner'; // Default name since we don't have user details
          } else {
            console.warn('⚠️ [ProptiiProperty] No matching user found in landlordUsers collection');
            console.warn('⚠️ [ProptiiProperty] userId:', userId);
            console.warn('⚠️ [ProptiiProperty] Available users:', allUsersResult.users.map(u => ({ id: u.id, email: u.email })));
          }
        }
      } else {
        console.warn('⚠️ [ProptiiProperty] Failed to fetch landlordUsers or collection is empty');
        // Still use email from userId if it's an email
        if (userId.includes('@')) {
          agentInfo.email = userId.toLowerCase().trim();
          agentInfo.name = 'Property Owner';
        }
      }
      
      // Strategy 2: Try direct document lookup (fallback)
      if (agentInfo.email === 'info@proptii.com' && !userId.includes('@')) {
        console.log('🔍 [ProptiiProperty] Strategy 2: Trying direct document lookup...');
        try {
          const userDocRef = doc(db, 'landlordUsers', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const foundEmail = userData.email || (agentInfo.email !== 'info@proptii.com' ? agentInfo.email : null);
            console.log('✅ [ProptiiProperty] Found by direct document lookup:', foundEmail || 'NO EMAIL IN DOCUMENT');
            if (foundEmail) {
              agentInfo = {
                id: userDoc.id,
                name: userData.name || 'Proptii Property',
                email: foundEmail,
                phone: userData.phone || '',
                company: userData.companyName || userData.name || 'Proptii',
              };
            } else {
              console.warn('⚠️ [ProptiiProperty] User document found but has no email field:', userData);
            }
          }
        } catch (docError) {
          console.log('ℹ️ [ProptiiProperty] Direct document lookup failed:', docError);
        }
      }
      
      // Strategy 3: Try email lookup service (if userId is an email and we haven't found it yet)
      if (agentInfo.email === 'info@proptii.com' && userId.includes('@')) {
        console.log('🔍 [ProptiiProperty] Strategy 3: Trying email lookup service...');
        try {
          const lookupResult = await landlordUserService.getLandlordUserByEmail(userId.toLowerCase().trim());
          if (lookupResult.success && lookupResult.user) {
            console.log('✅ [ProptiiProperty] Found by email lookup service:', lookupResult.user.email);
            agentInfo = {
              id: lookupResult.user.id,
              name: lookupResult.user.name || 'Proptii Property',
              email: lookupResult.user.email || userId.toLowerCase().trim(),
              phone: lookupResult.user.phone || '',
              company: lookupResult.user.companyName || lookupResult.user.name || 'Proptii',
            };
          } else {
            // Even if not in landlordUsers, use the email from userId
            console.log('ℹ️ [ProptiiProperty] User not in landlordUsers, using email from userId:', userId);
            agentInfo.email = userId.toLowerCase().trim();
            agentInfo.name = 'Property Owner';
          }
        } catch (emailError) {
          console.log('ℹ️ [ProptiiProperty] Email lookup service failed, using email from userId:', userId);
          agentInfo.email = userId.toLowerCase().trim();
          agentInfo.name = 'Property Owner';
        }
      }
      
      // Final check: if we still have default email, try one more direct lookup by userId as document ID
      if (agentInfo.email === 'info@proptii.com' && !userId.includes('@')) {
        console.log('🔍 [ProptiiProperty] Final attempt: Trying direct document lookup by userId as document ID...');
        try {
          const userDocRef = doc(db, 'landlordUsers', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const foundEmail = userData.email;
            console.log('✅ [ProptiiProperty] Found by direct document lookup (final attempt):', foundEmail || 'NO EMAIL IN DOCUMENT');
            if (foundEmail) {
              agentInfo = {
                id: userDoc.id,
                name: userData.name || 'Property Owner',
                email: foundEmail,
                phone: userData.phone || '',
                company: userData.companyName || userData.name || 'Proptii',
              };
            } else {
              console.warn('⚠️ [ProptiiProperty] User document found (final attempt) but has no email field');
            }
          }
        } catch (finalLookupError) {
          console.error('❌ [ProptiiProperty] Final lookup attempt failed:', finalLookupError);
        }
      }
      
      if (agentInfo.email === 'info@proptii.com') {
        console.error('❌ [ProptiiProperty] All lookup strategies failed for userId:', userId);
        console.error('❌ [ProptiiProperty] Property document:', {
          id: firestoreProperty.id,
          address: firestoreProperty.address,
          userId: firestoreProperty.userId,
          ownerEmail: firestoreProperty.ownerEmail || 'NOT SET'
        });
        console.error('❌ [ProptiiProperty] Using default email. Property needs ownerEmail field set or userId must match a landlordUser.');
      } else {
        console.log('✅ [ProptiiProperty] Final agent info:', {
          email: agentInfo.email,
          name: agentInfo.name,
          company: agentInfo.company
        });
      }
    } catch (error) {
      console.error('❌ [ProptiiProperty] Error fetching landlord/agent info:', error);
      // If userId is an email, still use it even if lookup fails
      if (userId.includes('@')) {
        agentInfo.email = userId.toLowerCase().trim();
        agentInfo.name = 'Property Owner';
        console.log('ℹ️ [ProptiiProperty] Using email from userId after error:', agentInfo.email);
      }
    }
  } else {
    console.warn('⚠️ [ProptiiProperty] Property has no userId, using default agent info');
  }

  const amenitiesArray = firestoreProperty.amenities || [];
  console.log('📋 [ProptiiProperty] Property amenities:', amenitiesArray);
  console.log('📧 [ProptiiProperty] Final agent info before return:', {
    email: agentInfo.email,
    name: agentInfo.name,
    company: agentInfo.company,
    phone: agentInfo.phone,
    id: agentInfo.id
  });
  
  return {
    title,
    price,
    location: firestoreProperty.address,
    bedrooms: firestoreProperty.bedrooms.toString(),
    propertyType: firestoreProperty.type,
    imageUrls,
    agent: agentInfo,
    source: 'proptii',
    description,
    // Add extended fields for BookViewing compatibility
    street: addressParts.street,
    city: addressParts.city,
    postcode: addressParts.postcode,
    amenities: amenitiesArray, // Pass amenities as array, not in description
    bathrooms: firestoreProperty.bathrooms?.toString() || '',
    squareFootage: firestoreProperty.squareFootage?.toString() || '',
  } as Property & { street?: string; city?: string; postcode?: string; amenities?: string[]; bathrooms?: string; squareFootage?: string };
}

/**
 * Search properties in Firestore based on query
 */
export async function searchProptiiProperties(searchQuery: string): Promise<Property[]> {
  try {
    console.log('🚀 [ProptiiProperty] Starting search with query:', searchQuery);
    const propertiesCollection = collection(db, 'properties');
    
    // Always fetch all properties and filter in memory to ensure we catch all properties
    // This handles cases where:
    // 1. Properties don't have a status field set
    // 2. Properties have status 'vacant' but index might not be set up
    // 3. Properties were just created and might not be indexed yet
    console.log('🔍 [ProptiiProperty] Fetching all properties from Firestore...');
    const querySnapshot = await getDocs(propertiesCollection);
    console.log(`📋 [ProptiiProperty] Found ${querySnapshot.size} total properties in collection`);
    
    const properties: FirestoreProperty[] = [];
    const skippedByStatus: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const property = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as FirestoreProperty;
      
      // Include properties that are:
      // 1. Vacant (explicitly marked as available)
      // 2. Missing status field (assume they're available for rent)
      // 3. Not explicitly marked as 'occupied' or 'under-renovation'
      const status = property.status?.toLowerCase();
      if (!status || status === 'vacant' || (status !== 'occupied' && status !== 'under-renovation')) {
        properties.push(property);
        console.log(`✅ [ProptiiProperty] Including property: ${property.address || property.id} (status: ${property.status || 'none'})`);
      } else {
        skippedByStatus.push(`${property.address || property.id} (${property.status})`);
        console.log(`⏭️ [ProptiiProperty] Skipping property: ${property.address || property.id} (status: ${property.status})`);
      }
    });
    
    console.log(`📊 [ProptiiProperty] Filtered to ${properties.length} available properties (${skippedByStatus.length} skipped by status)`);
    if (skippedByStatus.length > 0) {
      console.log(`📋 [ProptiiProperty] Skipped properties:`, skippedByStatus);
    }

    // If no query provided or query is very generic, return all available properties
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      const transformationResults = await Promise.allSettled(
        properties.map(transformProperty)
      );
      const transformedProperties = transformationResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ [ProptiiProperty] Failed to transform property at index ${index}:`, result.reason);
            console.error(`❌ [ProptiiProperty] Property data:`, properties[index]);
            return null;
          }
        })
        .filter((property): property is Property => property !== null);
      console.log(`✅ [ProptiiProperty] Successfully transformed ${transformedProperties.length} out of ${properties.length} properties`);
      return transformedProperties;
    }

    // Filter properties based on search query
    const queryLower = searchQuery.toLowerCase();
    console.log(`🔍 [ProptiiProperty] Filtering ${properties.length} properties with query: "${searchQuery}"`);
    
    const filteredProperties = properties.filter((property) => {
      // Search in address
      if (property.address.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in type
      if (property.type?.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in notes
      if (property.notes?.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in amenities
      if (property.amenities?.some(amenity => amenity.toLowerCase().includes(queryLower))) {
        return true;
      }
      
      // Search for bedroom count
      const bedroomMatch = searchQuery.match(/(\d+)\s*bed/i);
      if (bedroomMatch) {
        const requestedBedrooms = parseInt(bedroomMatch[1]);
        if (property.bedrooms === requestedBedrooms) {
          return true;
        }
      }
      
      // Search for price range (more flexible matching)
      const priceMatch = searchQuery.match(/(\d+)(?:k|pcm|\s*pound)/i);
      if (priceMatch) {
        const requestedPrice = parseInt(priceMatch[1]);
        // Convert k to thousands if needed
        const requestedPriceValue = searchQuery.toLowerCase().includes('k') ? requestedPrice * 1000 : requestedPrice;
        // Allow 30% variance in price (increased from 20% for better matching)
        const priceVariance = property.rent * 0.3;
        if (Math.abs(property.rent - requestedPriceValue) <= priceVariance || 
            Math.abs(property.rent - requestedPrice) <= priceVariance) {
          return true;
        }
      }
      
      // Search for location (extract location from query) - more flexible
      const locationMatch = searchQuery.match(/(?:in|at|near|for)\s+([A-Za-z\s,]+?)(?:\s+for|\s+\d|$)/i);
      if (locationMatch) {
        const location = locationMatch[1].trim().toLowerCase();
        if (property.address.toLowerCase().includes(location)) {
          return true;
        }
      }
      
      // If query contains multiple keywords, try partial matching
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const propertyText = `${property.address} ${property.type || ''} ${property.notes || ''}`.toLowerCase();
      const matchingWords = queryWords.filter(word => propertyText.includes(word));
      // If at least 50% of query words match, include the property
      if (matchingWords.length >= Math.ceil(queryWords.length * 0.5)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`📊 [ProptiiProperty] Query filtering: ${filteredProperties.length} properties match search query`);

    // Transform to Property format (async transformation)
    // Use Promise.allSettled to handle errors per-property instead of failing entirely
    const transformationResults = await Promise.allSettled(
      filteredProperties.map(transformProperty)
    );

    // Filter out failed transformations and log errors
    const transformedProperties = transformationResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const property = filteredProperties[index];
          console.error(`❌ [ProptiiProperty] Failed to transform property at index ${index}:`, result.reason);
          console.error(`❌ [ProptiiProperty] Property ID: ${property?.id || 'unknown'}`);
          console.error(`❌ [ProptiiProperty] Property address: ${property?.address || 'missing'}`);
          console.error(`❌ [ProptiiProperty] Property data:`, {
            id: property?.id,
            address: property?.address,
            type: property?.type,
            rent: property?.rent,
            bedrooms: property?.bedrooms,
            status: property?.status
          });
          return null;
        }
      })
      .filter((property): property is Property => property !== null);

    const failedCount = filteredProperties.length - transformedProperties.length;
    console.log(`✅ [ProptiiProperty] Successfully transformed ${transformedProperties.length} out of ${filteredProperties.length} properties`);
    if (failedCount > 0) {
      console.warn(`⚠️ [ProptiiProperty] ${failedCount} properties failed transformation and were excluded`);
    }

    // If very few matches found (less than 5), try a more lenient search
    if (transformedProperties.length < 5 && transformedProperties.length > 0) {
      console.log(`⚠️ [ProptiiProperty] Only ${transformedProperties.length} properties matched strict query, trying lenient matching...`);
      
      // Try lenient matching: extract key terms (bedrooms, location, price) and match on those
      const bedroomMatch = searchQuery.match(/(\d+)\s*bed/i);
      const locationMatch = searchQuery.match(/(?:in|at|near|for)\s+([A-Za-z\s,]+?)(?:\s+for|\s+\d|$)/i);
      const priceMatch = searchQuery.match(/(\d+)(?:k|pcm|\s*pound)/i);
      
      const lenientFiltered = properties.filter((property) => {
        let matches = 0;
        
        // Match on bedrooms if specified
        if (bedroomMatch) {
          const requestedBedrooms = parseInt(bedroomMatch[1]);
          if (property.bedrooms === requestedBedrooms) {
            matches++;
          }
        }
        
        // Match on location if specified
        if (locationMatch) {
          const location = locationMatch[1].trim().toLowerCase();
          if (property.address.toLowerCase().includes(location)) {
            matches++;
          }
        }
        
        // Match on price if specified (with wider variance)
        if (priceMatch) {
          const requestedPrice = parseInt(priceMatch[1]);
          const requestedPriceValue = searchQuery.toLowerCase().includes('k') ? requestedPrice * 1000 : requestedPrice;
          const priceVariance = property.rent * 0.5; // 50% variance for lenient matching
          if (Math.abs(property.rent - requestedPriceValue) <= priceVariance || 
              Math.abs(property.rent - requestedPrice) <= priceVariance) {
            matches++;
          }
        }
        
        // Include if at least one criteria matches
        return matches > 0;
      });
      
      // Transform lenient matches
      const lenientTransformationResults = await Promise.allSettled(
        lenientFiltered.map(transformProperty)
      );
      const lenientTransformedProperties = lenientTransformationResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ [ProptiiProperty] Failed to transform lenient property at index ${index}:`, result.reason);
            return null;
          }
        })
        .filter((property): property is Property => property !== null);
      
      // Remove duplicates and combine
      const combined = [...transformedProperties];
      const existingIds = new Set(transformedProperties.map(p => p.title));
      lenientTransformedProperties.forEach(prop => {
        if (!existingIds.has(prop.title)) {
          combined.push(prop);
        }
      });
      
      if (combined.length > transformedProperties.length) {
        console.log(`✅ [ProptiiProperty] Lenient matching found ${combined.length} total properties (added ${combined.length - transformedProperties.length} more)`);
        return combined;
      }
    }
    
    // If no matches found, return all available properties (user can browse)
    if (transformedProperties.length === 0) {
      console.log('⚠️ [ProptiiProperty] No properties matched search query, returning all available properties');
      const allTransformationResults = await Promise.allSettled(
        properties.map(transformProperty)
      );
      const allTransformedProperties = allTransformationResults
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ [ProptiiProperty] Failed to transform property at index ${index}:`, result.reason);
            return null;
          }
        })
        .filter((property): property is Property => property !== null);
      console.log(`✅ [ProptiiProperty] Returning ${allTransformedProperties.length} total properties (all available)`);
      return allTransformedProperties;
    }

    console.log(`✅ [ProptiiProperty] Returning ${transformedProperties.length} properties matching search query`);
    return transformedProperties;
  } catch (error) {
    console.error('Error searching Proptii properties:', error);
    throw new Error('Failed to search Proptii properties');
  }
}

/**
 * Get all available properties from Proptii (for browsing)
 */
export async function getAllProptiiProperties(): Promise<Property[]> {
  try {
    const propertiesCollection = collection(db, 'properties');
    
    // Only fetch vacant properties (available for rent)
    const q = query(
      propertiesCollection,
      where('status', '==', 'vacant')
    );
    
    const querySnapshot = await getDocs(q);
    const properties: FirestoreProperty[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      properties.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as FirestoreProperty);
    });

    // Transform to Property format (async transformation)
    // Use Promise.allSettled to handle errors per-property instead of failing entirely
    const transformationResults = await Promise.allSettled(
      properties.map(transformProperty)
    );

    // Filter out failed transformations and log errors
    const transformedProperties = transformationResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ [ProptiiProperty] Failed to transform property at index ${index}:`, result.reason);
          console.error(`❌ [ProptiiProperty] Property data:`, properties[index]);
          return null;
        }
      })
      .filter((property): property is Property => property !== null);

    console.log(`✅ [ProptiiProperty] Successfully transformed ${transformedProperties.length} out of ${properties.length} properties`);
    return transformedProperties;
  } catch (error) {
    console.error('Error fetching Proptii properties:', error);
    throw new Error('Failed to fetch Proptii properties');
  }
}

