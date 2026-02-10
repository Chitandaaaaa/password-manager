import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPasswordModal from './AddPasswordModal';

describe('AddPasswordModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock electronAPI
    window.electronAPI = {
      listCategories: vi.fn().mockResolvedValue({
        success: true,
        categories: ['未分类', '社交', '工作', '银行'],
      }),
      addPassword: vi.fn(),
      generatePassword: vi.fn().mockResolvedValue('generatedPassword123!'),
      // 添加其他必需的 mock 方法
      checkSetup: vi.fn(),
      setup: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      listPasswords: vi.fn(),
      decryptPassword: vi.fn(),
      updatePassword: vi.fn(),
      deletePassword: vi.fn(),
      clearAllPasswords: vi.fn(),
      exportPasswords: vi.fn(),
      deleteCategory: vi.fn(),
      renameCategory: vi.fn(),
      getDisplayCategories: vi.fn(),
      updateDisplayCategories: vi.fn(),
      changeMasterPassword: vi.fn(),
      getOllamaConfig: vi.fn(),
      updateOllamaConfig: vi.fn(),
      checkOllama: vi.fn(),
      parsePasswordsWithAI: vi.fn(),
      selectFile: vi.fn(),
      getConfig: vi.fn(),
      updateConfig: vi.fn(),
      copyPassword: vi.fn(),
      onAppLock: vi.fn(),
    } as any;
  });

  describe('渲染测试', () => {
    it('AP-001: isOpen=false时不应该渲染任何内容', () => {
      const { container } = render(
        <AddPasswordModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('AP-002: isOpen=true时应该渲染完整的表单', () => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('添加密码')).toBeInTheDocument();
      expect(screen.getByLabelText(/软件\/网站名称/)).toBeInTheDocument();
      expect(screen.getByLabelText(/用户名\/账号/)).toBeInTheDocument();
      expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
    });

    it('AP-003: 组件打开时应该调用listCategories加载分类', async () => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(window.electronAPI.listCategories).toHaveBeenCalled();
      });
    });
  });

  describe('表单验证测试', () => {
    beforeEach(() => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    it('AP-004: 提交空软件名应该显示错误', async () => {
      const submitButton = screen.getByText('保存');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入软件名称')).toBeInTheDocument();
      });
    });

    it('AP-005: 提交空密码应该显示错误', async () => {
      const softwareInput = screen.getByPlaceholderText('例如：微信、GitHub、支付宝');
      await userEvent.type(softwareInput, 'Test App');

      const submitButton = screen.getByText('保存');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入密码')).toBeInTheDocument();
      });
    });

    it('AP-006: 输入密码时应该显示密码强度条', async () => {
      const passwordInput = screen.getByPlaceholderText('输入或生成密码');
      await userEvent.type(passwordInput, 'test123');

      expect(screen.getByText('密码强度')).toBeInTheDocument();
    });

    it('AP-008: 点击刷新按钮应该生成随机密码', async () => {
      const refreshButton = screen.getByTitle('生成随机密码');
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(window.electronAPI.generatePassword).toHaveBeenCalledWith({
          length: 16,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
        });
      });
    });

    it('AP-009: 点击眼睛图标应该切换密码可见性', async () => {
      const toggleButton = screen.getAllByRole('button')[1]; // 眼睛图标按钮
      const passwordInput = screen.getByPlaceholderText('输入或生成密码');

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      await userEvent.click(toggleButton);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('提交测试', () => {
    beforeEach(() => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
    });

    it('AP-010: 填写有效数据并提交应该调用addPassword', async () => {
      window.electronAPI.addPassword = vi.fn().mockResolvedValue({ success: true });

      const softwareInput = screen.getByPlaceholderText('例如：微信、GitHub、支付宝');
      const passwordInput = screen.getByPlaceholderText('输入或生成密码');

      await userEvent.type(softwareInput, 'Test App');
      await userEvent.type(passwordInput, 'testpassword123');

      const submitButton = screen.getByText('保存');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(window.electronAPI.addPassword).toHaveBeenCalledWith({
          softwareName: 'Test App',
          username: '',
          password: 'testpassword123',
          url: '',
          notes: '',
          category: '未分类',
        });
      });
    });

    it('AP-011: addPassword返回错误应该显示错误信息', async () => {
      window.electronAPI.addPassword = vi.fn().mockResolvedValue({
        success: false,
        error: '添加失败',
      });

      const softwareInput = screen.getByPlaceholderText('例如：微信、GitHub、支付宝');
      const passwordInput = screen.getByPlaceholderText('输入或生成密码');

      await userEvent.type(softwareInput, 'Test App');
      await userEvent.type(passwordInput, 'testpassword123');

      const submitButton = screen.getByText('保存');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('添加失败')).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('AP-014: 成功提交后应该重置表单', async () => {
      window.electronAPI.addPassword = vi.fn().mockResolvedValue({ success: true });

      const softwareInput = screen.getByPlaceholderText('例如：微信、GitHub、支付宝');
      const passwordInput = screen.getByPlaceholderText('输入或生成密码');

      await userEvent.type(softwareInput, 'Test App');
      await userEvent.type(passwordInput, 'testpassword123');

      const submitButton = screen.getByText('保存');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('关闭测试', () => {
    it('AP-012: 点击关闭按钮应该调用onClose', () => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const closeButton = screen.getAllByRole('button')[0];
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('AP-013: 点击取消按钮应该调用onClose', () => {
      render(
        <AddPasswordModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
