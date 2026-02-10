import { vi } from 'vitest';

// Mock electron-store before any imports
const mockStoreData = {
  users: [],
  passwords: [],
  categories: ['社交', '工作', '银行', '邮箱', '购物', '其他'],
  config: {
    ollama: {
      enabled: false,
      host: 'http://localhost:11434',
      model: 'llama3.2',
      timeout: 30000,
    },
    autoLock: {
      enabled: true,
      timeout: 5,
    },
    clipboard: {
      autoClear: true,
      timeout: 30,
    },
    displayCategories: {
      enabled: true,
      categories: ['社交', '工作', '银行', '邮箱'],
      maxDisplayCount: 4,
    },
    dangerousOperations: {
      enableClearAll: false,
    },
  },
};

// Create a proper mock class
class MockStore {
  private data: any;

  constructor() {
    this.data = JSON.parse(JSON.stringify(mockStoreData));
  }

  get(key: string) {
    return this.data[key];
  }

  set(key: string, value: any) {
    this.data[key] = value;
  }

  clear() {
    this.data = JSON.parse(JSON.stringify(mockStoreData));
  }
}

// Mock the module
vi.mock('electron-store', () => {
  return {
    default: MockStore,
  };
});
