"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhone = void 0;
function normalizePhone(raw, propertyId) {
    if (!raw)
        return null;
    // Clean string
    var cleaned = raw.replace(/[\s\-\(\)]/g, '');
    // E.164 Regex for UK and international (basic matching)
    var e164Regex = /^\+[1-9]\d{7,14}$/;
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
    console.warn("[normalizePhone] Invalid phone number detected".concat(propertyId ? " for property ".concat(propertyId) : '', ": \"").concat(raw, "\""));
    return null;
}
exports.normalizePhone = normalizePhone;
