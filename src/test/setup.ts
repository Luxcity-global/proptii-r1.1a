import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers as any);

// Mock scrollIntoView which is missing in JSDOM
if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Cleanup after each test case
afterEach(() => {
    cleanup();
}); 