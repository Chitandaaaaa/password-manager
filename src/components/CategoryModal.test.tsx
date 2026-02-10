import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryModal from './CategoryModal';

describe('CategoryModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCategoriesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    window.electronAPI = {
      listCategories: vi.fn().mockResolvedValue({
        success: true,
        categories: ['社交', '工作', '银行', '邮箱', '购物', '其他'],
      }),
      addCategory: vi.fn(),
      deleteCategory: vi.fn(),
      renameCategory: vi.fn(),
      // 添加其他必需的 mock 方法
      checkSetup: vi.fn(),
      setup: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      addPassword: vi.fn(),
      listPasswords: vi.fn(),
      decryptPassword: vi.fn(),
      updatePassword: vi.fn(),
      clearAllPasswords: vi.fn(),
      generatePassword: vi.fn(),
      exportPasswords: vi.fn(),
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
    it('CM-001: 打开modal应该显示所有分类', async () => {
      render(
        <CategoryModal
          isOpen={true}
          onClose={mockOnClose}
          onCategoriesChange={mockOnCategoriesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('社交')).toBeInTheDocument();
        expect(screen.getByText('工作')).toBeInTheDocument();
        expect(screen.getByText('银行')).toBeInTheDocument();
      });
    });

    it('isOpen=false时不应该渲染', () => {
      const { container } = render(
        <CategoryModal
          isOpen={false}
          onClose={mockOnClose}
          onCategoriesChange={mockOnCategoriesChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('添加分类测试', () => {
    beforeEach(() => {
      render(
        <CategoryModal
          isOpen={true}
          onClose={mockOnClose}
          onCategoriesChange={mockOnCategoriesChange}
        />
      );
    });

    it('CM-002: 添加空分类名应该显示错误', async () => {
      const addButton = screen.getByText('添加');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('请输入分类名称')).toBeInTheDocument();
      });
    });

    it('CM-003: 添加已存在的分类名应该显示错误', async () => {
      window.electronAPI.addCategory = vi.fn().mockResolvedValue({ success: true });
      
      // 等待分类列表加载
      await waitFor(() => {
        expect(screen.getByText('社交')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('输入新分类名称');
      await userEvent.type(input, '社交');

      const addButton = screen.getByText('添加');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('分类已存在')).toBeInTheDocument();
      });
    });

    it('CM-004: 添加有效分类名应该成功', async () => {
      window.electronAPI.addCategory = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.listCategories = vi.fn().mockResolvedValue({
        success: true,
        categories: ['社交', '工作', '银行', '邮箱', '购物', '其他', '新分类'],
      });

      const input = screen.getByPlaceholderText('输入新分类名称');
      await userEvent.type(input, '新分类');

      const addButton = screen.getByText('添加');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(window.electronAPI.addCategory).toHaveBeenCalledWith('新分类');
        expect(mockOnCategoriesChange).toHaveBeenCalled();
      });
    });
  });

  describe('删除分类测试', () => {
    beforeEach(async () => {
      window.confirm = vi.fn().mockReturnValue(true);
      window.electronAPI.deleteCategory = vi.fn().mockResolvedValue({ success: true });

      render(
        <CategoryModal
          isOpen={true}
          onClose={mockOnClose}
          onCategoriesChange={mockOnCategoriesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('社交')).toBeInTheDocument();
      });
    });

    it('CM-005: 删除分类并确认应该调用deleteCategory', async () => {
      const deleteButtons = screen.getAllByTitle('删除');
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(window.electronAPI.deleteCategory).toHaveBeenCalled();
        expect(mockOnCategoriesChange).toHaveBeenCalled();
      });
    });

    it('CM-006: 删除分类但取消不应该调用deleteCategory', async () => {
      window.confirm = vi.fn().mockReturnValue(false);

      const deleteButtons = screen.getAllByTitle('删除');
      await userEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(window.electronAPI.deleteCategory).not.toHaveBeenCalled();
    });
  });

  describe('重命名分类测试', () => {
    beforeEach(async () => {
      window.electronAPI.renameCategory = vi.fn().mockResolvedValue({ success: true });

      render(
        <CategoryModal
          isOpen={true}
          onClose={mockOnClose}
          onCategoriesChange={mockOnCategoriesChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('社交')).toBeInTheDocument();
      });
    });

    it('CM-007: 重命名分类应该调用renameCategory', async () => {
      const editButtons = screen.getAllByTitle('重命名');
      await userEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('社交');
      await userEvent.clear(input);
      await userEvent.type(input, '社交网络');

      const confirmButton = screen.getByTitle('确认');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(window.electronAPI.renameCategory).toHaveBeenCalledWith('社交', '社交网络');
        expect(mockOnCategoriesChange).toHaveBeenCalled();
      });
    });

    it('CM-009: 编辑时按回车应该确认重命名', async () => {
      const editButtons = screen.getAllByTitle('重命名');
      await userEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('社交');
      await userEvent.clear(input);
      await userEvent.type(input, '社交网络');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(window.electronAPI.renameCategory).toHaveBeenCalled();
      });
    });

    it('CM-010: 编辑时按Esc应该取消编辑', async () => {
      const editButtons = screen.getAllByTitle('重命名');
      await userEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue('社交');
      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(window.electronAPI.renameCategory).not.toHaveBeenCalled();
      });
    });
  });
});
