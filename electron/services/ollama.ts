import { DatabaseService } from './database';
import http from 'http';

export interface OllamaConfig {
  enabled: boolean;
  host: string;
  model: string;
  timeout: number;
}

export interface PasswordEntry {
  softwareName: string;
  username?: string;
  password: string;
  url?: string;
  category?: string;
  notes?: string;
}

export class OllamaService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  getConfig(): OllamaConfig {
    return this.db.getConfig().ollama;
  }

  updateConfig(config: Partial<OllamaConfig>): void {
    this.db.updateConfig({ ollama: { ...this.getConfig(), ...config } });
  }

  // 解析 URL
  private parseUrl(url: string): { hostname: string; port: number; path: string } {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const parts = cleanUrl.split('/');
    const hostPort = parts[0].split(':');
    let hostname = hostPort[0];
    // 将 localhost 替换为 127.0.0.1 避免 IPv6 问题
    if (hostname === 'localhost') {
      hostname = '127.0.0.1';
    }
    return {
      hostname,
      port: parseInt(hostPort[1] || '11434'),
      path: '/' + parts.slice(1).join('/') || '/api/tags'
    };
  }

  // 使用 http 模块发送请求
  private async httpRequest(url: string, method: string = 'GET', body?: any, timeoutMs?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const { hostname, port, path } = this.parseUrl(url);
      
      const options = {
        hostname,
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        timeout: timeoutMs || 5000,
      };

      const req = http.request(options, (res) => {
        // 使用 Buffer 收集二进制数据，避免编码问题
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => { chunks.push(chunk); });
        res.on('end', () => {
          try {
            // 合并 Buffer 并使用 UTF-8 解码
            const buffer = Buffer.concat(chunks);
            const data = buffer.toString('utf-8');
            
            // 尝试解析 JSON
            const jsonData = JSON.parse(data);
            resolve({ ok: res.statusCode === 200, status: res.statusCode, json: () => Promise.resolve(jsonData) });
          } catch (e) {
            // 即使 JSON 解析失败，也返回原始数据供调试
            const buffer = Buffer.concat(chunks);
            const data = buffer.toString('utf-8');
            resolve({ ok: res.statusCode === 200, status: res.statusCode, text: () => Promise.resolve(data) });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        const bodyStr = JSON.stringify(body);
        req.write(Buffer.from(bodyStr, 'utf8'));
      }
      req.end();
    });
  }

  // 使用指定配置检查Ollama是否可用
  async checkAvailabilityWithConfig(config: OllamaConfig): Promise<{ available: boolean; message: string }> {
    return this.doCheckAvailability(config);
  }

  // 检查Ollama是否可用
  async checkAvailability(): Promise<{ available: boolean; message: string }> {
    const config = this.getConfig();
    return this.doCheckAvailability(config);
  }

  // 实际的检查逻辑
  private async doCheckAvailability(config: OllamaConfig): Promise<{ available: boolean; message: string }> {
    if (!config.enabled) {
      return { available: false, message: 'Ollama功能未启用' };
    }

    try {
      // 确保 URL 格式正确
      let apiUrl = config.host;
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = 'http://' + apiUrl;
      }
      
      // 移除末尾的斜杠并添加 api/tags 路径
      apiUrl = apiUrl.replace(/\/$/, '') + '/api/tags';

      const response: any = await this.httpRequest(apiUrl, 'GET');

      if (!response.ok) {
        return { available: false, message: `连接失败: HTTP ${response.status}` };
      }

      const data = await response.json();
      const models = data.models || [];
      
      // 检查模型是否存在
      const hasModel = models.some((m: any) => {
        const modelName = m.name || m.model || '';
        return modelName === config.model || modelName.startsWith(config.model);
      });

      if (!hasModel) {
        const availableModels = models.map((m: any) => m.name || m.model).join(', ');
        return { 
          available: false, 
          message: `模型 "${config.model}" 未找到。已安装模型: ${availableModels || '无'}` 
        };
      }

      return { available: true, message: 'Ollama服务正常' };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          return { available: false, message: '连接超时，请检查Ollama服务是否运行' };
        }
        return { available: false, message: `连接错误: ${error.message}` };
      }
      return { available: false, message: '未知错误' };
    }
  }

  // 提取JSON的辅助函数
  private extractJSON(text: string): string | null {
    // 尝试多种方式提取JSON
    
    // 1. 查找方括号包裹的内容
    const bracketMatch = text.match(/\[[\s\S]*\]/);
    if (bracketMatch) return bracketMatch[0];
    
    // 2. 查找花括号包裹的内容（单个对象）
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return `[${braceMatch[0]}]`;
    
    // 3. 尝试查找 ```json 代码块
    const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    
    return null;
  }

  // 清理和验证JSON
  private cleanJSON(jsonStr: string): string {
    // 移除markdown格式标记
    let cleaned = jsonStr
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/^```\s*/i, '')
      .trim();
    
    // 确保是数组格式
    if (!cleaned.startsWith('[')) {
      cleaned = '[' + cleaned;
    }
    if (!cleaned.endsWith(']')) {
      cleaned = cleaned + ']';
    }
    
    return cleaned;
  }

  // 从简单文本中解析密码信息（备用方案）
  private parseSimpleText(text: string, categories: string[]): PasswordEntry[] {
    const entries: PasswordEntry[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 移除常见的无关前缀
    const cleanedLines = lines.map(line => {
      return line
        .replace(/^\[Pasted.*?\]\s*/i, '')  // 移除 [Pasted ~3 lines] 等前缀
        .replace(/^\d+\.\s*/, '')           // 移除序号如 "1. "
        .replace(/^[-*]\s*/, '')           // 移除列表符号
        .trim();
    }).filter(line => line.length > 0);
    
    // 尝试识别常见的密码格式
    // 格式1: 每3行一组（软件名、用户名、密码）
    if (cleanedLines.length >= 3) {
      for (let i = 0; i < cleanedLines.length - 2; i += 3) {
        const softwareName = cleanedLines[i];
        const username = cleanedLines[i + 1];
        const password = cleanedLines[i + 2];
        
        // 验证：软件名通常不包含数字，密码通常包含字母数字混合
        if (softwareName && password && softwareName.length < 50) {
          entries.push({
            softwareName: softwareName,
            username: username && username !== password ? username : undefined,
            password: password,
            url: this.inferUrl(softwareName),
            category: this.inferCategory(softwareName, categories),
            notes: '从文本自动提取'
          });
        }
      }
    }
    
    // 格式2: 查找包含用户名和密码的行
    if (entries.length === 0) {
      for (let i = 0; i < cleanedLines.length; i++) {
        const line = cleanedLines[i];
        
        // 查找邮箱格式
        const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        // 查找手机号
        const phoneMatch = line.match(/(\d{11})/);
        // 查找密码（通常包含字母和数字）
        const passwordMatch = line.match(/[:\s]+([a-zA-Z0-9!@#$%^&*]{6,})/);
        
        if ((emailMatch || phoneMatch) && passwordMatch) {
          // 尝试从上一行获取软件名
          const softwareName = i > 0 ? cleanedLines[i - 1] : '未知应用';
          entries.push({
            softwareName: softwareName,
            username: emailMatch ? emailMatch[1] : (phoneMatch ? phoneMatch[1] : undefined),
            password: passwordMatch[1],
            url: this.inferUrl(softwareName),
            category: this.inferCategory(softwareName, categories),
            notes: '从文本自动提取'
          });
        }
      }
    }
    
    return entries;
  }
  
  // 根据软件名推断网址
  private inferUrl(softwareName: string): string | undefined {
    const urlMap: { [key: string]: string } = {
      '百度': 'https://www.baidu.com',
      '微信': 'https://weixin.qq.com',
      'qq': 'https://www.qq.com',
      '微博': 'https://weibo.com',
      '淘宝': 'https://www.taobao.com',
      '天猫': 'https://www.tmall.com',
      '京东': 'https://www.jd.com',
      '支付宝': 'https://www.alipay.com',
      'github': 'https://github.com',
      'gmail': 'https://gmail.com',
      'google': 'https://www.google.com',
    };
    
    const lowerName = softwareName.toLowerCase();
    for (const [key, url] of Object.entries(urlMap)) {
      if (lowerName.includes(key.toLowerCase())) {
        return url;
      }
    }
    
    return undefined;
  }
  
  // 根据软件名推断分类
  private inferCategory(softwareName: string, categories: string[]): string {
    const categoryMap: { [key: string]: string[] } = {
      '社交': ['微信', 'qq', '微博', 'twitter', 'facebook', 'instagram', 'whatsapp'],
      '购物': ['淘宝', '天猫', '京东', '拼多多', 'amazon', 'ebay'],
      '银行': ['支付宝', '银行', '工商', '建设', '招商', 'paypal'],
      '邮箱': ['gmail', 'qq邮箱', '163', '126', 'outlook', 'yahoo'],
      '工作': ['github', 'gitlab', 'jira', 'confluence', 'slack'],
    };
    
    const lowerName = softwareName.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => lowerName.includes(kw.toLowerCase()))) {
        return category;
      }
    }
    
    return '未分类';
  }

  // 使用AI解析密码文本
  async parsePasswords(text: string): Promise<{ success: boolean; entries?: PasswordEntry[]; error?: string; rawResponse?: string }> {
    const config = this.getConfig();
    
    if (!config.enabled) {
      return { success: false, error: 'Ollama功能未启用' };
    }

    try {
      const categories = await this.db.getCategories();
      
      const prompt = `你是一个密码管理助手。请从以下文本中提取账号密码信息。

任务：
1. 识别每个账号的软件/网站名称
2. 提取用户名/账号
3. 提取密码
4. 推断对应的网址（可选）
5. 选择最合适的分类：${categories.join('、')}

文本格式可能是：
- 简单列表：每行一个信息（软件名、用户名、密码等）
- 表格格式：CSV或其他分隔符分隔的数据
- JSON格式：已经结构化的数据
- 混合格式：包含说明文字和密码信息

重要规则：
- 只返回JSON数组，不要有其他任何文字说明
- JSON格式必须标准，使用双引号
- 如果没有提取到任何信息，返回空数组 []
- 字段名必须使用以下英文：
  * softwareName: 软件/网站名称
  * username: 用户名（可选）
  * password: 密码
  * url: 网址（可选）
  * category: 分类（可选）
  * notes: 备注（可选）

示例格式：
[
  {
    "softwareName": "微信",
    "username": "user@example.com",
    "password": "password123",
    "url": "https://weixin.qq.com",
    "category": "社交",
    "notes": ""
  }
]

文本内容：
${text}

请返回JSON数组：`;

      let apiUrl = config.host;
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = 'http://' + apiUrl;
      }
      apiUrl = apiUrl.replace(/\/$/, '') + '/api/generate';

      // 使用用户配置的超时时间（最少60秒）
      const timeoutMs = Math.max(config.timeout, 60000);

      const response: any = await this.httpRequest(apiUrl, 'POST', {
        model: config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // 降低温度，更快更确定性的回答
          num_predict: 2000, // 限制输出长度
        }
      }, timeoutMs);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || '';
      
      console.log('AI原始响应:', aiResponse.substring(0, 500));
      console.log('AI响应长度:', aiResponse.length);
      
      // 检查是否有乱码
      if (aiResponse.includes('��') || /[\uFFFD]/.test(aiResponse)) {
        console.warn('警告：AI响应包含乱码字符');
      }

      // 提取JSON
      let jsonStr = this.extractJSON(aiResponse);
      
      // 如果没有找到JSON，尝试从原始文本直接解析
      if (!jsonStr) {
        console.log('未找到JSON，尝试直接解析文本...');
        const parsedFromText = this.parseSimpleText(text, categories);
        if (parsedFromText.length > 0) {
          return { success: true, entries: parsedFromText };
        }
        
        return { 
          success: false, 
          error: 'AI返回格式不正确，无法找到JSON数据', 
          rawResponse: aiResponse.substring(0, 1000)
        };
      }

      // 清理JSON
      jsonStr = this.cleanJSON(jsonStr);
      
      let entries: PasswordEntry[];
      try {
        entries = JSON.parse(jsonStr);
      } catch (parseError) {
        // 尝试修复常见的JSON格式错误
        try {
          // 移除可能的注释
          jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
          // 移除尾部逗号
          jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
          // 尝试再次解析
          entries = JSON.parse(jsonStr);
        } catch {
          return { 
            success: false, 
            error: `JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`, 
            rawResponse: aiResponse.substring(0, 1000)
          };
        }
      }
      
      // 确保是数组
      if (!Array.isArray(entries)) {
        entries = [entries];
      }
      
      // 字段名映射（支持中文字段名）
      const fieldMappings: { [key: string]: string } = {
        '软件名称': 'softwareName',
        '软件': 'softwareName',
        '名称': 'softwareName',
        '软件名': 'softwareName',
        '应用': 'softwareName',
        '应用名称': 'softwareName',
        '网站': 'softwareName',
        '网站名称': 'softwareName',
        '平台': 'softwareName',
        '用户名': 'username',
        '账号': 'username',
        '用户': 'username',
        '登陆名': 'username',
        '登录名': 'username',
        '帐户': 'username',
        '密码': 'password',
        '口令': 'password',
        '网址': 'url',
        '网站地址': 'url',
        '链接': 'url',
        '地址': 'url',
        '分类': 'category',
        '类别': 'category',
        '类型': 'category',
        '分组': 'category',
        '备注': 'notes',
        '说明': 'notes',
        '描述': 'notes',
        '注释': 'notes',
      };
      
      // 转换字段名
      const normalizedEntries = entries.map(entry => {
        const normalized: any = {};
        for (const [key, value] of Object.entries(entry)) {
          const normalizedKey = fieldMappings[key] || key;
          normalized[normalizedKey] = value;
        }
        return normalized;
      });
      
      // 验证和清理数据
      const validEntries = normalizedEntries
        .filter(entry => entry && typeof entry === 'object')
        .filter(entry => entry.softwareName && entry.password)
        .map(entry => ({
          softwareName: String(entry.softwareName || '').trim(),
          username: entry.username ? String(entry.username).trim() : undefined,
          password: String(entry.password || '').trim(),
          url: entry.url ? String(entry.url).trim() : undefined,
          category: categories.includes(entry.category || '') ? entry.category : '未分类',
          notes: entry.notes ? String(entry.notes).trim() : undefined,
        }));

      if (validEntries.length === 0) {
        return { 
          success: false, 
          error: '未能从AI响应中提取有效的密码数据', 
          rawResponse: aiResponse.substring(0, 1000)
        };
      }

      return { success: true, entries: validEntries };
    } catch (error) {
      console.error('AI解析错误:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: '解析失败' };
    }
  }
}
