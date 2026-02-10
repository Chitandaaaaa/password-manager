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
2. Run affected tests - must pass
3. Check no `console.log` left in production code (except debug logs)
4. Use `git add -A` then `git commit -m "type: description"`

### After Code Modifications

**MANDATORY Verification Workflow:**

After completing any code change, ALWAYS verify by running:

```bash
# 1. Type check (must pass)
npm run typecheck

# 2. Build the project (must succeed)
npm run build

# 3. Start dev server and verify manually
npm run dev
```

**Rationale:**
- Type checking catches type mismatches early
- Building ensures all code compiles correctly
- Manual verification catches UI/UX issues (like flickering, layout problems)
- Prevents shipping broken code

**This is NOT optional - always verify before marking a task complete.**

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
