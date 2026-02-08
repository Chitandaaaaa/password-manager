import { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Trash2, Edit2, Check } from 'lucide-react';
import { Password } from '../types';
import { formatDate, cn } from '../lib/utils';

interface PasswordCardProps {
  password: Password;
  onDelete: () => void;
  onEdit: (password: Password, decryptedPassword: string) => void;
}

export default function PasswordCard({ password, onDelete, onEdit }: PasswordCardProps) {
  // Debug: Log the received password data
  console.log('PasswordCard received:', {
    id: password.id,
    softwareName: password.softwareName,
    category: password.category,
    categoryType: typeof password.category,
    categoryLength: password.category?.length,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
            title={copied ? '已复制' : '复制密码'}
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
    </div>
  );
}
