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

function createTestEnv(defaults: any = {}) {
  return {
    ...process.env,
    FORCE_COLOR: '0',
    BUMP_VERSION_SKIP_PUSH: 'true',
    BUMP_VERSION_DEFAULTS: JSON.stringify(defaults)
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
    description: 'Test package for bump-version'
  };
  
  await writeFile(
    join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // 创建初始提交
  await execa('git', ['add', '.'], { cwd: tempDir });
  await execa('git', ['commit', '-m', 'Initial commit'], { cwd: tempDir });
  
  // 创建 main 分支
  await execa('git', ['branch', '-M', 'main'], { cwd: tempDir });
  
  return {
    path: tempDir,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    }
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
          confirm: true
        })
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
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'minor',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.1.0');
      
      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.1.0');
    });

    it('should bump major version for production release', async () => {
      testRepo = await createTestRepo('1.0.0');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          selectedVersionBump: 'major',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('2.0.0');
      
      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v2.0.0');
    });
  });

  describe('prerelease versions', () => {
    it('should create alpha version from production', async () => {
      testRepo = await createTestRepo('1.0.0');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'alpha',
          selectedVersionBump: 'patch',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.1-alpha.0');
      
      const tags = await getTags(testRepo.path);
      expect(tags).toContain('v1.0.1-alpha.0');
    });

    it('should increment alpha version', async () => {
      testRepo = await createTestRepo('1.0.0-alpha.0');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'alpha',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-alpha.1');
    });

    it('should upgrade from alpha to beta', async () => {
      testRepo = await createTestRepo('1.0.0-alpha.3');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'beta',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-beta.0');
    });

    it('should upgrade from beta to rc', async () => {
      testRepo = await createTestRepo('1.0.0-beta.2');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'rc',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0-rc.0');
    });

    it('should convert rc to production release', async () => {
      testRepo = await createTestRepo('1.0.0-rc.1');
      
      const { stdout } = await execa('node', [bumpVersionPath], {
        cwd: testRepo.path,
        env: createTestEnv({
          releaseTypeChoice: 'production',
          confirm: true
        })
      });
      
      const newVersion = await getVersion(testRepo.path);
      expect(newVersion).toBe('1.0.0');
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
        reject: false  // 不要在非零退出码时抛出错误
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
          confirm: true
        })
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
          confirm: false
        }),
        reject: false  // 不要在非零退出码时抛出错误
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
          confirm: true
        })
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
          confirm: true
        })
      });
      
      // 获取标签信息
      const { stdout } = await execa('git', ['tag', '-n', 'v1.0.1'], { cwd: testRepo.path });
      expect(stdout).toContain('Release 1.0.1');
    });
  });
});