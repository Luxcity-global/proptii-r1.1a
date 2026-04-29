export function normalizePhone(raw: string | null | undefined, propertyId?: string): string | null {
  if (!raw) return null;
  
  // Clean string
  let cleaned = raw.replace(/[\s\-\(\)]/g, '');
  
  // E.164 Regex for UK and international (basic matching)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  
  if (e164Regex.test(cleaned)) {
    return cleaned;
  }
  
  // Prepend +44 and strip 0 for 07, 08, etc.
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.substring(1);
    if (e164Regex.test(cleaned)) {
      return cleaned;
    }
  }

  // Not a valid E.164 number after transformation
  console.warn(`[normalizePhone] Invalid phone number detected${propertyId ? ` for property ${propertyId}` : ''}: "${raw}"`);
  return null;
}
