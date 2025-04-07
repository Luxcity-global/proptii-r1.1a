import { z } from 'zod';

// Identity section schema
export const identitySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  isBritish: z.boolean(),
  nationality: z.string().min(1, 'Nationality is required'),
  identityProof: z.any().optional() // File validation is handled separately
});

// Employment section schema
export const employmentSchema = z.object({
  employmentStatus: z.string().min(1, 'Employment status is required'),
  companyDetails: z.string().min(1, 'Company details are required'),
  lengthOfEmployment: z.string().min(1, 'Length of employment is required'),
  jobPosition: z.string().min(1, 'Job position is required'),
  referenceFullName: z.string().min(1, 'Reference full name is required'),
  referenceEmail: z.string().email('Invalid reference email address'),
  referencePhone: z.string().min(1, 'Reference phone number is required'),
  proofType: z.string().min(1, 'Proof type is required'),
  proofDocument: z.any().optional() // File validation is handled separately
});

// Residential section schema
export const residentialSchema = z.object({
  currentAddress: z.string().min(1, 'Current address is required'),
  durationAtCurrentAddress: z.string().min(1, 'Duration at current address is required'),
  previousAddress: z.string().optional(),
  durationAtPreviousAddress: z.string().optional(),
  reasonForLeaving: z.string().optional(),
  proofType: z.string().min(1, 'Proof type is required'),
  proofDocument: z.any().optional() // File validation is handled separately
});

// Financial section schema
export const financialSchema = z.object({
  proofOfIncomeType: z.string().min(1, 'Proof of income type is required'),
  proofOfIncomeDocument: z.any().optional(), // File validation is handled separately
  useOpenBanking: z.boolean(),
  isConnectedToOpenBanking: z.boolean()
});

// Guarantor section schema
export const guarantorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required')
});

// Credit check section schema
export const creditCheckSchema = z.object({
  hasAgreedToCheck: z.boolean().refine(val => val === true, {
    message: 'You must agree to the credit check'
  })
});

// Complete form schema
export const formSchema = z.object({
  identity: identitySchema,
  employment: employmentSchema,
  residential: residentialSchema,
  financial: financialSchema,
  guarantor: guarantorSchema,
  creditCheck: creditCheckSchema
});

// Helper function to validate a specific section
export const validateSection = <T extends keyof typeof formSchema.shape>(
  section: T,
  data: unknown
) => {
  const schema = formSchema.shape[section] as z.ZodType<any>;
  return schema.safeParse(data);
};

// Helper function to validate file uploads
export const validateFile = (file: File | null, options: { 
  required?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}) => {
  const { required = false, maxSize = 10 * 1024 * 1024, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'] } = options;
  
  if (!file) {
    return required ? { valid: false, error: 'File is required' } : { valid: true };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
  }
  
  return { valid: true };
}; 