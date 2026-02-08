import { DatabaseService } from './database';
import { CryptoService, EncryptedData } from './crypto';

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
  encrypted_password: string;
  url?: string;
  notes?: string;
  category?: string;
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
    // 加密密码
    const encrypted = this.cryptoService.encryptPassword(data.password, this.key);
    
    return await this.db.addPassword({
      softwareName: data.softwareName,
      username: data.username,
      encryptedPassword: JSON.stringify(encrypted),
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
    const record = await this.db.getPasswordById(id);
    
    if (!record) {
      throw new Error('密码记录不存在');
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
    if (data.password !== undefined) {
      const encrypted = this.cryptoService.encryptPassword(data.password, this.key);
      updateData.encryptedPassword = JSON.stringify(encrypted);
    }
    if (data.url !== undefined) {
      updateData.url = data.url;
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
    password: string;
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
        const encryptedData: EncryptedData = JSON.parse(record.encrypted_password);
        const decryptedPassword = this.cryptoService.decryptPassword(encryptedData, this.key);
        
        decryptedPasswords.push({
          id: record.id,
          softwareName: record.software_name,
          username: record.username,
          password: decryptedPassword,
          url: record.url,
          notes: record.notes,
          category: record.category,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        });
      } catch (error) {
        console.error(`解密密码 ID ${record.id} 失败:`, error);
      }
    }

    return decryptedPasswords;
  }
}
