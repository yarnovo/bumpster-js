# GitHub Actions 部署文档

## 项目概述

本项目是一个用于管理 JavaScript/TypeScript 项目版本号的工具，支持通过 GitHub Actions 实现自动化 CI/CD 流程。

## GitHub Actions 配置

### 基础 CI/CD 工作流

创建 `.github/workflows/ci.yml` 文件：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm test

      - name: Run format check
        run: npm run format:check

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/
```

### 发布工作流

创建 `.github/workflows/release.yml` 文件：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run checks
        run: npm run check

      - name: Build project
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

### 版本自动更新工作流

创建 `.github/workflows/version-bump.yml` 文件：

```yaml
name: Version Bump

on:
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version type to bump'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  bump-version:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure Git
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"

      - name: Bump version
        run: |
          npm version ${{ github.event.inputs.version_type }}
          git push origin main --tags
```

## 环境变量和密钥配置

### 必需的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **NPM_TOKEN**: NPM 发布令牌
   - 在 npmjs.com 生成访问令牌
   - 在 GitHub 仓库设置 → Secrets → Actions 中添加

2. **GITHUB_TOKEN**: GitHub 访问令牌
   - GitHub 自动提供，无需手动设置

### 可选的环境变量

```yaml
env:
  NODE_ENV: production
  CI: true
```

## 工作流触发条件

### 自动触发

- **推送到主分支**: 触发 CI/CD 流程
- **创建 Pull Request**: 触发测试和检查
- **推送标签**: 触发发布流程

### 手动触发

- **版本更新**: 通过 GitHub Actions 页面手动触发
- **重新部署**: 通过 workflow_dispatch 手动触发

## 分支策略

### 推荐的分支模型

```
main (生产环境)
├── develop (开发环境)
├── feature/xxx (功能分支)
└── hotfix/xxx (紧急修复分支)
```

### 对应的工作流配置

```yaml
on:
  push:
    branches:
      - main # 生产部署
      - develop # 开发环境部署
  pull_request:
    branches:
      - main # 生产环境代码审查
      - develop # 开发环境代码审查
```

## 部署到不同环境

### 开发环境部署

```yaml
deploy-dev:
  if: github.ref == 'refs/heads/develop'
  runs-on: ubuntu-latest
  environment: development

  steps:
    - name: Deploy to development
      run: |
        # 部署到开发环境的命令
        echo "Deploying to development environment"
```

### 生产环境部署

```yaml
deploy-prod:
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  environment: production

  steps:
    - name: Deploy to production
      run: |
        # 部署到生产环境的命令
        echo "Deploying to production environment"
```

## 通知和监控

### Slack 通知

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#deployments'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### 邮件通知

```yaml
- name: Send email notification
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: 'Deployment Status: ${{ job.status }}'
    body: 'The deployment has ${{ job.status }}'
    to: 'team@example.com'
  if: failure()
```

## 最佳实践

### 1. 缓存依赖

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 2. 并行执行

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [16.x, 18.x, 20.x]
```

### 3. 条件执行

```yaml
- name: Deploy only on main branch
  if: github.ref == 'refs/heads/main'
  run: npm run deploy
```

### 4. 错误处理

```yaml
- name: Run tests
  run: npm test
  continue-on-error: true

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: test-results/
```

## 故障排查

### 常见问题

1. **权限问题**
   - 检查 GitHub Token 权限
   - 确认仓库访问权限

2. **依赖安装失败**
   - 检查 Node.js 版本兼容性
   - 清除缓存重新安装

3. **测试失败**
   - 检查环境变量配置
   - 验证测试命令正确性

### 调试技巧

1. **启用调试模式**

   ```yaml
   - name: Debug information
     run: |
       echo "Node version: $(node --version)"
       echo "NPM version: $(npm --version)"
       echo "Working directory: $(pwd)"
       ls -la
   ```

2. **保存工作流日志**
   ```yaml
   - name: Upload logs
     uses: actions/upload-artifact@v3
     if: failure()
     with:
       name: workflow-logs
       path: |
         ~/.npm/_logs/
         ./logs/
   ```

## 安全考虑

### 1. 密钥管理

- 使用 GitHub Secrets 存储敏感信息
- 定期轮换访问令牌
- 限制令牌权限范围

### 2. 代码审查

- 要求 PR 审查通过才能合并
- 使用分支保护规则
- 自动化安全扫描

### 3. 依赖安全

```yaml
- name: Audit dependencies
  run: npm audit --audit-level=moderate
```

## 监控和度量

### 1. 构建时间监控

```yaml
- name: Build time tracking
  run: |
    start_time=$(date +%s)
    npm run build
    end_time=$(date +%s)
    echo "Build time: $((end_time - start_time)) seconds"
```

### 2. 测试覆盖率

```yaml
- name: Test coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

通过以上配置，可以实现完整的 GitHub Actions CI/CD 流程，确保代码质量和自动化部署。
