import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { useAppStore } from '../stores/appStore';

// Mock the store
vi.mock('../stores/appStore', () => ({
  useAppStore: vi.fn(),
}));

describe('LoginPage', () => {
  const mockSetView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockReturnValue({ setView: mockSetView });
    
    // Setup default mock for electronAPI
    window.electronAPI.login = vi.fn();
    window.electronAPI.resetPassword = vi.fn();
  });

  describe('initial render', () => {
    it('should render login form with all elements', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('密码管家')).toBeInTheDocument();
      expect(screen.getByText('请输入主密码解锁')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入主密码')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /解锁/ })).toBeInTheDocument();
      expect(screen.getByText('忘记密码？')).toBeInTheDocument();
    });

    it('should have password input field', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password visibility', async () => {
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      const toggleButton = screen.getByRole('button', { name: '' }); // Toggle button has no text, just icon

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      await userEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('form submission', () => {
    it('should show error when password is empty', async () => {
      render(<LoginPage />);
      const submitButton = screen.getByRole('button', { name: /解锁/ });
      
      await userEvent.click(submitButton);
      
      expect(screen.getByText('请输入主密码')).toBeInTheDocument();
    });

    it('should call login API with password', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.login = mockLogin;
      
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      const submitButton = screen.getByRole('button', { name: /解锁/ });
      
      await userEvent.type(passwordInput, 'testpassword');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testpassword');
      });
    });

    it('should navigate to main view on successful login', async () => {
      window.electronAPI.login = vi.fn().mockResolvedValue({ success: true });
      
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      const submitButton = screen.getByRole('button', { name: /解锁/ });
      
      await userEvent.type(passwordInput, 'testpassword');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSetView).toHaveBeenCalledWith('main');
      });
    });

    it('should show error message on failed login', async () => {
      window.electronAPI.login = vi.fn().mockResolvedValue({ 
        success: false, 
        error: '密码错误' 
      });
      
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      const submitButton = screen.getByRole('button', { name: /解锁/ });
      
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('密码错误')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      window.electronAPI.login = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('请输入主密码');
      const submitButton = screen.getByRole('button', { name: /解锁/ });
      
      await userEvent.type(passwordInput, 'testpassword');
      await userEvent.click(submitButton);
      
      expect(screen.getByText('解锁中...')).toBeInTheDocument();
    });
  });

  describe('forgot password flow', () => {
    it('should show forgot password view when clicked', async () => {
      render(<LoginPage />);
      const forgotLink = screen.getByText('忘记密码？');
      
      await userEvent.click(forgotLink);
      
      expect(screen.getByText('忘记密码？')).toBeInTheDocument();
      expect(screen.getByText('此操作将清除所有数据')).toBeInTheDocument();
    });

    it('should navigate to reset step when user confirms', async () => {
      render(<LoginPage />);
      await userEvent.click(screen.getByText('忘记密码？'));
      await userEvent.click(screen.getByText('我了解风险，继续重置'));
      
      expect(screen.getByText('设置新密码')).toBeInTheDocument();
    });

    it('should return to login from forgot password', async () => {
      render(<LoginPage />);
      await userEvent.click(screen.getByText('忘记密码？'));
      await userEvent.click(screen.getByText('返回登录'));
      
      expect(screen.getByText('请输入主密码解锁')).toBeInTheDocument();
    });

    it('should show error when passwords do not match', async () => {
      render(<LoginPage />);
      await userEvent.click(screen.getByText('忘记密码？'));
      await userEvent.click(screen.getByText('我了解风险，继续重置'));
      
      const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入新密码');
      const submitButton = screen.getByRole('button', { name: /重置密码/ });
      
      await userEvent.type(newPasswordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'differentpassword');
      await userEvent.click(submitButton);
      
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    });

    it('should show error when password is too short', async () => {
      render(<LoginPage />);
      await userEvent.click(screen.getByText('忘记密码？'));
      await userEvent.click(screen.getByText('我了解风险，继续重置'));
      
      const newPasswordInput = screen.getByPlaceholderText('请输入新密码');
      const confirmPasswordInput = screen.getByPlaceholderText('请再次输入新密码');
      const submitButton = screen.getByRole('button', { name: /重置密码/ });
      
      await userEvent.type(newPasswordInput, '12345');
      await userEvent.type(confirmPasswordInput, '12345');
      await userEvent.click(submitButton);
      
      expect(screen.getByText('密码长度至少为6位')).toBeInTheDocument();
    });
  });
});
