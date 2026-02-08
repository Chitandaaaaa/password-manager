# 密码管家 - 测试用例文档

## 测试框架配置

- **测试框架**: Vitest
- **测试工具**: React Testing Library + Jest DOM
- **环境**: jsdom
- **命令**: `npm test` / `npm run test:ui` / `npm run test:coverage`

---

## 测试文件结构

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts           # 工具函数测试
├── stores/
│   ├── appStore.ts
│   └── appStore.test.ts        # 状态管理测试
├── pages/
│   ├── LoginPage.tsx
│   └── LoginPage.test.tsx      # 登录页面测试
├── components/
│   ├── PasswordCard.tsx
│   └── PasswordCard.test.tsx   # 密码卡片组件测试
└── test/
    └── setup.ts                # 测试环境配置
```

---

## 测试用例详情

### 1. 工具函数测试 (utils.test.ts)

#### cn() - 类名合并函数

| 用例ID | 用例名称 | 前置条件 | 测试步骤 | 预期结果 |
|--------|----------|----------|----------|----------|
| UTIL-001 | 合并多个类名 | 无 | 调用 `cn('class1', 'class2')` | 返回 `'class1 class2'` |
| UTIL-002 | 条件类名 | 条件为 true | 调用 `cn('base', true && 'conditional')` | 返回 `'base conditional'` |
| UTIL-003 | Tailwind冲突处理 | 存在冲突类名 | 调用 `cn('px-2 py-1', 'px-4')` | 返回 `'py-1 px-4'` |
| UTIL-004 | 过滤假值 | 包含假值 | 调用 `cn('base', false, undefined, null, 'valid')` | 返回 `'base valid'` |

#### getPasswordStrengthColor() - 密码强度颜色

| 用例ID | 用例名称 | 输入 | 预期结果 |
|--------|----------|------|----------|
| UTIL-101 | 非常弱密码颜色 | strength < 30 | `'bg-red-500'` |
| UTIL-102 | 弱密码颜色 | 30 <= strength < 50 | `'bg-orange-500'` |
| UTIL-103 | 一般密码颜色 | 50 <= strength < 70 | `'bg-yellow-500'` |
| UTIL-104 | 强密码颜色 | 70 <= strength < 90 | `'bg-blue-500'` |
| UTIL-105 | 非常强密码颜色 | strength >= 90 | `'bg-green-500'` |

#### getPasswordStrengthText() - 密码强度文本

| 用例ID | 用例名称 | 输入 | 预期结果 |
|--------|----------|------|----------|
| UTIL-201 | 非常弱密码文本 | strength < 30 | `'非常弱'` |
| UTIL-202 | 弱密码文本 | 30 <= strength < 50 | `'弱'` |
| UTIL-203 | 一般密码文本 | 50 <= strength < 70 | `'一般'` |
| UTIL-204 | 强密码文本 | 70 <= strength < 90 | `'强'` |
| UTIL-205 | 非常强密码文本 | strength >= 90 | `'非常强'` |

#### formatDate() - 日期格式化

| 用例ID | 用例名称 | 输入 | 预期结果 |
|--------|----------|------|----------|
| UTIL-301 | 标准日期格式 | `'2024-01-15T10:30:00'` | 包含年/月/日/时/分 |
| UTIL-302 | ISO日期格式 | ISO字符串 | 格式化后的本地时间 |
| UTIL-303 | 时间显示 | 任何日期 | 包含 `HH:MM` 格式 |

---

### 2. 状态管理测试 (appStore.test.ts)

#### 视图状态 (view state)

| 用例ID | 用例名称 | 操作 | 预期状态 |
|--------|----------|------|----------|
| STORE-001 | 默认视图 | 初始状态 | `view: 'login'` |
| STORE-002 | 切换主视图 | `setView('main')` | `view: 'main'` |
| STORE-003 | 支持所有视图 | 遍历所有视图 | 支持 `'login'`, `'main'`, `'setup'` |

#### 认证状态 (authentication)

| 用例ID | 用例名称 | 操作 | 预期状态 |
|--------|----------|------|----------|
| STORE-101 | 默认未认证 | 初始状态 | `isAuthenticated: false` |
| STORE-102 | 设置认证状态 | `setAuthenticated(true)` | `isAuthenticated: true` |

#### 密码列表 (passwords)

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| STORE-201 | 默认空列表 | 初始状态 | `passwords: []` |
| STORE-202 | 设置密码列表 | `setPasswords([...])` | 列表更新为传入值 |
| STORE-203 | 添加密码 | `addPassword(password)` | 新密码插入列表开头 |
| STORE-204 | 删除密码 | `removePassword(id)` | 指定ID的密码被移除 |

#### 搜索和筛选 (search & filter)

| 用例ID | 用例名称 | 操作 | 预期状态 |
|--------|----------|------|----------|
| STORE-301 | 默认空搜索 | 初始状态 | `searchQuery: ''` |
| STORE-302 | 更新搜索词 | `setSearchQuery('test')` | `searchQuery: 'test'` |
| STORE-303 | 默认全部分类 | 初始状态 | `selectedCategory: '全部'` |
| STORE-304 | 更新分类 | `setSelectedCategory('工作')` | `selectedCategory: '工作'` |

#### 加载状态 (loading)

| 用例ID | 用例名称 | 操作 | 预期状态 |
|--------|----------|------|----------|
| STORE-401 | 默认不加载 | 初始状态 | `isLoading: false` |
| STORE-402 | 设置加载状态 | `setIsLoading(true)` | `isLoading: true` |

#### 错误状态 (error)

| 用例ID | 用例名称 | 操作 | 预期状态 |
|--------|----------|------|----------|
| STORE-501 | 默认无错误 | 初始状态 | `error: null` |
| STORE-502 | 设置错误 | `setError('Error message')` | `error: 'Error message'` |
| STORE-503 | 清除错误 | `setError(null)` | `error: null` |

---

### 3. 登录页面测试 (LoginPage.test.tsx)

#### 初始渲染

| 用例ID | 用例名称 | 检查项 | 预期结果 |
|--------|----------|--------|----------|
| LOGIN-001 | 页面标题 | 标题元素 | 显示"密码管家" |
| LOGIN-002 | 副标题 | 副标题文本 | 显示"请输入主密码解锁" |
| LOGIN-003 | 密码输入框 | 输入框存在 | 类型为 `password` |
| LOGIN-004 | 解锁按钮 | 按钮存在 | 显示"解锁" |
| LOGIN-005 | 忘记密码链接 | 链接存在 | 显示"忘记密码？" |

#### 密码可见性切换

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| LOGIN-101 | 切换显示密码 | 点击眼睛图标 | 输入框类型变为 `text` |
| LOGIN-102 | 切换隐藏密码 | 再次点击图标 | 输入框类型变为 `password` |

#### 表单提交

| 用例ID | 用例名称 | 场景 | 预期结果 |
|--------|----------|------|----------|
| LOGIN-201 | 空密码错误 | 不输入密码直接提交 | 显示"请输入主密码" |
| LOGIN-202 | 调用登录API | 输入密码后提交 | 调用 `electronAPI.login(password)` |
| LOGIN-203 | 登录成功跳转 | API返回成功 | 调用 `setView('main')` |
| LOGIN-204 | 登录失败提示 | API返回失败 | 显示错误信息 |
| LOGIN-205 | 加载状态 | 提交后等待响应 | 按钮显示"解锁中..." |

#### 忘记密码流程

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| LOGIN-301 | 进入忘记密码 | 点击"忘记密码？" | 显示警告信息 |
| LOGIN-302 | 确认重置 | 点击"继续重置" | 进入设置新密码页面 |
| LOGIN-303 | 返回登录 | 点击"返回登录" | 回到登录表单 |
| LOGIN-304 | 密码不匹配 | 两次输入不同密码 | 显示"两次输入的密码不一致" |
| LOGIN-305 | 密码太短 | 输入少于6位密码 | 显示"密码长度至少为6位" |

---

### 4. 密码卡片组件测试 (PasswordCard.test.tsx)

#### 渲染测试

| 用例ID | 用例名称 | 检查项 | 预期结果 |
|--------|----------|--------|----------|
| CARD-001 | 显示软件名称 | 标题元素 | 显示 `softwareName` |
| CARD-002 | 显示用户名 | 用户名文本 | 显示 `username` |
| CARD-003 | 显示分类标签 | 标签元素 | 显示 `category` |
| CARD-004 | 密码默认隐藏 | 密码显示 | 显示"••••••••" |
| CARD-005 | 显示URL链接 | 链接元素 | 可点击跳转 |
| CARD-006 | 显示备注 | 备注文本 | 显示 `notes` |
| CARD-007 | 无用户名隐藏 | username为空 | 不显示账号行 |
| CARD-008 | 无URL隐藏 | url为空 | 不显示链接 |
| CARD-009 | 无备注隐藏 | notes为空 | 不显示备注块 |

#### 密码可见性

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| CARD-101 | 显示真实密码 | 点击眼睛图标 | 调用 `decryptPassword` 并显示 |
| CARD-102 | 重新隐藏密码 | 再次点击图标 | 显示"••••••••" |

#### 复制功能

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| CARD-201 | 复制密码 | 点击复制按钮 | 调用 `copyPassword(password)` |
| CARD-202 | 显示已复制 | 复制成功后 | 按钮显示"已复制"状态 |

#### 删除功能

| 用例ID | 用例名称 | 场景 | 预期结果 |
|--------|----------|------|----------|
| CARD-301 | 确认删除 | 点击删除并确认 | 调用 `deletePassword(id)` 并回调 |
| CARD-302 | 取消删除 | 点击删除但取消 | 不调用删除API |

#### 编辑功能

| 用例ID | 用例名称 | 操作 | 预期结果 |
|--------|----------|------|----------|
| CARD-401 | 打开编辑 | 点击编辑按钮 | 调用 `onEdit(password, decryptedPassword)` |

#### 分类徽章样式

| 用例ID | 用例名称 | 输入分类 | 预期样式 |
|--------|----------|----------|----------|
| CARD-501 | 社交分类 | 社交 | badge-blue |
| CARD-502 | 工作分类 | 工作 | badge-purple |
| CARD-503 | 银行分类 | 银行 | badge-green |
| CARD-504 | 邮箱分类 | 邮箱 | badge-yellow |
| CARD-505 | 购物分类 | 购物 | badge-red |
| CARD-506 | 其他分类 | 其他 | badge-gray |
| CARD-507 | 未分类 | 未知/空 | 显示"未分类" |

---

## 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|----------|
| 工具函数 (utils.ts) | 100% | ✅ 已完成 |
| 状态管理 (appStore.ts) | 100% | ✅ 已完成 |
| 登录页面 (LoginPage.tsx) | 80%+ | ✅ 已完成 |
| 密码卡片 (PasswordCard.tsx) | 80%+ | ✅ 已完成 |

---

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 运行测试并监视文件变化
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- src/lib/utils.test.ts
```

### 添加新的测试脚本到 package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 测试最佳实践

### 1. 测试命名规范
- 使用描述性的测试名称
- 遵循 `should [expected behavior] when [condition]` 格式
- 示例: `should show error when password is empty`

### 2. 测试结构
- 使用 `describe` 分组相关测试
- 每个 `it` 测试一个具体行为
- 使用 `beforeEach` 重置状态

### 3. Mock 规范
- 所有外部依赖（electronAPI）都应该 mock
- 在 `beforeEach` 中重置所有 mock
- 使用 `vi.fn()` 创建 mock 函数

### 4. 断言规范
- 使用 `@testing-library/jest-dom` 的匹配器
- 优先使用语义化匹配器（如 `toBeInTheDocument()`）
- 异步操作使用 `waitFor`

---

## 持续集成

建议在 CI/CD 流程中添加测试步骤：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

---

## 问题排查

### 常见问题

1. **测试超时**
   - 检查异步操作是否正确等待
   - 使用 `waitFor` 包裹期望

2. **Mock 未生效**
   - 确保在 `beforeEach` 中重置
   - 检查 mock 路径是否正确

3. **样式测试失败**
   - 确保引入 CSS
   - 检查 vitest 配置中的 `css: true`

### 调试技巧

```typescript
// 打印组件结构
screen.debug();

// 打印特定元素
screen.debug(screen.getByRole('button'));

// 使用 logRoles 查看可用角色
import { logRoles } from '@testing-library/react';
logRoles(container);
```
