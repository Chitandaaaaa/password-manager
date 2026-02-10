import { Notification } from 'electron';
import { DatabaseService } from './database';

interface Subscription {
  id: string;
  serviceName: string;
  category: string;
  level: string;
  billingMode: 'time' | 'traffic';
  endDate?: string;
  autoRenew: boolean;
}

export class NotificationService {
  private db: DatabaseService;
  private checkTimer: NodeJS.Timeout | null = null;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // 启动定时检查
  start(intervalMinutes: number = 60) {
    // 立即检查一次
    this.checkExpiringSubscriptions();

    // 设置定时器
    this.checkTimer = setInterval(() => {
      this.checkExpiringSubscriptions();
    }, intervalMinutes * 60 * 1000);
  }

  // 停止定时检查
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  // 检查即将到期的订阅
  async checkExpiringSubscriptions() {
    try {
      const config = this.db.getNotificationConfig();
      const remindDays = config.systemNotification?.remindDays || 7;

      // 检查是否已经检查过（每天只检查一次）
      const lastCheckTime = config.lastCheckTime;
      if (lastCheckTime) {
        const lastCheck = new Date(lastCheckTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

        // 如果在24小时内已经检查过，跳过
        if (hoursDiff < 24) {
          return;
        }
      }

      const expiring = await this.db.getExpiringSubscriptions(remindDays);

      if (expiring.length > 0) {
        // 发送系统通知
        if (config.systemNotification?.enabled) {
          this.sendSystemNotification(expiring);
        }

        // 发送邮件通知
        if (config.emailNotification?.enabled) {
          await this.sendEmailNotification(expiring, config.emailNotification);
        }

        // 更新最后检查时间
        this.db.updateLastCheckTime();
      }
    } catch (error) {
      console.error('检查订阅到期通知失败:', error);
    }
  }

  // 发送系统通知
  private sendSystemNotification(expiring: Array<{ passwordId: number; passwordName: string; subscription: Subscription }>) {
    // 批量通知：先发送一个汇总通知
    if (expiring.length > 0) {
      const title = '订阅即将到期提醒';
      const body = `您有 ${expiring.length} 个订阅即将到期`;

      this.showNotification(title, body, () => {
        // 点击通知时打开应用并显示即将到期的订阅
        // 这个功能需要在主进程中处理窗口显示
      });
    }
  }

  // 显示系统通知
  private showNotification(title: string, body: string, onClick?: () => void) {
    if (!Notification.isSupported()) {
      console.log('系统通知不支持');
      return;
    }

    const notification = new Notification({
      title,
      body,
      urgency: 'normal',
      timeoutType: 'default',
    });

    notification.on('click', () => {
      onClick?.();
      notification.close();
    });

    notification.on('close', () => {
      notification.removeAllListeners('click');
      notification.removeAllListeners('close');
    });

    notification.show();
  }

  // 发送邮件通知
  private async sendEmailNotification(
    expiring: Array<{ passwordId: number; passwordName: string; subscription: Subscription }>,
    emailConfig: {
      smtpHost: string;
      smtpPort: number;
      fromEmail: string;
      authCode: string;
      toEmail: string;
      remindDays: number;
    }
  ) {
    // TODO: 实现邮件发送功能
    // 可以使用 nodemailer 库来发送邮件
    // 注意：主进程中没有nodemailer，需要单独安装

    console.log('邮件通知功能需要实现 nodemailer 集成');
    console.log('即将到期的订阅:', expiring.map(e => e.subscription.serviceName));
  }

  // 手动检查并发送通知（可用于测试）
  async manualCheck() {
    await this.checkExpiringSubscriptions();
  }
}
