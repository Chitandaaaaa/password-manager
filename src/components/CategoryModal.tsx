import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Folder, Check, XCircle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: () => void;
}

export default function CategoryModal({ isOpen, onClose, onCategoriesChange }: CategoryModalProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

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

  const handleAdd = async () => {
    if (!newCategory.trim()) {
      setError('请输入分类名称');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setError('分类已存在');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.addCategory(newCategory.trim());
      if (result.success) {
        setNewCategory('');
        setError('');
        await loadCategories();
        onCategoriesChange();
      } else {
        setError(result.error || '添加失败');
      }
    } catch (err) {
      setError('添加失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确定要删除分类"${name}"吗？\n该分类下的密码将移动到"未分类"。`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.deleteCategory(name);
      if (result.success) {
        await loadCategories();
        onCategoriesChange();
      } else {
        setError(result.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (name: string) => {
    setEditingCategory(name);
    setEditingValue(name);
  };

  const handleRename = async () => {
    if (!editingCategory || !editingValue.trim()) return;

    if (editingValue.trim() === editingCategory) {
      setEditingCategory(null);
      return;
    }

    if (categories.includes(editingValue.trim())) {
      setError('分类名称已存在');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.renameCategory(editingCategory, editingValue.trim());
      if (result.success) {
        setEditingCategory(null);
        setError('');
        await loadCategories();
        onCategoriesChange();
      } else {
        setError(result.error || '重命名失败');
      }
    } catch (err) {
      setError('重命名失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">管理分类</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* 添加新分类 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="输入新分类名称"
              className="flex-1 input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={isLoading || !newCategory.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          {/* 分类列表 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暂无分类
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    {editingCategory === category ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Folder className="w-5 h-5 text-primary-500" />
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 input-field py-1 text-sm"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          onClick={handleRename}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-primary-500" />
                          <span className="text-gray-900">{category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(category)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="重命名"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            提示：删除分类时，该分类下的密码将自动移动到"未分类"
          </p>
        </div>
      </div>
    </div>
  );
}
