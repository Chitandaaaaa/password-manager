import { useState } from 'react';
import { Copy, Eye, EyeOff, ExternalLink, Trash2, Edit2 } from 'lucide-react';
import { Password } from '../types';
import { formatDate, cn } from '../lib/utils';

interface PasswordCardProps {
  password: Password;
  onDelete: () => void;
  onEdit: (password: Password, decryptedPassword: string) => void;
}

export default function PasswordCard({ password, onDelete, onEdit }: PasswordCardProps) {
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
      // 先解密再复制
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
        // 使用 IPC 复制，支持自动清除
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
    // 如果密码还没解密，先解密
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

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      '社交': 'bg-blue-100 text-blue-700',
      '工作': 'bg-purple-100 text-purple-700',
      '银行': 'bg-green-100 text-green-700',
      '邮箱': 'bg-yellow-100 text-yellow-700',
      '购物': 'bg-pink-100 text-pink-700',
      '其他': 'bg-gray-100 text-gray-700',
      '未分类': 'bg-gray-100 text-gray-600',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* 左侧信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {password.softwareName}
            </h3>
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getCategoryColor(password.category))}>
              {password.category || '未分类'}
            </span>
          </div>
          
          {password.username && (
            <p className="text-gray-600 mb-1 flex items-center gap-2">
              <span className="text-gray-400">账号:</span>
              <span className="font-mono">{password.username}</span>
            </p>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400">密码:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {showPassword ? decryptedPassword : '••••••••'}
              </span>
              <button
                onClick={handleDecrypt}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {password.url}
            </a>
          )}

          {password.notes && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
              {password.notes}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-3">
            更新于 {formatDate(password.updatedAt)}
          </p>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={handleCopy}
            className={cn(
              'p-2 rounded-lg transition-colors',
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            )}
            title="复制密码"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={handleEdit}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            title="编辑"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
