# 测试文档

本文档提供 `bumpster` 工具的测试指南，包括本地测试、全局安装和卸载流程。

## 本地测试流程

### 使用 npm link 进行本地测试

`npm link` 允许你在本地测试包而无需发布到 npm。它会创建一个符号链接，让你可以像使用已发布的包一样使用本地开发版本。

#### 1. 准备工作

首先确保项目已构建：

```bash
# 在项目根目录执行
npm install
npm run build
```

#### 2. 创建全局链接

在项目根目录创建全局链接：

```bash
# 在 bumpster 项目目录中
npm link

# 成功后会显示类似信息：
# added 1 package, and audited 2 packages in 2s
# found 0 vulnerabilities
```

这会在全局 node_modules 中创建一个符号链接指向当前项目。

#### 3. 验证链接

查看全局安装的包：

```bash
# 查看所有全局包
npm list -g --depth=0

# 查看 bumpster 的链接位置
npm list -g bumpster
```

#### 4. 测试命令

现在可以在任何目录使用命令：

```bash
# 测试主命令
bump --version
bump --help

# 测试别名命令
bump-js --version
bump-js --help

# 测试版本管理功能
cd /path/to/test-project
bump

# 测试版本验证功能
bump validate 1.0.0
bump-js validate 2.0.0-alpha.1
```

#### 5. 在其他项目中使用链接

如果要在其他项目中测试：

```bash
# 进入测试项目目录
cd /path/to/test-project

# 链接到本地开发的 bumpster
npm link bumpster

# 现在可以在项目中使用
npx bump --version
```

#### 6. 开发时实时更新

修改代码后重新构建即可生效：

```bash
# 修改代码后
npm run build

# 链接会自动使用最新构建的版本
bump --version  # 会显示最新版本
```

### 移除本地链接

#### 从其他项目中移除链接

```bash
# 在测试项目目录中
cd /path/to/test-project
npm unlink bumpster
# 或
npm uninstall bumpster
```

#### 移除全局链接

```bash
# 方法1：在任何目录运行
npm uninstall -g bumpster

# 方法2：在 bumpster 项目目录运行
cd /path/to/bumpster
npm unlink
```

## 全局安装和卸载

### 从 npm 安装（发布后）

```bash
# 全局安装
npm install -g bumpster

# 或使用 yarn
yarn global add bumpster

# 或使用 pnpm
pnpm add -g bumpster
```

### 验证安装

```bash
# 检查版本
bump --version
bump-js --version

# 查看帮助
bump --help
bump-js --help

# 查看安装位置
which bump
which bump-js
```

### 全局卸载

```bash
# 使用 npm
npm uninstall -g bumpster

# 使用 yarn
yarn global remove bumpster

# 使用 pnpm
pnpm remove -g bumpster
```

## 测试场景

### 1. 基本功能测试

```bash
# 版本管理测试
cd test-project
bump  # 交互式版本管理

# 版本验证测试
bump validate 1.0.0
bump validate 2.0.0-beta.1
bump validate invalid-version
```

### 2. 边界情况测试

```bash
# 在非项目目录运行
cd /tmp
bump  # 应该提示找不到 package.json

# 在有未提交更改的项目中运行
cd test-project
echo "test" > test.txt
bump  # 应该提示有未提交的更改
```

### 3. 环境变量测试

```bash
# 跳过推送测试
BUMP_VERSION_SKIP_PUSH=true bump

# 使用默认选项测试
BUMP_VERSION_DEFAULTS='{"releaseType":"patch"}' bump
```

## 常见问题

### 1. npm link 失败

**问题**：权限错误

```bash
npm ERR! Error: EACCES: permission denied
```

**解决方案**：

```bash
# 使用 sudo（不推荐）
sudo npm link

# 或修改 npm 全局目录（推荐）
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm link
```

### 2. 命令找不到

**问题**：`bump: command not found`

**解决方案**：

```bash
# 检查 npm bin 目录是否在 PATH 中
npm bin -g

# 添加到 PATH（在 ~/.bashrc 或 ~/.zshrc 中）
export PATH=$(npm bin -g):$PATH

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

### 3. 链接未更新

**问题**：修改代码后链接的版本没有更新

**解决方案**：

```bash
# 确保重新构建
npm run build

# 如果还是不行，重新链接
npm unlink -g
npm link
```

### 4. 多个版本冲突

**问题**：全局安装和链接版本冲突

**解决方案**：

```bash
# 先卸载全局版本
npm uninstall -g bumpster

# 再创建链接
npm link
```

## 自动化测试

### 运行单元测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run coverage

# 使用测试 UI
npm run test:ui
```

### 运行集成测试

```bash
# 集成测试会创建临时 Git 仓库
npm test -- tests/bump-version.integration.test.ts
```

### 运行完整检查

```bash
# 运行 lint、typecheck 和测试
npm run check

# 生成检查报告
npm run check-report
```

## 调试技巧

### 1. 查看详细日志

```bash
# 使用 npm 的详细日志
npm link --verbose

# 查看符号链接
ls -la $(npm root -g)/bumpster
```

### 2. 调试命令执行

```bash
# 在源码中添加调试信息
console.log('Current directory:', process.cwd());
console.log('Arguments:', process.argv);

# 重新构建并测试
npm run build
bump --version
```

### 3. 使用开发模式

```bash
# 直接运行 TypeScript 源码（无需构建）
npm run dev

# 或使用 tsx 直接运行
npx tsx src/bump-version.ts --version
```

## 最佳实践

1. **定期测试**：在发布前始终进行本地链接测试
2. **清理环境**：测试前确保没有旧版本的全局安装
3. **多环境测试**：在不同 Node.js 版本下测试
4. **文档更新**：功能变更后及时更新测试用例

通过遵循这些测试流程，可以确保 `bumpster` 工具在各种环境下都能正常工作。
