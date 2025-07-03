# 开发文档

本文档包含 `bump-version-js` 项目的开发相关信息。

## 环境要求

- Node.js >= 14.0.0
- Git
- npm 或 yarn

## 项目设置

### 克隆项目

```bash
git clone https://github.com/ai-app-base/bump-version-js.git
cd bump-version-js
```

### 安装依赖

```bash
npm install
```

## 开发命令

```bash
# 开发模式运行（使用 tsx 直接运行 TypeScript）
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 运行测试（带 UI）
npm run test:ui

# 生成测试覆盖率报告
npm run coverage

# 清理构建产物
npm run prebuild
```

## 项目结构

```
bump-version-js/
├── src/                           # 源代码目录
│   └── bump-version.ts           # 主程序（包含版本管理和验证功能）
├── tests/                        # 测试目录
│   ├── bump-version.integration.test.ts  # 集成测试
│   └── setup.ts                  # 测试环境设置
├── dist/                         # 构建输出目录
├── test-repo/                    # 测试用临时仓库（自动生成）
├── package.json                  # 项目配置
├── tsconfig.json                # TypeScript 配置
├── vitest.config.ts             # Vitest 测试框架配置
├── README.md                    # 用户文档
└── DEVELOPMENT.md               # 开发文档（本文件）
```

## 技术栈

- **编程语言**: TypeScript
- **运行时**: Node.js
- **模块系统**: ES Modules
- **测试框架**: Vitest
- **构建工具**: TypeScript Compiler (tsc)

### 主要依赖

**运行时依赖**:

- `semver`: 语义化版本解析和计算
- `prompts`: 命令行交互界面
- `chalk`: 终端颜色输出

**开发依赖**:

- `typescript`: TypeScript 编译器
- `vitest`: 测试框架
- `@vitest/ui`: 测试 UI 界面
- `tsx`: TypeScript 执行器（开发时使用）
- `execa`: 子进程执行（测试中使用）
- `rimraf`: 跨平台文件删除工具

## 核心模块说明

### bump-version.ts

统一的主程序文件，包含版本管理和版本验证两大功能模块：

#### 核心函数

- `exec()`: 执行 shell 命令的封装函数
- `getCurrentVersion()`: 从 package.json 读取当前版本
- `getCurrentBranch()`: 获取当前 Git 分支
- `checkGitStatus()`: 检查工作区是否干净
- `getPrereleaseInfo()`: 解析预发布版本信息
- `getNextVersion()`: 计算下一个版本号的核心逻辑
- `validateVersion()`: 验证版本号是否符合语义化版本规范
- `showHelp()`: 显示帮助信息
- `showVersion()`: 显示工具版本号
- `main()`: 主程序入口，处理命令路由和执行流程

#### 命令路由

主程序通过检查命令行参数来决定执行哪个功能：

- 无参数或未知参数：进入交互式版本管理模式
- `validate <version>`: 执行版本验证功能
- `-h, --help`: 显示帮助信息
- `-v, --version`: 显示版本号

## 测试

### 测试策略

项目采用集成测试策略，通过创建临时 Git 仓库来模拟真实的使用场景。

### 测试覆盖

测试覆盖以下场景：

1. **版本升级逻辑**
   - Patch 版本升级
   - Minor 版本升级
   - Major 版本升级

2. **预发布版本管理**
   - Dev 版本创建和迭代
   - Alpha 版本创建和迭代
   - Beta 版本创建和迭代
   - RC 版本创建和迭代
   - 预发布版本间的升级路径
   - 预发布版本转正式版本

3. **错误处理**
   - 工作区有未提交更改
   - 非主分支警告
   - 用户取消操作

4. **Git 操作验证**
   - 提交信息格式
   - 标签创建
   - 文件更新

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并查看 UI
npm run test:ui

# 生成覆盖率报告
npm run coverage
```

### 测试环境变量

- `BUMP_VERSION_SKIP_PUSH`: 跳过 Git 推送步骤
- `BUMP_VERSION_DEFAULTS`: 设置默认选项，避免交互式输入

## 构建流程

1. **预构建**: 清理 dist 目录
2. **编译**: 使用 tsc 编译 TypeScript 到 JavaScript
3. **后处理**: 为生成的脚本文件添加执行权限

```bash
npm run build
```

构建产物：

- `dist/bump-version.js`: 统一的命令行工具（包含所有功能）

## 本地测试

### 使用 npm link 进行本地测试

`npm link` 允许你在本地测试包而无需发布到 npm。

#### 链接包

1. **在包目录中创建全局链接**

   ```bash
   npm link
   ```

   这会在全局 node_modules 中创建一个符号链接指向当前包。

2. **在其他项目中使用链接的包**
   ```bash
   cd /path/to/other-project
   npm link @ai-app-base/bump-version-js
   ```

#### 卸载链接

1. **从其他项目中移除链接**

   ```bash
   cd /path/to/other-project
   npm unlink @ai-app-base/bump-version-js
   # 或
   npm uninstall @ai-app-base/bump-version-js
   ```

2. **移除全局链接**

   ```bash
   # 方法1：在任何目录运行
   npm uninstall -g @ai-app-base/bump-version-js

   # 方法2：在包目录运行
   cd /path/to/bump-version-js
   npm unlink @ai-app-base/bump-version-js
   ```

#### 查看全局链接的包

```bash
# 查看所有全局安装的包
npm list -g --depth=0

# 查看具体包的链接位置
npm list -g @ai-app-base/bump-version-js
```

#### 注意事项

- `npm unlink` 是 `npm uninstall` 的别名
- 在包目录中执行 `npm unlink` 时也需要指定包名
- 也可以使用 `npm rm` 或 `npm remove` 作为 `npm uninstall` 的别名

## 发布流程

1. **本地测试**

   ```bash
   npm test
   npm run build
   npm link  # 本地测试命令
   ```

2. **版本更新**

   ```bash
   npm run build
   bump-version-js  # 使用工具自身更新版本
   ```

3. **发布到 npm**
   ```bash
   npm publish
   ```

## 贡献指南

### 开发流程

1. Fork 本仓库
2. 创建特性分支
   ```bash
   git checkout -b feature/your-feature
   ```
3. 开发并编写测试
4. 确保所有测试通过
   ```bash
   npm test
   ```
5. 提交更改
   ```bash
   git commit -m 'feat: add your feature'
   ```
6. 推送到你的 Fork
   ```bash
   git push origin feature/your-feature
   ```
7. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循项目现有的代码风格
- 函数和变量使用有意义的命名
- 适当添加类型注解
- 复杂逻辑添加注释说明

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 代码重构（不影响功能）
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：

```
feat: 添加版本验证命令
fix: 修复预发布版本升级逻辑
docs: 更新 README 使用说明
test: 添加 RC 版本测试用例
```

## 调试技巧

### 开发模式调试

使用 `npm run dev` 可以直接运行 TypeScript 源码：

```bash
npm run dev
```

### 测试调试

1. 运行单个测试文件

   ```bash
   npx vitest run tests/bump-version.integration.test.ts
   ```

2. 使用测试 UI 进行交互式调试

   ```bash
   npm run test:ui
   ```

3. 查看测试输出的临时仓库
   测试会在 `test-repo/` 目录创建临时 Git 仓库

### 环境变量调试

```bash
# 跳过推送步骤
BUMP_VERSION_SKIP_PUSH=1 npm run dev

# 设置默认选项
BUMP_VERSION_DEFAULTS='{"releaseTypeChoice":"production","selectedVersionBump":"patch","confirm":true}' npm run dev
```

## 常见问题

### Q: 如何添加新的预发布类型？

A: 需要修改以下位置：

1. `src/bump-version.ts` 中的 `PrereleaseType` 类型定义
2. `getPrereleaseInfo()` 函数中的类型检查
3. `getNextVersion()` 函数中的升级逻辑
4. 相关的测试用例

### Q: 如何修改提交信息格式？

A: 在 `src/bump-version.ts` 的第 333 行修改提交信息模板：

```typescript
exec(`git commit -m "chore: release ${newVersion}"`);
```

### Q: 如何支持其他包管理器（如 yarn、pnpm）？

A: 需要修改：

1. 版本更新命令（第 322 行）
2. 可能需要处理不同的 lock 文件

## 许可证

本项目采用 ISC 许可证。
