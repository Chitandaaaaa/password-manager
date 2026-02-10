import { useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, DollarSign, Tag, Clock, Database } from 'lucide-react';
import { Subscription, CATEGORY_LABELS, LEVEL_LABELS, BILLING_MODE_LABELS, UNIT_TYPE_LABELS, BillingMode, UnitType } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  passwordId: number;
  passwordName: string;
  existingSubscription?: Subscription | null;
  mode: 'add' | 'edit' | 'view';
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][];
const LEVELS = Object.entries(LEVEL_LABELS) as [keyof typeof LEVEL_LABELS, string][];

function SubscriptionModalInner({
  isOpen,
  onClose,
  onSuccess,
  passwordId,
  passwordName,
  existingSubscription,
  mode: initialMode,
}: SubscriptionModalProps) {
  // 内部状态管理当前模式，支持从 view 切换到 edit
  const [currentMode, setCurrentMode] = useState(initialMode);

  // 当外部 mode 变化时更新内部状态
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'video' as Subscription['category'],
    level: 'basic' as Subscription['level'],
    billingMode: 'time' as BillingMode,
    startDate: '',
    endDate: '',
    totalAmount: undefined as number | undefined,
    usedAmount: undefined as number | undefined,
    unit: 'GB' as UnitType,
    cost: undefined as number | undefined,
    autoRenew: false,
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isViewMode = currentMode === 'view';

  // 使用 useMemo 缓存剩余天数计算
  const daysLeft = useMemo(() => {
    if (!formData.endDate) return null;
    const now = new Date();
    const end = new Date(formData.endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }, [formData.endDate]);

  useEffect(() => {
    if (existingSubscription && currentMode !== 'add') {
      setFormData({
        serviceName: existingSubscription.serviceName,
        category: existingSubscription.category,
        level: existingSubscription.level,
        billingMode: existingSubscription.billingMode || 'time',
        startDate: existingSubscription.startDate ? existingSubscription.startDate.split('T')[0] : '',
        endDate: existingSubscription.endDate ? existingSubscription.endDate.split('T')[0] : '',
        totalAmount: existingSubscription.totalAmount,
        usedAmount: existingSubscription.usedAmount,
        unit: existingSubscription.unit || 'GB',
        cost: existingSubscription.cost,
        autoRenew: existingSubscription.autoRenew,
        note: existingSubscription.note || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        serviceName: passwordName,
        billingMode: 'time',
        startDate: today,
        endDate: '',
        totalAmount: undefined,
        usedAmount: undefined,
        unit: 'GB',
        autoRenew: false,
        note: '',
      }));
    }
  }, [existingSubscription, currentMode, passwordName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 根据计费模式准备数据
      const baseData = {
        serviceName: formData.serviceName,
        category: formData.category,
        level: formData.level,
        billingMode: formData.billingMode,
        cost: formData.cost,
        autoRenew: formData.autoRenew,
        note: formData.note,
      };

      const timeModeData = formData.billingMode === 'time' ? {
        startDate: formData.startDate,
        endDate: formData.endDate,
      } : {};

      const trafficModeData = formData.billingMode === 'traffic' ? {
        totalAmount: formData.totalAmount,
        usedAmount: formData.usedAmount,
        unit: formData.unit,
      } : {};

      if (currentMode === 'add') {
        const result = await window.electronAPI.addSubscription(passwordId, {
          ...baseData,
          ...timeModeData,
          ...trafficModeData,
        });

        if (!result.success) {
          throw new Error(result.error || '添加订阅失败');
        }
      } else if (currentMode === 'edit' && existingSubscription) {
        const result = await window.electronAPI.updateSubscription(passwordId, existingSubscription.id, {
          ...baseData,
          ...timeModeData,
          ...trafficModeData,
        });

        if (!result.success) {
          throw new Error(result.error || '更新订阅失败');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSubscription) return;

    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.deleteSubscription(passwordId, existingSubscription.id);
      if (!result.success) {
        throw new Error(result.error || '删除订阅失败');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 使用 Portal 渲染到 body，避免父组件 hover 影响位置和闪烁
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '512px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {isViewMode ? '订阅详情' : existingSubscription ? '编辑订阅' : '添加订阅'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{passwordName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* 服务名称 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              服务名称 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.serviceName}
              onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isViewMode ? '#f8fafc' : 'white',
              }}
              placeholder="例如：Netflix 高级会员"
              required
              disabled={isViewMode}
            />
          </div>

          {/* 分类和等级 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                分类 <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Subscription['category'] })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isViewMode ? '#f8fafc' : 'white',
                }}
                disabled={isViewMode}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                等级
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as Subscription['level'] })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isViewMode ? '#f8fafc' : 'white',
                }}
                disabled={isViewMode}
              >
                {LEVELS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 计费模式选择 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>
              <Database style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
              计费模式
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billingMode: 'time' })}
                disabled={isViewMode}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '2px solid',
                  borderColor: formData.billingMode === 'time' ? '#4f46e5' : '#e2e8f0',
                  backgroundColor: formData.billingMode === 'time' ? '#eff6ff' : 'white',
                  color: formData.billingMode === 'time' ? '#4f46e5' : '#334155',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isViewMode ? 'not-allowed' : 'pointer',
                  opacity: isViewMode ? 0.6 : 1,
                }}
              >
                {BILLING_MODE_LABELS.time}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billingMode: 'traffic' })}
                disabled={isViewMode}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '2px solid',
                  borderColor: formData.billingMode === 'traffic' ? '#4f46e5' : '#e2e8f0',
                  backgroundColor: formData.billingMode === 'traffic' ? '#eff6ff' : 'white',
                  color: formData.billingMode === 'traffic' ? '#4f46e5' : '#334155',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isViewMode ? 'not-allowed' : 'pointer',
                  opacity: isViewMode ? 0.6 : 1,
                }}
              >
                {BILLING_MODE_LABELS.traffic}
              </button>
            </div>
          </div>

          {/* 时间制字段 */}
          {formData.billingMode === 'time' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    <Calendar style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                    开始日期 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: isViewMode ? '#f8fafc' : 'white',
                    }}
                    required={formData.billingMode === 'time'}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    <Clock style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                    到期日期 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: isViewMode ? '#f8fafc' : 'white',
                    }}
                    required={formData.billingMode === 'time'}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              {/* 剩余天数提示 */}
              {daysLeft !== null && formData.endDate && (
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  backgroundColor: daysLeft < 0 ? '#fef2f2' : daysLeft <= 7 ? '#fefce8' : '#f0fdf4',
                  color: daysLeft < 0 ? '#dc2626' : daysLeft <= 7 ? '#ca8a04' : '#16a34a',
                }}>
                  {daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `剩余 ${daysLeft} 天`}
                </div>
              )}
            </>
          )}

          {/* 流量制字段 */}
          {formData.billingMode === 'traffic' && (
            <>
              {/* 总量和单位 */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    总量 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value ? Number(e.target.value) : undefined })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: isViewMode ? '#f8fafc' : 'white',
                    }}
                    placeholder="100"
                    min="0"
                    required={formData.billingMode === 'traffic'}
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    单位
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: isViewMode ? '#f8fafc' : 'white',
                    }}
                    disabled={isViewMode}
                  >
                    {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 已用量 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  已用量（可选）
                </label>
                <input
                  type="number"
                  value={formData.usedAmount || ''}
                  onChange={(e) => setFormData({ ...formData, usedAmount: e.target.value ? Number(e.target.value) : undefined })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: isViewMode ? '#f8fafc' : 'white',
                  }}
                  placeholder="0"
                  min="0"
                  disabled={isViewMode}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>用于记录当前已使用的量</p>
              </div>

              {/* 剩余量显示（查看模式） */}
              {isViewMode && formData.totalAmount !== undefined && formData.usedAmount !== undefined && (
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                }}>
                  剩余: {formData.totalAmount - formData.usedAmount} {formData.unit}
                </div>
              )}
            </>
          )}

          {/* 费用 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              <DollarSign style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
              费用 (可选)
            </label>
            <input
              type="number"
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value ? Number(e.target.value) : undefined })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isViewMode ? '#f8fafc' : 'white',
              }}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isViewMode}
            />
          </div>

          {/* 自动续费 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
                disabled={isViewMode}
              />
              <label style={{ fontSize: '14px', color: '#334155' }}>自动续费</label>
            </div>
            {formData.autoRenew && (
              <span style={{ fontSize: '12px', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '4px' }}>
                已开启自动续费
              </span>
            )}
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
              备注 (可选)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '96px',
                resize: 'none',
                backgroundColor: isViewMode ? '#f8fafc' : 'white',
              }}
              placeholder="添加一些备注..."
              disabled={isViewMode}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            {isViewMode ? (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                  disabled={loading}
                >
                  删除
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentMode('edit');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  编辑
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default memo(SubscriptionModalInner);
