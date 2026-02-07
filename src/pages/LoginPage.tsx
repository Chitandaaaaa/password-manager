import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield, AlertTriangle, ArrowLeft, KeyRound } from 'lucide-react';
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
  const [step, setStep] = useState(1);

  const { setView } = useAppStore();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
        <div className="w-full max-w-md animate-scale">
          <div className="card-elevated p-8 space-y-6">
            <button
              onClick={handleBackToLogin}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              返回登录
            </button>

            {step === 1 ? (
              <>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-2">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">忘记密码？</h1>
                  <p className="text-slate-500">此操作将清除所有数据</p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-red-800">
                    <strong className="font-semibold">警告：</strong> 由于没有设置密码找回机制，忘记密码意味着您将无法访问已保存的所有密码。
                  </p>
                  <p className="text-sm text-red-700">
                    要继续，您需要重置主密码，<strong>这将永久删除所有已保存的密码记录</strong>。
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full btn-danger py-3"
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
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-2">
                    <KeyRound className="w-8 h-8 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">设置新密码</h1>
                  <p className="text-slate-500">设置新的主密码</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pl-11 pr-11"
                        placeholder="请输入新密码"
                        required
                        autoFocus
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="password-toggle right-3"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">密码长度至少为6位</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      确认新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pl-11 pr-11"
                        placeholder="请再次输入新密码"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle right-3"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-danger py-3"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md animate-scale">
        <div className="card-elevated p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-2">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">密码管家</h1>
            <p className="text-slate-500">请输入主密码解锁</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                主密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="请输入主密码"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle right-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? '解锁中...' : '解锁'}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-slate-500 hover:text-primary-600 transition-colors"
          >
            忘记密码？
          </button>
        </div>
      </div>
    </div>
  );
}
