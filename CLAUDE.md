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
- **DEVELOPMENT.md** - 开发文档，包含开发环境设置、项目结构等
- **DEPLOYMENT.md** - 部署文档，包含 GitHub Actions 配置和部署流程
- **TESTING.md** - 测试文档，包含本地测试、npm link 和全局安装流程

### 项目文档结构

- **用户向文档**：README.md（使用说明）
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

<!-- 最后更新时间: 2025-01-08T14:13:42+08:00 -->
<!-- 最后检查时间: 2025-01-08T14:13:42+08:00 -->
