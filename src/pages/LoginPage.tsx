import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: warning, 2: set new password

  const { setView } = useAppStore();

  // 组件挂载时重置所有状态
  useEffect(() => {
    setPassword('');
    setShowPassword(false);
    setIsLoading(false);
    setError('');
    setShowForgotPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setStep(1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('请输入主密码');
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.electronAPI.login(password);
      if (result.success) {
        // 登录成功后重置状态
        setPassword('');
        setShowPassword(false);
        setError('');
        setView('main');
      } else {
        setError(result.error || '密码错误');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setStep(1);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setStep(1);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.electronAPI.resetPassword(newPassword);
      if (result.success) {
        alert('密码已重置，所有数据已清除');
        // 重置所有状态
        setPassword('');
        setShowPassword(false);
        setShowForgotPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setStep(1);
        setError('');
        setView('main');
      } else {
        setError(result.error || '重置失败');
      }
    } catch (err) {
      setError('重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="w-full max-w-md">
          <div className="card space-y-6">
            {/* 返回按钮 */}
            <button
              onClick={handleBackToLogin}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </button>

            {step === 1 ? (
              <>
                {/* 警告步骤 */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">忘记密码？</h1>
                  <p className="text-gray-600">此操作将清除所有数据</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>警告：</strong> 由于没有设置密码找回机制，忘记密码意味着您将无法访问已保存的所有密码。
                  </p>
                  <p className="text-sm text-red-800">
                    要继续，您需要重置主密码，<strong>这将永久删除所有已保存的密码记录</strong>。
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    我了解风险，继续重置
                  </button>
                  <button
                    onClick={handleBackToLogin}
                    className="w-full btn-secondary py-3"
                  >
                    取消，返回登录
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 设置新密码步骤 */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">设置新密码</h1>
                  <p className="text-gray-600">设置新的主密码</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pl-10 pr-10"
                        placeholder="请输入新密码"
                        required
                        autoFocus
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="password-toggle"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">密码长度至少为6位</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      确认新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pl-10 pr-10"
                        placeholder="请再次输入新密码"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '重置中...' : '重置密码并清除数据'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="card space-y-6">
          {/* 头部 */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">密码管家</h1>
            <p className="text-gray-600">请输入主密码解锁</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="请输入主密码"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '解锁中...' : '解锁'}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            忘记密码？
          </button>
        </div>
      </div>
    </div>
  );
}
