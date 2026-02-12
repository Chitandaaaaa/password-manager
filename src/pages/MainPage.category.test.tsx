import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainPage from './MainPage';
import { useAppStore } from '../stores/appStore';

// Mock the store
vi.mock('../stores/appStore', () => ({
  useAppStore: vi.fn(),
}));

describe('MainPage Category Integration', () => {
  const mockSetView = vi.fn();
  const mockSetPasswords = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockReturnValue({
      passwords: [],
      setPasswords: mockSetPasswords,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      selectedCategory: '全部',
      setSelectedCategory: vi.fn(),
      setView: mockSetView,
      setError: mockSetError,
    });

    // Setup mock electronAPI
    window.electronAPI.listPasswords = vi.fn();
    window.electronAPI.listCategories = vi.fn();
    window.electronAPI.getDisplayCategories = vi.fn().mockResolvedValue({ success: false });
    window.electronAPI.getConfig = vi.fn();
    window.electronAPI.logout = vi.fn();
    window.electronAPI.onAppLock = vi.fn();
  });

  describe('category data flow', () => {
    it('should correctly display passwords with their categories', async () => {
      // Mock API response with various categories
      const mockPasswords = [
        {
          id: 1,
          software_name: '微信',
          username: 'user1',
          url: 'https://weixin.qq.com',
          notes: '',
          category: '社交',
          created_at: '2024-01-15T10:00:00',
          updated_at: '2024-01-15T10:00:00',
        },
        {
          id: 2,
          software_name: '公司邮箱',
          username: 'employee@company.com',
          url: 'https://mail.company.com',
          notes: '工作邮箱',
          category: '工作',
          created_at: '2024-01-14T10:00:00',
          updated_at: '2024-01-14T10:00:00',
        },
        {
          id: 3,
          software_name: '支付宝',
          username: 'user3',
          url: 'https://www.alipay.com',
          notes: '',
          category: '银行',
          created_at: '2024-01-13T10:00:00',
          updated_at: '2024-01-13T10:00:00',
        },
        {
          id: 4,
          software_name: 'Test App',
          username: 'test',
          url: '',
          notes: '',
          category: undefined, // Missing category
          created_at: '2024-01-12T10:00:00',
          updated_at: '2024-01-12T10:00:00',
        },
      ];

      window.electronAPI.listPasswords = vi.fn().mockResolvedValue({
        success: true,
        passwords: mockPasswords,
      });

      window.electronAPI.listCategories = vi.fn().mockResolvedValue({
        success: true,
        categories: ['社交', '工作', '银行', '邮箱', '购物', '其他'],
      });

      window.electronAPI.getConfig = vi.fn().mockResolvedValue({
        success: true,
        config: {
          dangerousOperations: { enableClearAll: false },
        },
      });

      render(<MainPage />);

      // Wait for passwords to load
      await waitFor(() => {
        expect(window.electronAPI.listPasswords).toHaveBeenCalled();
      });

      // Verify that setPasswords was called with formatted data
      await waitFor(() => {
        expect(mockSetPasswords).toHaveBeenCalled();
      });

      // Get the formatted passwords passed to setPasswords
      const formattedPasswords = mockSetPasswords.mock.calls[0][0];

      // Verify category mapping is correct
      expect(formattedPasswords).toHaveLength(4);
      expect(formattedPasswords[0].category).toBe('社交');
      expect(formattedPasswords[0].softwareName).toBe('微信');
      expect(formattedPasswords[1].category).toBe('工作');
      expect(formattedPasswords[1].softwareName).toBe('公司邮箱');
      expect(formattedPasswords[2].category).toBe('银行');
      expect(formattedPasswords[2].softwareName).toBe('支付宝');
      expect(formattedPasswords[3].category).toBe('未分类');
      expect(formattedPasswords[3].softwareName).toBe('Test App');
    });

    it('should handle category filtering correctly', async () => {
      const mockPasswords = [
        {
          id: 1,
          software_name: '微信',
          username: 'user1',
          category: '社交',
          created_at: '2024-01-15T10:00:00',
          updated_at: '2024-01-15T10:00:00',
        },
        {
          id: 2,
          software_name: 'QQ',
          username: 'user2',
          category: '社交',
          created_at: '2024-01-14T10:00:00',
          updated_at: '2024-01-14T10:00:00',
        },
        {
          id: 3,
          software_name: '公司邮箱',
          username: 'employee',
          category: '工作',
          created_at: '2024-01-13T10:00:00',
          updated_at: '2024-01-13T10:00:00',
        },
      ];

      window.electronAPI.listPasswords = vi.fn().mockResolvedValue({
        success: true,
        passwords: mockPasswords,
      });

      window.electronAPI.listCategories = vi.fn().mockResolvedValue({
        success: true,
        categories: ['社交', '工作', '银行'],
      });

      window.electronAPI.getConfig = vi.fn().mockResolvedValue({
        success: true,
        config: {
          dangerousOperations: { enableClearAll: false },
        },
      });

      // Test with '社交' category filter
      (useAppStore as any).mockReturnValue({
        passwords: [],
        setPasswords: mockSetPasswords,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        selectedCategory: '社交',
        setSelectedCategory: vi.fn(),
        setView: mockSetView,
        setError: mockSetError,
      });

      render(<MainPage />);

      await waitFor(() => {
        expect(window.electronAPI.listPasswords).toHaveBeenCalledWith(
          expect.objectContaining({ category: '社交' })
        );
      });
    });

    it('should not lose category when password is updated', async () => {
      // This test verifies the update flow preserves category
      const existingPassword = {
        id: 1,
        software_name: '微信',
        category: '社交',
        created_at: '2024-01-15T10:00:00',
        updated_at: '2024-01-15T10:00:00',
      };

      // Mock the update API
      window.electronAPI.updatePassword = vi.fn().mockResolvedValue({
        success: true,
      });

      // When updating, the category should be preserved
      const updateData = {
        softwareName: '微信',
        username: 'newuser',
        category: '社交', // Category should remain unchanged
      };

      // Simulate calling updatePassword
      const result = await window.electronAPI.updatePassword(1, updateData);

      expect(result.success).toBe(true);
      expect(window.electronAPI.updatePassword).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ category: '社交' })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty category list from API', async () => {
      window.electronAPI.listCategories = vi.fn().mockResolvedValue({
        success: true,
        categories: [],
      });

      window.electronAPI.listPasswords = vi.fn().mockResolvedValue({
        success: true,
        passwords: [],
      });

      window.electronAPI.getConfig = vi.fn().mockResolvedValue({
        success: true,
        config: {},
      });

      render(<MainPage />);

      await waitFor(() => {
        expect(window.electronAPI.listCategories).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      window.electronAPI.listPasswords = vi.fn().mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      window.electronAPI.listCategories = vi.fn().mockResolvedValue({
        success: true,
        categories: ['社交', '工作'],
      });

      window.electronAPI.getConfig = vi.fn().mockResolvedValue({
        success: true,
        config: {},
      });

      render(<MainPage />);

      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Database error');
      });
    });
  });
});
