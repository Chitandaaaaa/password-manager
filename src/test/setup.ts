import '@testing-library/jest-dom';
import { expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Import mock store setup
import './mock-store';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Setup mock electronAPI before each test
beforeEach(() => {
  (window as any).electronAPI = {
    checkSetup: vi.fn(),
    setup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    addPassword: vi.fn(),
    updatePassword: vi.fn(),
    deletePassword: vi.fn(),
    listPasswords: vi.fn(),
    decryptPassword: vi.fn(),
    copyPassword: vi.fn(),
    clearAllPasswords: vi.fn(),
    listCategories: vi.fn(),
    addCategory: vi.fn(),
    deleteCategory: vi.fn(),
    renameCategory: vi.fn(),
    getDisplayCategories: vi.fn(),
    updateDisplayCategories: vi.fn(),
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    checkOllama: vi.fn(),
    smartImport: vi.fn(),
    exportPasswords: vi.fn(),
    onAppLock: vi.fn(),
    selectFile: vi.fn(),
    parsePasswordsWithAI: vi.fn(),
    generatePassword: vi.fn(),
    changeMasterPassword: vi.fn(),
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
