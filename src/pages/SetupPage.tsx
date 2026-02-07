import { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { cn, getPasswordStrengthColor, getPasswordStrengthText } from '../lib/utils';

export default function SetupPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setView } = useAppStore();

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

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('主密码至少需要8位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await window.electronAPI.setup(password);
      if (result.success) {
        setView('main');
      } else {
        setError(result.error || '设置失败');
      }
    } catch (err) {
      setError('设置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md animate-scale">
        <div className="card-elevated p-8 space-y-6">
          {/* 头部 */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-2 shadow-glow">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">欢迎使用密码管家</h1>
            <p className="text-slate-500">请设置您的主密码</p>
          </div>

          {/* 安全提示 */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="font-semibold">安全提示</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-primary-700">
              <li>主密码用于保护所有存储的密码</li>
              <li>请务必牢记，丢失无法找回</li>
              <li>建议12位以上，包含大小写字母、数字和符号</li>
            </ul>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                设置主密码
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
              
              {/* 密码强度指示器 */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">密码强度</span>
                    <span className={cn(
                      'font-semibold',
                      strength < 30 ? 'text-red-600' :
                      strength < 50 ? 'text-orange-600' :
                      strength < 70 ? 'text-yellow-600' :
                      strength < 90 ? 'text-primary-600' : 'text-green-600'
                    )}>
                      {getPasswordStrengthText(strength)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-300 rounded-full', getPasswordStrengthColor(strength))}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                确认主密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="请再次输入主密码"
                  required
                />
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
              {isLoading ? '设置中...' : '开始使用'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
