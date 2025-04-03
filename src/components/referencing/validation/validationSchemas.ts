import * as yup from 'yup';
import { FormSection } from '../../../types/referencing';

// Regular expressions for validation
const PHONE_REGEX = /^(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format

// Identity section validation schema
export const identitySchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Invalid email format')
    .email('Invalid email format'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Invalid phone number format'),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required')
    .matches(DATE_REGEX, 'Date must be in YYYY-MM-DD format')
    .test('is-adult', 'You must be at least 18 years old', (value) => {
      if (!value) return false;
      const dob = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    }),
  isBritish: yup.boolean(),
  nationality: yup.string().required('Nationality is required'),
  identityProof: yup.mixed().when(['isBritish'], {
    is: (isBritish: boolean) => isBritish === false,
    then: (schema) => schema.required('Identity proof is required for non-British citizens'),
    otherwise: (schema) => schema.nullable()
  })
});

// Employment section validation schema
export const employmentSchema = yup.object().shape({
  employmentStatus: yup
    .string()
    .required('Employment status is required')
    .oneOf(
      ['employed', 'self-employed', 'unemployed', 'retired', 'student'],
      'Invalid employment status'
    ),
  companyDetails: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema.required('Company details are required'),
    otherwise: (schema) => schema.nullable()
  }),
  lengthOfEmployment: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema.required('Length of employment is required'),
    otherwise: (schema) => schema.nullable()
  }),
  jobPosition: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed',
    then: (schema) => schema.required('Job position is required'),
    otherwise: (schema) => schema.nullable()
  }),
  referenceFullName: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema.required('Reference full name is required'),
    otherwise: (schema) => schema.nullable()
  }),
  referenceEmail: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema
      .required('Reference email is required')
      .matches(EMAIL_REGEX, 'Invalid email format')
      .email('Invalid email format'),
    otherwise: (schema) => schema.nullable()
  }),
  referencePhone: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema
      .required('Reference phone is required')
      .matches(PHONE_REGEX, 'Invalid phone number format'),
    otherwise: (schema) => schema.nullable()
  }),
  proofType: yup.string().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema.required('Proof type is required'),
    otherwise: (schema) => schema.nullable()
  }),
  proofDocument: yup.mixed().when(['employmentStatus'], {
    is: (status: string) => status === 'employed' || status === 'self-employed',
    then: (schema) => schema.required('Proof document is required'),
    otherwise: (schema) => schema.nullable()
  })
});

// Residential section validation schema
export const residentialSchema = yup.object().shape({
  currentAddress: yup.string().required('Current address is required'),
  durationAtCurrentAddress: yup.string().required('Duration at current address is required'),
  previousAddress: yup.string().when(['durationAtCurrentAddress'], {
    is: (duration: string) => {
      // If duration is less than 3 years, require previous address
      const match = duration.match(/(\d+)/);
      if (!match) return false;
      const years = parseInt(match[0], 10);
      return years < 3;
    },
    then: (schema) => schema.required('Previous address is required for less than 3 years at current address'),
    otherwise: (schema) => schema.nullable()
  }),
  durationAtPreviousAddress: yup.string().when(['previousAddress'], {
    is: (address: string) => !!address && address.length > 0,
    then: (schema) => schema.required('Duration at previous address is required'),
    otherwise: (schema) => schema.nullable()
  }),
  reasonForLeaving: yup.string().when(['previousAddress'], {
    is: (address: string) => !!address && address.length > 0,
    then: (schema) => schema.required('Reason for leaving is required'),
    otherwise: (schema) => schema.nullable()
  }),
  proofType: yup.string().required('Proof type is required'),
  proofDocument: yup.mixed().required('Proof document is required')
});

// Financial section validation schema
export const financialSchema = yup.object().shape({
  proofOfIncomeType: yup
    .string()
    .required('Proof of income type is required')
    .oneOf(
      ['bank_statements', 'payslips', 'tax_return', 'accountant_letter', 'other'],
      'Invalid proof of income type'
    ),
  proofOfIncomeDocument: yup.mixed().when(['useOpenBanking'], {
    is: (useOpenBanking: boolean) => useOpenBanking === false,
    then: (schema) => schema.required('Proof of income document is required'),
    otherwise: (schema) => schema.nullable()
  }),
  useOpenBanking: yup.boolean(),
  isConnectedToOpenBanking: yup.boolean().when(['useOpenBanking'], {
    is: (useOpenBanking: boolean) => useOpenBanking === true,
    then: (schema) => schema.oneOf([true], 'Open Banking connection is required'),
    otherwise: (schema) => schema.nullable()
  })
});

// Guarantor section validation schema
export const guarantorSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Invalid email format')
    .email('Invalid email format'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Invalid phone number format'),
  address: yup.string().required('Address is required'),
  identityDocument: yup.mixed().nullable().test(
    'fileType',
    'Invalid file type. Please upload an image or PDF',
    (value) => {
      if (!value) return true;
      return ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes((value as File).type);
    }
  ).test(
    'fileSize',
    'File too large. Maximum size is 5MB',
    (value) => {
      if (!value) return true;
      return (value as File).size <= 5 * 1024 * 1024; // 5MB
    }
  )
});

// Credit check section validation schema
export const creditCheckSchema = yup.object().shape({
  hasAgreedToCheck: yup
    .boolean()
    .oneOf([true], 'You must agree to the credit check to proceed'),
  additionalDocument: yup.mixed().nullable().test(
    'fileType',
    'Invalid file type. Please upload an image or PDF',
    (value) => {
      if (!value) return true;
      return ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes((value as File).type);
    }
  ).test(
    'fileSize',
    'File too large. Maximum size is 5MB',
    (value) => {
      if (!value) return true;
      return (value as File).size <= 5 * 1024 * 1024; // 5MB
    }
  )
});

// Map of section names to validation schemas
export const validationSchemas: Record<FormSection, yup.ObjectSchema<any>> = {
  identity: identitySchema,
  employment: employmentSchema,
  residential: residentialSchema,
  financial: financialSchema,
  guarantor: guarantorSchema,
  creditCheck: creditCheckSchema
};

// Function to validate a specific section
export const validateSection = async (
  section: FormSection,
  data: any
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    const schema = validationSchemas[section];
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Validation failed' } };
  }
};

export default validationSchemas; 