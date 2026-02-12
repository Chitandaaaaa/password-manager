import { useState, memo, useCallback } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Trash2, Edit2, Check, CreditCard, Plus, Smartphone, Mail } from 'lucide-react';
import { Password, Subscription, CATEGORY_LABELS, LEVEL_LABELS, BILLING_MODE_LABELS } from '../types';
import { formatDate, cn } from '../lib/utils';
import SubscriptionModal from './SubscriptionModal';

interface PasswordCardProps {
  password: Password;
  onDelete: () => void;
  onEdit: (password: Password, decryptedPassword: string) => void;
  onRefresh?: () => void;
}

function PasswordCardInner({ password, onDelete, onEdit, onRefresh }: PasswordCardProps) {
  // 使用 useCallback 缓存函数，避免每次渲染都创建新函数
  const handleSubscriptionClose = useCallback(() => {
    setIsSubscriptionModalOpen(false);
    setEditingSubscription(null);
  }, []);

  const handleSubscriptionSuccess = useCallback(() => {
    // 通知父组件刷新数据
    onRefresh?.();
  }, [onRefresh]);
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 订阅相关状态
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionMode, setSubscriptionMode] = useState<'add' | 'edit' | 'view'>('add');

  const handleDecrypt = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword('');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.decryptPassword(password.id);
      if (result.success && result.password) {
        setDecryptedPassword(result.password);
        setShowPassword(true);
      }
    } catch (error) {
      console.error('解密失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    // 短信验证码：复制手机号
    if (password.loginType === 'sms_code' && password.phoneNumber) {
      try {
        const result = await window.electronAPI.copyPassword(password.phoneNumber);
        if (result.success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        console.error('复制失败:', error);
      }
      return;
    }
    // 邮箱登录：复制邮箱
    if (password.loginType === 'email' && password.email) {
      try {
        const result = await window.electronAPI.copyPassword(password.email);
        if (result.success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        console.error('复制失败:', error);
      }
      return;
    }
    // 密码登录：复制密码
    let passwordToCopy = decryptedPassword;
    if (!passwordToCopy && !showPassword) {
      setIsLoading(true);
      try {
        const result = await window.electronAPI.decryptPassword(password.id);
        if (result.success && result.password) {
          passwordToCopy = result.password;
        } else {
          return;
        }
      } catch (error) {
        console.error('复制失败:', error);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    if (passwordToCopy) {
      try {
        const result = await window.electronAPI.copyPassword(passwordToCopy);
        if (result.success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除 ${password.softwareName} 的密码记录吗？`)) {
      return;
    }

    try {
      const result = await window.electronAPI.deletePassword(password.id);
      if (result.success) {
        onDelete();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleEdit = async () => {
    // 邮箱登录和短信验证码无需解密，直接打开编辑
    if (password.loginType === 'email' || password.loginType === 'sms_code') {
      onEdit(password, '');
      return;
    }
    if (!showPassword || !decryptedPassword) {
      setIsLoading(true);
      try {
        const result = await window.electronAPI.decryptPassword(password.id);
        if (result.success && result.password) {
          onEdit(password, result.password);
        }
      } catch (error) {
        console.error('解密失败:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      onEdit(password, decryptedPassword);
    }
  };

  // 只检查 category 是否为空，不限制具体分类值
  const getCategoryDisplayName = (category?: string): string => {
    console.log('getCategoryDisplayName input:', category, 'type:', typeof category);
    if (!category || category === '') {
      console.log('  -> returning "未分类" (empty value)');
      return '未分类';
    }
    console.log('  -> returning category:', category);
    return category; // 直接返回原始值，支持自定义分类
  };
  
  const getCategoryBadge = (category?: string) => {
    const displayName = getCategoryDisplayName(category);
    const styles: Record<string, string> = {
      '社交': 'badge-blue',
      '工作': 'badge-purple',
      '银行': 'badge-green',
      '邮箱': 'badge-yellow',
      '购物': 'badge-red',
      '其他': 'badge-gray',
      '未分类': 'badge-gray',
    };
    // 返回对应样式，如果没有则使用默认灰色样式（支持自定义分类）
    return styles[displayName] || 'badge-gray';
  };

  return (
    <div className="group card-flat p-5 hover-lift animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {password.softwareName}
            </h3>
            <span className={cn('badge', getCategoryBadge(password.category))}>
              {getCategoryDisplayName(password.category)}
            </span>
          </div>
          
          {password.username && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400 w-10">账号</span>
              <span className="text-sm text-slate-700 font-mono">{password.username}</span>
            </div>
          )}
          
          {/* 根据登录类型显示不同内容 */}
          {password.loginType === 'password' ? (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-slate-400 w-10">密码</span>
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 bg-slate-100 rounded-md text-sm font-mono text-slate-700">
                  {showPassword ? decryptedPassword : '••••••••'}
                </code>
                <button
                  onClick={handleDecrypt}
                  disabled={isLoading}
                  className="btn-icon"
                  title={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                  ) : showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ) : password.loginType === 'sms_code' ? (
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                短信验证码登录
              </span>
              {password.phoneNumber && (
                <span className="text-sm text-slate-700 font-mono">
                  {password.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </span>
              )}
              <button
                onClick={() => {
                  if (password.phoneNumber) {
                    window.electronAPI.copyPassword(password.phoneNumber);
                  }
                }}
                className="btn-icon text-blue-600 hover:text-blue-700"
                title="复制手机号"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                邮箱登录
              </span>
              {password.email && (
                <span className="text-sm text-slate-700 font-mono">
                  {password.email.includes('@')
                    ? password.email.split('@').map((part, i) => i === 0 ? part.slice(0, 3) + '***' : part).join('@')
                    : '***'}
                </span>
              )}
              <button
                onClick={() => {
                  if (password.email) {
                    window.electronAPI.copyPassword(password.email);
                  }
                }}
                className="btn-icon text-emerald-600 hover:text-emerald-700"
                title="复制邮箱"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {password.url && (
            <a
              href={password.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mb-2 group/link"
            >
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
              <span className="truncate max-w-xs">{password.url}</span>
            </a>
          )}

          {password.notes && (
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {password.notes}
            </p>
          )}

          {/* 订阅区域 */}
          <div className="mt-3 space-y-2">
            {/* 订阅列表 */}
            {password.subscriptions && password.subscriptions.length > 0 && (
              <>
                {password.subscriptions.map((sub) => {
                  // 计算时间制订阅的状态
                  let daysLeft: number | null = null;
                  let isExpiring = false;
                  let isExpired = false;
                  
                  if (sub.billingMode === 'time' && sub.endDate) {
                    daysLeft = Math.ceil(
                      (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    isExpiring = daysLeft <= 7 && daysLeft >= 0;
                    isExpired = daysLeft < 0;
                  }
                  
                  // 计算流量制订阅的状态
                  let trafficPercentage = 0;
                  let isTrafficLow = false;
                  
                  if (sub.billingMode === 'traffic' && sub.totalAmount && sub.usedAmount !== undefined) {
                    trafficPercentage = (sub.usedAmount / sub.totalAmount) * 100;
                    isTrafficLow = trafficPercentage >= 50;
                  }

                  return (
                    <div
                      key={sub.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer hover:opacity-90 transition-opacity',
                        sub.billingMode === 'time' && isExpired
                          ? 'bg-red-50 border-red-200'
                          : sub.billingMode === 'time' && isExpiring
                          ? 'bg-yellow-50 border-yellow-200'
                          : sub.billingMode === 'traffic' && isTrafficLow
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-green-50 border-green-200'
                      )}
                      onClick={() => {
                        setEditingSubscription(sub);
                        setSubscriptionMode('view');
                        setIsSubscriptionModalOpen(true);
                      }}
                    >
                      <CreditCard className={cn(
                        'w-4 h-4 flex-shrink-0',
                        sub.billingMode === 'time' && isExpired ? 'text-red-500' : 
                        sub.billingMode === 'time' && isExpiring ? 'text-yellow-500' : 
                        sub.billingMode === 'traffic' && isTrafficLow ? 'text-orange-500' :
                        'text-green-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 truncate">
                            {sub.serviceName}
                          </span>
                          <span className={cn(
                            'badge text-xs',
                            sub.level === 'premium' ? 'bg-purple-100 text-purple-700' :
                            sub.level === 'ultimate' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            {LEVEL_LABELS[sub.level]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{CATEGORY_LABELS[sub.category]}</span>
                          <span>·</span>
                          {sub.billingMode === 'time' ? (
                            <>
                              <span>{sub.autoRenew ? '自动续费' : '到期止'} </span>
                              <span>·</span>
                              <span className={cn(
                                isExpired ? 'text-red-600 font-medium' :
                                isExpiring ? 'text-yellow-600 font-medium' :
                                ''
                              )}>
                                {isExpired ? `已过期 ${Math.abs(daysLeft!)} 天` : `剩余 ${daysLeft} 天`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>按流量计费</span>
                              <span>·</span>
                              <span className={cn(
                                isTrafficLow ? 'text-orange-600 font-medium' : ''
                              )}>
                                总量: {sub.totalAmount} {sub.unit}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* 添加订阅按钮 */}
            <button
              onClick={() => {
                setEditingSubscription(null);
                setSubscriptionMode('add');
                setIsSubscriptionModalOpen(true);
              }}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed text-sm font-medium transition-all',
                password.subscriptions && password.subscriptions.length > 0
                  ? 'border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
                  : 'border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
              )}
            >
              <Plus className="w-4 h-4" />
              <span>添加订阅</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            更新于 {formatDate(password.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className={cn(
              'btn-icon',
              copied && 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
            )}
            title={copied ? '已复制' : (password.loginType === 'email' ? '复制邮箱' : password.loginType === 'sms_code' ? '复制手机号' : '复制密码')}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleEdit}
            disabled={isLoading}
            className="btn-icon hover:text-primary-600 hover:bg-primary-50"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="btn-icon hover:text-red-600 hover:bg-red-50"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 订阅弹窗 */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleSubscriptionClose}
        onSuccess={handleSubscriptionSuccess}
        passwordId={password.id}
        passwordName={password.softwareName}
        existingSubscription={editingSubscription}
        mode={subscriptionMode}
      />
    </div>
  );
}

export default memo(PasswordCardInner);
