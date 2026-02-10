import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, AlertCircle, Check, Save, Loader2 } from 'lucide-react';
import { NotificationConfig } from '../types';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NotificationSettings({ isOpen, onClose, onSuccess }: NotificationSettingsProps) {
  const [config, setConfig] = useState<NotificationConfig>({
    systemNotification: {
      enabled: true,
      remindDays: 7,
    },
    emailNotification: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      fromEmail: '',
      authCode: '',
      toEmail: '',
      remindDays: 7,
      remindTime: '09:00',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.getNotificationConfig();
      if (result.success && result.config) {
        setConfig(result.config);
      }
    } catch (err) {
      setError('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.updateNotificationConfig(config);
      if (result.success) {
        setSuccess('保存成功');
        setTimeout(() => {
          setSuccess('');
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    // 简单验证邮箱配置是否完整
    const { smtpHost, smtpPort, fromEmail, authCode, toEmail } = config.emailNotification;
    if (!smtpHost || !smtpPort || !fromEmail || !authCode || !toEmail) {
      setError('请先填写完整的邮箱配置');
      return;
    }
    setSaving(true);
    setError('');
    // TODO: 实现邮件测试功能
    setTimeout(() => {
      setSaving(false);
      setSuccess('邮件配置测试成功（模拟）');
      setTimeout(() => setSuccess(''), 2000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-elevated w-full max-w-xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">通知设置</h2>
              <p className="text-sm text-slate-500">配置会员到期提醒通知</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {/* 系统通知 */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">系统通知</h3>
                    <p className="text-sm text-slate-500">通过系统弹窗提醒</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.systemNotification.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        systemNotification: {
                          ...config.systemNotification,
                          enabled: e.target.checked,
                        },
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {config.systemNotification.enabled && (
                  <div className="ml-13">
                    <label className="block text-sm text-slate-600 mb-2">
                      提前提醒天数
                    </label>
                    <select
                      value={config.systemNotification.remindDays}
                      onChange={(e) => setConfig({
                        ...config,
                        systemNotification: {
                          ...config.systemNotification,
                          remindDays: Number(e.target.value),
                        },
                      })}
                      className="input-field w-40"
                    >
                      <option value={1}>1 天</option>
                      <option value={3}>3 天</option>
                      <option value={7}>7 天</option>
                      <option value={14}>14 天</option>
                      <option value={30}>30 天</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 邮件通知 */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">邮件通知</h3>
                    <p className="text-sm text-slate-500">通过邮件发送提醒</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.emailNotification.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        emailNotification: {
                          ...config.emailNotification,
                          enabled: e.target.checked,
                        },
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {config.emailNotification.enabled && (
                  <div className="ml-13 space-y-4">
                    {/* SMTP 服务器 */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm text-slate-600 mb-1">
                          SMTP 服务器
                        </label>
                        <input
                          type="text"
                          value={config.emailNotification.smtpHost}
                          onChange={(e) => setConfig({
                            ...config,
                            emailNotification: {
                              ...config.emailNotification,
                              smtpHost: e.target.value,
                            },
                          })}
                          className="input-field w-full"
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">
                          端口
                        </label>
                        <input
                          type="number"
                          value={config.emailNotification.smtpPort}
                          onChange={(e) => setConfig({
                            ...config,
                            emailNotification: {
                              ...config.emailNotification,
                              smtpPort: Number(e.target.value),
                            },
                          })}
                          className="input-field w-full"
                          placeholder="587"
                        />
                      </div>
                    </div>

                    {/* 发件邮箱 */}
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        发件邮箱
                      </label>
                      <input
                        type="email"
                        value={config.emailNotification.fromEmail}
                        onChange={(e) => setConfig({
                          ...config,
                          emailNotification: {
                            ...config.emailNotification,
                            fromEmail: e.target.value,
                          },
                        })}
                        className="input-field w-full"
                        placeholder="your@email.com"
                      />
                    </div>

                    {/* 授权码 */}
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        授权码
                      </label>
                      <input
                        type="password"
                        value={config.emailNotification.authCode}
                        onChange={(e) => setConfig({
                          ...config,
                          emailNotification: {
                            ...config.emailNotification,
                            authCode: e.target.value,
                          },
                        })}
                        className="input-field w-full"
                        placeholder="邮箱授权码（非密码）"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        请在邮箱设置中获取授权码
                      </p>
                    </div>

                    {/* 收件邮箱 */}
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        收件邮箱
                      </label>
                      <input
                        type="email"
                        value={config.emailNotification.toEmail}
                        onChange={(e) => setConfig({
                          ...config,
                          emailNotification: {
                            ...config.emailNotification,
                            toEmail: e.target.value,
                          },
                        })}
                        className="input-field w-full"
                        placeholder="receive@email.com"
                      />
                    </div>

                    {/* 提醒时间 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">
                          <Clock className="w-4 h-4 inline mr-1" />
                          提醒时间
                        </label>
                        <input
                          type="time"
                          value={config.emailNotification.remindTime}
                          onChange={(e) => setConfig({
                            ...config,
                            emailNotification: {
                              ...config.emailNotification,
                              remindTime: e.target.value,
                            },
                          })}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">
                          提前天数
                        </label>
                        <select
                          value={config.emailNotification.remindDays}
                          onChange={(e) => setConfig({
                            ...config,
                            emailNotification: {
                              ...config.emailNotification,
                              remindDays: Number(e.target.value),
                            },
                          })}
                          className="input-field w-full"
                        >
                          <option value={1}>1 天</option>
                          <option value={3}>3 天</option>
                          <option value={7}>7 天</option>
                          <option value={14}>14 天</option>
                        </select>
                      </div>
                    </div>

                    {/* 测试按钮 */}
                    <button
                      onClick={testEmailConfig}
                      disabled={saving}
                      className="btn-secondary w-full"
                    >
                      测试邮件配置
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
