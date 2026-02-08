import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock electronAPI
declare global {
  interface Window {
    electronAPI: {
      checkSetup: () => Promise<boolean>;
      setup: (password: string) => Promise<{ success: boolean; error?: string }>;
      login: (password: string) => Promise<{ success: boolean; error?: string }>;
      logout: () => Promise<{ success: boolean; error?: string }>;
      resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
      addPassword: (data: any) => Promise<{ success: boolean; id?: number; error?: string }>;
      updatePassword: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
      deletePassword: (id: number) => Promise<{ success: boolean; error?: string }>;
      listPasswords: (filters?: any) => Promise<{ success: boolean; passwords?: any[]; error?: string }>;
      decryptPassword: (id: number) => Promise<{ success: boolean; password?: string; error?: string }>;
      copyPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
      clearAllPasswords: () => Promise<{ success: boolean; error?: string }>;
      listCategories: () => Promise<{ success: boolean; categories?: string[]; error?: string }>;
      addCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
      deleteCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
      renameCategory: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
      getDisplayCategories: () => Promise<{ success: boolean; categories?: string[]; error?: string }>;
      updateDisplayCategories: (categories: string[]) => Promise<{ success: boolean; error?: string }>;
      getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
      updateConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      checkOllama: (config: any) => Promise<{ available: boolean; message: string }>;
      smartImport: (filePath: string, options: any) => Promise<{ success: boolean; passwords?: any[]; error?: string }>;
      exportPasswords: (format: 'json' | 'csv') => Promise<{ success: boolean; data?: string; error?: string }>;
      onAppLock: (callback: () => void) => void;
    };
  }
}

// Setup mock electronAPI before each test
beforeEach(() => {
  window.electronAPI = {
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
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
