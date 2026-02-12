import { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet, Shield } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [includePasswords, setIncludePasswords] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.exportPasswords();
      
      if (result.success && result.passwords) {
        let content: string;
        let filename: string;
        let mimeType: string;

        if (exportFormat === 'json') {
          // JSON 格式
          const exportData = {
            exportDate: new Date().toISOString(),
            totalCount: result.passwords.length,
            passwords: includePasswords 
              ? result.passwords 
              : result.passwords.map((p: any) => ({ ...p, password: '***' })),
          };
          content = JSON.stringify(exportData, null, 2);
          filename = `password-backup-${formatDate(new Date().toISOString()).replace(/[/:]/g, '-')}.json`;
          mimeType = 'application/json';
        } else {
          // CSV 格式
          const headers = ['软件名称', '用户名', '登录方式', '密码', '手机号', '邮箱', '网址', '分类', '备注', '创建时间', '更新时间'];
          const rows = result.passwords.map((p: any) => [
            p.softwareName,
            p.username || '',
            p.loginType || 'password',
            includePasswords ? (p.password || '') : '***',
            p.phoneNumber || '',
            p.email || '',
            p.url || '',
            p.category,
            p.notes || '',
            formatDate(p.createdAt),
            formatDate(p.updatedAt),
          ]);
          content = [headers.join(','), ...rows.map((r: string[]) => r.map(field => `"${field.replace(/"/g, '""')}"`).join(','))].join('\n');
          filename = `password-backup-${formatDate(new Date().toISOString()).replace(/[/:]/g, '-')}.csv`;
          mimeType = 'text/csv';
        }

        // 创建下载
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccess(`成功导出 ${result.passwords.length} 条密码记录`);
        
        // 3秒后关闭
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || '导出失败');
      }
    } catch (err) {
      setError('导出失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">导出备份</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 安全提示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">安全提醒</p>
                <p>导出的文件包含明文密码，请：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>妥善保管，不要上传到云端</li>
                  <li>备份完成后建议删除文件</li>
                  <li>存放在安全的地方（如加密U盘）</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 导出格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              导出格式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  exportFormat === 'json'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileJson className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-medium">JSON</p>
                  <p className="text-xs text-gray-500">结构化数据</p>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  exportFormat === 'csv'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-gray-500">表格格式</p>
                </div>
              </button>
            </div>
          </div>

          {/* 选项 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includePasswords"
              checked={includePasswords}
              onChange={(e) => setIncludePasswords(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="includePasswords" className="text-sm text-gray-700">
              包含明文密码（如果不勾选，密码将显示为 ***）
            </label>
          </div>

          {/* 消息提示 */}
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
        </div>

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
            onClick={handleExport}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出备份
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
