// Feature: proptii-communication, Property 1: Phone normalisation produces valid E.164 for parseable inputs
// Feature: proptii-communication, Property 2: Phone normalisation returns structured error for unparseable inputs

/**
 * Property 1: Phone normalisation produces valid E.164 for parseable inputs
 *
 * Validates: Requirements 2.1, 2.5
 *
 * For any string that `normalisePhone` considers parseable (i.e. `success === true`),
 * the returned `e164` value MUST match the E.164 pattern `^\+[1-9]\d{6,14}$`.
 */

import * as fc from 'fast-check';
import { normalisePhone } from '../../phoneNormaliser';

// E.164 pattern as specified in the design (§2.6)
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Arbitrary that generates strings containing at least 7 digit characters,
 * which is the minimum required for a parseable phone number.
 *
 * Strategy: generate a string of 7–15 digits (the core number), optionally
 * prefixed with a '+' and/or interspersed with common formatting characters
 * (spaces, hyphens, parentheses). This covers the realistic input space while
 * keeping the generator focused on strings that have a chance of being valid.
 */
const phonelikeString = fc.oneof(
    // Plain digit strings (7–15 digits) — local number format
    fc.stringMatching(/^\d{7,15}$/),
    // Digit strings with spaces
    fc.stringMatching(/^\d{3,5} \d{3,5} \d{3,5}$/),
    // E.164-style with country code prefix
    fc.stringMatching(/^\+[1-9]\d{6,14}$/),
    // UK-style with leading zero
    fc.stringMatching(/^0[1-9]\d{8,9}$/),
    // US-style with country code and formatting
    fc.stringMatching(/^\+1[2-9]\d{9}$/),
    // Numbers with parentheses and hyphens
    fc.stringMatching(/^\(\d{3}\) \d{3}-\d{4}$/),
);

/**
 * Property 2: Phone normalisation returns structured error for unparseable inputs
 *
 * Validates: Requirements 2.2
 *
 * For any string that `normalisePhone` cannot parse (i.e. `success === false`),
 * the returned error object MUST have non-empty `field` and `rawValue` strings.
 */

/**
 * Arbitrary that generates strings that cannot be parsed as phone numbers:
 * - Purely alphabetic strings (no digits at all)
 * - Very short strings (< 7 chars) with no digits
 * - Random alphanumeric strings that don't form valid phone numbers
 */
const unparseable = fc.oneof(
    // Purely alphabetic strings — no digits whatsoever
    fc.stringMatching(/^[a-zA-Z]{1,20}$/),
    // Short strings with no digits (< 7 chars)
    fc.stringMatching(/^[^0-9]{1,6}$/),
    // Alphanumeric strings that are too short to be a phone number (< 7 digits)
    fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/),
);

describe('Property 2: Phone normalisation returns structured error for unparseable inputs', () => {
    it('whenever normalisePhone returns failure, field is a non-empty string', () => {
        fc.assert(
            fc.property(unparseable, fc.string({ minLength: 1 }), (raw, fieldName) => {
                const result = normalisePhone(raw, fieldName);

                if (!result.success) {
                    // The core property: any failed normalisation MUST include a non-empty field
                    expect(result.field).toBeTruthy();
                    expect(result.field.length).toBeGreaterThan(0);
                }
            }),
            { numRuns: 25 },
        );
    });

    it('whenever normalisePhone returns failure, rawValue is a non-empty string', () => {
        fc.assert(
            fc.property(unparseable, fc.string({ minLength: 1 }), (raw, fieldName) => {
                const result = normalisePhone(raw, fieldName);

                if (!result.success) {
                    // The core property: any failed normalisation MUST include a non-empty rawValue
                    expect(result.rawValue).toBeTruthy();
                    expect(result.rawValue.length).toBeGreaterThan(0);
                }
            }),
            { numRuns: 25 },
        );
    });

    it('purely alphabetic strings always produce success === false with non-empty field and rawValue', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z]{3,20}$/),
                fc.string({ minLength: 1 }),
                (raw, fieldName) => {
                    const result = normalisePhone(raw, fieldName);

                    // Purely alphabetic strings have no digits, so they must always fail
                    expect(result.success).toBe(false);

                    if (!result.success) {
                        expect(result.field).toBeTruthy();
                        expect(result.field.length).toBeGreaterThan(0);
                        expect(result.rawValue).toBeTruthy();
                        expect(result.rawValue.length).toBeGreaterThan(0);
                    }
                },
            ),
            { numRuns: 25 },
        );
    });

    it('field in error result always equals the field argument passed to normalisePhone', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z]{3,20}$/),
                fc.string({ minLength: 1 }),
                (raw, fieldName) => {
                    const result = normalisePhone(raw, fieldName);

                    if (!result.success) {
                        // The field in the error must match what was passed in
                        expect(result.field).toBe(fieldName);
                    }
                },
            ),
            { numRuns: 25 },
        );
    });

    it('rawValue in error result always equals the raw input passed to normalisePhone', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z]{3,20}$/),
                fc.string({ minLength: 1 }),
                (raw, fieldName) => {
                    const result = normalisePhone(raw, fieldName);

                    if (!result.success) {
                        // The rawValue in the error must match the original input
                        expect(result.rawValue).toBe(raw);
                    }
                },
            ),
            { numRuns: 25 },
        );
    });
});

describe('Property 1: Phone normalisation produces valid E.164 for parseable inputs', () => {
    it('whenever normalisePhone returns success, e164 matches the E.164 pattern', () => {
        fc.assert(
            fc.property(phonelikeString, (raw) => {
                const result = normalisePhone(raw, 'phone', 'GB');

                if (result.success) {
                    // The core property: any successful normalisation MUST produce
                    // a string matching the E.164 pattern ^\+[1-9]\d{6,14}$
                    expect(result.e164).toMatch(E164_PATTERN);
                }
                // When success === false, no assertion is needed — the property
                // only constrains the success path.
            }),
            { numRuns: 25 },
        );
    });

    it('e164 length is between 8 and 16 characters (+ sign plus 7–15 digits)', () => {
        fc.assert(
            fc.property(phonelikeString, (raw) => {
                const result = normalisePhone(raw, 'phone', 'GB');

                if (result.success) {
                    // E.164: '+' + country code (1–3 digits) + subscriber (min 4 digits)
                    // Total: minimum 8 chars (+1XXXXXXX), maximum 16 chars (+XXXXXXXXXXXXXXX)
                    expect(result.e164.length).toBeGreaterThanOrEqual(8);
                    expect(result.e164.length).toBeLessThanOrEqual(16);
                }
            }),
            { numRuns: 25 },
        );
    });

    it('e164 always starts with + followed by a non-zero digit', () => {
        fc.assert(
            fc.property(phonelikeString, (raw) => {
                const result = normalisePhone(raw, 'phone', 'GB');

                if (result.success) {
                    expect(result.e164[0]).toBe('+');
                    expect(result.e164[1]).toMatch(/[1-9]/);
                }
            }),
            { numRuns: 25 },
        );
    });

    it('e164 contains only digits after the leading + sign', () => {
        fc.assert(
            fc.property(phonelikeString, (raw) => {
                const result = normalisePhone(raw, 'phone', 'GB');

                if (result.success) {
                    const digitsOnly = result.e164.slice(1);
                    expect(digitsOnly).toMatch(/^\d+$/);
                }
            }),
            { numRuns: 25 },
        );
    });
});
