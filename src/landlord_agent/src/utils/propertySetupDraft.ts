/**
 * Session draft for the landlord/agent property creation wizard.
 * Persists form progress across leaving the flow (Save & exit / Home)
 * and returning via Add Property, within the same browser tab.
 */

const DRAFT_KEY = 'proptii_property_setup_draft';
const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB under typical 5MB sessionStorage limit
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type PropertySetupDraftScreen =
  | 'property-setup-step1'
  | 'property-type-selection'
  | 'property-details-selection'
  | 'amenities-selection'
  | 'images-notes-selection'
  | 'property-preview';

export interface PropertySetupDraftData {
  propertyType: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
    uploadedDocuments: File[];
  };
  amenities: string[];
  images: string[];
  imageFiles: File[];
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation';
}

interface StoredFile {
  name: string;
  base64: string;
  type?: string;
}

interface StoredDraft {
  propertyType: string | null;
  propertyDetails: {
    address: string;
    monthlyRent: string;
    bedrooms: string;
    bathrooms: string;
    squareFootage: string;
  };
  documents: StoredFile[];
  amenities: string[];
  images: StoredFile[];
  additionalNotes: string;
  status?: 'vacant' | 'occupied' | 'under-renovation';
  lastScreen: PropertySetupDraftScreen;
  timestamp: number;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToFile(base64: string, filename: string, mimeHint?: string): File {
  const [header, data] = base64.split(',');
  const mimeMatch = header?.match(/data:([^;]+);/);
  const mime = mimeMatch?.[1] || mimeHint || 'application/octet-stream';
  const binary = atob(data || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([new Blob([bytes], { type: mime })], filename, { type: mime });
}

async function filesToStored(
  files: File[],
  maxTotalBytes: number
): Promise<StoredFile[]> {
  const stored: StoredFile[] = [];
  let total = 0;
  for (const file of files) {
    try {
      const base64 = await fileToBase64(file);
      const size = base64.length * 0.75;
      if (total + size > maxTotalBytes) break;
      stored.push({ name: file.name, base64, type: file.type });
      total += size;
    } catch {
      // Skip unreadable files
    }
  }
  return stored;
}

export function isPropertySetupDraftScreen(screen: string): screen is PropertySetupDraftScreen {
  return (
    screen === 'property-setup-step1' ||
    screen === 'property-type-selection' ||
    screen === 'property-details-selection' ||
    screen === 'amenities-selection' ||
    screen === 'images-notes-selection' ||
    screen === 'property-preview'
  );
}

export function hasPropertySetupDraftContent(data: PropertySetupDraftData): boolean {
  return !!(
    data.propertyType ||
    data.propertyDetails.address.trim() ||
    data.propertyDetails.monthlyRent.trim() ||
    data.propertyDetails.bedrooms.trim() ||
    data.propertyDetails.bathrooms.trim() ||
    data.propertyDetails.squareFootage.trim() ||
    data.propertyDetails.uploadedDocuments.length > 0 ||
    data.amenities.length > 0 ||
    data.images.length > 0 ||
    data.imageFiles.length > 0 ||
    data.additionalNotes.trim()
  );
}

export async function savePropertySetupDraft(
  data: PropertySetupDraftData,
  lastScreen: PropertySetupDraftScreen
): Promise<void> {
  if (!hasPropertySetupDraftContent(data)) {
    clearPropertySetupDraft();
    return;
  }

  try {
    const documents = await filesToStored(
      data.propertyDetails.uploadedDocuments,
      MAX_STORAGE_BYTES / 2
    );
    const images = await filesToStored(data.imageFiles, MAX_STORAGE_BYTES / 2);

    const payload: StoredDraft = {
      propertyType: data.propertyType,
      propertyDetails: {
        address: data.propertyDetails.address,
        monthlyRent: data.propertyDetails.monthlyRent,
        bedrooms: data.propertyDetails.bedrooms,
        bathrooms: data.propertyDetails.bathrooms,
        squareFootage: data.propertyDetails.squareFootage
      },
      documents,
      amenities: data.amenities,
      images,
      additionalNotes: data.additionalNotes,
      status: data.status,
      lastScreen,
      timestamp: Date.now()
    };

    const json = JSON.stringify(payload);
    if (json.length > MAX_STORAGE_BYTES) {
      const minimal: StoredDraft = { ...payload, documents: [], images: [] };
      getStorage()?.setItem(DRAFT_KEY, JSON.stringify(minimal));
    } else {
      getStorage()?.setItem(DRAFT_KEY, json);
    }
  } catch (e) {
    console.warn('Failed to save property setup draft', e);
  }
}

export function loadPropertySetupDraft(): {
  data: PropertySetupDraftData;
  lastScreen: PropertySetupDraftScreen;
} | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > DRAFT_TTL_MS) {
      storage.removeItem(DRAFT_KEY);
      return null;
    }

    const uploadedDocuments = (parsed.documents || []).map((d) =>
      base64ToFile(d.base64, d.name, d.type)
    );
    const imageFiles = (parsed.images || []).map((img) =>
      base64ToFile(img.base64, img.name, img.type)
    );
    const images = imageFiles.map((f) => URL.createObjectURL(f));

    const lastScreen = isPropertySetupDraftScreen(parsed.lastScreen)
      ? parsed.lastScreen
      : 'property-setup-step1';

    return {
      lastScreen,
      data: {
        propertyType: parsed.propertyType,
        propertyDetails: {
          address: parsed.propertyDetails?.address || '',
          monthlyRent: parsed.propertyDetails?.monthlyRent || '',
          bedrooms: parsed.propertyDetails?.bedrooms || '',
          bathrooms: parsed.propertyDetails?.bathrooms || '',
          squareFootage: parsed.propertyDetails?.squareFootage || '',
          uploadedDocuments
        },
        amenities: parsed.amenities || [],
        images,
        imageFiles,
        additionalNotes: parsed.additionalNotes || '',
        status: parsed.status
      }
    };
  } catch {
    storage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function peekPropertySetupDraftScreen(): PropertySetupDraftScreen | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > DRAFT_TTL_MS) {
      return null;
    }
    return isPropertySetupDraftScreen(parsed.lastScreen) ? parsed.lastScreen : null;
  } catch {
    return null;
  }
}

export function clearPropertySetupDraft(): void {
  try {
    getStorage()?.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
