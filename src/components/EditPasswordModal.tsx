import { useState, useEffect } from 'react';
import { X, Lock, Globe, FileText, RefreshCw, Eye, EyeOff, Smartphone, Mail } from 'lucide-react';
import { Password, LoginType, LOGIN_TYPE_LABELS } from '../types';
import { cn, getPasswordStrengthColor, getPasswordStrengthText } from '../lib/utils';

interface EditPasswordModalProps {
  isOpen: boolean;
  password: Password | null;
  decryptedPassword: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPasswordModal({ 
  isOpen, 
  password, 
  decryptedPassword,
  onClose, 
  onSuccess 
}: EditPasswordModalProps) {
  const [formData, setFormData] = useState({
    softwareName: '',
    username: '',
    loginType: 'password' as LoginType,
    password: '',
    phoneNumber: '',
    email: '',
    url: '',
    notes: '',
    category: '未分类',
  });
  const [categories, setCategories] = useState<string[]>(['未分类']);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && password) {
      setFormData({
        softwareName: password.softwareName,
        username: password.username || '',
        loginType: password.loginType || 'password',
        password: decryptedPassword,
        phoneNumber: password.phoneNumber || '',
        email: password.email || '',
        url: password.url || '',
        notes: password.notes || '',
        category: password.category || '未分类',
      });
      loadCategories();
    }
  }, [isOpen, password, decryptedPassword]);

  const loadCategories = async () => {
    try {
      const result = await window.electronAPI.listCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  };

  if (!isOpen || !password) return null;

  const calculateStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 10;
    if (pwd.length >= 16) strength += 10;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
    return Math.min(strength, 100);
  };

  const strength = calculateStrength(formData.password);

  const generatePassword = async () => {
    const newPassword = await window.electronAPI.generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setFormData({ ...formData, password: newPassword });
  };

  const validateForm = (): boolean => {
    if (!formData.softwareName.trim()) {
      setError('请输入软件名称');
      return false;
    }

    if (formData.loginType === 'password' && !formData.password) {
      setError('请输入密码');
      return false;
    }

    if (formData.loginType === 'sms_code') {
      if (!formData.phoneNumber.trim()) {
        setError('请输入手机号');
        return false;
      }
      // 中国大陆手机号格式验证
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        setError('请输入正确的手机号格式');
        return false;
      }
    }

    if (formData.loginType === 'email') {
      if (!formData.email.trim()) {
        setError('请输入邮箱');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('请输入正确的邮箱格式');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        softwareName: formData.softwareName.trim(),
        username: formData.username.trim(),
        loginType: formData.loginType,
        password: formData.loginType === 'password' ? formData.password : undefined,
        phoneNumber: formData.loginType === 'sms_code' ? formData.phoneNumber.trim() : '',
        email: formData.loginType === 'email' ? formData.email.trim() : '',
        url: formData.url.trim(),
        notes: formData.notes.trim(),
        category: formData.category,
      };
      console.log('发送更新密码请求:', { id: password.id, data: updateData });
      const result = await window.electronAPI.updatePassword(password.id, updateData);
      console.log('更新密码结果:', result);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || '更新失败');
      }
    } catch (err) {
      console.error('更新密码出错:', err);
      setError('更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">编辑密码</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* 软件名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              软件/网站名称 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.softwareName}
                onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })}
                className="input-field pl-10"
                placeholder="例如：微信、GitHub、支付宝"
                required
              />
            </div>
          </div>

          {/* 登录方式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登录方式
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, loginType: 'password' })}
                className={cn(
                  'flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                  formData.loginType === 'password'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">{LOGIN_TYPE_LABELS.password}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, loginType: 'sms_code' })}
                className={cn(
                  'flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                  formData.loginType === 'sms_code'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">{LOGIN_TYPE_LABELS.sms_code}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, loginType: 'email' })}
                className={cn(
                  'flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                  formData.loginType === 'email'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">{LOGIN_TYPE_LABELS.email}</span>
              </button>
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名/账号
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
              placeholder="可选"
            />
          </div>

          {/* 密码字段 - 仅在密码登录时显示 */}
          {formData.loginType === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pr-20"
                  placeholder="输入或生成密码"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                    title="生成随机密码"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* 密码强度 */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">密码强度</span>
                    <span className={cn(
                      'font-medium',
                      strength < 30 ? 'text-red-600' :
                      strength < 50 ? 'text-orange-600' :
                      strength < 70 ? 'text-yellow-600' :
                      strength < 90 ? 'text-blue-600' : 'text-green-600'
                    )}>
                      {getPasswordStrengthText(strength)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-300', getPasswordStrengthColor(strength))}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 手机号字段 - 仅在短信验证码登录时显示 */}
          {formData.loginType === 'sms_code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="input-field pl-10"
                  placeholder="13800138000"
                  maxLength={11}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">用于接收短信验证码登录</p>
            </div>
          )}

          {/* 邮箱字段 - 仅在邮箱登录时显示 */}
          {formData.loginType === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="user@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">用于邮箱登录</p>
            </div>
          )}

          {/* 网址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              网址
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="input-field pl-10"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {categories.map((category: string) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field pl-10 min-h-[80px] resize-none"
                placeholder="添加备注信息..."
                rows={3}
              />
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
