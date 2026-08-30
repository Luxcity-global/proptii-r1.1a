/**
 * Temporarily store add-property form data when a guest is prompted to sign in
 * at the publish step. Restored when the user signs in and returns to the
 * landlord app so they don't lose their input.
 *
 * Uses localStorage (not sessionStorage) so data persists across the sign-in
 * redirect to a different domain and back.
 */

const PENDING_PROPERTY_KEY = 'landlord_pendingProperty';
const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB to stay under typical 5MB limit

/** Serializable property details (no File objects) */
export interface PendingPropertyDetails {
  address: string;
  monthlyRent: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  isForSale: boolean;
  tenureType: string;
  annualGroundRent: string;
  councilTaxBand: string;
  annualServiceCharge: string;
  nightlyRate?: string;
  minStay?: string;
  maxStay?: string;
}

/** Stored document: base64 data URL + filename */
export interface PendingStoredFile {
  name: string;
  base64: string; // data URL
}

export interface PendingPropertyData {
  propertyType: string | null;
  propertyDetails: PendingPropertyDetails;
  amenities: string[];
  additionalNotes: string;
}

/** Shape expected by the landlord App (matches PropertySetupData minus File[]) */
export interface RestoredPropertySetupData {
  propertyType: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
    isForSale: boolean;
    tenureType: string;
    annualGroundRent: string;
    councilTaxBand: string;
    annualServiceCharge: string;
    nightlyRate?: string;
    minStay?: string;
    maxStay?: string;
  };
  amenities: string[];
  images: string[]; // blob URLs for preview
  imageFiles: File[];
  additionalNotes: string;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}



/** Save pending property data. Call before redirecting to sign-in. */
export async function savePendingProperty(data: {
  propertyType: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
    isForSale: boolean;
    tenureType: string;
    annualGroundRent: string;
    councilTaxBand: string;
    annualServiceCharge: string;
    nightlyRate?: string;
    minStay?: string;
    maxStay?: string;
  };
  amenities: string[];
  images: string[];
  imageFiles: File[];
  additionalNotes: string;
}): Promise<void> {
  try {
    const payload: PendingPropertyData = {
      propertyType: data.propertyType,
      propertyDetails: {
        address: data.propertyDetails.address,
        monthlyRent: data.propertyDetails.monthlyRent,
        bedrooms: data.propertyDetails.bedrooms,
        bathrooms: data.propertyDetails.bathrooms,
        squareFootage: data.propertyDetails.squareFootage,
        isForSale: data.propertyDetails.isForSale,
        tenureType: data.propertyDetails.tenureType,
        annualGroundRent: data.propertyDetails.annualGroundRent,
        councilTaxBand: data.propertyDetails.councilTaxBand,
        annualServiceCharge: data.propertyDetails.annualServiceCharge,
        nightlyRate: data.propertyDetails.nightlyRate,
        minStay: data.propertyDetails.minStay,
        maxStay: data.propertyDetails.maxStay
      },
      amenities: data.amenities,
      additionalNotes: data.additionalNotes
    };
    getStorage()?.setItem(PENDING_PROPERTY_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save pending property', e);
  }
}

/** Consume and return pending property data, removing it from storage. */
export function consumePendingProperty(): RestoredPropertySetupData | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(PENDING_PROPERTY_KEY);
  storage.removeItem(PENDING_PROPERTY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingPropertyData;
    return {
      propertyType: parsed.propertyType,
      propertyDetails: {
        ...parsed.propertyDetails,
        uploadedDocuments: []
      },
      amenities: parsed.amenities,
      images: [],
      imageFiles: [],
      additionalNotes: parsed.additionalNotes
    };
  } catch {
    return null;
  }
}

/** Check if there is pending property data without consuming it. */
export function hasPendingProperty(): boolean {
  return !!getStorage()?.getItem(PENDING_PROPERTY_KEY);
}
