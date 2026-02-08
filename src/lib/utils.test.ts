import { describe, it, expect } from 'vitest';
import { cn, getPasswordStrengthColor, getPasswordStrengthText, formatDate } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const condition = true;
      expect(cn('base', condition && 'conditional')).toBe('base conditional');
    });

    it('should handle tailwind class conflicts', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should filter out falsy values', () => {
      expect(cn('base', false, undefined, null, 'valid')).toBe('base valid');
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return red for very weak passwords (< 30)', () => {
      expect(getPasswordStrengthColor(0)).toBe('bg-red-500');
      expect(getPasswordStrengthColor(15)).toBe('bg-red-500');
      expect(getPasswordStrengthColor(29)).toBe('bg-red-500');
    });

    it('should return orange for weak passwords (30-49)', () => {
      expect(getPasswordStrengthColor(30)).toBe('bg-orange-500');
      expect(getPasswordStrengthColor(40)).toBe('bg-orange-500');
      expect(getPasswordStrengthColor(49)).toBe('bg-orange-500');
    });

    it('should return yellow for medium passwords (50-69)', () => {
      expect(getPasswordStrengthColor(50)).toBe('bg-yellow-500');
      expect(getPasswordStrengthColor(60)).toBe('bg-yellow-500');
      expect(getPasswordStrengthColor(69)).toBe('bg-yellow-500');
    });

    it('should return blue for strong passwords (70-89)', () => {
      expect(getPasswordStrengthColor(70)).toBe('bg-blue-500');
      expect(getPasswordStrengthColor(80)).toBe('bg-blue-500');
      expect(getPasswordStrengthColor(89)).toBe('bg-blue-500');
    });

    it('should return green for very strong passwords (>= 90)', () => {
      expect(getPasswordStrengthColor(90)).toBe('bg-green-500');
      expect(getPasswordStrengthColor(95)).toBe('bg-green-500');
      expect(getPasswordStrengthColor(100)).toBe('bg-green-500');
    });
  });

  describe('getPasswordStrengthText', () => {
    it('should return "非常弱" for very weak passwords (< 30)', () => {
      expect(getPasswordStrengthText(0)).toBe('非常弱');
      expect(getPasswordStrengthText(29)).toBe('非常弱');
    });

    it('should return "弱" for weak passwords (30-49)', () => {
      expect(getPasswordStrengthText(30)).toBe('弱');
      expect(getPasswordStrengthText(49)).toBe('弱');
    });

    it('should return "一般" for medium passwords (50-69)', () => {
      expect(getPasswordStrengthText(50)).toBe('一般');
      expect(getPasswordStrengthText(69)).toBe('一般');
    });

    it('should return "强" for strong passwords (70-89)', () => {
      expect(getPasswordStrengthText(70)).toBe('强');
      expect(getPasswordStrengthText(89)).toBe('强');
    });

    it('should return "非常强" for very strong passwords (>= 90)', () => {
      expect(getPasswordStrengthText(90)).toBe('非常强');
      expect(getPasswordStrengthText(100)).toBe('非常强');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00';
      const formatted = formatDate(dateString);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });

    it('should handle ISO date strings', () => {
      const dateString = new Date('2024-06-20T14:45:30').toISOString();
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/\d{4}/);
    });

    it('should include time in the format', () => {
      const dateString = '2024-12-25T08:00:00';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });
});
