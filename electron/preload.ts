import { contextBridge, ipcRenderer } from 'electron';

// 定义 API 类型
export interface ElectronAPI {
  // 认证
  checkSetup: () => Promise<boolean>;
  setup: (password: string) => Promise<{ success: boolean; error?: string }>;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // 密码管理
  addPassword: (data: PasswordData) => Promise<{ success: boolean; id?: number; error?: string }>;
  listPasswords: (filters?: FilterOptions) => Promise<{ success: boolean; passwords?: PasswordRecord[]; error?: string }>;
  decryptPassword: (id: number) => Promise<{ success: boolean; password?: string; error?: string }>;
  updatePassword: (id: number, data: Partial<PasswordData>) => Promise<{ success: boolean; error?: string }>;
  deletePassword: (id: number) => Promise<{ success: boolean; error?: string }>;
  clearAllPasswords: () => Promise<{ success: boolean; error?: string }>;
  generatePassword: (options?: GenerateOptions) => Promise<string>;
  exportPasswords: () => Promise<{ success: boolean; passwords?: any[]; error?: string }>;
  
  // 分类管理
  listCategories: () => Promise<{ success: boolean; categories?: string[]; error?: string }>;
  addCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
  renameCategory: (oldName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  getDisplayCategories: () => Promise<{ success: boolean; categories?: string[]; allCategories?: string[]; displayConfig?: any; error?: string }>;
  updateDisplayCategories: (categories: string[]) => Promise<{ success: boolean; error?: string }>;
  
  // 修改主密码
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Ollama AI
  getOllamaConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateOllamaConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
  checkOllama: (testConfig?: any) => Promise<{ available: boolean; message: string }>;
  parsePasswordsWithAI: (text: string) => Promise<{ success: boolean; entries?: any[]; error?: string }>;

  // 文件导入
  selectFile: () => Promise<{ success: boolean; content?: string; filename?: string; encoding?: string; cancelled?: boolean; error?: string }>;

  // 应用配置
  getConfig: () => Promise<{ success: boolean; config?: any; error?: string }>;
  updateConfig: (config: any) => Promise<{ success: boolean; error?: string }>;

  // 剪贴板
  copyPassword: (password: string) => Promise<{ success: boolean; error?: string }>;

  // 监听应用锁定
  onAppLock: (callback: () => void) => void;
}

export interface PasswordData {
  softwareName: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
}

export interface PasswordRecord {
  id: number;
  software_name: string;
  username?: string;
  url?: string;
  notes?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface FilterOptions {
  search?: string;
  category?: string;
}

export interface GenerateOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

// 暴露 API 到渲染进程
const api: ElectronAPI = {
  // 认证
  checkSetup: () => ipcRenderer.invoke('auth:checkSetup'),
  setup: (password: string) => ipcRenderer.invoke('auth:setup', password),
  login: (password: string) => ipcRenderer.invoke('auth:login', password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  resetPassword: (newPassword: string) => ipcRenderer.invoke('auth:resetPassword', newPassword),
  
  // 密码管理
  addPassword: (data: PasswordData) => ipcRenderer.invoke('password:add', data),
  listPasswords: (filters?: FilterOptions) => ipcRenderer.invoke('password:list', filters),
  decryptPassword: (id: number) => ipcRenderer.invoke('password:decrypt', id),
  updatePassword: (id: number, data: Partial<PasswordData>) => ipcRenderer.invoke('password:update', id, data),
  deletePassword: (id: number) => ipcRenderer.invoke('password:delete', id),
  clearAllPasswords: () => ipcRenderer.invoke('password:clearAll'),
  generatePassword: (options?: GenerateOptions) => ipcRenderer.invoke('password:generate', options),
  exportPasswords: () => ipcRenderer.invoke('password:export'),
  
  // 分类管理
  listCategories: () => ipcRenderer.invoke('category:list'),
  addCategory: (name: string) => ipcRenderer.invoke('category:add', name),
  deleteCategory: (name: string) => ipcRenderer.invoke('category:delete', name),
  renameCategory: (oldName: string, newName: string) => ipcRenderer.invoke('category:rename', oldName, newName),
  getDisplayCategories: () => ipcRenderer.invoke('category:getDisplay'),
  updateDisplayCategories: (categories: string[]) => ipcRenderer.invoke('category:updateDisplay', categories),
  
  // 修改主密码
  changeMasterPassword: (oldPassword: string, newPassword: string) => ipcRenderer.invoke('auth:changePassword', oldPassword, newPassword),

  // Ollama AI
  getOllamaConfig: () => ipcRenderer.invoke('ollama:getConfig'),
  updateOllamaConfig: (config: any) => ipcRenderer.invoke('ollama:updateConfig', config),
  checkOllama: (testConfig?: any) => ipcRenderer.invoke('ollama:check', testConfig),
  parsePasswordsWithAI: (text: string) => ipcRenderer.invoke('ollama:parse', text),

  // 文件导入
  selectFile: () => ipcRenderer.invoke('file:select'),

  // 应用配置
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (config: any) => ipcRenderer.invoke('config:update', config),

  // 剪贴板
  copyPassword: (password: string) => ipcRenderer.invoke('clipboard:copyPassword', password),

  // 监听应用锁定
  onAppLock: (callback: () => void) => ipcRenderer.on('app:lock', callback),
};

contextBridge.exposeInMainWorld('electronAPI', api);

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
