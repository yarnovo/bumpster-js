import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { execa } from 'execa';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const bumpVersionPath = join(__dirname, '..', 'dist', 'bump-version.js');

interface TestRepo {
  path: string;
  cleanup: () => Promise<void>;
}

function createTestEnv(defaults: Record<string, unknown> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    FORCE_COLOR: '0',
    BUMP_VERSION_SKIP_PUSH: 'true',
    BUMP_VERSION_DEFAULTS: JSON.stringify(defaults),
  };
}

async function createTestRepo(initialVersion: string = '1.0.0'): Promise<TestRepo> {
  // 在项目根目录下创建临时测试目录
  const testTempDir = join(__dirname, '..', '.test-repos');
  // 确保测试目录存在
  await mkdir(testTempDir, { recursive: true });

  // 创建临时目录
  const tempDir = await mkdtemp(join(testTempDir, 'test-repo-'));

  // 初始化 git 仓库
  await execa('git', ['init'], { cwd: tempDir });
  await execa('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
  await execa('git', ['config', 'user.name', 'Test User'], { cwd: tempDir });

  // 创建 package.json
  const packageJson = {
    name: 'test-package',
    version: initialVersion,
    description: 'Test package for bump-version',
  };

  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // 创建初始提交
  await execa('git', ['add', '.'], { cwd: tempDir });
  await execa('git', ['commit', '-m', 'Initial commit'], { cwd: tempDir });

  // 创建 main 分支
  await execa('git', ['branch', '-M', 'main'], { cwd: tempDir });

  return {
    path: tempDir,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

async function getVersion(repoPath: string): Promise<string> {
  const packageJsonContent = await readFile(join(repoPath, 'package.json'), 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  return packageJson.version;
}

async function getTags(repoPath: string): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['tag'], { cwd: repoPath });
    return stdout.split('\n').filter(tag => tag.trim() !== '');
  } catch {
    return [];
  }
}

describe('bump-version integration tests', () => {
  let testRepo: TestRepo;

  // 在所有测试开始前构建一次
  beforeAll(async () => {
    // 确保构建后的文件存在
    try {
      await execa('npm', ['run', 'build'], { cwd: join(__dirname, '..') });
    } catch (error) {
      console.error('Build failed:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (testRepo) {
      await testRepo.cleanup();
    }
  });

  describe('version bumping', () => {
    it('should bump patch version for production release', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      // 验证版本号更新
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.1');

      // 验证标签创建
      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.0.1');

      // 验证输出包含成功信息
      expect(stdout).toContain('版本更新成功');
      expect(stdout).toContain('1.0.1');
    });

    it('should bump minor version for production release', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'minor',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.1.0');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.1.0');
    });

    it('should bump major version for production release', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'major',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('2.0.0');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v2.0.0');
    });
  });

  describe('prerelease versions', () => {
    it('should create dev version from production', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'dev',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.1-dev.0');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.0.1-dev.0');
    });

    it('should increment dev version', async () => {
      testRepo = await createTestRepo('1.0.0-dev.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'dev',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-dev.1');
    });

    it('should upgrade from dev to alpha', async () => {
      testRepo = await createTestRepo('1.0.0-dev.3');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'alpha',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-alpha.0');
    });

    it('should create alpha version from production', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'alpha',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.1-alpha.0');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.0.1-alpha.0');
    });

    it('should increment alpha version', async () => {
      testRepo = await createTestRepo('1.0.0-alpha.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'alpha',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-alpha.1');
    });

    it('should upgrade from alpha to beta', async () => {
      testRepo = await createTestRepo('1.0.0-alpha.3');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'beta',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-beta.0');
    });

    it('should upgrade from beta to rc', async () => {
      testRepo = await createTestRepo('1.0.0-beta.2');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-rc.0');
    });

    it('should convert rc to production release', async () => {
      testRepo = await createTestRepo('1.0.0-rc.1');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0');
    });

    it('should increment rc version', async () => {
      testRepo = await createTestRepo('1.0.0-rc.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-rc.1');
    });

    it('should create rc version from production with minor bump', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          selectedVersionBump: 'minor',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.1.0-rc.0');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.1.0-rc.0');
    });

    it('should create rc version from production with major bump', async () => {
      testRepo = await createTestRepo('1.5.3');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          selectedVersionBump: 'major',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('2.0.0-rc.0');
    });

    it('should handle rc version with high iteration number', async () => {
      testRepo = await createTestRepo('1.0.0-rc.9');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-rc.10');
    });

    it('should convert dev to production release', async () => {
      testRepo = await createTestRepo('1.0.0-dev.5');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0');
    });

    it('should create dev version with major bump', async () => {
      testRepo = await createTestRepo('1.2.3');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'dev',
          selectedVersionBump: 'major',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('2.0.0-dev.0');
    });

    it('should handle dev version with high iteration number', async () => {
      testRepo = await createTestRepo('1.0.0-dev.15');

      const { stdout: _stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'dev',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-dev.16');
    });
  });

  describe('custom version', () => {
    it('should allow custom version input', async () => {
      testRepo = await createTestRepo('1.0.0');

      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'custom',
          customVersion: '2.5.8',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('2.5.8');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v2.5.8');

      expect(stdout).toContain('版本更新成功');
      expect(stdout).toContain('2.5.8');
    });

    it('should allow custom prerelease version', async () => {
      testRepo = await createTestRepo('1.0.0');

      await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'custom',
          customVersion: '3.0.0-beta.5',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('3.0.0-beta.5');

      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v3.0.0-beta.5');
    });

    it('should allow custom version with build metadata', async () => {
      testRepo = await createTestRepo('1.0.0');

      await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'custom',
          customVersion: '1.2.3+build.456',
          confirm: true,
        }),
      });

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.2.3+build.456');
    });
  });

  describe('error handling', () => {
    it('should fail when working directory has uncommitted changes', async () => {
      testRepo = await createTestRepo('1.0.0');

      // 创建未提交的更改
      await writeFile(join(testRepo.path, 'test.txt'), 'uncommitted change');

      // 当检测到未提交的更改时，脚本应该正常退出（exit code 0）
      const result = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv(),
        reject: false, // 不要在非零退出码时抛出错误
      });

      expect(result.stdout).toContain('工作区有未提交的更改');
      expect(result.exitCode).toBe(0);

      // 验证版本号未更改
      const version = await getVersion(testRepo.path);
      expect(version).toBe('1.0.0');
    });

    it('should warn when not on main branch but allow continuation', async () => {
      testRepo = await createTestRepo('1.0.0');

      // 创建并切换到新分支
      await execa('git', ['checkout', '-b', 'feature-branch'], { cwd: testRepo.path });

      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          proceed: true,
          releaseTypeChoice: 'production',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      expect(stdout).toContain('不在 main 分支上');

      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.1');
    });

    it('should handle user cancellation gracefully', async () => {
      testRepo = await createTestRepo('1.0.0');

      // 当用户取消时，脚本应该正常退出（exit code 0）
      const result = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'patch',
          confirm: false,
        }),
        reject: false, // 不要在非零退出码时抛出错误
      });

      expect(result.stdout).toContain('发布已取消');
      expect(result.exitCode).toBe(0);

      // 验证版本号未更改
      const version = await getVersion(testRepo.path);
      expect(version).toBe('1.0.0');
    });
  });

  describe('git operations', () => {
    it('should create proper commit message', async () => {
      testRepo = await createTestRepo('1.0.0');

      await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      // 获取最新提交信息
      const { stdout } = await execa('git', ['log', '-1', '--pretty=%B'], { cwd: testRepo.path });
      expect(stdout.trim()).toBe('chore: release 1.0.1');
    });

    it('should create annotated tag with correct message', async () => {
      testRepo = await createTestRepo('1.0.0');

      await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'patch',
          confirm: true,
        }),
      });

      // 获取标签信息
      const { stdout } = await execa('git', ['tag', '-n', 'v1.0.1'], { cwd: testRepo.path });
      expect(stdout).toContain('Release 1.0.1');
    });
  });

  describe('validate command', () => {
    it('should validate correct version numbers', async () => {
      const { stdout, exitCode } = await execa('node', [bumpVersionPath, 'validate', '1.0.0'], {
        reject: false,
        env: { FORCE_COLOR: '0' },
      });

      expect(exitCode).toBe(0);
      expect(stdout).toContain('✅ 版本号 "1.0.0" 符合语义化版本规范');
      expect(stdout).toContain('主版本号 (Major): 1');
      expect(stdout).toContain('次版本号 (Minor): 0');
      expect(stdout).toContain('修订号 (Patch): 0');
    });

    it('should validate prerelease versions', async () => {
      const { stdout, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', '2.1.0-alpha.3'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('✅ 版本号 "2.1.0-alpha.3" 符合语义化版本规范');
      expect(stdout).toContain('预发布版本: alpha.3');
      expect(stdout).toContain('预发布类型: alpha (内部测试版本)');
    });

    it('should validate dev versions', async () => {
      const { stdout, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', '1.0.0-dev.0'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('预发布类型: dev (开发版本)');
    });

    it('should validate beta versions', async () => {
      const { stdout, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', '3.0.0-beta.1'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('预发布类型: beta (公开测试版本)');
    });

    it('should validate rc versions', async () => {
      const { stdout, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', '2.0.0-rc.0'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('预发布类型: rc (候选发布版本)');
    });

    it('should validate versions with build metadata', async () => {
      const { stdout, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', '1.0.0+build.123'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('构建元数据: build.123');
    });

    it('should reject invalid version numbers', async () => {
      const { stderr, exitCode } = await execa(
        'node',
        [bumpVersionPath, 'validate', 'invalid-version'],
        {
          reject: false,
          env: { FORCE_COLOR: '0' },
        }
      );

      expect(exitCode).toBe(1);
      expect(stderr).toContain('❌ 版本号 "invalid-version" 不符合语义化版本规范');
      expect(stderr).toContain('语义化版本格式: MAJOR.MINOR.PATCH[-PRERELEASE]');
    });

    it('should reject when no version provided', async () => {
      const { stderr, exitCode } = await execa('node', [bumpVersionPath, 'validate'], {
        reject: false,
        env: { FORCE_COLOR: '0' },
      });

      expect(exitCode).toBe(1);
      expect(stderr).toContain('❌ 请提供要验证的版本号');
      expect(stderr).toContain('用法: bump-version-js validate <version>');
    });
  });
});
