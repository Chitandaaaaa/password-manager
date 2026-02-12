// 类型定义

// ==================== 会员订阅相关 ====================

export type BillingMode = 'time' | 'traffic';
export type UnitType = 'GB' | 'MB' | '次' | 'Token';

export const BILLING_MODE_LABELS: Record<BillingMode, string> = {
  time: '时间制',
  traffic: '流量制',
};

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  GB: 'GB',
  MB: 'MB',
  '次': '次',
  Token: 'Token',
};

export interface Subscription {
  id: string;                    // 唯一ID
  serviceName: string;           // 服务名称
  category: 'video' | 'music' | 'game' | 'software' | 'cloud' | 'shopping' | 'other';
  level: 'basic' | 'premium' | 'ultimate';  // 等级：基础/高级/终极
  billingMode: BillingMode;      // 计费模式：时间制/流量制
  
  // 时间制字段
  startDate?: string;            // 开始日期 (ISO 8601)
  endDate?: string;              // 到期日期 (ISO 8601)
  
  // 流量制字段
  totalAmount?: number;          // 总量
  usedAmount?: number;           // 已用量
  unit?: UnitType;               // 单位
  
  cost?: number;                 // 费用（可选）
  autoRenew: boolean;            // 是否自动续费
  note?: string;                 // 备注
  createdAt: string;
  updatedAt: string;
}

// ==================== 通知配置相关 ====================

export interface NotificationConfig {
  // 系统通知
  systemNotification: {
    enabled: boolean;            // 是否启用系统通知
    remindDays: number;          // 提前几天提醒（默认7天）
  };
  
  // 邮件通知
  emailNotification: {
    enabled: boolean;            // 是否启用邮件通知
    smtpHost: string;            // SMTP服务器
    smtpPort: number;            // SMTP端口（默认587）
    fromEmail: string;           // 发件邮箱
    authCode: string;            // 授权码（不是密码）
    toEmail: string;             // 收件邮箱
    remindDays: number;          // 提前几天提醒（默认7天）
    remindTime: string;          // 提醒时间（格式：09:00）
  };
  
  // 上次检查时间
  lastCheckTime?: string;
}

// ==================== 登录类型 ====================

export type LoginType = 'password' | 'sms_code' | 'email';

export const LOGIN_TYPE_LABELS: Record<LoginType, string> = {
  password: '密码登录',
  sms_code: '短信验证码',
  email: '邮箱登录',
};

// ==================== 密码相关 ====================

export interface Password {
  id: number;
  softwareName: string;
  username?: string;
  loginType: LoginType;           // 登录方式
  password?: string;              // 密码（密码登录时必填）
  phoneNumber?: string;           // 手机号（短信验证码登录时必填）
  email?: string;                 // 邮箱（邮箱登录时必填）
  url?: string;
  notes?: string;
  category: string;
  subscriptions: Subscription[];  // 会员订阅列表
  createdAt: string;
  updatedAt: string;
}

// 表单数据类型
export interface PasswordFormData {
  softwareName: string;
  username: string;
  loginType: LoginType;
  password: string;
  phoneNumber: string;
  email: string;
  url: string;
  notes: string;
  category: string;
}

// API 返回的原始数据类型（snake_case）
export interface PasswordRecordAPI {
  id: number;
  software_name: string;
  username?: string;
  login_type: LoginType;
  encrypted_password?: string;
  phone_number?: string;
  email?: string;
  url?: string;
  notes?: string;
  category: string;
  subscriptions: string; // JSON string
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

// 分类映射（用于显示）
export const CATEGORY_LABELS: Record<Subscription['category'], string> = {
  video: '视频',
  music: '音乐',
  game: '游戏',
  software: '软件',
  cloud: '云存储',
  shopping: '购物',
  other: '其他',
};

// 等级映射（用于显示）
export const LEVEL_LABELS: Record<Subscription['level'], string> = {
  basic: '基础版',
  premium: '高级版',
  ultimate: '终极版',
};
