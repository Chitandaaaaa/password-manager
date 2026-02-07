import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 密码强度颜色映射
export function getPasswordStrengthColor(strength: number): string {
  if (strength < 30) return 'bg-red-500';
  if (strength < 50) return 'bg-orange-500';
  if (strength < 70) return 'bg-yellow-500';
  if (strength < 90) return 'bg-blue-500';
  return 'bg-green-500';
}

export function getPasswordStrengthText(strength: number): string {
  if (strength < 30) return '非常弱';
  if (strength < 50) return '弱';
  if (strength < 70) return '一般';
  if (strength < 90) return '强';
  return '非常强';
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
