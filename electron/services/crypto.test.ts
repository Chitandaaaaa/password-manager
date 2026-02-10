import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from './crypto';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  describe('generateSalt', () => {
    it('CS-001: 应该生成64字符的十六进制字符串', () => {
      const salt = service.generateSalt();
      expect(salt).toMatch(/^[a-f0-9]{64}$/);
      expect(salt.length).toBe(64);
    });

    it('CS-002: 连续调用应该生成不同的盐值', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      expect(salt1).not.toBe(salt2);
    });

    it('CS-003: 生成的盐值应该只包含0-9a-f字符', () => {
      const salt = service.generateSalt();
      const hexPattern = /^[0-9a-f]+$/;
      expect(salt).toMatch(hexPattern);
    });
  });

  describe('hashMasterPassword', () => {
    it('CS-004: 应该返回64字符的十六进制哈希值', () => {
      const salt = service.generateSalt();
      const hash = service.hashMasterPassword('test123', salt);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64);
    });

    it('CS-005: 使用相同密码和盐值应该返回相同的哈希值', () => {
      const salt = service.generateSalt();
      const hash1 = service.hashMasterPassword('test123', salt);
      const hash2 = service.hashMasterPassword('test123', salt);
      expect(hash1).toBe(hash2);
    });

    it('CS-006: 使用相同密码但不同盐值应该返回不同的哈希值', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      const hash1 = service.hashMasterPassword('test123', salt1);
      const hash2 = service.hashMasterPassword('test123', salt2);
      expect(hash1).not.toBe(hash2);
    });

    it('CS-007: 空密码应该返回有效的哈希值', () => {
      const salt = service.generateSalt();
      const hash = service.hashMasterPassword('', salt);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64);
    });

    it('CS-008: 长密码应该成功返回哈希值', () => {
      const salt = service.generateSalt();
      const longPassword = 'a'.repeat(100);
      const hash = service.hashMasterPassword(longPassword, salt);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('CS-009: 包含Unicode字符的密码应该成功返回哈希值', () => {
      const salt = service.generateSalt();
      const unicodePassword = '密码123🔐';
      const hash = service.hashMasterPassword(unicodePassword, salt);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('deriveKey', () => {
    it('CS-010: 应该返回32字节(256位)的Buffer', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('test123', salt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('CS-011: 使用相同输入应该返回相同的密钥', () => {
      const salt = service.generateSalt();
      const key1 = service.deriveKey('test123', salt);
      const key2 = service.deriveKey('test123', salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it('CS-012: 使用略微不同的输入应该返回完全不同的密钥', () => {
      const salt = service.generateSalt();
      const key1 = service.deriveKey('test123', salt);
      const key2 = service.deriveKey('test124', salt);
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encryptPassword/decryptPassword', () => {
    it('CS-013: 加密应该返回包含encrypted、iv、authTag的对象', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const encrypted = service.encryptPassword('myPassword123', key);
      
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(typeof encrypted.encrypted).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.authTag).toBe('string');
    });

    it('CS-014: 解密应该返回原始明文', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const plaintext = 'myPassword123';
      const encrypted = service.encryptPassword(plaintext, key);
      const decrypted = service.decryptPassword(encrypted, key);
      
      expect(decrypted).toBe(plaintext);
    });

    it('CS-015: 两次加密相同明文应该返回不同的encrypted值', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const plaintext = 'myPassword123';
      const encrypted1 = service.encryptPassword(plaintext, key);
      const encrypted2 = service.encryptPassword(plaintext, key);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('CS-016: 使用错误密钥解密应该抛出错误', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();
      const key1 = service.deriveKey('masterPassword1', salt1);
      const key2 = service.deriveKey('masterPassword2', salt2);
      const plaintext = 'myPassword123';
      const encrypted = service.encryptPassword(plaintext, key1);
      
      expect(() => service.decryptPassword(encrypted, key2)).toThrow();
    });

    it('CS-017: 篡改密文后解密应该抛出认证失败错误', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const plaintext = 'myPassword123';
      const encrypted = service.encryptPassword(plaintext, key);
      
      // 篡改密文
      encrypted.encrypted = encrypted.encrypted.slice(0, -2) + '00';
      
      expect(() => service.decryptPassword(encrypted, key)).toThrow();
    });

    it('CS-018: 加密空字符串应该可以正常解密', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const encrypted = service.encryptPassword('', key);
      const decrypted = service.decryptPassword(encrypted, key);
      
      expect(decrypted).toBe('');
    });

    it('CS-019: 加密长密码应该可以正常解密', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const longPassword = 'a'.repeat(1000);
      const encrypted = service.encryptPassword(longPassword, key);
      const decrypted = service.decryptPassword(encrypted, key);
      
      expect(decrypted).toBe(longPassword);
    });

    it('CS-020: 加密包含特殊字符的密码应该可以正常解密', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?`~\\';
      const encrypted = service.encryptPassword(specialPassword, key);
      const decrypted = service.decryptPassword(encrypted, key);
      
      expect(decrypted).toBe(specialPassword);
    });

    it('CS-021: 加密中文字符密码应该可以正常解密', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const chinesePassword = '中文密码测试123';
      const encrypted = service.encryptPassword(chinesePassword, key);
      const decrypted = service.decryptPassword(encrypted, key);
      
      expect(decrypted).toBe(chinesePassword);
    });

    it('CS-022: 使用错误IV解密应该抛出错误', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const plaintext = 'myPassword123';
      const encrypted = service.encryptPassword(plaintext, key);
      
      // 篡改IV
      encrypted.iv = '00000000000000000000000000000000';
      
      expect(() => service.decryptPassword(encrypted, key)).toThrow();
    });

    it('CS-023: 使用错误AuthTag解密应该抛出认证失败错误', () => {
      const salt = service.generateSalt();
      const key = service.deriveKey('masterPassword', salt);
      const plaintext = 'myPassword123';
      const encrypted = service.encryptPassword(plaintext, key);
      
      // 篡改AuthTag
      encrypted.authTag = '00000000000000000000000000000000';
      
      expect(() => service.decryptPassword(encrypted, key)).toThrow();
    });
  });

  describe('generateRandomPassword', () => {
    it('CS-024: 默认参数应该返回16位长度的密码', () => {
      const password = service.generateRandomPassword();
      expect(password.length).toBe(16);
    });

    it('CS-025: 指定长度32应该返回32位长度的密码', () => {
      const password = service.generateRandomPassword({ length: 32 });
      expect(password.length).toBe(32);
    });

    it('CS-026: 仅小写应该只包含a-z字符', () => {
      const password = service.generateRandomPassword({
        length: 100,
        includeLowercase: true,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
      });
      expect(password).toMatch(/^[a-z]+$/);
    });

    it('CS-027: 仅大写应该只包含A-Z字符', () => {
      const password = service.generateRandomPassword({
        length: 100,
        includeLowercase: false,
        includeUppercase: true,
        includeNumbers: false,
        includeSymbols: false,
      });
      expect(password).toMatch(/^[A-Z]+$/);
    });

    it('CS-028: 仅数字应该只包含0-9字符', () => {
      const password = service.generateRandomPassword({
        length: 100,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: false,
      });
      expect(password).toMatch(/^[0-9]+$/);
    });

    it('CS-029: 仅符号应该只包含符号字符', () => {
      const password = service.generateRandomPassword({
        length: 100,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: true,
      });
      expect(password).toMatch(/^[\!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/);
    });

    it('CS-030: 所有选项禁用应该使用默认字符集', () => {
      const password = service.generateRandomPassword({
        length: 100,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
      });
      // 默认应该是小写字母+数字
      expect(password).toMatch(/^[a-z0-9]+$/);
    });

    it('CS-031: 连续生成10个密码应该都不相同', () => {
      const passwords = new Set();
      for (let i = 0; i < 10; i++) {
        passwords.add(service.generateRandomPassword());
      }
      expect(passwords.size).toBe(10);
    });

    it('CS-032: 长度为1应该返回1个字符的密码', () => {
      const password = service.generateRandomPassword({ length: 1 });
      expect(password.length).toBe(1);
    });

    it('CS-033: 长度为0应该返回空字符串', () => {
      const password = service.generateRandomPassword({ length: 0 });
      expect(password.length).toBe(0);
    });

    it('CS-034: 长度为1000应该返回1000个字符的密码', () => {
      const password = service.generateRandomPassword({ length: 1000 });
      expect(password.length).toBe(1000);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('CS-035: 空密码应该返回0', () => {
      const strength = service.calculatePasswordStrength('');
      expect(strength).toBe(0);
    });

    it('CS-036: 非常弱的密码应该返回小于30的值', () => {
      const strength = service.calculatePasswordStrength('abc');
      expect(strength).toBeLessThan(30);
    });

    it('CS-037: 弱密码应该返回30-49的值', () => {
      const strength = service.calculatePasswordStrength('abcdefgh');
      expect(strength).toBeGreaterThanOrEqual(30);
      expect(strength).toBeLessThan(50);
    });

    it('CS-038: 一般强度的密码应该返回50-69的值', () => {
      const strength = service.calculatePasswordStrength('Abcdefgh1');
      expect(strength).toBeGreaterThanOrEqual(50);
      expect(strength).toBeLessThan(70);
    });

    it('CS-039: 强密码应该返回70-89的值', () => {
      // 12位密码: 长度8(20) + 12(10) + 16(0) + 小写(15) + 大写(15) + 数字(15) + 符号(15) = 90
      // 使用11位来达到70-89范围
      const strength = service.calculatePasswordStrength('Abcdefgh12!');
      expect(strength).toBeGreaterThanOrEqual(70);
      expect(strength).toBeLessThan(90);
    });

    it('CS-040: 非常强的密码应该返回大于等于90的值', () => {
      const strength = service.calculatePasswordStrength('Abcdefgh123!@#');
      expect(strength).toBeGreaterThanOrEqual(90);
    });

    it('CS-041: 16位包含所有类型的密码应该返回100', () => {
      const strength = service.calculatePasswordStrength('Abcdefgh123!@#$%');
      expect(strength).toBe(100);
    });

    it('CS-042: 超长小写字母密码应该被限制在100以内', () => {
      const strength = service.calculatePasswordStrength('a'.repeat(50));
      expect(strength).toBeLessThanOrEqual(100);
    });
  });
});
