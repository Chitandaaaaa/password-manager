import { DatabaseService } from './database';
import { CryptoService, EncryptedData } from './crypto';

export type LoginType = 'password' | 'sms_code' | 'email';

export interface PasswordData {
  softwareName: string;
  username?: string;
  loginType: LoginType;
  password?: string;
  phoneNumber?: string;
  email?: string;
  url?: string;
  notes?: string;
  category: string; // 必须与数据库一致，不为空
}

export interface PasswordRecord {
  id: number;
  software_name: string;
  username?: string;
  login_type: LoginType;
  encrypted_password?: string;
  phone_number?: string;
  email?: string;
  url?: string;
  notes?: string;
  category: string; // 必须与数据库一致，不为空
  created_at: string;
  updated_at: string;
}

export class PasswordService {
  private db: DatabaseService;
  private key: Buffer;
  private cryptoService: CryptoService;

  constructor(db: DatabaseService, key: Buffer) {
    this.db = db;
    this.key = key;
    this.cryptoService = new CryptoService();
  }

  // 添加密码
  async addPassword(data: PasswordData): Promise<number> {
    let encryptedPassword: string | undefined;
    
    // 仅在密码登录类型时加密密码
    if (data.loginType === 'password' && data.password) {
      const encrypted = this.cryptoService.encryptPassword(data.password, this.key);
      encryptedPassword = JSON.stringify(encrypted);
    }
    
    return await this.db.addPassword({
      softwareName: data.softwareName,
      username: data.username,
      loginType: data.loginType,
      encryptedPassword,
      phoneNumber: data.phoneNumber,
      email: data.email,
      url: data.url,
      notes: data.notes,
      category: data.category || '未分类',
    });
  }

  // 获取密码列表
  async getPasswords(filters?: { search?: string; category?: string }): Promise<Omit<PasswordRecord, 'encrypted_password'>[]> {
    return await this.db.getPasswords(filters);
  }

  // 解密密码
  async decryptPassword(id: number): Promise<string> {
    // 直接从数据库获取完整记录（包含 encrypted_password）
    const record = await this.db.getAllPasswords().then(passwords => passwords.find(p => p.id === id));

    if (!record) {
      throw new Error('密码记录不存在');
    }

    if (!record.encrypted_password) {
      throw new Error('该账号未设置密码');
    }

    const encryptedData: EncryptedData = JSON.parse(record.encrypted_password);
    return this.cryptoService.decryptPassword(encryptedData, this.key);
  }

  // 更新密码
  async updatePassword(id: number, data: Partial<PasswordData>): Promise<void> {
    console.log('passwordService.updatePassword 接收数据:', { id, data });
    const updateData: any = {};
    
    if (data.softwareName !== undefined) {
      updateData.softwareName = data.softwareName;
    }
    if (data.username !== undefined) {
      updateData.username = data.username;
    }
    if (data.loginType !== undefined) {
      updateData.loginType = data.loginType;
    }
    if (data.password !== undefined) {
      const encrypted = this.cryptoService.encryptPassword(data.password, this.key);
      updateData.encryptedPassword = JSON.stringify(encrypted);
    }
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.url !== undefined) {
      updateData.url = data.url;
    }
    // 切换为邮箱登录或短信验证码时清空密码
    if (data.loginType === 'email' || data.loginType === 'sms_code') {
      updateData.encryptedPassword = '';
    }
    if (data.notes !== undefined) {
      console.log('更新 notes:', data.notes);
      updateData.notes = data.notes;
    }
    if (data.category !== undefined && data.category !== '') {
      updateData.category = data.category;
    }
    
    console.log('提交到数据库的 updateData:', updateData);
    await this.db.updatePassword(id, updateData);
  }

  // 删除密码
  async deletePassword(id: number): Promise<void> {
    await this.db.deletePassword(id);
  }

  // 获取分类列表
  async getCategories(): Promise<string[]> {
    return await this.db.getCategories();
  }

  // 导出所有密码（解密后）
  async exportAllPasswords(): Promise<Array<{
    id: number;
    softwareName: string;
    username?: string;
    loginType: LoginType;
    password?: string;
    phoneNumber?: string;
    email?: string;
    url?: string;
    notes?: string;
    category: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const passwords = await this.db.getAllPasswords();
    const decryptedPasswords = [];

    for (const record of passwords) {
      try {
        let decryptedPassword: string | undefined;
        
        // 仅在密码登录类型时解密密码
        if (record.login_type === 'password' && record.encrypted_password) {
          const encryptedData: EncryptedData = JSON.parse(record.encrypted_password);
          decryptedPassword = this.cryptoService.decryptPassword(encryptedData, this.key);
        }
        
        decryptedPasswords.push({
          id: record.id,
          softwareName: record.software_name,
          username: record.username,
          loginType: record.login_type,
          password: decryptedPassword,
          phoneNumber: record.phone_number,
          email: record.email,
          url: record.url,
          notes: record.notes,
          category: record.category,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        });
      } catch (error) {
        console.error(`处理密码记录 ID ${record.id} 失败:`, error);
      }
    }

    return decryptedPasswords;
  }
}
