import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, Plus, LogOut, Key,
  MessageCircle, Briefcase, Building2, Mail,
  ShoppingBag, MoreHorizontal, Folder, Lock, Download,
  Tags, Settings, Sparkles, Eye, Trash2, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Password } from '../types';
import PasswordCard from '../components/PasswordCard';
import AddPasswordModal from '../components/AddPasswordModal';
import EditPasswordModal from '../components/EditPasswordModal';
import ExportModal from '../components/ExportModal';
import CategoryModal from '../components/CategoryModal';
import CategoryDisplayModal from '../components/CategoryDisplayModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import SettingsModal from '../components/SettingsModal';
import SmartImportModal from '../components/SmartImportModal';
import { cn } from '../lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
  '全部': <Folder className="w-5 h-5" />,
  '社交': <MessageCircle className="w-5 h-5" />,
  '工作': <Briefcase className="w-5 h-5" />,
  '银行': <Building2 className="w-5 h-5" />,
  '邮箱': <Mail className="w-5 h-5" />,
  '购物': <ShoppingBag className="w-5 h-5" />,
  '其他': <MoreHorizontal className="w-5 h-5" />,
  '未分类': <Folder className="w-5 h-5" />,
};

export default function MainPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryDisplayModalOpen, setIsCategoryDisplayModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSmartImportModalOpen, setIsSmartImportModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [editingDecryptedPassword, setEditingDecryptedPassword] = useState('');
  const [enableClearAll, setEnableClearAll] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearAllPassword, setClearAllPassword] = useState('');
  const [clearAllError, setClearAllError] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const { 
    passwords, 
    setPasswords, 
    searchQuery, 
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setView,
    setError,
  } = useAppStore();

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      // 获取显示分类配置
      const displayResult = await window.electronAPI.getDisplayCategories();
      if (displayResult.success && displayResult.categories) {
        setCategories(['全部', ...displayResult.categories]);
      } else {
        // 如果失败，回退到显示所有分类
        const result = await window.electronAPI.listCategories();
        if (result.success && result.categories) {
          setCategories(['全部', ...result.categories]);
        }
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  }, []);

  // 加载危险操作配置
  const loadDangerousConfig = useCallback(async () => {
    try {
      const result = await window.electronAPI.getConfig();
      if (result.success && result.config) {
        setEnableClearAll(result.config.dangerousOperations?.enableClearAll ?? false);
      }
    } catch (err) {
      console.error('加载危险操作配置失败:', err);
    }
  }, []);

  // 加载密码列表
  const loadPasswords = useCallback(async () => {
    try {
      const result = await window.electronAPI.listPasswords({
        search: searchQuery || undefined,
        category: selectedCategory !== '全部' ? selectedCategory : undefined,
      });
      
      if (result.success && result.passwords) {
        // Debug: Log raw data from API
        console.log('API returned passwords:', result.passwords.map((p: any) => ({
          id: p.id,
          name: p.software_name,
          category: p.category,
          categoryType: typeof p.category,
        })));
        
        const formattedPasswords: Password[] = result.passwords.map(p => ({
          id: p.id,
          softwareName: p.software_name,
          username: p.username,
          url: p.url,
          notes: p.notes,
          category: p.category,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        
        // Debug: Log formatted data
        console.log('Formatted passwords:', formattedPasswords.map(p => ({
          id: p.id,
          name: p.softwareName,
          category: p.category,
        })));
        
        setPasswords(formattedPasswords);
      } else {
        setError(result.error || '加载失败');
      }
    } catch (err) {
      setError('加载密码列表失败');
    }
  }, [searchQuery, selectedCategory, setPasswords, setError]);

  useEffect(() => {
    loadCategories();
    loadDangerousConfig();
  }, [loadCategories, loadDangerousConfig]);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  // 监听自动锁定事件
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    
    const handleLock = async () => {
      if (!isMounted.current) return;
      console.log('应用已自动锁定');
      try {
        await window.electronAPI.logout();
      } catch (error) {
        console.error('自动锁定退出失败:', error);
      }
      if (isMounted.current) {
        setView('login');
      }
    };

    window.electronAPI.onAppLock(handleLock);

    // 清理函数
    return () => {
      isMounted.current = false;
    };
  }, [setView]);

  const handleLogout = async () => {
    // 标记组件即将卸载，防止自动锁定事件处理
    isMounted.current = false;
    try {
      await window.electronAPI.logout();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
    setView('login');
  };

  const handlePasswordChanged = () => {
    // 修改主密码成功后退出登录
    setTimeout(() => {
      setView('login');
    }, 2000);
  };

  const handleEditPassword = (password: Password, decryptedPassword: string) => {
    setEditingPassword(password);
    setEditingDecryptedPassword(decryptedPassword);
    setIsEditModalOpen(true);
  };

  const handleClearAllClick = () => {
    setClearAllPassword('');
    setClearAllError('');
    setIsClearAllModalOpen(true);
  };

  const handleClearAllConfirm = async () => {
    if (!clearAllPassword) {
      setClearAllError('请输入主密码');
      return;
    }

    setIsClearing(true);
    setClearAllError('');

    try {
      // First verify the password by trying to login
      const loginResult = await window.electronAPI.login(clearAllPassword);
      if (!loginResult.success) {
        setClearAllError('主密码错误');
        setIsClearing(false);
        return;
      }

      // If password is correct, clear all passwords
      const result = await window.electronAPI.clearAllPasswords();
      if (result.success) {
        setIsClearAllModalOpen(false);
        setClearAllPassword('');
        loadPasswords(); // Refresh the list
        alert('所有密码已清除');
      } else {
        setClearAllError(result.error || '清除失败');
      }
    } catch (err) {
      setClearAllError('操作失败，请重试');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* 侧边栏 */}
      <aside className="w-72 sidebar flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">密码管家</span>
          </div>
        </div>

        {/* 分类列表 */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-medium text-slate-400 uppercase font-semibold tracking-wider">
              分类
            </p>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'sidebar-item w-full',
                  selectedCategory === category && 'active'
                )}
              >
                {categoryIcons[category] || <Folder className="w-5 h-5" />}
                <span>{category}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* 底部操作 */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setIsSmartImportModalOpen(true)}
            className="sidebar-item w-full"
          >
            <Sparkles className="w-5 h-5" />
            <span>AI智能导入</span>
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="sidebar-item w-full"
          >
            <Tags className="w-5 h-5" />
            <span>管理分类</span>
          </button>
          <button
            onClick={() => setIsCategoryDisplayModalOpen(true)}
            className="sidebar-item w-full"
          >
            <Eye className="w-5 h-5" />
            <span>显示设置</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="sidebar-item w-full"
          >
            <Download className="w-5 h-5" />
            <span>导出备份</span>
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="sidebar-item w-full"
          >
            <Settings className="w-5 h-5" />
            <span>设置</span>
          </button>
          {enableClearAll && (
            <button
              onClick={handleClearAllClick}
              className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
              <span>全部清除</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col bg-slate-50/50">
        {/* 顶部栏 */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10 px-6 flex items-center justify-between">
          {/* 搜索框 */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索密码..."
                className="input-field pl-10 bg-slate-100 border-transparent focus:bg-white w-full"
              />
            </div>
          </div>

          {/* 添加按钮 */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>添加密码</span>
          </button>
        </header>

        {/* 密码列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {passwords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Key className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? '没有找到匹配的密码' : '还没有保存任何密码'}
              </h3>
              <p className="text-slate-500 max-w-sm">
                {searchQuery 
                  ? '尝试使用其他关键词搜索' 
                  : '点击右上角的"添加密码"按钮开始记录您的第一个密码'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 max-w-5xl">
              {passwords.map((password) => (
                <PasswordCard 
                  key={password.id} 
                  password={password}
                  onDelete={loadPasswords}
                  onEdit={handleEditPassword}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 添加密码弹窗 */}
      <AddPasswordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadPasswords}
      />

      {/* 导出备份弹窗 */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* 分类管理弹窗 */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChange={() => {
          loadCategories();
          loadPasswords();
        }}
      />

      {/* 分类显示设置弹窗 */}
      <CategoryDisplayModal
        isOpen={isCategoryDisplayModalOpen}
        onClose={() => {
          setIsCategoryDisplayModalOpen(false);
          loadCategories(); // 关闭时刷新分类列表
        }}
      />

      {/* 修改主密码弹窗 */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={handlePasswordChanged}
      />

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          loadDangerousConfig(); // 设置关闭后刷新危险操作配置
        }}
      />

      {/* AI智能导入弹窗 */}
      <SmartImportModal
        isOpen={isSmartImportModalOpen}
        onClose={() => setIsSmartImportModalOpen(false)}
        onSuccess={loadPasswords}
      />

      {/* 编辑密码弹窗 */}
      <EditPasswordModal
        isOpen={isEditModalOpen}
        password={editingPassword}
        decryptedPassword={editingDecryptedPassword}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadPasswords}
      />

      {/* 全部清除确认弹窗 */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-elevated w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">危险操作</h3>
                  <p className="text-sm text-slate-500">此操作将永久删除所有密码</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700">
                  <strong>警告：</strong> 您即将删除所有密码记录。此操作不可撤销，所有数据将永久丢失！
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  请输入主密码确认
                </label>
                <input
                  type="password"
                  value={clearAllPassword}
                  onChange={(e) => setClearAllPassword(e.target.value)}
                  className="input-field w-full"
                  placeholder="输入主密码"
                  autoFocus
                />
              </div>

              {clearAllError && (
                <div className="mb-4 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {clearAllError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="flex-1 btn-secondary"
                  disabled={isClearing}
                >
                  取消
                </button>
                <button
                  onClick={handleClearAllConfirm}
                  disabled={isClearing || !clearAllPassword}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isClearing ? '清除中...' : '确认清除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
