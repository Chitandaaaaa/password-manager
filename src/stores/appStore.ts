import { create } from 'zustand';
import { ViewState, Password } from '../types';

interface AppState {
  // 视图状态
  view: ViewState;
  setView: (view: ViewState) => void;
  
  // 认证状态
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  
  // 密码列表
  passwords: Password[];
  setPasswords: (passwords: Password[]) => void;
  addPassword: (password: Password) => void;
  removePassword: (id: number) => void;
  
  // 搜索和筛选
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  
  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'login',
  setView: (view) => set({ view }),
  
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  
  passwords: [],
  setPasswords: (passwords) => set({ passwords }),
  addPassword: (password) => set((state) => ({ 
    passwords: [password, ...state.passwords] 
  })),
  removePassword: (id) => set((state) => ({ 
    passwords: state.passwords.filter((p) => p.id !== id) 
  })),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: '全部',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
  
  error: null,
  setError: (error) => set({ error }),
}));
