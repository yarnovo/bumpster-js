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

<!-- 最后更新时间: 2025-01-08T05:27:33+08:00 -->
