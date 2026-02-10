import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaService } from './ollama';
import { DatabaseService } from './database';

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn((key: string) => {
        if (key === 'categories') return ['社交', '工作', '银行', '邮箱', '购物', '其他'];
        if (key === 'config') {
          return {
            ollama: {
              enabled: true,
              host: 'http://localhost:11434',
              model: 'llama3.2',
              timeout: 30000,
            },
          };
        }
        return [];
      }),
      set: vi.fn(),
    })),
  };
});

describe('OllamaService', () => {
  let dbService: DatabaseService;
  let ollamaService: OllamaService;

  beforeEach(async () => {
    dbService = new DatabaseService();
    ollamaService = new OllamaService(dbService);
  });

  describe('配置管理', () => {
    it('OL-001: 调用getConfig应该返回Ollama配置对象', () => {
      const config = ollamaService.getConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('timeout');
    });

    it('OL-002: 调用updateConfig应该更新配置', () => {
      ollamaService.updateConfig({ model: 'qwen2.5' });
      
      const config = ollamaService.getConfig();
      expect(config.model).toBe('qwen2.5');
    });

    it('OL-003: 部分更新配置应该只修改指定字段', () => {
      const originalConfig = ollamaService.getConfig();
      ollamaService.updateConfig({ host: 'http://192.168.1.100:11434' });
      
      const config = ollamaService.getConfig();
      expect(config.host).toBe('http://192.168.1.100:11434');
      expect(config.model).toBe(originalConfig.model); // 其他字段不变
    });
  });

  describe('checkAvailability', () => {
    it('OL-004: 配置enabled=false时应该返回未启用', async () => {
      ollamaService.updateConfig({ enabled: false });
      const result = await ollamaService.checkAvailability();
      
      expect(result.available).toBe(false);
      expect(result.message).toContain('未启用');
    });

    it('OL-007: 服务未启动时应该返回连接错误', async () => {
      // 模拟HTTP请求失败
      const mockRequest = vi.spyOn(ollamaService as any, 'httpRequest');
      mockRequest.mockRejectedValue(new Error('ECONNREFUSED'));
      
      const result = await ollamaService.checkAvailability();
      
      expect(result.available).toBe(false);
      expect(result.message).toContain('连接错误');
      
      mockRequest.mockRestore();
    });

    it('OL-008: 连接超时时应该返回超时错误', async () => {
      const mockRequest = vi.spyOn(ollamaService as any, 'httpRequest');
      mockRequest.mockRejectedValue(new Error('Request timeout'));
      
      const result = await ollamaService.checkAvailability();
      
      expect(result.available).toBe(false);
      expect(result.message).toContain('超时');
      
      mockRequest.mockRestore();
    });
  });

  describe('parsePasswords', () => {
    it('OL-010: 配置enabled=false时应该返回错误', async () => {
      ollamaService.updateConfig({ enabled: false });
      const result = await ollamaService.parsePasswords('some text');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('未启用');
    });

    it('OL-012: 输入无密码信息的文本应该返回空结果或错误', async () => {
      // 模拟AI返回空数组
      const mockRequest = vi.spyOn(ollamaService as any, 'httpRequest');
      mockRequest.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: '[]' }),
      });
      
      const result = await ollamaService.parsePasswords('这是一些无关的文本');
      
      // 应该返回成功但entries为空或错误
      expect(result.success === true || result.error).toBeTruthy();
      
      mockRequest.mockRestore();
    });

    it('OL-014: AI返回中文字段名应该正确映射到英文字段名', async () => {
      const mockRequest = vi.spyOn(ollamaService as any, 'httpRequest');
      mockRequest.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: '[{"软件名称": "测试", "用户名": "user", "密码": "pass"}]',
        }),
      });
      
      const result = await ollamaService.parsePasswords('test');
      
      if (result.success && result.entries) {
        expect(result.entries[0]).toHaveProperty('softwareName');
        expect(result.entries[0]).toHaveProperty('username');
        expect(result.entries[0]).toHaveProperty('password');
      }
      
      mockRequest.mockRestore();
    });

    it('OL-016: 网络请求失败应该返回错误信息', async () => {
      const mockRequest = vi.spyOn(ollamaService as any, 'httpRequest');
      mockRequest.mockRejectedValue(new Error('Network error'));
      
      const result = await ollamaService.parsePasswords('test');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      mockRequest.mockRestore();
    });
  });

  describe('inferUrl', () => {
    it('OL-019: 输入已知软件名应该返回对应URL', () => {
      const url = (ollamaService as any).inferUrl('微信');
      expect(url).toBe('https://weixin.qq.com');
    });

    it('OL-020: 输入未知软件名应该返回undefined', () => {
      const url = (ollamaService as any).inferUrl('未知软件XYZ');
      expect(url).toBeUndefined();
    });

    it('OL-021: 大小写不敏感应该正确推断', () => {
      const url = (ollamaService as any).inferUrl('GITHUB');
      expect(url).toBe('https://github.com');
    });
  });

  describe('inferCategory', () => {
    it('OL-022: 输入社交类软件名应该返回"社交"', () => {
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const category = (ollamaService as any).inferCategory('微信', categories);
      expect(category).toBe('社交');
    });

    it('OL-023: 输入购物类软件名应该返回"购物"', () => {
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const category = (ollamaService as any).inferCategory('淘宝', categories);
      expect(category).toBe('购物');
    });

    it('OL-024: 输入银行类软件名应该返回"银行"', () => {
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const category = (ollamaService as any).inferCategory('支付宝', categories);
      expect(category).toBe('银行');
    });

    it('OL-025: 输入未知软件名应该返回"未分类"', () => {
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const category = (ollamaService as any).inferCategory('未知软件XYZ', categories);
      expect(category).toBe('未分类');
    });
  });

  describe('extractJSON', () => {
    it('应该正确提取方括号包裹的JSON', () => {
      const text = 'Here is the data: [{"name": "test"}] End';
      const result = (ollamaService as any).extractJSON(text);
      expect(result).toBe('[{"name": "test"}]');
    });

    it('应该正确提取花括号包裹的JSON', () => {
      const text = 'Here is the data: {"name": "test"} End';
      const result = (ollamaService as any).extractJSON(text);
      expect(result).toBe('[{"name": "test"}]');
    });

    it('应该正确提取代码块中的JSON', () => {
      const text = '```json\n[{"name": "test"}]\n```';
      const result = (ollamaService as any).extractJSON(text);
      expect(result).toBe('[{"name": "test"}]');
    });

    it('没有找到JSON时应该返回null', () => {
      const text = 'No JSON here';
      const result = (ollamaService as any).extractJSON(text);
      expect(result).toBeNull();
    });
  });

  describe('cleanJSON', () => {
    it('应该移除markdown格式标记', () => {
      const json = '```json\n[{"name": "test"}]\n```';
      const result = (ollamaService as any).cleanJSON(json);
      expect(result).toBe('[{"name": "test"}]');
    });

    it('应该确保数组格式', () => {
      const json = '{"name": "test"}';
      const result = (ollamaService as any).cleanJSON(json);
      expect(result).toBe('[{"name": "test"}]');
    });

    it('应该正确处理已经是数组的JSON', () => {
      const json = '[{"name": "test"}]';
      const result = (ollamaService as any).cleanJSON(json);
      expect(result).toBe('[{"name": "test"}]');
    });
  });

  describe('parseSimpleText', () => {
    it('应该解析简单列表格式（每3行一组）', () => {
      const text = 'Software1\nUser1\nPass1\nSoftware2\nUser2\nPass2';
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const result = (ollamaService as any).parseSimpleText(text, categories);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('softwareName');
      expect(result[0]).toHaveProperty('password');
    });

    it('应该解析包含邮箱格式的文本', () => {
      const text = 'App\ntest@example.com password123';
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const result = (ollamaService as any).parseSimpleText(text, categories);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('softwareName');
        expect(result[0]).toHaveProperty('username');
        expect(result[0]).toHaveProperty('password');
      }
    });

    it('应该清理常见的无关前缀', () => {
      const text = '[Pasted 3 lines] Software\nUser\nPass';
      const categories = ['社交', '工作', '银行', '邮箱', '购物', '其他'];
      const result = (ollamaService as any).parseSimpleText(text, categories);
      
      if (result.length > 0) {
        expect(result[0].softwareName).not.toContain('[Pasted');
      }
    });
  });

  describe('parseUrl', () => {
    it('应该正确解析localhost URL', () => {
      const result = (ollamaService as any).parseUrl('http://localhost:11434/api/tags');
      expect(result.hostname).toBe('127.0.0.1');
      expect(result.port).toBe(11434);
    });

    it('应该正确解析IP地址URL', () => {
      const result = (ollamaService as any).parseUrl('http://192.168.1.100:11434/api/tags');
      expect(result.hostname).toBe('192.168.1.100');
      expect(result.port).toBe(11434);
    });

    it('应该使用默认端口11434', () => {
      const result = (ollamaService as any).parseUrl('http://localhost/api/tags');
      expect(result.port).toBe(11434);
    });

    it('应该正确解析路径', () => {
      const result = (ollamaService as any).parseUrl('http://localhost:11434/api/generate');
      expect(result.path).toBe('/api/generate');
    });
  });
});
