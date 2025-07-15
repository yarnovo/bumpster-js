# 更新日志

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- npm 生命周期钩子支持，在目标项目中执行 `preversion`、`version` 和 `postversion` 脚本
- 智能执行计划显示，根据项目配置动态显示将要执行的钩子
- 钩子执行过程中的详细状态反馈和错误处理

### Changed

- 执行计划现在会显示哪些 npm 脚本将被执行
- `preversion` 和 `version` 脚本失败时会取消版本更新
- `postversion` 脚本失败时仅显示警告，不会回滚已完成的更新

## [0.1.2] - 2025-07-08

### Changed

- 更新 README.md 文档，新增 `--dry-run` 选项使用说明

## [0.1.1] - 2025-07-08

### Changed

- 包名从 `@ai-app-base/bump-version-js` 更改为 `bumpster`
- 更新 README.md 文档中的安装命令

## [0.1.0] - 2025-07-08

### Added

- `--dry-run` 参数，支持预览操作而不实际执行
- 预览模式下的 Git 操作显示（commit、tag、push）
- 预览模式下的文件更新操作显示

### Changed

- 优化 lint-staged 配置，避免重复格式化，提高 Git 提交效率

### Fixed

- 移除版本更新成功后的 CI/CD 提示信息，简化输出内容

## [0.1.1-dev.0] - 2025-07-08

### Changed

- 更新 CLAUDE.md 文档，新增 CI/CD 配置细节
- 完善 GitHub Actions 权限设置和 Release 创建流程文档

## [0.1.0-alpha.0] - 2025-07-02

### Added

- 初始版本发布
- 智能语义化版本管理，支持 major、minor、patch 版本递增
- 完整的预发布版本支持（dev、alpha、beta、rc）
- 预发布版本升级路径：dev → alpha → beta → rc → production
- 自定义版本号输入功能
- 自动 Git 提交和标签创建
- 智能分支检查，支持非 main 分支发布（需确认）
- 工作区状态检查，确保发布前代码已提交
- 自动推送提交和标签到远程仓库
- 交互式命令行界面，支持选择发布类型和版本递增类型
- 详细的执行计划预览，包含版本变更和操作步骤
- 彩色终端输出，提供直观的状态反馈
- 版本验证子命令，检查版本号格式是否正确
- 跨平台支持（Windows、macOS、Linux）
- 命令行工具支持多种调用方式（`bump`、`bump-js`）
- TypeScript 开发，提供类型安全
- ESLint 代码质量检查和 Prettier 代码格式化
- Vitest 测试框架，包含完整的测试套件
- Husky Git hooks，支持提交前检查
- GitHub Actions 自动化构建和发布
- 自动 NPM 包发布
- 命令行选项：`-h/--help`、`-v/--version`、`validate <version>`

[Unreleased]: https://github.com/yarnovo/bumpster-js/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/yarnovo/bumpster-js/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/yarnovo/bumpster-js/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/yarnovo/bumpster-js/compare/v0.1.1-dev.0...v0.1.0
[0.1.1-dev.0]: https://github.com/yarnovo/bumpster-js/compare/v0.1.0-alpha.0...v0.1.1-dev.0
[0.1.0-alpha.0]: https://github.com/yarnovo/bumpster-js/releases/tag/v0.1.0-alpha.0
