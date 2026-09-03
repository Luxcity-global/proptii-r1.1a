/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency (GBP)
 * @param value The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format an ISO date string to a more readable format
 * @param isoDate ISO date string
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "1.2 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}; 

/**
 * Mask an email address for privacy.
 * e.g. "john.smith@example.com" → "jo****h@e***.com"
 * Returns an empty string if the input is falsy.
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;

  // Mask the local part: show first 2 chars, mask middle, show last char
  const maskedLocal =
    local.length <= 3
      ? local[0] + '***'
      : local.slice(0, 2) + '****' + local.slice(-1);

  // Mask the domain: show first char of domain name, mask rest, keep TLD
  const dotIndex = domain.lastIndexOf('.');
  const domainName = dotIndex > 0 ? domain.slice(0, dotIndex) : domain;
  const tld = dotIndex > 0 ? domain.slice(dotIndex) : '';
  const maskedDomain = domainName[0] + '***' + tld;

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number for privacy.
 * Shows first 4 and last 2 digits, masks the rest with ****
 * e.g. "+441174630288" → "+441*****88"
 * Returns an empty string if the input is falsy.
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '•••••';
  const prefix = phone.startsWith('+') ? phone.slice(0, 4) : phone.slice(0, 3);
  const suffix = phone.slice(-2);
  return `${prefix}*****${suffix}`;
}
