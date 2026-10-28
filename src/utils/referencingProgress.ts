export type ReferencingStepStatus = { [key: number]: 'empty' | 'partial' | 'complete' };

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