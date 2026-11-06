import apiService from './api';
import { getResolvedApiBaseUrl } from '../config/apiBaseUrl';

import { uploadToFirebaseStorage } from './storageService';


/**
 * Resolves the path prefix for referencing routes.
 * If VITE_API_URL already ends with /api the prefix is empty; otherwise /api is prepended.
 */
export function referencingPath(suffix: string): string {
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
  async saveSectionData(userId: string, section: string, data: any): Promise<any> {
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
  async getApplication(applicationId: string): Promise<any> {
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
   * Posts the file as multipart/form-data to the file-save endpoint.
   * The backend uploads to Firebase Storage and returns { url, storagePath }.
   */
  async uploadDocument(
    applicationId: string,
    section: string,
    file: File,
    field: string,
    onProgress?: (progress: number) => void,
  ) {
    // 1. Try backend API multipart upload
    try {
      const additionalData = {
        section,
        field,
        userId: applicationId,
        name: file.name,
        fileName: file.name,
      };

      const response = await apiService.uploadFile(
        referencingPath('files/save'),
        file,
        additionalData,
        onProgress
      );

      const data = response.data as any;
      if (data?.url) {
        return { success: true, data: { fileUrl: data.url, storagePath: data.storagePath } };
      }
    } catch (backendError: any) {
      console.warn(`[ReferencingService] Backend upload failed for (${section}/${field}):`, backendError?.message);
    }

    // 2. Direct client Cloud Storage upload fallback (always store in real cloud storage)
    try {
      const storageResult = await uploadToFirebaseStorage(
        file,
        `referencing/${applicationId || 'general'}/${section}/${field}`,
        (progress) => {
          if (onProgress) onProgress(progress.percentage);
        }
      );

      if (storageResult.success && storageResult.url) {
        return {
          success: true,
          data: {
            fileUrl: storageResult.url,
            storagePath: storageResult.fileName || file.name,
          },
        };
      }
      return { success: false, error: storageResult.error || 'Failed to upload document to cloud storage' };
    } catch (fbError: any) {
      console.error(`[ReferencingService] Cloud Storage upload failed for (${section}/${field}):`, fbError);
      return { success: false, error: fbError?.message || 'Cloud storage upload failed' };
    }
  }

  /**
   * Save the current form state as a named draft.
   * Maps to POST /referencing/forms/:formId with the full form payload.
   */
  async saveDraft(applicationId: string, name: string, data: any): Promise<any> {
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

  async sharePassport(data: any): Promise<any> {
    try {
      const response = await apiService.post(referencingPath('shares'), data);
      return response.data;
    } catch (error) {
      console.error('Error sharing referencing passport:', error);
      throw error;
    }
  }

  async getShares(): Promise<any> {
    try {
      const response = await apiService.get(referencingPath('shares'));
      return response.data;
    } catch (error) {
      console.error('Error fetching referencing shares:', error);
      throw error;
    }
  }

  async deleteShare(shareId: string): Promise<any> {
    try {
      const response = await apiService.delete(referencingPath(`shares/${shareId}`));
      return response.data;
    } catch (error) {
      console.error('Error deleting referencing share:', error);
      throw error;
    }
  }

  async loadDraft(propertyId: string, draftId: string): Promise<any> {
    try {
      const response = await apiService.get(referencingPath(`forms/${draftId || propertyId}`));
      return response.data ?? { success: true, data: null };
    } catch (error) {
      console.error('Error loading draft:', error);
      return { success: false, error: 'Failed to load draft' };
    }
  }

  async deleteDraft(propertyId: string, draftId: string): Promise<any> {
    try {
      const response = await apiService.delete(referencingPath(`forms/${draftId || propertyId}`));
      return response.data ?? { success: true };
    } catch (error) {
      console.error('Error deleting draft:', error);
      return { success: false, error: 'Failed to delete draft' };
    }
  }

  async getFormData(userId: string): Promise<any> {
    return this.getApplication(userId);
  }

  async getDrafts(applicationId: string): Promise<any> {
    try {
      const response = await apiService.get(referencingPath('forms/all'));
      return response.data ?? { success: true, data: [] };
    } catch (error) {
      console.error('Error fetching drafts:', error);
      return { success: false, data: [] };
    }
  }

  /** Allow longer timeout — backend runs file uploads + Firestore writes on submit. */
  private static readonly SUBMIT_TIMEOUT_MS = 120_000;

  async submitApplication(userId: string, data: any): Promise<any> {
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

const serviceInstance = new ReferencingService();

export const saveIdentityData = (data: any) => serviceInstance.saveIdentityData(data);
export const saveEmploymentData = (data: any) => serviceInstance.saveEmploymentData(data);
export const saveResidentialData = (data: any) => serviceInstance.saveResidentialData(data);
export const saveFinancialData = (data: any) => serviceInstance.saveFinancialData(data);
export const saveGuarantorData = (data: any) => serviceInstance.saveGuarantorData(data);
export const saveAgentDetailsData = (data: any) => serviceInstance.saveAgentDetailsData(data);
export const saveSectionData = (userId: string, section: string, data: any) => serviceInstance.saveSectionData(userId, section, data);
export const getFormData = (userId: string) => serviceInstance.getFormData(userId);
export const getApplication = (applicationId: string) => serviceInstance.getApplication(applicationId);
export const createApplication = (propertyId: string) => serviceInstance.createApplication(propertyId);
export const uploadDocument = (
  applicationId: string,
  section: string,
  file: File,
  field: string,
  onProgress?: (progress: number) => void,
) => serviceInstance.uploadDocument(applicationId, section, file, field, onProgress);
export const saveDraft = (applicationId: string, name: string, data: any) => serviceInstance.saveDraft(applicationId, name, data);
export const loadDraft = (propertyId: string, draftId: string) => serviceInstance.loadDraft(propertyId, draftId);
export const deleteDraft = (propertyId: string, draftId: string) => serviceInstance.deleteDraft(propertyId, draftId);
export const getDrafts = (applicationId: string) => serviceInstance.getDrafts(applicationId);
export const sharePassport = (data: any) => serviceInstance.sharePassport(data);
export const getShares = () => serviceInstance.getShares();
export const deleteShare = (shareId: string) => serviceInstance.deleteShare(shareId);
export const submitApplication = (userId: string, data: any) => serviceInstance.submitApplication(userId, data);

export default serviceInstance;
