import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  updateChangelog,
  checkChangelogExists,
  hasUnreleasedSection,
} from '../src/changelog-updater.js';

describe('changelog-updater', () => {
  const testDir = path.join(process.cwd(), 'test-changelog');
  const changelogPath = path.join(testDir, 'CHANGELOG.md');
  const packageJsonPath = path.join(testDir, 'package.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.mkdir(testDir, { recursive: true });

    // 创建测试用的 package.json
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify({ name: 'test-package', version: '1.2.3' }, null, 2)
    );
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('checkChangelogExists', () => {
    it('应该在 CHANGELOG.md 存在时返回 true', async () => {
      await fs.writeFile(changelogPath, '# Changelog\n');
      const exists = await checkChangelogExists(testDir);
      expect(exists).toBe(true);
    });

    it('应该在 CHANGELOG.md 不存在时返回 false', async () => {
      const exists = await checkChangelogExists(testDir);
      expect(exists).toBe(false);
    });
  });

  describe('hasUnreleasedSection', () => {
    it('应该在有 [Unreleased] 部分时返回 true', async () => {
      await fs.writeFile(changelogPath, '# Changelog\n\n## [Unreleased]\n\n- Some changes\n');
      const hasUnreleased = await hasUnreleasedSection(testDir);
      expect(hasUnreleased).toBe(true);
    });

    it('应该在没有 [Unreleased] 部分时返回 false', async () => {
      await fs.writeFile(changelogPath, '# Changelog\n\n## [1.0.0] - 2024-01-01\n');
      const hasUnreleased = await hasUnreleasedSection(testDir);
      expect(hasUnreleased).toBe(false);
    });

    it('应该在文件不存在时返回 false', async () => {
      const hasUnreleased = await hasUnreleasedSection(testDir);
      expect(hasUnreleased).toBe(false);
    });
  });

  describe('updateChangelog', () => {
    it('应该更新 [Unreleased] 部分为新版本', async () => {
      const originalContent = `# Changelog

## [Unreleased]

### Added
- New feature

## [1.0.0] - 2024-01-01

### Added
- Initial release
`;
      await fs.writeFile(changelogPath, originalContent);

      await updateChangelog(testDir, '1.1.0');

      const updatedContent = await fs.readFile(changelogPath, 'utf8');

      // 检查是否保留了 [Unreleased] 标题
      expect(updatedContent).toContain('## [Unreleased]');

      // 检查是否添加了新版本
      expect(updatedContent).toMatch(/## \[1\.1\.0\] - \d{4}-\d{2}-\d{2}/);

      // 检查新版本是否在 [Unreleased] 后面
      const unreleasedIndex = updatedContent.indexOf('## [Unreleased]');
      const newVersionIndex = updatedContent.indexOf('## [1.1.0]');
      expect(unreleasedIndex).toBeLessThan(newVersionIndex);

      // 检查原有内容是否保留
      expect(updatedContent).toContain('### Added\n- New feature');
      expect(updatedContent).toContain('## [1.0.0] - 2024-01-01');
    });

    it('应该在 dry-run 模式下不修改文件', async () => {
      const originalContent = `# Changelog

## [Unreleased]

- Some changes
`;
      await fs.writeFile(changelogPath, originalContent);

      await updateChangelog(testDir, '1.1.0', true);

      const content = await fs.readFile(changelogPath, 'utf8');
      expect(content).toBe(originalContent);
    });

    it('应该在没有 [Unreleased] 部分时跳过更新', async () => {
      const originalContent = `# Changelog

## [1.0.0] - 2024-01-01

- Initial release
`;
      await fs.writeFile(changelogPath, originalContent);

      await updateChangelog(testDir);

      const content = await fs.readFile(changelogPath, 'utf8');
      expect(content).toBe(originalContent);
    });

    it('应该在文件不存在时静默跳过', async () => {
      // 不应该抛出错误
      await expect(updateChangelog(testDir)).resolves.not.toThrow();
    });

    it('应该使用 package.json 中的版本号（如果未提供）', async () => {
      const originalContent = `# Changelog

## [Unreleased]

- Some changes
`;
      await fs.writeFile(changelogPath, originalContent);

      await updateChangelog(testDir); // 不传入版本号

      const updatedContent = await fs.readFile(changelogPath, 'utf8');
      expect(updatedContent).toContain('## [1.2.3]'); // 使用 package.json 中的版本
    });

    it('应该正确处理日期格式', async () => {
      const originalContent = `# Changelog

## [Unreleased]

- Some changes
`;
      await fs.writeFile(changelogPath, originalContent);

      await updateChangelog(testDir, '1.1.0');

      const updatedContent = await fs.readFile(changelogPath, 'utf8');

      // 检查日期格式是否为 YYYY-MM-DD
      const datePattern = /## \[1\.1\.0\] - (\d{4}-\d{2}-\d{2})/;
      const match = updatedContent.match(datePattern);
      expect(match).toBeTruthy();

      if (match) {
        const dateStr = match[1];
        const date = new Date(dateStr);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    });
  });
});
