import { normalizePhone } from '../phone';

describe('normalizePhone', () => {
  it('should return null for null or undefined', () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });

  it('should return valid E.164 numbers unchanged', () => {
    expect(normalizePhone('+447123456789')).toBe('+447123456789');
    expect(normalizePhone('+14155552671')).toBe('+14155552671');
    expect(normalizePhone('+353871234567')).toBe('+353871234567');
  });

  it('should clean spaces, dashes, and parentheses from valid E.164 numbers', () => {
    expect(normalizePhone('+44 7123 456 789')).toBe('+447123456789');
    expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
  });

  it('should convert UK numbers starting with 0 to +44 format', () => {
    expect(normalizePhone('07123456789')).toBe('+447123456789');
    expect(normalizePhone('08001111')).toBe('+448001111');
    expect(normalizePhone('020 7123 4567')).toBe('+442071234567');
  });

  it('should return null and warn for completely invalid phone numbers', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    expect(normalizePhone('invalid_string')).toBeNull();
    expect(normalizePhone('123')).toBeNull(); // Too short
    expect(normalizePhone('+44123')).toBeNull(); // Too short for E.164
    expect(normalizePhone('0')).toBeNull(); // Invalid
    
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
    
    consoleWarnSpy.mockRestore();
  });
  
  it('should include propertyId in warning when provided', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    expect(normalizePhone('invalid_string', 'prop_123')).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('prop_123'));
    
    consoleWarnSpy.mockRestore();
  });
});
