import { FormData } from '../types/referencing';
import { DashboardSummary } from '../mocks/dashboardApi';
import { StorageManager } from '../utils/storageManager';

/**
 * Service to read referencing form data from localStorage and convert it to dashboard format
 */
export class ReferencingProgressService {
  /**
   * Read form data from localStorage for a specific user
   */
  static getFormDataFromStorage(userId: string): FormData | null {
    try {
      const storageKey = `${userId}_formData`;
      return StorageManager.getItem(storageKey);
    } catch (error) {
      console.error('Error reading form data from localStorage:', error);
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
      data.jobPosition?.trim()
    );
  }

  /**
   * Check if residential section is completed
   */
  private static isResidentialCompleted(data: any): boolean {
    return !!(
      data.currentAddress?.trim() &&
      data.durationAtCurrentAddress?.trim()
    );
  }

  /**
   * Check if financial section is completed
   */
  private static isFinancialCompleted(data: any): boolean {
    return !!(
      data.proofOfIncomeType?.trim() ||
      data.proofOfIncomeDocument ||
      data.openBankingConsent === true
    );
  }

  /**
   * Check if guarantor section is completed
   */
  private static isGuarantorCompleted(data: any): boolean {
    // Guarantor might be optional, so we check if it's either completed or explicitly skipped
    return !!(
      (data.firstName?.trim() && data.lastName?.trim() && data.email?.trim()) ||
      data.isNotRequired === true
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
      data.agentName?.trim() &&
      data.agentEmail?.trim() &&
      data.agentPhone?.trim()
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
    const progressData = this.calculateProgress(formData);
    
    return {
      status: progressData.progress === 0 ? 'not_started' : 
              progressData.progress === 100 ? 'completed' : 'in_progress',
      progress: progressData.progress,
      completedSteps: progressData.completedSteps,
      totalSteps: progressData.totalSteps,
      ...progressData.sectionStatus
    };
  }

  /**
   * Get current step from localStorage
   */
  static getCurrentStep(userId: string): number {
    try {
      const storageKey = `${userId}_currentStep`;
      const currentStep = StorageManager.getItem(storageKey);
      return currentStep ? parseInt(currentStep, 10) : 1;
    } catch (error) {
      console.error('Error reading current step from localStorage:', error);
      return 1;
    }
  }

  /**
   * Get last saved timestamp from localStorage
   */
  static getLastSaved(userId: string): Date | null {
    try {
      const storageKey = `${userId}_lastSaved`;
      const lastSaved = StorageManager.getItem(storageKey);
      return lastSaved ? new Date(parseInt(lastSaved, 10)) : null;
    } catch (error) {
      console.error('Error reading last saved timestamp from localStorage:', error);
      return null;
    }
  }
}
