# bump-version-js

一个智能的语义化版本管理命令行工具，专为现代 JavaScript/TypeScript 项目设计。

## 简介

`bump-version-js` 是一个交互式的版本管理工具，它遵循[语义化版本规范](https://semver.org/)，支持正式版本和预发布版本的管理。该工具通过友好的命令行界面，自动化处理版本号更新、Git 提交和标签创建等繁琐的发布流程。

## 职责

本工具负责以下核心任务：

- **版本号管理**：自动计算和更新符合语义化版本规范的版本号
- **版本号验证**：验证版本号是否符合语义化版本规范
- **Git 集成**：自动创建规范的提交信息和标签
- **发布流程自动化**：一键完成版本更新、提交、标签创建和推送
- **预发布版本支持**：管理 dev、alpha、beta、rc 等预发布版本的迭代

## 功能特性

### 🎯 版本管理功能

- **交互式界面**：通过友好的命令行交互界面选择版本类型和更新方式
- **智能版本计算**：自动根据当前版本和选择的类型计算下一个版本号
- **预发布版本管理**：
  - 支持 dev、alpha、beta、rc 四种预发布类型
  - 自动处理预发布版本间的升级路径
  - 支持预发布版本转正式版本
- **Git 工作流集成**：
  - 自动提交 package.json 和 package-lock.json
  - 创建带注释的 Git 标签
  - 一键推送到远程仓库
- **安全保护**：
  - 检查工作区是否有未提交的更改
  - 警告非主分支发布（可选择继续）
  - 执行前显示详细的执行计划

### 🔍 版本验证功能

- **版本号格式验证**：检查版本号是否符合语义化版本规范
- **详细信息展示**：显示版本号的各个组成部分
- **预发布类型识别**：自动识别并展示预发布版本类型

### 📦 支持的版本类型

1. **正式版本**
   - Patch (修订号): 错误修复 (1.0.0 → 1.0.1)
   - Minor (次版本号): 新功能，向后兼容 (1.0.0 → 1.1.0)
   - Major (主版本号): 重大更新，可能不兼容 (1.0.0 → 2.0.0)

2. **预发布版本**
   - Dev: 开发版本，用于开发过程中的版本管理
   - Alpha: 内部测试版本，功能可能不完整
   - Beta: 公开测试版本，功能基本完整
   - RC: 候选发布版本，即将成为正式版

## 安装

### 全局安装

```bash
npm install -g @ai-app-base/bump-version-js
```

### 项目内安装

```bash
npm install --save-dev @ai-app-base/bump-version-js
```

## 使用方法

### 命令语法

```bash
bump-version-js [command] [options]
# 或使用别名
bvj [command] [options]
```

### 可用命令

- **无命令**（默认）: 交互式版本管理
- **validate <version>**: 验证版本号是否符合语义化版本规范

### 选项

- `-h, --help`: 显示帮助信息
- `-v, --version`: 显示工具版本号

### 版本管理（默认模式）

当不带任何命令运行时，进入交互式版本管理模式：

```bash
bump-version-js
# 或
bvj
```

#### 使用流程

1. **启动工具**

   ```bash
   bvj
   ```

2. **选择发布类型**
   - 正式版本 (Production)
   - Dev 版本
   - Alpha 版本
   - Beta 版本
   - RC 版本

3. **选择版本递增类型**（仅在需要时）
   - Patch: 修复 bug
   - Minor: 新增功能（向后兼容）
   - Major: 重大更改（可能不兼容）

4. **确认执行计划**
   - 查看版本变更详情
   - 确认执行步骤
   - 输入 y 确认或 n 取消

### 版本验证

验证版本号是否符合语义化版本规范：

```bash
bump-version-js validate <version>
# 或
bvj validate <version>
```

#### 示例

```bash
# 验证正式版本
bvj validate 1.0.0
# ✅ 版本号 "1.0.0" 符合语义化版本规范

# 验证预发布版本
bvj validate 2.1.0-alpha.3
# ✅ 版本号 "2.1.0-alpha.3" 符合语义化版本规范
# 显示详细信息包括预发布类型

# 验证无效版本
bvj validate invalid-version
# ❌ 版本号 "invalid-version" 不符合语义化版本规范
```

## API 参考

### bump-version-js / bvj

统一的命令行工具，支持版本管理和版本验证功能。

#### 默认模式（版本管理）

**语法**：

```bash
bump-version-js [options]
bvj [options]
```

**功能**：

- 自动检测当前版本
- 提供版本升级选项
- 执行 Git 操作
- 推送到远程仓库

**环境变量**：

- `BUMP_VERSION_SKIP_PUSH`: 设置后跳过 Git 推送步骤（用于测试）
- `BUMP_VERSION_DEFAULTS`: JSON 格式的默认选项（用于测试）

#### validate 子命令

**语法**：

```bash
bump-version-js validate <version>
bvj validate <version>
```

**参数**：

- `version`: 要验证的版本号字符串

**返回值**：

- 成功：退出码 0
- 失败：退出码 1

#### 通用选项

- `-h, --help`: 显示帮助信息
- `-v, --version`: 显示工具版本号

## 注意事项

1. **工作目录**：必须在包含 `package.json` 的项目根目录运行
2. **Git 状态**：执行版本更新前确保工作区干净（无未提交的更改）
3. **分支管理**：建议在 main 分支上进行版本发布
4. **网络连接**：推送操作需要网络连接和远程仓库访问权限
5. **版本回退**：版本号只能递增，不支持回退操作
6. **标签管理**：自动创建的标签格式为 `v{version}`（如 v1.0.0）

## 许可证

[ISC](LICENSE)

## 相关链接

- [语义化版本规范](https://semver.org/)
- [npm 包主页](https://www.npmjs.com/package/@ai-app-base/bump-version-js)
- [GitHub 仓库](https://github.com/ai-app-base/bump-version-js)
- [问题反馈](https://github.com/ai-app-base/bump-version-js/issues)
