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

/** Serializable shape stored in localStorage */
export interface PendingPropertyData {
  propertyType: string | null;
  propertyDetails: PendingPropertyDetails;
  propertyDetailsDocuments: PendingStoredFile[];
  amenities: string[];
  images: PendingStoredFile[]; // base64 image data
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

function base64ToFile(base64: string, filename: string): File {
  const [header, data] = base64.split(',');
  const mimeMatch = header?.match(/data:([^;]+);/);
  const mime = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(data || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  return new File([blob], filename, { type: mime });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert File[] to PendingStoredFile[] with size cap */
async function filesToStored(
  files: File[],
  maxTotalBytes: number
): Promise<{ stored: PendingStoredFile[]; dropped: number }> {
  const stored: PendingStoredFile[] = [];
  let total = 0;
  let dropped = 0;
  for (const file of files) {
    const base64 = await fileToBase64(file);
    const size = base64.length * 0.75; // approx base64 overhead
    if (total + size > maxTotalBytes) {
      dropped++;
      continue;
    }
    stored.push({ name: file.name, base64 });
    total += size;
  }
  return { stored, dropped };
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
    const { propertyDetailsDocuments, dropped: docsDropped } = await filesToStored(
      data.propertyDetails.uploadedDocuments,
      MAX_STORAGE_BYTES / 2
    );
    const { stored: imagesStored, dropped: imagesDropped } = await filesToStored(
      data.imageFiles,
      MAX_STORAGE_BYTES / 2
    );
    if (docsDropped > 0 || imagesDropped > 0) {
      console.warn(
        `landlordPendingProperty: Dropped ${docsDropped} docs, ${imagesDropped} images to stay within storage limit`
      );
    }
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
      propertyDetailsDocuments: propertyDetailsDocuments,
      amenities: data.amenities,
      images: imagesStored,
      additionalNotes: data.additionalNotes
    };
    const json = JSON.stringify(payload);
    if (json.length > MAX_STORAGE_BYTES) {
      console.warn('landlordPendingProperty: Payload too large, saving without files');
      const minimal: PendingPropertyData = {
        ...payload,
        propertyDetailsDocuments: [],
        images: []
      };
      getStorage()?.setItem(PENDING_PROPERTY_KEY, JSON.stringify(minimal));
    } else {
      getStorage()?.setItem(PENDING_PROPERTY_KEY, json);
    }
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
    const uploadedDocuments: File[] = parsed.propertyDetailsDocuments.map((d) =>
      base64ToFile(d.base64, d.name)
    );
    const imageFiles: File[] = parsed.images.map((img) => base64ToFile(img.base64, img.name));
    const images: string[] = imageFiles.map((f) => URL.createObjectURL(f));
    return {
      propertyType: parsed.propertyType,
      propertyDetails: {
        ...parsed.propertyDetails,
        uploadedDocuments
      },
      amenities: parsed.amenities,
      images,
      imageFiles,
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
