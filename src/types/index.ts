// 类型定义

export interface Password {
  id: number;
  softwareName: string;
  username?: string;
  url?: string;
  notes?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordFormData {
  softwareName: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
}

export type ViewState = 'login' | 'setup' | 'main';

// 默认分类（仅用于初始化）
export const DEFAULT_CATEGORIES = [
  '社交',
  '工作',
  '银行',
  '邮箱',
  '购物',
  '其他',
] as const;
