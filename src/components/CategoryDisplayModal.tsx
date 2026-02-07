import { useState, useEffect } from 'react';
import { X, Check, Settings2 } from 'lucide-react';

interface CategoryDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryDisplayModal({ isOpen, onClose }: CategoryDisplayModalProps) {
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxDisplayCount, setMaxDisplayCount] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDisplayConfig();
    }
  }, [isOpen]);

  const loadDisplayConfig = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.getDisplayCategories();
      if (result.success) {
        setAllCategories(result.allCategories || []);
        setSelectedCategories(result.categories || []);
        if (result.displayConfig) {
          setMaxDisplayCount(result.displayConfig.maxDisplayCount || 4);
        }
      } else {
        setError(result.error || '加载配置失败');
      }
    } catch (err) {
      console.error('加载配置详细错误:', err);
      setError('加载配置失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // 保存显示的分类
      const result = await window.electronAPI.updateDisplayCategories(selectedCategories);
      if (result.success) {
        setSuccess('配置已保存');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      // 限制最多选择 maxDisplayCount 个
      if (selectedCategories.length < maxDisplayCount) {
        setSelectedCategories([...selectedCategories, category]);
      } else {
        setError(`最多只能选择 ${maxDisplayCount} 个分类`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">分类显示设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              {success}
            </div>
          )}

          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              选择要在侧边栏显示的常用分类（最多 {maxDisplayCount} 个）。
              <br />
              当前已选择: {selectedCategories.length} 个
            </p>
          </div>

          {/* 分类选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择显示的分类
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{category}</span>
                    {isSelected ? (
                      <Check className="w-5 h-5 text-primary-600" />
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 已选择提示 */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || selectedCategories.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
