import { normalisePhone, PhoneNormaliseResult } from '../phoneNormaliser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert the result is a success and return the e164 value. */
function assertSuccess(result: PhoneNormaliseResult): string {
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');
    return result.e164;
}

/** Assert the result is a failure and return the error object. */
function assertFailure(
    result: PhoneNormaliseResult,
): { field: string; rawValue: string; reason: string } {
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected failure');
    return { field: result.field, rawValue: result.rawValue, reason: result.reason };
}

// ---------------------------------------------------------------------------
// E.164 pattern used by the spec (§2.6)
// ---------------------------------------------------------------------------
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

// ---------------------------------------------------------------------------
// Parseable inputs — should return { success: true, e164 }
// ---------------------------------------------------------------------------

describe('normalisePhone — parseable inputs', () => {
    it('normalises a UK mobile number with spaces (07911 123456)', () => {
        const e164 = assertSuccess(normalisePhone('07911 123456', 'phone', 'GB'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+447911123456');
    });

    it('normalises a UK mobile number with leading zero and no spaces (07911123456)', () => {
        const e164 = assertSuccess(normalisePhone('07911123456', 'phone', 'GB'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+447911123456');
    });

    it('normalises a US number with country code (+1 202-555-0173)', () => {
        const e164 = assertSuccess(normalisePhone('+1 202-555-0173', 'phone'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+12025550173');
    });

    it('normalises a number with parentheses and hyphens ((020) 7946-0958)', () => {
        // London landline in a common display format
        const e164 = assertSuccess(normalisePhone('(020) 7946-0958', 'phone', 'GB'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+442079460958');
    });

    it('normalises a number that already includes the country code (+447911123456)', () => {
        const e164 = assertSuccess(normalisePhone('+447911123456', 'phone'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+447911123456');
    });
});

// ---------------------------------------------------------------------------
// Unparseable inputs — should return { success: false, field, rawValue, reason }
// ---------------------------------------------------------------------------

describe('normalisePhone — unparseable inputs', () => {
    it('returns a structured error for an empty string', () => {
        const err = assertFailure(normalisePhone('', 'phone'));
        expect(err.field).toBe('phone');
        expect(err.rawValue).toBe('');
        expect(err.reason.length).toBeGreaterThan(0);
    });

    it('returns a structured error for a random alphanumeric string (abc123xyz)', () => {
        const err = assertFailure(normalisePhone('abc123xyz', 'phone'));
        expect(err.field).toBe('phone');
        expect(err.rawValue).toBe('abc123xyz');
        expect(err.reason.length).toBeGreaterThan(0);
    });

    it('returns a structured error for a string shorter than 7 digits (12345)', () => {
        const err = assertFailure(normalisePhone('12345', 'phone'));
        expect(err.field).toBe('phone');
        expect(err.rawValue).toBe('12345');
        expect(err.reason.length).toBeGreaterThan(0);
    });

    it('returns a structured error for a string with exactly 6 digits (123456)', () => {
        const err = assertFailure(normalisePhone('123456', 'phone'));
        expect(err.field).toBe('phone');
        expect(err.rawValue).toBe('123456');
        expect(err.reason.length).toBeGreaterThan(0);
    });

    it('preserves the field name in the error result', () => {
        const err = assertFailure(normalisePhone('not-a-phone', 'agent.phone'));
        expect(err.field).toBe('agent.phone');
    });

    it('preserves the rawValue in the error result', () => {
        const raw = 'not-a-phone';
        const err = assertFailure(normalisePhone(raw, 'phone'));
        expect(err.rawValue).toBe(raw);
    });
});

// ---------------------------------------------------------------------------
// Default region behaviour
// ---------------------------------------------------------------------------

describe('normalisePhone — default region', () => {
    it('defaults to GB when no region is provided for a local UK number', () => {
        // 07911 123456 is only valid with a GB default region
        const e164 = assertSuccess(normalisePhone('07911 123456', 'phone'));
        expect(e164).toBe('+447911123456');
    });

    it('uses the supplied defaultRegion when parsing a local number', () => {
        // 2025550173 is a valid US number when region is US
        const e164 = assertSuccess(normalisePhone('2025550173', 'phone', 'US'));
        expect(e164).toMatch(E164_PATTERN);
        expect(e164).toBe('+12025550173');
    });
});
