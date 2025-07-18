# 项目开发规则约定

## 项目基本信息

### 项目名称

- NPM 包名：`bumpster`（原名 @ai-app-base/bump-version-js）
- 项目描述：一个智能的语义化版本管理命令行工具
- GitHub 仓库：`git@github.com:yarnovo/bumpster-js.git`

### 命令行工具

- 主命令：`bump`
- 别名命令：`bump-js`
- 二进制文件：`./dist/bump-version.js`

### 命令行选项

- `-h, --help` - 显示帮助信息
- `-v, --version` - 显示版本号
- `--dry-run` - 预览操作但不实际执行（无副作用）

### 子命令

- `validate <version>` - 验证版本号是否符合语义化版本规范

## 技术栈

### 核心技术

- TypeScript - 主要开发语言
- Node.js - 运行环境
- ES Modules - 模块系统

### 主要依赖

- semver - 语义化版本解析和计算
- prompts - 命令行交互界面
- chalk - 终端颜色输出

### 开发工具

- Vitest - 测试框架
- ESLint - 代码规范检查
- Prettier - 代码格式化
- eslint-config-prettier - 禁用与 Prettier 冲突的 ESLint 规则
- eslint-plugin-prettier - 将 Prettier 作为 ESLint 规则运行
- Husky - Git hooks
- lint-staged - 暂存文件检查

## 项目结构

```
bumpster/
├── src/
│   └── bump-version.ts    # 主程序文件
├── tests/                 # 测试文件
├── dist/                  # 构建输出
└── package.json          # 项目配置
```

## 开发规范

### 代码风格

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- Git 提交前自动运行 lint-staged

### 测试要求

- 运行测试：`npm test`
- 运行 lint：`npm run lint`
- 运行类型检查：`npm run typecheck`

## 文档维护规则

### 文档更新要求

每次更新代码或文件后，必须检查并更新相关文档：

- **README.md** - 用户文档，包含使用说明、API 参考等
- **CHANGELOG.md** - 更新日志，记录版本变更历史（遵循 Keep a Changelog 规范）
- **DEVELOPMENT.md** - 开发文档，包含开发环境设置、项目结构等
- **DEPLOYMENT.md** - 部署文档，包含 GitHub Actions 配置和部署流程
- **TESTING.md** - 测试文档，包含本地测试、npm link 和全局安装流程

### 项目文档结构

- **用户向文档**：README.md（使用说明）、CHANGELOG.md（更新日志）
- **开发者文档**：DEVELOPMENT.md（开发指南）、TESTING.md（测试指南）
- **运维文档**：DEPLOYMENT.md（部署配置）

### 更新原则

- 代码变更后立即更新相关文档
- 保持文档与代码的一致性
- 使用清晰的中文描述
- 提供完整的示例代码

## 调试技巧

### ESLint comma-dangle 错误

如果遇到 comma-dangle 错误，运行 `npm run lint:fix` 自动修复。

### 代码格式化问题

如果遇到 ESLint 格式化错误，可以使用以下命令：

- `npm run lint:fix` - 自动修复 ESLint 错误
- `npm run format` - 使用 Prettier 格式化代码

### TypeScript 编译器损坏问题

如果遇到 TypeScript 编译器错误（如 `Invalid or unexpected token`），说明 node_modules 中的 TypeScript 文件可能已损坏。解决方法：

1. 删除 node_modules 和 package-lock.json：`rm -rf node_modules package-lock.json`
2. 重新安装依赖：`npm install`
3. 验证修复：`npm run build`

### ESLint 和 Prettier 兼容性配置

项目使用 ESLint 进行代码质量检查，Prettier 进行代码格式化。为避免规则冲突：

1. 已安装 `eslint-config-prettier` 和 `eslint-plugin-prettier`
2. ESLint 配置中集成了 Prettier 插件
3. 格式化规则（如 `semi`、`quotes`、`comma-dangle`）由 Prettier 统一处理
4. 运行 `npm run format` 格式化代码，`npm run lint` 检查代码质量

配置要点：

- `.prettierrc.json` 定义格式化规则
- `eslint.config.js` 中使用 `prettier/prettier` 规则
- 通过 `prettierConfig.rules` 禁用冲突的 ESLint 规则

### lint-staged 配置优化

为避免重复格式化，`lint-staged` 配置已优化：

- **TypeScript 文件** (`*.{ts,tsx}`)：只运行 `eslint --fix`
  - ESLint 通过 `prettier/prettier` 规则自动格式化代码
  - 不需要单独运行 `prettier --write`
- **其他文件** (`*.{json,md}`)：运行 `prettier --write`
  - 这些文件 ESLint 不处理，需要直接用 Prettier

这样可以提高 Git 提交效率，避免重复格式化操作。

### npm 生命周期钩子问题排查

如果在使用 bumpster 时发现目标项目的 npm 脚本没有被执行，请检查：

1. **确认脚本存在**：检查目标项目的 `package.json` 中是否定义了相应的脚本
2. **检查脚本名称**：确保脚本名称为 `preversion`、`version` 或 `postversion`
3. **查看执行日志**：bumpster 会显示是否找到并执行了相应的脚本
4. **验证脚本权限**：确保脚本有执行权限

**常见问题**：

- 问题：为什么 `version` 脚本没有被调用？
- 原因：bumpster 直接修改 `package.json` 文件，而不是使用 `npm version` 命令
- 解决：bumpster 现在会手动检测并执行这些钩子，保持与 npm 标准一致

## CI/CD 配置

### GitHub Actions 权限配置

项目使用 GitHub Actions 进行持续集成和部署。关键配置：

1. **权限声明**（必须）：

   ```yaml
   permissions:
     contents: write # 允许创建 release
     packages: write # 允许发布包
   ```

2. **Release 创建**：
   - 使用 `softprops/action-gh-release@v1` 替代过时的 `actions/create-release@v1`
   - 避免 "Resource not accessible by integration" 错误

3. **NPM 发布配置**：
   - 需要在仓库设置中配置 `NPM_TOKEN` secret
   - 包名已更新为 `bumpster`

## 功能特性

### Dry-Run 模式

支持 `--dry-run` 参数，用于预览操作而不实际执行：

- **使用方法**：`bump --dry-run`
- **功能特点**：
  - 显示 "🧪 DRY-RUN 模式" 提示
  - 预览所有 Git 操作（commit、tag、push）但不执行
  - 预览文件更新（package.json、package-lock.json）但不写入
  - 预览 npm 生命周期钩子的执行
  - 每个操作都会显示 "[DRY-RUN] 将执行: xxx"
- **实现方式**：
  - 全局变量 `isDryRun` 控制模式
  - 在 `exec` 函数中拦截 Git 命令
  - 在文件写入前进行判断
  - 在 `executeNpmScript` 函数中支持预览钩子执行

### npm 生命周期钩子支持

工具会自动检测并执行目标项目的 npm 生命周期钩子，完全符合 npm 标准：

- **支持的钩子**：
  - `preversion` - 版本更新前执行（用于测试、代码检查等）
  - `version` - 版本更新后执行（用于更新文档、构建等）
  - `postversion` - 版本更新完成后执行（用于发布、通知等）

- **执行顺序**：

  ```
  preversion → 更新版本号 → 更新 CHANGELOG.md → version → git commit → git tag → postversion → git push
  ```

- **错误处理**：
  - `preversion` 和 `version` 脚本失败时会取消版本更新
  - `postversion` 脚本失败时仅显示警告，不会回滚已完成的更新

- **用户体验**：
  - 智能检测项目中的 npm scripts
  - 执行计划会动态显示将要执行的钩子
  - 详细的执行状态反馈
  - 支持 dry-run 模式预览钩子执行

- **实现函数**：
  - `executeNpmScript(scriptName, description)` - 核心钩子执行函数
  - 自动检测项目 package.json 中的 scripts 配置
  - 与现有的 dry-run 模式完全兼容

### CHANGELOG.md 自动更新

工具会在版本更新过程中自动更新项目的 CHANGELOG.md 文件：

- **触发条件**：
  - 项目根目录存在 CHANGELOG.md 文件
  - CHANGELOG.md 中包含 `## [Unreleased]` 部分
  - 在 version 钩子执行前自动触发

- **更新逻辑**：
  - 保留原有的 `[Unreleased]` 标题用于后续开发
  - 在 `[Unreleased]` 下方插入新版本记录
  - 格式：`## [版本号] - YYYY-MM-DD`
  - 保留所有原有内容，仅添加版本标记

- **集成特性**：
  - 支持 dry-run 模式预览更新
  - 自动将 CHANGELOG.md 添加到 Git 提交中
  - 在执行计划中显示更新步骤
  - 静默处理不存在或无需更新的情况

- **实现模块**：
  - `changelog-updater.ts` - 独立的更新模块
  - `updateChangelog()` - 核心更新函数
  - `checkChangelogExists()` - 检查文件存在性
  - `hasUnreleasedSection()` - 检查是否有待发布内容
