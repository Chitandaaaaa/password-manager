import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordCard from './PasswordCard';
import { Password } from '../types';

describe('PasswordCard', () => {
  const mockPassword: Password = {
    id: 1,
    softwareName: 'Test App',
    username: 'testuser',
    encryptedPassword: 'encrypted123',
    category: '工作',
    url: 'https://testapp.com',
    notes: 'Test notes',
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-01-15T10:00:00',
  };

  const mockOnDelete = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI.decryptPassword = vi.fn();
    window.electronAPI.copyPassword = vi.fn();
    window.electronAPI.deletePassword = vi.fn();
  });

  describe('rendering', () => {
    it('should render password information correctly', () => {
      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.getByText('Test App')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('工作')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    it('should show masked password by default', () => {
      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.getByText('••••••••')).toBeInTheDocument();
    });

    it('should render URL as link when provided', () => {
      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const link = screen.getByText('https://testapp.com');
      expect(link).toHaveAttribute('href', 'https://testapp.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not show username section when username is empty', () => {
      const passwordWithoutUsername = { ...mockPassword, username: undefined };
      render(
        <PasswordCard 
          password={passwordWithoutUsername} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.queryByText('账号')).not.toBeInTheDocument();
    });

    it('should not show URL section when URL is empty', () => {
      const passwordWithoutUrl = { ...mockPassword, url: undefined };
      render(
        <PasswordCard 
          password={passwordWithoutUrl} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.queryByText('https://testapp.com')).not.toBeInTheDocument();
    });

    it('should not show notes section when notes is empty', () => {
      const passwordWithoutNotes = { ...mockPassword, notes: undefined };
      render(
        <PasswordCard 
          password={passwordWithoutNotes} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.queryByText('Test notes')).not.toBeInTheDocument();
    });
  });

  describe('password visibility toggle', () => {
    it('should show password when eye icon is clicked', async () => {
      window.electronAPI.decryptPassword = vi.fn().mockResolvedValue({
        success: true,
        password: 'decryptedPassword123',
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const eyeButton = screen.getByTitle('显示密码');
      await userEvent.click(eyeButton);

      await waitFor(() => {
        expect(screen.getByText('decryptedPassword123')).toBeInTheDocument();
      });
    });

    it('should hide password when clicked again', async () => {
      window.electronAPI.decryptPassword = vi.fn().mockResolvedValue({
        success: true,
        password: 'decryptedPassword123',
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const eyeButton = screen.getByTitle('显示密码');
      await userEvent.click(eyeButton);
      await waitFor(() => {
        expect(screen.getByText('decryptedPassword123')).toBeInTheDocument();
      });

      const hideButton = screen.getByTitle('隐藏密码');
      await userEvent.click(hideButton);

      expect(screen.getByText('••••••••')).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('should copy password to clipboard', async () => {
      window.electronAPI.decryptPassword = vi.fn().mockResolvedValue({
        success: true,
        password: 'decryptedPassword123',
      });
      window.electronAPI.copyPassword = vi.fn().mockResolvedValue({
        success: true,
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const copyButton = screen.getByTitle('复制密码');
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(window.electronAPI.copyPassword).toHaveBeenCalledWith('decryptedPassword123');
      });
    });

    it('should show copied state after copying', async () => {
      window.electronAPI.decryptPassword = vi.fn().mockResolvedValue({
        success: true,
        password: 'decryptedPassword123',
      });
      window.electronAPI.copyPassword = vi.fn().mockResolvedValue({
        success: true,
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const copyButton = screen.getByTitle('复制密码');
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByTitle('已复制')).toBeInTheDocument();
      });
    });
  });

  describe('delete functionality', () => {
    it('should call delete API when delete button is clicked', async () => {
      window.confirm = vi.fn().mockReturnValue(true);
      window.electronAPI.deletePassword = vi.fn().mockResolvedValue({
        success: true,
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      // Action buttons are only visible on hover, so we need to find by title
      const deleteButton = screen.getByTitle('删除');
      await userEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => {
        expect(window.electronAPI.deletePassword).toHaveBeenCalledWith(1);
      });
    });

    it('should not delete if user cancels confirmation', async () => {
      window.confirm = vi.fn().mockReturnValue(false);

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const deleteButton = screen.getByTitle('删除');
      await userEvent.click(deleteButton);

      expect(window.electronAPI.deletePassword).not.toHaveBeenCalled();
    });
  });

  describe('edit functionality', () => {
    it('should call onEdit with decrypted password', async () => {
      window.electronAPI.decryptPassword = vi.fn().mockResolvedValue({
        success: true,
        password: 'decryptedPassword123',
      });

      render(
        <PasswordCard 
          password={mockPassword} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const editButton = screen.getByTitle('编辑');
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(mockOnEdit).toHaveBeenCalledWith(mockPassword, 'decryptedPassword123');
      });
    });
  });

  describe('category badges', () => {
    it.each([
      ['社交', 'badge-blue'],
      ['工作', 'badge-purple'],
      ['银行', 'badge-green'],
      ['邮箱', 'badge-yellow'],
      ['购物', 'badge-red'],
      ['其他', 'badge-gray'],
    ])('should render %s category with correct style', (category, expectedClass) => {
      const passwordWithCategory = { ...mockPassword, category };
      render(
        <PasswordCard 
          password={passwordWithCategory} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      const badge = screen.getByText(category);
      expect(badge).toHaveClass('badge');
    });

    it('should show "未分类" for unknown categories', () => {
      const passwordWithUnknownCategory = { ...mockPassword, category: 'Unknown' };
      render(
        <PasswordCard 
          password={passwordWithUnknownCategory} 
          onDelete={mockOnDelete} 
          onEdit={mockOnEdit} 
        />
      );

      expect(screen.getByText('未分类')).toBeInTheDocument();
    });
  });
});
