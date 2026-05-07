import { parsePhoneNumber, isValidPhoneNumber, ParseError } from 'libphonenumber-js';

/**
 * The result type returned by `normalisePhone`.
 *
 * On success, `e164` is a string matching `^\+[1-9]\d{6,14}$`.
 * On failure, `field`, `rawValue`, and `reason` are all non-empty strings.
 */
export type PhoneNormaliseResult =
    | { success: true; e164: string }
    | { success: false; field: string; rawValue: string; reason: string };

/**
 * Converts a raw phone string to E.164 format.
 *
 * @param raw           The raw phone string to normalise (may contain spaces,
 *                      hyphens, parentheses, or leading zeros).
 * @param field         The name of the field being validated (included in the
 *                      error result so callers can surface it to the user).
 * @param defaultRegion An optional ISO 3166-1 alpha-2 region code (e.g. "GB",
 *                      "US") used when the raw string has no country prefix.
 *                      Defaults to "GB" when omitted.
 * @returns             A `PhoneNormaliseResult` union — either
 *                      `{ success: true, e164 }` or
 *                      `{ success: false, field, rawValue, reason }`.
 */
export function normalisePhone(
    raw: string,
    field: string,
    defaultRegion: string = 'GB',
): PhoneNormaliseResult {
    // Reject obviously unparseable inputs early to avoid misleading parse errors.
    if (!raw || raw.trim().length === 0) {
        return {
            success: false,
            field,
            rawValue: raw,
            reason: 'Phone number must not be empty',
        };
    }

    // Strip only characters that are not meaningful to the parser so that
    // libphonenumber-js can handle the rest (spaces, hyphens, parens, etc.).
    const stripped = raw.trim();

    // Count the digit characters in the input. Strings with fewer than 7 digits
    // cannot form a valid phone number under any numbering plan.
    const digitCount = (stripped.match(/\d/g) ?? []).length;
    if (digitCount < 7) {
        return {
            success: false,
            field,
            rawValue: raw,
            reason: `Phone number contains too few digits (${digitCount}); at least 7 are required`,
        };
    }

    try {
        const parsed = parsePhoneNumber(stripped, defaultRegion as Parameters<typeof parsePhoneNumber>[1]);

        if (!parsed || !parsed.isValid()) {
            return {
                success: false,
                field,
                rawValue: raw,
                reason: 'Phone number is not valid for the detected or specified region',
            };
        }

        const e164 = parsed.format('E.164');

        // Belt-and-suspenders: verify the formatted string matches the E.164 pattern
        // required by the spec (§2.6): ^\+[1-9]\d{6,14}$
        if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
            return {
                success: false,
                field,
                rawValue: raw,
                reason: `Normalised value "${e164}" does not match the required E.164 pattern`,
            };
        }

        return { success: true, e164 };
    } catch (err) {
        const reason =
            err instanceof ParseError
                ? `Parse error: ${err.message}`
                : err instanceof Error
                    ? err.message
                    : 'Unknown parse error';

        return {
            success: false,
            field,
            rawValue: raw,
            reason,
        };
    }
}
