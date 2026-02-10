import { useState } from 'react';
import { X, Upload, FileText, Cpu, Check, Sparkles } from 'lucide-react';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SmartImportModal({ isOpen, onClose, onSuccess }: SmartImportModalProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'complete' | 'manual'>('upload');
  const [parsedEntries, setParsedEntries] = useState<any[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [progressText, setProgressText] = useState('');
  const [manualText, setManualText] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.selectFile();
      
      if (result.cancelled) {
        setIsLoading(false);
        return;
      }

      if (result.success && result.content) {
        if (useAI) {
          // 使用AI解析
          setStep('processing');
          setProgressText('正在调用AI分析文件内容，这可能需要一些时间...');
          
          const aiResult = await window.electronAPI.parsePasswordsWithAI(result.content);
          
          if (aiResult.success && aiResult.entries) {
            setParsedEntries(aiResult.entries);
            // 默认全选所有条目
            setSelectedEntries(new Set(aiResult.entries.map((_, index) => index)));
            setStep('review');
          } else {
            const errorMsg = aiResult.error || 'AI解析失败';
            if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
              setError('AI响应超时。建议：1.检查模型是否正常运行 2.在设置中增加超时时间 3.尝试使用更快的模型');
              setStep('upload');
            } else {
              setError(errorMsg + '。请尝试不使用AI模式，或检查文件格式');
              setStep('upload');
            }
          }
        } else {
          // 手动解析（简单CSV/JSON）
          parseManual(result.content);
        }
      } else {
        setError(result.error || '读取文件失败');
      }
    } catch (err) {
      setError('选择文件失败');
    } finally {
      setIsLoading(false);
    }
  };

  const parseManual = async (content: string) => {
    try {
      // 尝试解析JSON
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        setParsedEntries(data);
      } else if (data.passwords && Array.isArray(data.passwords)) {
        setParsedEntries(data.passwords);
      } else {
        setParsedEntries([data]);
      }
      setStep('review');
    } catch {
      const lines = content.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) {
        setError('文件内容为空');
        return;
      }

      // 尝试解析CSV格式
      if (lines[0].includes(',')) {
        // 解析CSV字段（处理双引号包裹的情况）
        const parseCSVField = (field: string): string => {
          let value = field.trim();
          // 移除首尾的双引号
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          // 处理CSV中的转义双引号（两个双引号表示一个）
          value = value.replace(/""/g, '"');
          return value.trim();
        };

        const headers = lines[0].split(',').map(h => parseCSVField(h));
        const entries = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => parseCSVField(v));
          const entry: any = {};
          headers.forEach((header, index) => {
            const value = values[index] || '';
            if (header.includes('软件') || header.includes('名称') || header.includes('name')) {
              entry.softwareName = value;
            } else if (header.includes('用户') || header.includes('账号') || header.includes('username')) {
              entry.username = value;
            } else if (header.includes('密码') || header.includes('password')) {
              entry.password = value;
            } else if (header.includes('网址') || header.includes('url') || header.includes('网站')) {
              entry.url = value;
            } else if (header.includes('分类') || header.includes('category')) {
              entry.category = value;
            } else if (header.includes('备注') || header.includes('notes')) {
              entry.notes = value;
            }
          });
          if (entry.softwareName && entry.password) {
            entries.push(entry);
          }
        }

        if (entries.length > 0) {
          setParsedEntries(entries);
          // 默认全选所有条目
          setSelectedEntries(new Set(entries.map((_, index) => index)));
          setStep('review');
          return;
        }
      }

      // 尝试解析简单列表格式（每3行一组：软件名、用户名、密码）
      if (lines.length >= 3) {
        const entries = [];
        
        // 移除常见的无关前缀
        const cleanedLines = lines.map(line => {
          return line
            .replace(/^\[Pasted.*?\]\s*/i, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^[-*]\s*/, '')
            .trim();
        }).filter(line => line.length > 0);

        for (let i = 0; i < cleanedLines.length - 2; i += 3) {
          const softwareName = cleanedLines[i];
          const username = cleanedLines[i + 1];
          const password = cleanedLines[i + 2];

          if (softwareName && password) {
            entries.push({
              softwareName: softwareName,
              username: username || undefined,
              password: password,
              url: undefined,
              category: '未分类',
              notes: ''
            });
          }
        }

        if (entries.length > 0) {
          setParsedEntries(entries);
          // 默认全选所有条目
          setSelectedEntries(new Set(entries.map((_, index) => index)));
          setStep('review');
          return;
        }
      }

      // 如果都无法识别，进入手动编辑模式
      setManualText(content);
      setStep('manual');
      setError('无法自动识别文件格式，请手动编辑为JSON格式');
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError('');

    try {
      let successCount = 0;
      // 只导入选中的条目
      const entriesToImport = parsedEntries.filter((_, index) => selectedEntries.has(index));
      
      if (entriesToImport.length === 0) {
        setError('请先选择要导入的条目');
        setIsLoading(false);
        return;
      }
      
      for (const entry of entriesToImport) {
        const result = await window.electronAPI.addPassword({
          softwareName: entry.softwareName,
          username: entry.username,
          loginType: 'password',
          password: entry.password,
          url: entry.url,
          category: entry.category || '未分类',
          notes: entry.notes,
        });
        if (result.success) {
          successCount++;
        }
      }

      setStep('complete');
      setTimeout(() => {
        onSuccess();
        onClose();
        resetState();
      }, 2000);
    } catch (err) {
      setError('导入失败');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('upload');
    setParsedEntries([]);
    setSelectedEntries(new Set());
    setError('');
    setManualText('');
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === parsedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(parsedEntries.map((_, index) => index)));
    }
  };

  const toggleSelectEntry = (index: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEntries(newSelected);
  };

  const updateEntry = (index: number, field: string, value: string) => {
    const newEntries = [...parsedEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setParsedEntries(newEntries);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI智能导入</h2>
          </div>
          <button
            onClick={() => { onClose(); resetState(); }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* 步骤1: 上传文件 */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择要导入的文件</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  支持任意格式的文本文件（CSV、JSON、TXT等）<br />
                  AI将自动识别其中的用户名、密码、网址等信息
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">使用AI智能识别</span>
                  <Cpu className="w-4 h-4 text-primary-600" />
                </label>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleFileSelect}
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2 px-8 py-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      读取中...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      选择文件
                    </>
                  )}
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-medium mb-1">提示：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>使用AI智能识别</strong>：自动识别任意格式文本，推荐</li>
                  <li><strong>不使用AI</strong>：支持标准CSV、JSON格式，或简单列表（每3行：软件名、用户名、密码）</li>
                  <li>支持从Chrome、Edge等浏览器导出的密码文件</li>
                  <li>支持Excel导出的CSV文件</li>
                </ul>
              </div>
            </div>
          )}

          {/* 步骤2: 处理中 */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI正在分析文件...</h3>
              <p className="text-gray-500 mb-4">请稍候，AI正在识别和提取密码信息</p>
              {progressText && (
                <div className="max-w-md mx-auto p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">{progressText}</p>
                  <p className="text-xs text-blue-500 mt-2">大型模型可能需要30-60秒，请耐心等待</p>
                </div>
              )}
            </div>
          )}

          {/* 步骤2.5: 手动编辑JSON */}
          {step === 'manual' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">AI未能正确解析格式</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  您可以手动编辑AI返回的内容，修正为正确的JSON格式后继续。
                </p>
                <p className="text-xs text-yellow-600">
                  支持的字段名（中英文均可）：<br/>
                  软件名称/软件名/应用 → softwareName（必填）<br/>
                  用户名/账号 → username<br/>
                  密码（必填）→ password<br/>
                  网址/链接 → url<br/>
                  分类/类别 → category<br/>
                  备注/说明 → notes
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI原始响应（可编辑）
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder='[{"softwareName":"示例","username":"user","password":"pass"}]'
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    try {
                      const cleaned = manualText
                        .replace(/```json\s*/gi, '')
                        .replace(/```\s*/gi, '')
                        .trim();
                      let entries = JSON.parse(cleaned);
                      if (!Array.isArray(entries)) {
                        entries = [entries];
                      }
                      
                      // 字段名映射（支持中文）
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
                      const normalizedEntries = entries.map((entry: any) => {
                        const normalized: any = {};
                        for (const [key, value] of Object.entries(entry)) {
                          const normalizedKey = fieldMappings[key] || key;
                          normalized[normalizedKey] = value;
                        }
                        return normalized;
                      });
                      
                      const validEntries = normalizedEntries.filter((e: any) => e.softwareName && e.password);
                      if (validEntries.length === 0) {
                        setError('未找到有效的密码数据，请确保包含 softwareName 和 password 字段（或对应的中文：软件名称、密码）');
                        return;
                      }
                      setParsedEntries(validEntries);
                      // 默认全选所有条目
                      setSelectedEntries(new Set(validEntries.map((_entry: any, index: number) => index)));
                      setStep('review');
                      setError('');
                    } catch (err) {
                      setError('JSON格式错误，请检查语法');
                    }
                  }}
                  className="btn-primary"
                >
                  解析JSON
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setError('');
                  }}
                  className="btn-secondary"
                >
                  返回重试
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 审核和编辑 */}
          {step === 'review' && parsedEntries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    识别到 {parsedEntries.length} 条记录
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedEntries.size === parsedEntries.length && parsedEntries.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    全选
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  已选择 {selectedEntries.size} 条
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parsedEntries.map((entry, index) => (
                  <div key={index} className={`border rounded-lg p-4 bg-gray-50 transition-all ${selectedEntries.has(index) ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(index)}
                        onChange={() => toggleSelectEntry(index)}
                        className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">软件名称</label>
                          <input
                            type="text"
                            value={entry.softwareName || ''}
                            onChange={(e) => updateEntry(index, 'softwareName', e.target.value)}
                            className="input-field text-sm py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">分类</label>
                          <input
                            type="text"
                            value={entry.category || ''}
                            onChange={(e) => updateEntry(index, 'category', e.target.value)}
                            className="input-field text-sm py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">用户名</label>
                          <input
                            type="text"
                            value={entry.username || ''}
                            onChange={(e) => updateEntry(index, 'username', e.target.value)}
                            className="input-field text-sm py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">密码</label>
                          <input
                            type="text"
                            value={entry.password || ''}
                            onChange={(e) => updateEntry(index, 'password', e.target.value)}
                            className="input-field text-sm py-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">网址</label>
                          <input
                            type="text"
                            value={entry.url || ''}
                            onChange={(e) => updateEntry(index, 'url', e.target.value)}
                            className="input-field text-sm py-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 步骤4: 完成 */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">导入成功！</h3>
              <p className="text-gray-500">密码已导入到您的密码库中</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {step === 'review' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setStep('upload')}
              className="btn-secondary"
              disabled={isLoading}
            >
              重新选择
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || selectedEntries.size === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  确认导入 ({selectedEntries.size}/{parsedEntries.length}条)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
