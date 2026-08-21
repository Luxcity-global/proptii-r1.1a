import { collection, getDocs, query, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Property } from '../types/property';

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
 * Parse natural language query to extract structured search criteria
 */
interface SearchCriteria {
  location?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  keywords: string[];
}

function parseNaturalLanguageQuery(query: string): SearchCriteria {
  const normalizedQuery = query.toLowerCase();
  const criteria: SearchCriteria = { keywords: [] };

  // Extract location - multiple patterns
  const locationPatterns = [
    /(?:in|at|near|around|within)\s+([a-z\s,]+?)(?:\s+(?:for|under|below|max|up\s+to|£|\d|pcm|bedroom|bed|flat|house|apartment|studio)|$)/i,
    /(?:in|at|near|around|within)\s+([a-z\s,]+)/i,
    /\b(london|manchester|birmingham|liverpool|leeds|bristol|sheffield|edinburgh|glasgow|cardiff|birmingham|newcastle|nottingham|leicester|southampton|portsmouth|brighton|reading|northampton|luton|bolton|bournemouth|norwich|swansea|swindon|crawley|ipswich|wigan|croydon|walsall|mansfield|oxford|cambridge|peterborough|doncaster|york|poole|gloucester|burnley|watford|blackpool|southend|middlesbrough|slough|derby|plymouth|stoke|wolverhampton|southampton|salford|aberdeen|westminster|southwark|tower\s+hamlets|greenwich|camden|islington|hackney|hammersmith|kensington|chelsea|fulham|wandsworth|lambeth|southwark|lewisham|greenwich|bexley|havering|barking|redbridge|newham|waltham\s+forest|haringey|enfield|barnet|harrow|hillingdon|hounslow|richmond|kingston|merton|sutton|croydon|bromley)\b/i
  ];

  for (const pattern of locationPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      criteria.location = match[1].trim().toLowerCase();
      // Clean up location (remove common words that might have been captured)
      criteria.location = criteria.location
        .replace(/\s+(for|under|below|max|up\s+to|£|\d+|pcm|bedroom|bed|flat|house|apartment|studio).*$/i, '')
        .trim();
      if (criteria.location.length > 1) {
        break;
      }
    }
  }

  // Extract bedrooms - multiple patterns
  const bedroomPatterns = [
    /(\d+)\s*(?:bedroom|bed|br|beds?)/i,
    /(?:studio|bedsit)/i,
    /(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:bedroom|bed|br)/i
  ];

  for (const pattern of bedroomPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      if (match[1]) {
        criteria.bedrooms = parseInt(match[1]);
      } else if (normalizedQuery.includes('studio') || normalizedQuery.includes('bedsit')) {
        criteria.bedrooms = 0;
      } else {
        // Handle word numbers
        const wordNumbers: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        const wordMatch = normalizedQuery.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:bedroom|bed|br)/i);
        if (wordMatch && wordMatch[1]) {
          criteria.bedrooms = wordNumbers[wordMatch[1].toLowerCase()];
        }
      }
      if (criteria.bedrooms !== undefined) {
        break;
      }
    }
  }

  // Extract price - multiple patterns
  const pricePatterns = [
    /(?:under|below|max|up\s+to|maximum|less\s+than)\s*£?\s*(\d+)(?:k|,000)?/i,
    /£\s*(\d+)(?:k|,000)?(?:\s*(?:pcm|per\s+month|monthly|pw|per\s+week|weekly))?/i,
    /(\d+)(?:k|,000)?\s*(?:pcm|per\s+month|monthly|pw|per\s+week|weekly|pound)/i,
    /(\d+)(?:k|,000)?(?:pcm|per\s+month|monthly|pw|per\s+week|weekly)/i, // No space between number and unit (e.g., "2000pcm")
    /(\d+)\s*(?:pcm|per\s+month|monthly)/i,
    /for\s+(\d+)(?:pcm|pound)/i // "for 2000pcm" pattern
  ];

  for (const pattern of pricePatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      let price = parseInt(match[1].replace(/,/g, ''));
      if (normalizedQuery.includes('k') || normalizedQuery.includes(',000')) {
        price = price * 1000;
      }
      // If price is less than 500, assume it's weekly and convert to monthly
      if (price < 500 && (normalizedQuery.includes('pw') || normalizedQuery.includes('per week') || normalizedQuery.includes('weekly'))) {
        price = price * 4.33; // Convert weekly to monthly
      }
      criteria.maxPrice = price;
      // Allow some flexibility - set min price to 70% of max
      criteria.minPrice = Math.floor(price * 0.7);
      break;
    }
  }

  // Extract property type (handle plural forms)
  const propertyTypePatterns = [
    /\b(flats?|apartments?|houses?|studios?|bedsits?|bungalows?|cottages?|maisonettes?|penthouses?|townhouses?|terraced|semi-detached|detached|mansions?|villas?)\b/i
  ];

  for (const pattern of propertyTypePatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      let propertyType = match[1].toLowerCase();
      // Normalize plural forms to singular
      if (propertyType.endsWith('s') && propertyType !== 'house' && propertyType !== 'terraced') {
        propertyType = propertyType.slice(0, -1);
      }
      criteria.propertyType = propertyType;
      break;
    }
  }

  // Extract keywords (non-criteria words) - remove stop words and already extracted criteria
  const stopWords = new Set(['in', 'at', 'near', 'for', 'to', 'rent', 'the', 'a', 'an', 'and', 'or', 'but', 'with', 'under', 'below', 'max', 'up', 'to', 'pcm', 'per', 'month', 'week', 'bedroom', 'bed', 'br', 'flat', 'house', 'apartment', 'studio', 'bedsit', 'bungalow', 'cottage', 'pound', 'pounds', '£']);
  let words = normalizedQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  
  // Remove location words if location was extracted
  if (criteria.location) {
    const locationWords = criteria.location.split(/\s+/);
    words = words.filter(w => !locationWords.includes(w));
  }
  
  // Remove property type if it was extracted
  if (criteria.propertyType) {
    words = words.filter(w => w !== criteria.propertyType);
  }
  
  // Remove bedroom numbers
  words = words.filter(w => !/^\d+$/.test(w) || parseInt(w) !== criteria.bedrooms);
  
  // Remove price numbers
  if (criteria.maxPrice) {
    const priceStr = String(criteria.maxPrice);
    words = words.filter(w => !priceStr.includes(w) && !w.includes(priceStr));
  }
  
  criteria.keywords = words;

  console.log('🔍 [ProptiiProperty] Parsed search criteria:', criteria);
  return criteria;
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

    // Parse natural language query to extract structured criteria
    const criteria = parseNaturalLanguageQuery(searchQuery);
    const queryLower = searchQuery.toLowerCase();
    console.log(`🔍 [ProptiiProperty] Filtering ${properties.length} properties with query: "${searchQuery}"`);
    
    const filteredProperties = properties.filter((property) => {
      // Use AND logic: ALL specified criteria must match
      let passesAllCriteria = true;

      // Location matching (REQUIRED if specified)
      if (criteria.location) {
        const addressLower = property.address.toLowerCase();
        const searchLocation = criteria.location.toLowerCase().trim();
        
        // Special handling for major cities to avoid false matches
        // e.g., "London" should not match "London, Kent" or properties in Kent
        if (searchLocation === 'london') {
          // For London, check if address contains "london" but NOT other cities/counties
          const londonMatch = addressLower.includes('london');
          const otherCities = ['kent', 'manchester', 'birmingham', 'liverpool', 'leeds', 'bristol', 'sheffield', 'edinburgh', 'glasgow', 'cardiff', 'norwich', 'cambridge', 'oxford', 'brighton', 'portsmouth', 'southampton'];
          const hasOtherCity = otherCities.some(city => addressLower.includes(city) && !addressLower.includes('london'));
          
          if (!londonMatch || hasOtherCity) {
            return false;
          }
        } else {
          // For other locations, check if the location words appear in the address
          const locationWords = searchLocation.split(/\s+/).filter(w => w.length > 2);
          
          // All significant location words should appear in the address
          const locationMatches = locationWords.every(word => addressLower.includes(word));
          
          if (!locationMatches) {
            return false;
          }
        }
      }

      // Bedroom matching (REQUIRED if specified - exact match only)
      if (criteria.bedrooms !== undefined) {
        // Studio (0 bedrooms) should only match if explicitly searched for
        if (criteria.bedrooms === 0) {
          // If searching for studio, property must be studio (0 bedrooms)
          if (property.bedrooms !== 0) {
            return false;
          }
        } else {
          // For other bedroom counts, require exact match
          if (property.bedrooms !== criteria.bedrooms) {
            return false;
          }
        }
      }

      // Price matching (REQUIRED if specified - within reasonable range)
      if (criteria.maxPrice !== undefined) {
        const priceVariance = criteria.maxPrice * 0.2; // 20% variance (stricter)
        const minPrice = criteria.minPrice || Math.max(0, criteria.maxPrice - priceVariance);
        const maxPrice = criteria.maxPrice + priceVariance;
        
        // Property must be within price range
        if (property.rent < minPrice || property.rent > maxPrice) {
          return false;
        }
      }

      // Property type matching (REQUIRED if specified)
      if (criteria.propertyType) {
        const propertyTypeLower = property.type?.toLowerCase() || '';
        const searchTypeLower = criteria.propertyType.toLowerCase();
        
        // Normalize plural forms
        const searchTypeSingular = searchTypeLower.endsWith('s') && searchTypeLower !== 'house' ? searchTypeLower.slice(0, -1) : searchTypeLower;
        const propertyTypeSingular = propertyTypeLower.endsWith('s') && propertyTypeLower !== 'house' ? propertyTypeLower.slice(0, -1) : propertyTypeLower;
        
        // Check for type match (handle variations like flat/apartment)
        const typeMatches = 
          propertyTypeLower.includes(searchTypeLower) || 
          searchTypeLower.includes(propertyTypeLower) ||
          propertyTypeSingular === searchTypeSingular ||
          (searchTypeSingular === 'flat' && (propertyTypeSingular === 'apartment' || propertyTypeLower.includes('apartment'))) ||
          (searchTypeSingular === 'apartment' && (propertyTypeSingular === 'flat' || propertyTypeLower.includes('flat')));
        
        if (!typeMatches) {
          return false;
        }
      }

      // Keyword matching (if keywords are specified, at least one must match)
      if (criteria.keywords.length > 0) {
        const propertyText = `${property.address} ${property.type || ''} ${property.notes || ''} ${(property.amenities || []).join(' ')}`.toLowerCase();
        const keywordMatches = criteria.keywords.some(keyword => propertyText.includes(keyword));
        
        // If we have keywords but no other criteria, require keyword match
        // If we have other criteria, keywords are optional but helpful
        const hasOtherCriteria = criteria.location || criteria.bedrooms !== undefined || criteria.maxPrice !== undefined || criteria.propertyType;
        if (!hasOtherCriteria && !keywordMatches) {
          return false;
        }
      }

      // If no structured criteria at all, fall back to direct text search
      const hasStructuredCriteria = criteria.location || criteria.bedrooms !== undefined || criteria.maxPrice !== undefined || criteria.propertyType || criteria.keywords.length > 0;
      if (!hasStructuredCriteria) {
        const propertyText = `${property.address} ${property.type || ''} ${property.notes || ''}`.toLowerCase();
        return propertyText.includes(queryLower);
      }

      // If we get here, all specified criteria matched
      return passesAllCriteria;
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

    // If no matches found, return empty array (don't return all properties)
    if (transformedProperties.length === 0) {
      console.log('⚠️ [ProptiiProperty] No properties matched search query, returning empty results');
      return [];
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

