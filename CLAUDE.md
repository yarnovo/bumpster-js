# 项目开发规则约定

## 项目基本信息

### 项目名称

- NPM 包名：`bumpster`（原名 @ai-app-base/bump-version-js）
- 项目描述：一个智能的语义化版本管理命令行工具

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
- **DEPLOYMENT.md** - 部署文档（如果存在），包含部署流程、配置等

### 更新原则

- 代码变更后立即更新相关文档
- 保持文档与代码的一致性
- 使用清晰的中文描述
- 提供完整的示例代码

## MCP 工具使用规则

### 规则 1：自主选择 MCP 工具调用

- 根据问题内容自主决定是否调用 MCP 工具
- 如果用户明确指定了工具，必须使用指定的工具
- 如果用户未指定，根据任务需求智能选择合适的 MCP 工具

<!-- 最后更新时间: 2025-01-08T05:30:00+08:00 -->
<!-- 最后检查时间: 2025-01-08T13:46:00+08:00 -->
