export type ReferencingStepStatus = { [key: number]: 'empty' | 'partial' | 'complete' };

/** Guarantor (step 5) is optional and does not count towards completeness. */
export const REQUIRED_REFERENCING_STEPS = [1, 2, 3, 4] as const;
export const OPTIONAL_REFERENCING_STEPS = [5] as const;

export function isReferencingStepOptional(step: number): boolean {
  return (OPTIONAL_REFERENCING_STEPS as readonly number[]).includes(step);
}

export function getReferencingProgress(
  formData: any,
  stepStatus: ReferencingStepStatus | undefined
): { completed: number; total: number; percent: number } {
  const total = REQUIRED_REFERENCING_STEPS.length;
  const completed = REQUIRED_REFERENCING_STEPS.filter((step) =>
    isReferencingStepComplete(formData, stepStatus, step)
  ).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

// The referencing modal used to save an untouched guarantor step as 'complete'.
function hasGuarantorDetails(formData: any): boolean {
  if (formData.guarantorInvitation?.status === 'completed') return true;
  const guarantor = formData.guarantor;
  if (!guarantor || typeof guarantor !== 'object') return false;
  return Object.values(guarantor).some((value) => value !== null && value !== undefined && value !== '' && value !== false);
}

export function isReferencingStepComplete(
  formData: any,
  stepStatus: ReferencingStepStatus | undefined,
  step: number
): boolean {
  if (!formData) return false;
  if (stepStatus?.[step] === 'complete' && (step !== 5 || hasGuarantorDetails(formData))) return true;

  switch (step) {
    case 1:
      return !!(
        formData.identity?.firstName &&
        formData.identity?.lastName &&
        formData.identity?.email &&
        (formData.identity?.identityProof || formData.identity?.dateOfBirth)
      );
    case 2:
      return !!(
        formData.employment?.employmentStatus &&
        (['Unemployed', 'Retired', 'Student'].includes(formData.employment?.employmentStatus) ||
          formData.employment?.companyDetails ||
          formData.employment?.jobPosition)
      );
    case 3:
      return !!(formData.residential?.currentAddress && formData.residential?.durationAtCurrentAddress);
    case 4:
      return !!(
        formData.financial?.monthlyIncome ||
        formData.financial?.proofOfIncomeDocument ||
        formData.financial?.useOpenBanking
      );
    case 5:
      return !!(
        formData.guarantor?.verifiedViaLink ||
        formData.guarantorInvitation?.status === 'completed' ||
        (formData.guarantor?.firstName && formData.guarantor?.lastName && formData.guarantor?.email)
      );
    default:
      return false;
  }
}