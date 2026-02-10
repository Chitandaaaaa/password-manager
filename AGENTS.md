# AGENTS.md - Coding Guidelines for AI Agents

## Project Overview
Password Manager (密码管家) - A secure local password manager built with Electron + React + TypeScript.

## Build / Lint / Test Commands

```bash
# Development
npm run dev                    # Start Vite dev server

# Building
npm run build                  # Full build (tsc + vite + electron-builder)
npx vite build                 # Frontend only
npx electron-builder --win     # Build Windows installer

# Code Quality
npm run typecheck              # TypeScript type checking
npm run lint                   # ESLint check

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage report
npx vitest run src/components/PasswordCard.test.tsx  # Single test file
npx vitest run -t "should correctly display"         # Single test by name

# Utility
npm run reset                  # Clear all app data (reset to first-use state)
```

## Code Style Guidelines

### TypeScript Types
- Use strict types, no `any`
- Types in `src/types/index.ts` are source of truth
- Database uses `snake_case` (software_name), frontend uses `camelCase` (softwareName)
- Always map API data explicitly in MainPage.tsx

### Imports
```typescript
// React first
import { useState, useEffect } from 'react';

// Third-party libraries
import { Copy, Eye } from 'lucide-react';

// Local imports (relative paths)
import { Password } from '../types';
import { cn, formatDate } from '../lib/utils';

// Component props interface
interface PasswordCardProps {
  password: Password;
  onDelete: () => void;
}
```

### Naming Conventions
- Components: PascalCase (`PasswordCard.tsx`)
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE for true constants
- Types/Interfaces: PascalCase (`Password`, `PasswordFormData`)
- Files: PascalCase for components, camelCase for utilities

### Error Handling
```typescript
// Always use try-catch for async operations
try {
  const result = await window.electronAPI.listPasswords();
  if (result.success) {
    setPasswords(result.passwords);
  } else {
    setError(result.error || '操作失败');
  }
} catch (err) {
  setError('网络错误，请重试');
  console.error('Detailed error:', err);
}
```

### Tailwind CSS Classes
- Use the custom utility classes defined in `src/index.css`
- Prefer: `btn-primary`, `card-flat`, `input-field`, `badge-blue`
- Avoid arbitrary values when possible

### Component Structure
```typescript
// 1. Imports
// 2. Props interface
// 3. Component function
// 4. State hooks
// 5. Effect hooks
// 6. Event handlers
// 7. Render

export default function ComponentName({ prop1, prop2 }: Props) {
  const [state, setState] = useState('');
  
  const handleClick = () => {
    // handler logic
  };
  
  return (
    <div className="card-flat">
      {/* JSX */}
    </div>
  );
}
```

### Testing Guidelines
- Use Vitest + React Testing Library
- Mock `window.electronAPI` in test setup
- Test component rendering and user interactions
- Use `screen.getByText()`, `screen.getByRole()`
- Clean up mocks in `beforeEach`

### IPC Communication
- Always check if API call succeeded: `if (result.success)`
- Handle errors gracefully with user-friendly messages
- Use Chinese error messages for user-facing errors

### Data Flow
1. Frontend (camelCase) → IPC → Backend (snake_case)
2. Always transform data in MainPage.tsx load functions
3. Ensure `category` field always has a value (default: '未分类')

### State Management
- Use Zustand for global state (see `src/stores/appStore.ts`)
- Local component state with `useState` for UI state

### Before Committing
1. Run `npm run typecheck` - must pass
2. **Run affected tests** - must pass (详见下方测试规则)
3. Check no `console.log` left in production code (except debug logs)
4. Use `git add -A` then `git commit -m "type: description"`

### Testing Rules (测试执行规则)

**每次修改代码后的强制流程：**

```bash
# 1. 运行类型检查
npm run typecheck

# 2. 运行相关单元测试（必须全部通过）
npm test

# 3. 如果有测试失败，必须修复后才能提交
# 禁止使用 git commit --no-verify 跳过检查
```

**测试执行优先级：**

| 修改范围 | 必须运行的测试 | 命令 |
|---------|--------------|------|
| 加密相关 | CryptoService 测试 | `npx vitest run electron/services/crypto.test.ts` |
| 密码服务 | PasswordService 测试 | `npx vitest run electron/services/password.test.ts` |
| 数据库 | DatabaseService 测试 | `npx vitest run electron/services/database.test.ts` |
| UI组件 | 对应组件测试 | `npx vitest run src/components/Xxx.test.tsx` |
| 全局改动 | 全部测试 | `npm test` |

**测试失败处理流程：**

1. **查看失败原因** - 运行 `npm test` 查看具体失败用例
2. **定位问题** - 根据错误堆栈找到问题代码
3. **修复代码** - 修改源代码或测试代码（如测试已过时）
4. **重新运行** - 再次运行测试直到全部通过
5. **禁止提交** - 测试未通过前禁止使用 `git commit`

**测试覆盖要求：**

- 新增功能 → 必须编写对应的单元测试
- 修改功能 → 必须确保相关测试通过
- 删除功能 → 必须删除对应的单元测试
- Bug修复 → 必须添加回归测试（防止再次出现）

**测试快速检查清单：**

```bash
# 运行特定文件测试
npx vitest run <测试文件路径>

# 运行特定测试用例
npx vitest run -t "测试用例描述"

# 监视模式（开发时使用）
npm run test:watch

# 带覆盖率报告
npm run test:coverage
```

## Common Issues

- **File locking on Windows**: Use `dist-release` as output dir temporarily if `release` is locked
- **Type errors after changes**: Ensure all type definitions match across frontend/backend
- **Custom categories not showing**: Check `getCategoryDisplayName` doesn't filter them out

## Project Structure
```
src/
  components/       # React components
  pages/           # Main pages (Login, Main, Setup)
  stores/          # Zustand state management
  types/           # TypeScript type definitions
  lib/             # Utility functions
  test/            # Test setup
electron/          # Electron main process
  services/        # Database, Crypto, Password services
scripts/           # Utility scripts (reset-database.js)
```

## No Existing Rules
- No .cursorrules file
- No .cursor/rules/ directory
- No .github/copilot-instructions.md
- ESLint config is inline in package.json
- No Prettier config (using defaults)
