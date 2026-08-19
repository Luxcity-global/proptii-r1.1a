import apiService from './api';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

/**
 * Resolves the path prefix for referencing routes.
 * If VITE_API_URL already ends with /api the prefix is empty; otherwise /api is prepended.
 */
function referencingPath(suffix: string): string {
  const raw = getResolvedApiBaseUrl().replace(/\/$/, '');
  const prefix = raw.endsWith('/api') ? '' : '/api';
  return `${prefix}/referencing/${suffix}`;
}

class ReferencingService {
  // ── Section saves ───────────────────────────────────────────────────────────

  async saveIdentityData(data: any) {
    const response = await apiService.post(referencingPath('identity'), data);
    return response.data;
  }

  async saveEmploymentData(data: any) {
    const response = await apiService.post(referencingPath('employment'), data);
    return response.data;
  }

  async saveResidentialData(data: any) {
    const response = await apiService.post(referencingPath('residential'), data);
    return response.data;
  }

  async saveFinancialData(data: any) {
    const response = await apiService.post(referencingPath('financial'), data);
    return response.data;
  }

  async saveGuarantorData(data: any) {
    const response = await apiService.post(referencingPath('guarantor'), data);
    return response.data;
  }

  async saveAgentDetailsData(data: any) {
    const response = await apiService.post(referencingPath('agentDetails'), data);
    return response.data;
  }

  /**
   * Generic section save — called from ReferencingContext.saveFormData().
   * Maps to POST /referencing/{section} which the backend handles for all sections.
   */
  async saveSectionData(userId: string, section: string, data: any) {
    try {
      const response = await apiService.post(referencingPath(section), data);
      return response.data ?? { success: true };
    } catch (error) {
      console.error(`Error saving section "${section}":`, error);
      // Return graceful degradation so the form doesn't block the user
      return { success: false, error: 'Failed to save section' };
    }
  }

  // ── Application lifecycle ───────────────────────────────────────────────────

  /**
   * Load a saved referencing application by its userId/applicationId.
   * Maps to GET /referencing/:userId
   */
  async getApplication(applicationId: string) {
    try {
      const response = await apiService.get(referencingPath(applicationId));
      const data = response.data;
      // Backend returns the raw Firestore doc; wrap it in a consistent envelope
      if (data && typeof data === 'object' && !('success' in data)) {
        return { success: true, data };
      }
      return data ?? { success: false, data: null };
    } catch (error) {
      console.error('Error loading application:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Create a new referencing application for a property.
   * The backend does not have a dedicated create endpoint — instead it initialises
   * the Firestore doc on the first section save. We synthesise an applicationId
   * from the propertyId here so the context has something to work with immediately.
   *
   * If a dedicated POST /referencing endpoint is added later, swap the body below.
   */
  async createApplication(propertyId: string) {
    try {
      // Seed an empty doc so getApplication won't return 404 later
      const response = await apiService.post(referencingPath('forms/' + propertyId), {
        propertyId,
        status: 'draft',
      });
      const data = response.data;
      // Return a normalised envelope the context expects
      return {
        success: true,
        data: { applicationId: propertyId, ...(data ?? {}) },
      };
    } catch (error) {
      console.error('Error creating application:', error);
      // Fallback: use propertyId as the applicationId — the first section save
      // will create the doc server-side anyway.
      return { success: true, data: { applicationId: propertyId } };
    }
  }

  /**
   * Upload a document file for a referencing section.
   * Converts the File to a base64 data URI and POSTs it to the file-save endpoint.
   * The backend uploads to Firebase Storage and returns { url, storagePath }.
   */
  async uploadDocument(
    applicationId: string,
    section: string,
    file: File,
    field: string,
    onProgress?: (progress: number) => void,
  ) {
    try {
      // Read file as base64 data URI
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      if (onProgress) onProgress(30);

      const response = await apiService.post(referencingPath('files/save'), {
        base64,
        section,
        field,
        fileName:    file.name,
        contentType: file.type,
        size:        file.size,
        userId:      applicationId,
      });

      if (onProgress) onProgress(100);

      const data = response.data;
      if (data?.url) {
        return { success: true, data: { fileUrl: data.url, storagePath: data.storagePath } };
      }
      return { success: false, error: 'Upload succeeded but no URL returned' };
    } catch (error: any) {
      console.error(`Error uploading document (${section}/${field}):`, error);
      return { success: false, error: error?.message || 'Failed to upload document' };
    }
  }

  /**
   * Save the current form state as a named draft.
   * Maps to POST /referencing/forms/:formId with the full form payload.
   */
  async saveDraft(applicationId: string, name: string, data: any) {
    try {
      const response = await apiService.post(referencingPath(`forms/${applicationId}`), {
        ...data,
        draftName: name,
        status: 'draft',
      });
      return response.data ?? { success: true };
    } catch (error) {
      console.error('Error saving draft:', error);
      return { success: false, error: 'Failed to save draft' };
    }
  }

  // ── Passport sharing ────────────────────────────────────────────────────────

  async sharePassport(data: any) {
    try {
      const response = await apiService.post(referencingPath('shares'), data);
      return response.data;
    } catch (error) {
      console.error('Error sharing referencing passport:', error);
      throw error;
    }
  }

  async getShares() {
    try {
      const response = await apiService.get(referencingPath('shares'));
      return response.data;
    } catch (error) {
      console.error('Error fetching referencing shares:', error);
      throw error;
    }
  }

  async deleteShare(shareId: string) {
    try {
      const response = await apiService.delete(referencingPath(`shares/${shareId}`));
      return response.data;
    } catch (error) {
      console.error('Error deleting referencing share:', error);
      throw error;
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  /** Allow longer timeout — backend runs file uploads + Firestore writes on submit. */
  private static readonly SUBMIT_TIMEOUT_MS = 120_000;

  async submitApplication(userId: string, data: any) {
    try {
      const response = await apiService.post(
        referencingPath(`${userId}/submit`),
        data,
        { timeout: ReferencingService.SUBMIT_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }
}

export default new ReferencingService();
