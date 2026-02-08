// 类型定义

// 前端使用的密码类型（与显示一致）
export interface Password {
  id: number;
  softwareName: string;
  username?: string;
  url?: string;
  notes?: string;
  category: string; // 必须与数据库一致，不为空
  createdAt: string;
  updatedAt: string;
}

// 表单数据类型
export interface PasswordFormData {
  softwareName: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
}

// API 返回的原始数据类型（snake_case）
export interface PasswordRecordAPI {
  id: number;
  software_name: string;
  username?: string;
  url?: string;
  notes?: string;
  category: string; // 必须与前端一致
  created_at: string;
  updated_at: string;
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
