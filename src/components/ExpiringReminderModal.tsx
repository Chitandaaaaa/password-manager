import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, X, ExternalLink, Calendar, Clock } from 'lucide-react';
import { Subscription, CATEGORY_LABELS, LEVEL_LABELS } from '../types';

interface ExpiringReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  days?: number;
}

interface ExpiringSubscription {
  passwordId: number;
  passwordName: string;
  subscription: Subscription;
}

export default function ExpiringReminderModal({ isOpen, onClose, days = 7 }: ExpiringReminderModalProps) {
  const [expiringList, setExpiringList] = useState<ExpiringSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadExpiringSubscriptions();
    }
  }, [isOpen, days]);

  const loadExpiringSubscriptions = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getExpiringSubscriptions(days);
      if (result.success && result.subscriptions) {
        setExpiringList(result.subscriptions);
      }
    } catch (error) {
      console.error('加载即将到期订阅失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate: string | undefined) => {
    if (!endDate) return 0;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyStyle = (daysLeft: number) => {
    if (daysLeft < 0) {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        text: 'text-red-600',
      };
    }
    if (daysLeft <= 3) {
      return {
        bg: 'bg-orange-50 border-orange-200',
        icon: 'text-orange-500',
        badge: 'bg-orange-100 text-orange-700',
        text: 'text-orange-600',
      };
    }
    return {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      badge: 'bg-yellow-100 text-yellow-700',
      text: 'text-yellow-600',
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-elevated w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">订阅即将到期</h2>
              <p className="text-sm text-slate-500">
                {days} 天内即将到期的会员服务
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : expiringList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                一切正常！
              </h3>
              <p className="text-slate-500">
                没有即将到期的订阅
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringList
                .filter(item => item.subscription.billingMode === 'time' && item.subscription.endDate)
                .map((item) => {
                  const daysLeft = getDaysLeft(item.subscription.endDate);
                  const style = getUrgencyStyle(daysLeft);

                  return (
                    <div
                      key={item.subscription.id}
                      className={`p-4 rounded-xl border ${style.bg}`}
                    >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 truncate">
                            {item.subscription.serviceName}
                          </span>
                          <span className={`badge text-xs ${style.badge}`}>
                            {LEVEL_LABELS[item.subscription.level]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {item.passwordName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {CATEGORY_LABELS[item.subscription.category]}
                          </span>
                          <span className={`flex items-center gap-1 font-medium ${style.text}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {daysLeft < 0 ? `已过期 ${Math.abs(daysLeft)} 天` : `剩余 ${daysLeft} 天`}
                          </span>
                        </div>
                        {item.subscription.autoRenew && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            已开启自动续费
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 p-4 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 btn-primary"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
