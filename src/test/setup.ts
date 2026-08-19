import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers as any);

// Mock scrollIntoView which is missing in JSDOM
if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Global mocks for Firebase SDK in testing environment
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    uploadBytesResumable: vi.fn(),
    deleteObject: vi.fn(),
}));

// Cleanup after each test case
afterEach(() => {
    cleanup();
}); 