import { useState, useEffect } from 'react';
import { X, Server, Cpu, Clock, Shield, Save, TestTube, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'ollama' | 'security' | 'dangerous'>('ollama');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ollama配置
  const [ollamaConfig, setOllamaConfig] = useState({
    enabled: false,
    host: 'http://localhost:11434',
    model: 'llama3.2',
    timeout: 30000,
  });
  const [ollamaStatus, setOllamaStatus] = useState({ available: false, message: '' });

  // 安全配置
  const [securityConfig, setSecurityConfig] = useState({
    autoLock: { enabled: true, timeout: 5 },
    clipboard: { autoClear: true, timeout: 30 },
  });

  // 危险操作配置
  const [dangerousConfig, setDangerousConfig] = useState({
    enableClearAll: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const result = await window.electronAPI.getConfig();
      if (result.success && result.config) {
        setOllamaConfig(result.config.ollama);
        setSecurityConfig({
          autoLock: result.config.autoLock,
          clipboard: result.config.clipboard,
        });
        setDangerousConfig({
          enableClearAll: result.config.dangerousOperations?.enableClearAll ?? false,
        });
      }
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  };

  const checkOllama = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 传入当前配置进行测试，而不是使用已保存的配置
      const status = await window.electronAPI.checkOllama(ollamaConfig);
      setOllamaStatus(status);
    } catch (err) {
      setError('检查失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.updateConfig({
        ollama: ollamaConfig,
        autoLock: securityConfig.autoLock,
        clipboard: securityConfig.clipboard,
        dangerousOperations: dangerousConfig,
      });

      if (result.success) {
        setSuccess('配置已保存');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ollama')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ollama'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Ollama AI
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            安全设置
          </button>
          <button
            onClick={() => setActiveTab('dangerous')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dangerous'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            危险操作
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              {success}
            </div>
          )}

          {/* Ollama配置 */}
          {activeTab === 'ollama' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-blue-900">启用Ollama AI</h3>
                  <p className="text-sm text-blue-700 mt-1">使用本地AI模型智能识别和分类导入的密码</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ollamaConfig.enabled}
                    onChange={(e) => setOllamaConfig({ ...ollamaConfig, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {ollamaConfig.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ollama服务地址
                    </label>
                    <input
                      type="text"
                      value={ollamaConfig.host}
                      onChange={(e) => setOllamaConfig({ ...ollamaConfig, host: e.target.value })}
                      className="input-field"
                      placeholder="http://localhost:11434"
                    />
                    <p className="text-xs text-gray-500 mt-1">本地Ollama服务地址，默认端口11434</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI模型名称
                    </label>
                    <input
                      type="text"
                      value={ollamaConfig.model}
                      onChange={(e) => setOllamaConfig({ ...ollamaConfig, model: e.target.value })}
                      className="input-field"
                      placeholder="llama3.2"
                    />
                    <p className="text-xs text-gray-500 mt-1">已安装的模型名称，如: llama3.2, qwen2.5 等</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      请求超时时间 (毫秒)
                    </label>
                    <input
                      type="number"
                      value={ollamaConfig.timeout}
                      onChange={(e) => setOllamaConfig({ ...ollamaConfig, timeout: parseInt(e.target.value) || 30000 })}
                      className="input-field"
                      min="5000"
                      max="120000"
                      step="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">AI响应超时时间，建议30秒以上</p>
                  </div>

                  {/* 连接测试 */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">连接测试</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {ollamaStatus.message || '点击测试按钮检查Ollama服务状态'}
                        </p>
                      </div>
                      <button
                        onClick={checkOllama}
                        disabled={isLoading}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <TestTube className="w-4 h-4" />
                        测试连接
                      </button>
                    </div>
                    {ollamaStatus.available && (
                      <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        ✓ 服务正常
                      </div>
                    )}
                    {!ollamaStatus.available && ollamaStatus.message && (
                      <div className="mt-2 text-sm text-red-600">
                        ✗ {ollamaStatus.message}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 安全设置 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* 自动锁定 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">自动锁定</h3>
                      <p className="text-sm text-gray-500">无操作一段时间后自动锁定应用</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityConfig.autoLock.enabled}
                      onChange={(e) => setSecurityConfig({
                        ...securityConfig,
                        autoLock: { ...securityConfig.autoLock, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {securityConfig.autoLock.enabled && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      锁定时间 (分钟)
                    </label>
                    <input
                      type="number"
                      value={securityConfig.autoLock.timeout}
                      onChange={(e) => setSecurityConfig({
                        ...securityConfig,
                        autoLock: { ...securityConfig.autoLock, timeout: parseInt(e.target.value) || 5 }
                      })}
                      className="input-field w-32"
                      min="1"
                      max="60"
                    />
                  </div>
                )}
              </div>

              {/* 剪贴板自动清除 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">剪贴板自动清除</h3>
                      <p className="text-sm text-gray-500">复制密码后自动清除剪贴板</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securityConfig.clipboard.autoClear}
                      onChange={(e) => setSecurityConfig({
                        ...securityConfig,
                        clipboard: { ...securityConfig.clipboard, autoClear: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {securityConfig.clipboard.autoClear && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      清除时间 (秒)
                    </label>
                    <input
                      type="number"
                      value={securityConfig.clipboard.timeout}
                      onChange={(e) => setSecurityConfig({
                        ...securityConfig,
                        clipboard: { ...securityConfig.clipboard, timeout: parseInt(e.target.value) || 30 }
                      })}
                      className="input-field w-32"
                      min="5"
                      max="300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 危险操作 */}
          {activeTab === 'dangerous' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">警告</p>
                    <p>以下操作具有危险性，请谨慎使用。这些操作可能会导致数据丢失，且无法恢复。</p>
                  </div>
                </div>
              </div>

              {/* 启用全部清除按钮 */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-red-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">启用"全部清除"按钮</h3>
                    <p className="text-sm text-gray-500">在侧边栏显示"全部清除"按钮，可一键删除所有密码</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dangerousConfig.enableClearAll}
                      onChange={(e) => setDangerousConfig({ ...dangerousConfig, enableClearAll: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                {dangerousConfig.enableClearAll && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ 启用后，侧边栏将出现红色的"全部清除"按钮。点击后会要求输入主密码确认，确认后将永久删除所有密码记录，此操作不可撤销！
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
