import { DashboardSummary } from '../mocks/dashboardApi';
import { IndexedDBManager } from '../utils/indexedDBManager';

// Define the actual FormData interface that matches what's stored in IndexedDB
interface FormData {
  identity: any;
  employment: any;
  residential: any;
  financial: any;
  guarantor: any;
  creditCheck: any;
  agentDetails: any;
}

// Add interface for file data that matches UserFile structure
export interface ReferencingFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: 'identity' | 'employment' | 'residential' | 'financial' | 'guarantor';
  url: string;
}

/**
 * Service to read referencing form data from localStorage and convert it to dashboard format
 */
export class ReferencingProgressService {
  /**
   * Read form data from IndexedDB for a specific user
   */
  static async getFormDataFromStorage(userId: string): Promise<FormData | null> {
    try {
      const storageKey = `${userId}_formData`;
      return await IndexedDBManager.getItem(storageKey);
    } catch (error) {
      console.error('Error reading form data from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Check if a form section is completed based on its data
   */
  static isSectionCompleted(sectionData: any, sectionName: string): boolean {
    if (!sectionData) return false;

    switch (sectionName) {
      case 'identity':
        return this.isIdentityCompleted(sectionData);
      case 'employment':
        return this.isEmploymentCompleted(sectionData);
      case 'residential':
        return this.isResidentialCompleted(sectionData);
      case 'financial':
        return this.isFinancialCompleted(sectionData);
      case 'guarantor':
        return this.isGuarantorCompleted(sectionData);
      case 'creditCheck':
        return this.isCreditCheckCompleted(sectionData);
      case 'agentDetails':
        return this.isAgentDetailsCompleted(sectionData);
      default:
        return false;
    }
  }

  /**
   * Check if identity section is completed
   */
  private static isIdentityCompleted(data: any): boolean {
    return !!(
      data.firstName?.trim() &&
      data.lastName?.trim() &&
      data.email?.trim() &&
      data.phoneNumber?.trim() &&
      data.dateOfBirth?.trim()
    );
  }

  /**
   * Check if employment section is completed
   */
  private static isEmploymentCompleted(data: any): boolean {
    return !!(
      data.employmentStatus?.trim() &&
      data.companyDetails?.trim() &&
      data.jobPosition?.trim() &&
      data.referenceFullName?.trim() &&
      data.referenceEmail?.trim() &&
      data.referencePhone?.trim()
    );
  }

  /**
   * Check if residential section is completed
   */
  private static isResidentialCompleted(data: any): boolean {
    return !!(
      data.currentAddress?.trim() &&
      data.durationAtCurrentAddress?.trim() &&
      data.proofType?.trim()
    );
  }

  /**
   * Check if financial section is completed
   */
  private static isFinancialCompleted(data: any): boolean {
    return !!(
      data.monthlyIncome?.trim() &&
      (data.proofOfIncomeType?.trim() || data.proofOfIncomeDocument)
    );
  }

  /**
   * Check if guarantor section is completed
   */
  private static isGuarantorCompleted(data: any): boolean {
    return !!(
      data.firstName?.trim() &&
      data.lastName?.trim() &&
      data.email?.trim() &&
      data.phoneNumber?.trim() &&
      data.address?.trim()
    );
  }

  /**
   * Check if credit check section is completed
   */
  private static isCreditCheckCompleted(data: any): boolean {
    return data.hasAgreedToCheck === true;
  }

  /**
   * Check if agent details section is completed
   */
  private static isAgentDetailsCompleted(data: any): boolean {
    return !!(
      data.firstName?.trim() &&
      data.lastName?.trim() &&
      data.email?.trim() &&
      data.phoneNumber?.trim()
    );
  }

  /**
   * Calculate progress percentage based on completed sections
   */
  static calculateProgress(formData: FormData): {
    progress: number;
    completedSteps: number;
    totalSteps: number;
    sectionStatus: {
      identity: boolean;
      employment: boolean;
      residential: boolean;
      financial: boolean;
      guarantor: boolean;
      creditCheck: boolean;
      agentDetails: boolean;
    };
  } {
    const sections = ['identity', 'employment', 'residential', 'financial', 'guarantor', 'creditCheck', 'agentDetails'] as const;
    const sectionStatus = {
      identity: this.isSectionCompleted(formData.identity, 'identity'),
      employment: this.isSectionCompleted(formData.employment, 'employment'),
      residential: this.isSectionCompleted(formData.residential, 'residential'),
      financial: this.isSectionCompleted(formData.financial, 'financial'),
      guarantor: this.isSectionCompleted(formData.guarantor, 'guarantor'),
      creditCheck: this.isSectionCompleted(formData.creditCheck, 'creditCheck'),
      agentDetails: this.isSectionCompleted(formData.agentDetails, 'agentDetails')
    };

    const completedSteps = Object.values(sectionStatus).filter(Boolean).length;
    const totalSteps = sections.length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      progress,
      completedSteps,
      totalSteps,
      sectionStatus
    };
  }

  /**
   * Convert form data to dashboard summary format
   */
  static convertToDashboardSummary(formData: FormData, userId: string): DashboardSummary['referencing'] {
    console.log('🔄 Converting form data to dashboard summary for user:', userId);
    console.log('📋 Input form data:', formData);
    
    const progressData = this.calculateProgress(formData);
    console.log('📊 Calculated progress data:', progressData);
    
    const result: DashboardSummary['referencing'] = {
      status: progressData.progress === 0 ? 'not_started' : 
              progressData.progress === 100 ? 'completed' : 'in_progress',
      progress: progressData.progress,
      completedSteps: progressData.completedSteps,
      totalSteps: progressData.totalSteps,
      ...progressData.sectionStatus
    };
    
    console.log('✅ Final dashboard summary result:', result);
    return result;
  }

  /**
   * Get current step from IndexedDB
   */
  static async getCurrentStep(userId: string): Promise<number> {
    try {
      const storageKey = `${userId}_currentStep`;
      const currentStep = await IndexedDBManager.getItem(storageKey);
      return currentStep ? parseInt(currentStep, 10) : 1;
    } catch (error) {
      console.error('Error reading current step from IndexedDB:', error);
      return 1;
    }
  }

  /**
   * Get last saved timestamp from IndexedDB
   */
  static async getLastSaved(userId: string): Promise<Date | null> {
    try {
      const storageKey = `${userId}_lastSaved`;
      const lastSaved = await IndexedDBManager.getItem(storageKey);
      return lastSaved ? new Date(parseInt(lastSaved, 10)) : null;
    } catch (error) {
      console.error('Error reading last saved timestamp from IndexedDB:', error);
      return null;
    }
  }
}

// Function to get actual uploaded files from referencing form data
export const getReferencingFiles = async (userId?: string): Promise<ReferencingFile[]> => {
  try {
    console.log('🔍 Getting referencing files for user:', userId);
    
    if (!userId) {
      console.log('❌ No user ID provided');
      return [];
    }

    const formData = await ReferencingProgressService.getFormDataFromStorage(userId);
    if (!formData) {
      console.log('❌ No form data found for user:', userId);
      return [];
    }

    const files: ReferencingFile[] = [];
    let fileId = 1;

    // Extract files from each section
    if (formData.identity?.identityProof) {
      const file = formData.identity.identityProof;
      files.push({
        id: `identity_${fileId++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.lastModified).toISOString(),
        category: 'identity',
        url: file.dataUrl // Use dataUrl as the URL for viewing
      });
    }

    if (formData.employment?.proofDocument) {
      const file = formData.employment.proofDocument;
      files.push({
        id: `employment_${fileId++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.lastModified).toISOString(),
        category: 'employment',
        url: file.dataUrl
      });
    }

    if (formData.residential?.proofDocument) {
      const file = formData.residential.proofDocument;
      files.push({
        id: `residential_${fileId++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.lastModified).toISOString(),
        category: 'residential',
        url: file.dataUrl
      });
    }

    if (formData.financial?.proofOfIncomeDocument) {
      const file = formData.financial.proofOfIncomeDocument;
      files.push({
        id: `financial_${fileId++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.lastModified).toISOString(),
        category: 'financial',
        url: file.dataUrl
      });
    }

    if (formData.guarantor?.identityDocument) {
      const file = formData.guarantor.identityDocument;
      files.push({
        id: `guarantor_${fileId++}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(file.lastModified).toISOString(),
        category: 'guarantor',
        url: file.dataUrl
      });
    }

    console.log('📁 Found files:', files.length);
    return files;
  } catch (error) {
    console.error('❌ Error getting referencing files:', error);
    return [];
  }
};
