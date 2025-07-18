# 更新日志

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- **自动更新 CHANGELOG.md 功能**
  - 在 version 钩子执行阶段自动更新 CHANGELOG.md 文件
  - 将 [Unreleased] 部分替换为新版本号和当前日期
  - 智能检测：仅在存在 CHANGELOG.md 且包含 [Unreleased] 部分时更新
  - 支持 dry-run 模式预览
  - 自动将更新后的 CHANGELOG.md 添加到 Git 提交中

### 变更

- 优化版本推送流程，合并推送提交和标签为一个命令
- 移除提交信息中的 `[skip ci]` 标记，确保 CI/CD 正常运行

## [0.1.3] - 2025-07-18

### 新增

- **npm 生命周期钩子支持**
  - 自动检测并执行目标项目的 `preversion`、`version` 和 `postversion` 脚本
  - 遵循 npm 标准的执行顺序：preversion → 更新版本 → version → git commit → git tag → postversion → git push
  - 智能执行计划显示，根据项目配置动态显示将要执行的钩子
  - 详细的执行状态反馈，包括脚本输出和错误信息
  - 完整的错误处理机制：preversion 和 version 失败时回滚，postversion 失败时仅警告

- **文档更新**
  - 新增 CHANGELOG.md 文件，记录版本变更历史
  - README.md 新增 npm 生命周期钩子的使用说明
  - CLAUDE.md 新增钩子支持的详细文档和故障排查指南

### 变更

- 增强了 `executeNpmScript` 函数的错误处理和回滚机制
- 集成测试新增对 npm 生命周期钩子的全面验证
- 修正版本发布的提交信息格式，新增 `[skip ci]` 标记

### 技术细节

- 影响文件：7 个文件，新增 578 行代码
- 主要更新：`src/bump-version.ts`（149 行变更）、`tests/bump-version.integration.test.ts`（292 行新增测试）

## [0.1.2] - 2025-07-08

### 变更

- 更新包名从 `@ai-app-base/bump-version-js` 到 `bumpster`
- 更新 README.md 中的安装命令和使用说明

### 技术细节

- 影响文件：4 个文件，14 行变更
- 纯文档和配置更新，无功能变更

## [0.1.1] - 2025-07-08

### 新增

- **Dry-Run 模式**
  - 新增 `--dry-run` 命令行参数，支持预览所有操作而不实际执行
  - 显示 "🧪 DRY-RUN 模式" 醒目提示
  - 预览 Git 操作（commit、tag、push）
  - 预览文件更新（package.json、package-lock.json）
  - 所有预览操作都标记为 "[DRY-RUN] 将执行: xxx"

### 变更

- **CI/CD 配置优化**
  - 更新 GitHub Actions 权限配置，添加 `contents: write` 和 `packages: write`
  - 替换过时的 `actions/create-release@v1` 为 `softprops/action-gh-release@v1`
  - 修复 "Resource not accessible by integration" 错误

- **用户体验优化**
  - 移除版本更新成功后的 CI/CD 提示信息，简化输出内容

### 技术细节

- 影响文件：5 个文件，134 行变更
- 主要更新：`src/bump-version.ts`（60 行变更）、`.github/workflows/ci-cd.yml`（15 行变更）

## [0.1.1-dev.0] - 2025-07-08

### 变更

- 更新 CLAUDE.md 文档，新增 CI/CD 配置细节
- 完善 GitHub Actions 权限设置和 Release 创建流程文档

### 技术细节

- 预发布版本，主要用于文档更新

## [0.1.0] - 2025-07-08

### 新增

- **核心功能**
  - 智能语义化版本管理，支持 major、minor、patch 版本递增
  - 完整的预发布版本支持（dev、alpha、beta、rc）
  - 预发布版本升级路径：dev → alpha → beta → rc → production
  - 自定义版本号输入功能
  - 版本验证子命令 `validate <version>`

- **Git 集成**
  - 自动 Git 提交和标签创建
  - 智能分支检查，支持非 main 分支发布（需用户确认）
  - 工作区状态检查，确保发布前代码已提交
  - 自动推送提交和标签到远程仓库

- **用户体验**
  - 交互式命令行界面，使用 prompts 库提供友好的选择界面
  - 详细的执行计划预览，包含版本变更和操作步骤
  - 彩色终端输出（chalk），提供直观的状态反馈
  - 支持多种调用方式：`bump` 和 `bump-js`
  - 命令行选项：`-h/--help`、`-v/--version`

- **开发工具链**
  - TypeScript 开发，提供类型安全
  - ESLint + Prettier 代码规范
  - Vitest 测试框架
  - Husky + lint-staged Git hooks
  - 跨平台支持（Windows、macOS、Linux）

- **CI/CD**
  - GitHub Actions 自动化构建
  - 自动 NPM 包发布
  - 构建产物自动上传

### 变更

- 优化 lint-staged 配置，避免重复格式化

### 技术细节

- 初始发布版本
- 主要依赖：semver、prompts、chalk、commander

[Unreleased]: https://github.com/yarnovo/bumpster-js/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/yarnovo/bumpster-js/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/yarnovo/bumpster-js/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/yarnovo/bumpster-js/compare/v0.1.1-dev.0...v0.1.1
[0.1.1-dev.0]: https://github.com/yarnovo/bumpster-js/compare/v0.1.0...v0.1.1-dev.0
[0.1.0]: https://github.com/yarnovo/bumpster-js/releases/tag/v0.1.0
