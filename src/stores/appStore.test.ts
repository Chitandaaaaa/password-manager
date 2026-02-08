import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      view: 'login',
      isAuthenticated: false,
      passwords: [],
      searchQuery: '',
      selectedCategory: '全部',
      isLoading: false,
      error: null,
    });
  });

  describe('view state', () => {
    it('should have default view as login', () => {
      const state = useAppStore.getState();
      expect(state.view).toBe('login');
    });

    it('should update view when setView is called', () => {
      useAppStore.getState().setView('main');
      expect(useAppStore.getState().view).toBe('main');
    });

    it('should support all view states', () => {
      const views = ['login', 'main', 'setup'] as const;
      views.forEach((view) => {
        useAppStore.getState().setView(view);
        expect(useAppStore.getState().view).toBe(view);
      });
    });
  });

  describe('authentication state', () => {
    it('should default to not authenticated', () => {
      expect(useAppStore.getState().isAuthenticated).toBe(false);
    });

    it('should update authentication status', () => {
      useAppStore.getState().setAuthenticated(true);
      expect(useAppStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('passwords', () => {
    it('should have empty passwords array by default', () => {
      expect(useAppStore.getState().passwords).toEqual([]);
    });

    it('should set passwords array', () => {
      const mockPasswords = [
        { id: 1, softwareName: 'Test', username: 'user', password: 'pass', category: '工作' },
      ];
      useAppStore.getState().setPasswords(mockPasswords as any);
      expect(useAppStore.getState().passwords).toEqual(mockPasswords);
    });

    it('should add password to the beginning of array', () => {
      const firstPassword = { id: 1, softwareName: 'First' };
      const secondPassword = { id: 2, softwareName: 'Second' };
      
      useAppStore.getState().addPassword(firstPassword as any);
      useAppStore.getState().addPassword(secondPassword as any);
      
      const passwords = useAppStore.getState().passwords;
      expect(passwords[0].id).toBe(2);
      expect(passwords[1].id).toBe(1);
    });

    it('should remove password by id', () => {
      const passwords = [
        { id: 1, softwareName: 'Keep' },
        { id: 2, softwareName: 'Remove' },
        { id: 3, softwareName: 'Keep2' },
      ];
      useAppStore.getState().setPasswords(passwords as any);
      useAppStore.getState().removePassword(2);
      
      expect(useAppStore.getState().passwords).toHaveLength(2);
      expect(useAppStore.getState().passwords.find(p => p.id === 2)).toBeUndefined();
    });
  });

  describe('search and filter', () => {
    it('should have empty search query by default', () => {
      expect(useAppStore.getState().searchQuery).toBe('');
    });

    it('should update search query', () => {
      useAppStore.getState().setSearchQuery('test query');
      expect(useAppStore.getState().searchQuery).toBe('test query');
    });

    it('should default to "全部" category', () => {
      expect(useAppStore.getState().selectedCategory).toBe('全部');
    });

    it('should update selected category', () => {
      useAppStore.getState().setSelectedCategory('工作');
      expect(useAppStore.getState().selectedCategory).toBe('工作');
    });
  });

  describe('loading state', () => {
    it('should default to not loading', () => {
      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should update loading state', () => {
      useAppStore.getState().setIsLoading(true);
      expect(useAppStore.getState().isLoading).toBe(true);
    });
  });

  describe('error state', () => {
    it('should have no error by default', () => {
      expect(useAppStore.getState().error).toBeNull();
    });

    it('should set error message', () => {
      useAppStore.getState().setError('Something went wrong');
      expect(useAppStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error when set to null', () => {
      useAppStore.getState().setError('Error');
      useAppStore.getState().setError(null);
      expect(useAppStore.getState().error).toBeNull();
    });
  });
});
