#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import * as semver from 'semver';

type ReleaseType = 'major' | 'minor' | 'patch';
type PrereleaseType = 'dev' | 'alpha' | 'beta' | 'rc';
type ReleaseChoice = 'production' | PrereleaseType | 'custom';

// 全局变量存储 dry-run 状态
let isDryRun = false;

// 执行命令并返回结果
function exec(command: string, silent: boolean = false): string {
  try {
    if (
      isDryRun &&
      (command.includes('git push') ||
        command.includes('git tag') ||
        command.includes('git commit'))
    ) {
      if (!silent) console.log(chalk.gray(`[DRY-RUN] 将执行: ${command}`));
      return '';
    }
    const result = execSync(command, { encoding: 'utf8' });
    if (!silent) console.log(result.trim());
    return result.trim();
  } catch (error) {
    if (!silent) {
      console.error(chalk.red(`❌ 命令执行失败: ${command}`));
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
    throw error;
  }
}

// 获取当前版本
function getCurrentVersion(): string {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  return packageJson.version;
}

// 检查并执行 npm 生命周期钩子
function executeNpmScript(scriptName: string, description: string): boolean {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    const scripts = packageJson.scripts || {};

    if (scripts[scriptName]) {
      console.log(chalk.cyan(`\n🔄 执行 ${description} 脚本: ${scriptName}...`));

      if (isDryRun) {
        console.log(chalk.gray(`[DRY-RUN] 将执行: npm run ${scriptName}`));
        return true;
      }

      try {
        const result = execSync(`npm run ${scriptName}`, { encoding: 'utf8' });
        console.log(result.trim());
        console.log(chalk.green(`✅ ${description} 脚本执行成功`));
        return true;
      } catch (error) {
        console.error(chalk.red(`❌ ${description} 脚本执行失败`));
        if (error instanceof Error) {
          console.error(error.message);
        }
        return false;
      }
    } else {
      console.log(chalk.gray(`ℹ️  未找到 ${scriptName} 脚本，跳过`));
      return true;
    }
  } catch (error) {
    console.error(chalk.red(`❌ ${description} 脚本执行失败`));
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

// 获取当前分支
function getCurrentBranch(): string {
  return exec('git branch --show-current', true);
}

// 检查工作区是否干净
function checkGitStatus(): boolean {
  const status = exec('git status --porcelain', true);
  if (status) {
    console.log(chalk.yellow('⚠️  工作区有未提交的更改:'));
    console.log(status);
    return false;
  }
  return true;
}

// 获取预发布类型和版本号
function getPrereleaseInfo(version: string): { type?: PrereleaseType; num?: number } {
  const prerelease = semver.prerelease(version);
  if (!prerelease || prerelease.length === 0) {
    return {};
  }

  const prereleaseType = prerelease[0] as string;
  const prereleaseNum = prerelease[1] as number;

  if (['dev', 'alpha', 'beta', 'rc'].includes(prereleaseType)) {
    return { type: prereleaseType as PrereleaseType, num: prereleaseNum };
  }

  return {};
}

// 计算下一个版本号
function getNextVersion(
  currentVersion: string,
  releaseType: ReleaseType,
  isPrerelease: boolean,
  prereleaseType: PrereleaseType | null
): string {
  // 验证当前版本号
  if (!semver.valid(currentVersion)) {
    throw new Error('无效的版本号格式');
  }

  const { type: currentPrereleaseType } = getPrereleaseInfo(currentVersion);

  // 如果当前是预发布版本
  if (currentPrereleaseType) {
    if (isPrerelease && prereleaseType) {
      if (prereleaseType === currentPrereleaseType) {
        // 相同类型: 递增预发布版本号
        return semver.inc(currentVersion, 'prerelease', prereleaseType) || currentVersion;
      } else {
        // 不同类型: 检查升级路径
        const prereleaseOrder: PrereleaseType[] = ['dev', 'alpha', 'beta', 'rc'];
        const currentIndex = prereleaseOrder.indexOf(currentPrereleaseType);
        const newIndex = prereleaseOrder.indexOf(prereleaseType);

        if (newIndex > currentIndex) {
          // 升级预发布类型 (dev -> alpha -> beta -> rc)
          const baseVersion = `${semver.major(currentVersion)}.${semver.minor(currentVersion)}.${semver.patch(currentVersion)}`;
          return `${baseVersion}-${prereleaseType}.0`;
        } else {
          console.log(
            chalk.yellow(
              `\n⚠️  警告: 从 ${currentPrereleaseType} 切换到 ${prereleaseType} 是降级操作`
            )
          );
          const baseVersion = `${semver.major(currentVersion)}.${semver.minor(currentVersion)}.${semver.patch(currentVersion)}`;
          return `${baseVersion}-${prereleaseType}.0`;
        }
      }
    } else {
      // 预发布 -> 正式版: 去掉预发布后缀
      return `${semver.major(currentVersion)}.${semver.minor(currentVersion)}.${semver.patch(currentVersion)}`;
    }
  } else {
    // 当前是正式版本
    let newVersion: string;

    if (isPrerelease && prereleaseType) {
      // 正式版 -> 预发布版: 先递增版本，然后添加预发布标识
      newVersion = semver.inc(currentVersion, releaseType) || currentVersion;
      return `${newVersion}-${prereleaseType}.0`;
    } else {
      // 正式版 -> 正式版: 直接递增
      return semver.inc(currentVersion, releaseType) || currentVersion;
    }
  }
}

function showHelp(): void {
  console.log(chalk.blue.bold('\n🔢 bump-version-js - 语义化版本管理工具\n'));

  console.log(chalk.white('用法:'));
  console.log(chalk.cyan('  bump-version-js [command] [options]'));
  console.log(chalk.cyan('  bvj [command] [options]\n'));

  console.log(chalk.white('命令:'));
  console.log(
    chalk.green('  validate <version>') + chalk.gray('  验证版本号是否符合语义化版本规范')
  );
  console.log(chalk.gray('  (无命令)') + chalk.gray('            交互式版本管理（默认）\n'));

  console.log(chalk.white('选项:'));
  console.log(chalk.green('  -h, --help') + chalk.gray('         显示帮助信息'));
  console.log(chalk.green('  -v, --version') + chalk.gray('      显示版本号'));
  console.log(chalk.green('  --dry-run') + chalk.gray('          预览操作但不实际执行\n'));

  console.log(chalk.white('功能说明:'));
  console.log(chalk.gray('  1. 版本管理（默认）：'));
  console.log(chalk.gray('     • 自动更新项目版本号（遵循语义化版本规范）'));
  console.log(chalk.gray('     • 创建 Git 提交和标签'));
  console.log(chalk.gray('     • 支持正式版本和预发布版本（dev/alpha/beta/rc）'));
  console.log(chalk.gray('     • 一键推送到远程仓库\n'));

  console.log(chalk.gray('  2. 版本验证：'));
  console.log(chalk.gray('     • 检查版本号格式是否正确'));
  console.log(chalk.gray('     • 显示版本号各组成部分'));
  console.log(chalk.gray('     • 识别预发布版本类型\n'));

  console.log(chalk.white('使用示例:'));
  console.log(chalk.gray('  # 交互式版本管理'));
  console.log(chalk.gray('  $ bump-version-js'));
  console.log(chalk.gray('  $ bvj\n'));

  console.log(chalk.gray('  # 验证版本号'));
  console.log(chalk.gray('  $ bump-version-js validate 1.0.0'));
  console.log(chalk.gray('  $ bvj validate 2.1.0-alpha.3\n'));

  console.log(chalk.white('更多信息:'));
  console.log(chalk.gray('  文档: https://github.com/ai-app-base/bump-version-js'));
  console.log(chalk.gray('  问题: https://github.com/ai-app-base/bump-version-js/issues\n'));
}

function showVersion(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJsonPath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  console.log(packageJson.version);
}

function validateVersion(version: string): boolean {
  // 检查版本号是否为有效的语义化版本
  if (!semver.valid(version)) {
    console.error(chalk.red(`❌ 版本号 "${version}" 不符合语义化版本规范`));
    console.error(chalk.yellow('\n语义化版本格式: MAJOR.MINOR.PATCH[-PRERELEASE]'));
    console.error(chalk.yellow('示例: 1.0.0, 2.1.3, 1.0.0-alpha.1, 2.0.0-beta.3'));
    return false;
  }

  // 解析版本号
  const parsed = semver.parse(version);
  if (!parsed) {
    console.error(chalk.red(`❌ 无法解析版本号 "${version}"`));
    return false;
  }

  // 显示版本号详情
  console.log(chalk.green(`✅ 版本号 "${version}" 符合语义化版本规范`));
  console.log(chalk.cyan('\n📊 版本号详情:'));
  console.log(chalk.white(`  主版本号 (Major): ${parsed.major}`));
  console.log(chalk.white(`  次版本号 (Minor): ${parsed.minor}`));
  console.log(chalk.white(`  修订号 (Patch): ${parsed.patch}`));

  // 如果有预发布版本信息
  if (parsed.prerelease.length > 0) {
    console.log(chalk.white(`  预发布版本: ${parsed.prerelease.join('.')}`));

    // 检查预发布类型
    const prereleaseType = parsed.prerelease[0];
    const supportedTypes = ['dev', 'alpha', 'beta', 'rc'];

    if (typeof prereleaseType === 'string' && supportedTypes.includes(prereleaseType)) {
      const typeDescriptions = {
        dev: '开发版本',
        alpha: '内部测试版本',
        beta: '公开测试版本',
        rc: '候选发布版本',
      };
      console.log(
        chalk.white(
          `  预发布类型: ${prereleaseType} (${typeDescriptions[prereleaseType as keyof typeof typeDescriptions]})`
        )
      );
    }
  }

  // 如果有构建元数据
  if (parsed.build.length > 0) {
    console.log(chalk.white(`  构建元数据: ${parsed.build.join('.')}`));
  }

  return true;
}

async function main(): Promise<void> {
  // 处理命令行参数
  const args = process.argv.slice(2);

  // 检查 dry-run 参数
  if (args.includes('--dry-run')) {
    isDryRun = true;
    // 从参数列表中移除 --dry-run
    const index = args.indexOf('--dry-run');
    args.splice(index, 1);
  }

  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    process.exit(0);
  }

  // 处理 validate 子命令
  if (args[0] === 'validate') {
    if (args.length < 2) {
      console.error(chalk.red('❌ 请提供要验证的版本号'));
      console.error(chalk.yellow('\n用法: bump-version-js validate <version>'));
      console.error(chalk.yellow('示例: bump-version-js validate 1.0.0'));
      process.exit(1);
    }

    const version = args[1];
    const isValid = validateVersion(version);
    process.exit(isValid ? 0 : 1);
  }

  // 默认执行版本管理功能
  console.log(chalk.blue.bold('\n🔢 版本号管理工具\n'));

  // 如果是 dry-run 模式，显示提示
  if (isDryRun) {
    console.log(chalk.yellow.bold('🧪 DRY-RUN 模式：仅预览操作，不会实际执行\n'));
  }

  // 检查当前状态
  const currentVersion = getCurrentVersion();
  const currentBranch = getCurrentBranch();

  console.log(chalk.cyan(`📦 当前版本: ${currentVersion}`));
  console.log(chalk.cyan(`🌿 当前分支: ${currentBranch}`));
  console.log();

  // 检查分支
  if (currentBranch !== 'main') {
    console.log(chalk.yellow('⚠️  警告: 不在 main 分支上'));
    const { proceed } = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: '确定要在非 main 分支上发布吗？',
      initial: false,
    });

    if (!proceed) {
      console.log(chalk.red('✖ 发布已取消'));
      process.exit(0);
    }
  }

  // 检查工作区
  const isDirty = !checkGitStatus();
  if (isDirty) {
    console.log(chalk.red('✖ 发布已取消：工作区有未提交的更改'));
    process.exit(0);
  }

  // 检查当前是否是预发布版本
  const { type: currentPrereleaseType } = getPrereleaseInfo(currentVersion);

  // 构建发布类型选项
  const releaseTypeChoices: prompts.Choice[] = [
    {
      title: '正式版本 (Production)',
      value: 'production',
      description: '稳定版本，供生产环境使用',
    },
  ];

  if (!currentPrereleaseType || currentPrereleaseType === 'dev') {
    releaseTypeChoices.push({
      title: 'Dev 版本',
      value: 'dev',
      description: '开发版本，用于开发过程中的版本管理',
    });
  }

  if (
    !currentPrereleaseType ||
    currentPrereleaseType === 'dev' ||
    currentPrereleaseType === 'alpha'
  ) {
    releaseTypeChoices.push({
      title: 'Alpha 版本',
      value: 'alpha',
      description: '内部测试版本，功能可能不完整',
    });
  }

  if (
    !currentPrereleaseType ||
    currentPrereleaseType === 'dev' ||
    currentPrereleaseType === 'alpha' ||
    currentPrereleaseType === 'beta'
  ) {
    releaseTypeChoices.push({
      title: 'Beta 版本',
      value: 'beta',
      description: '公开测试版本，功能基本完整',
    });
  }

  if (
    !currentPrereleaseType ||
    currentPrereleaseType === 'dev' ||
    currentPrereleaseType === 'alpha' ||
    currentPrereleaseType === 'beta' ||
    currentPrereleaseType === 'rc'
  ) {
    releaseTypeChoices.push({
      title: 'RC 版本',
      value: 'rc',
      description: '候选发布版本，即将成为正式版',
    });
  }

  // 添加自定义版本号选项
  releaseTypeChoices.push({
    title: '自定义版本号',
    value: 'custom',
    description: '手动输入版本号',
  });

  // 选择发布类型
  const { releaseTypeChoice } = (await prompts({
    type: 'select',
    name: 'releaseTypeChoice',
    message: '选择发布类型',
    choices: releaseTypeChoices,
    initial: 0,
  })) as { releaseTypeChoice: ReleaseChoice };

  if (!releaseTypeChoice) {
    console.log(chalk.red('✖ 发布已取消'));
    process.exit(0);
  }

  let newVersion: string;
  let tagName: string;

  // 处理自定义版本号
  if (releaseTypeChoice === 'custom') {
    const { customVersion } = await prompts({
      type: 'text',
      name: 'customVersion',
      message: '输入自定义版本号',
      initial: currentVersion,
      validate: (value: string) => {
        if (!semver.valid(value)) {
          return '版本号不符合语义化版本规范 (例如: 1.0.0, 2.1.0-alpha.1)';
        }
        return true;
      },
    });

    if (!customVersion) {
      console.log(chalk.red('✖ 发布已取消'));
      process.exit(0);
    }

    newVersion = customVersion;
    tagName = `v${newVersion}`;
  } else {
    const isPrerelease = releaseTypeChoice !== 'production';
    const prereleaseType = isPrerelease ? (releaseTypeChoice as PrereleaseType) : null;

    // 选择版本号类型
    let versionBump: ReleaseType = 'patch';

    if (currentPrereleaseType) {
      // 当前是预发布版本
      if (isPrerelease && prereleaseType === currentPrereleaseType) {
        console.log(chalk.yellow(`\n当前是 ${currentPrereleaseType} 版本，将自动递增版本号`));
      } else if (isPrerelease) {
        const prereleaseNames = { dev: 'Dev', alpha: 'Alpha', beta: 'Beta', rc: 'RC' };
        console.log(
          chalk.yellow(
            `\n当前是 ${prereleaseNames[currentPrereleaseType]} 版本，将切换到 ${prereleaseNames[prereleaseType!]} 版本`
          )
        );
      } else {
        console.log(chalk.yellow(`\n当前是 ${currentPrereleaseType} 版本，将发布为正式版本`));
      }
    } else if (isPrerelease || releaseTypeChoice === 'production') {
      // 需要选择版本递增类型
      const [major, minor, patch] = currentVersion.split('.').map(Number);

      const prereleaseSuffix = isPrerelease ? `-${prereleaseType}.0` : '';

      const { selectedVersionBump } = (await prompts({
        type: 'select',
        name: 'selectedVersionBump',
        message: '选择版本号迭代类型',
        choices: [
          {
            title: 'Patch (修订号)',
            value: 'patch',
            description: `错误修复 (${currentVersion} → ${major}.${minor}.${patch + 1}${prereleaseSuffix})`,
          },
          {
            title: 'Minor (次版本号)',
            value: 'minor',
            description: `新功能，向后兼容 (${currentVersion} → ${major}.${minor + 1}.0${prereleaseSuffix})`,
          },
          {
            title: 'Major (主版本号)',
            value: 'major',
            description: `重大更新，可能不兼容 (${currentVersion} → ${major + 1}.0.0${prereleaseSuffix})`,
          },
        ],
        initial: 0,
      })) as { selectedVersionBump: ReleaseType };

      if (!selectedVersionBump) {
        console.log(chalk.red('✖ 发布已取消'));
        process.exit(0);
      }

      versionBump = selectedVersionBump;
    }

    // 计算新版本号
    newVersion = getNextVersion(currentVersion, versionBump, isPrerelease, prereleaseType);
    tagName = `v${newVersion}`;
  }

  // 显示执行计划
  console.log(chalk.blue.bold('\n📋 执行计划:\n'));
  console.log(chalk.white(`  当前版本: ${currentVersion} → 新版本: ${newVersion}`));
  console.log(chalk.white(`  标签名称: ${tagName}`));

  let releaseTypeName = '正式版本';
  if (releaseTypeChoice === 'custom') {
    releaseTypeName = '自定义版本';
  } else if (releaseTypeChoice !== 'production') {
    const prereleaseNames = {
      dev: 'Dev (开发版本)',
      alpha: 'Alpha (内部测试)',
      beta: 'Beta (公开测试)',
      rc: 'RC (候选发布)',
    };
    releaseTypeName = prereleaseNames[releaseTypeChoice as PrereleaseType];
  }
  console.log(chalk.white(`  发布类型: ${releaseTypeName}`));

  console.log(chalk.blue.bold('\n📝 执行步骤:\n'));

  // 检查目标项目的 npm scripts
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const scripts = packageJson.scripts || {};

  const steps = [];

  // 根据项目配置动态生成步骤
  if (scripts.preversion) {
    steps.push('执行 preversion 脚本 (版本更新前检查)');
  }

  steps.push(`更新版本号到 ${newVersion}`);

  if (scripts.version) {
    steps.push('执行 version 脚本 (版本更新后处理)');
  }

  steps.push(`提交版本更新 (commit message: "chore: release ${newVersion}")`);
  steps.push(`创建 Git 标签 ${tagName}`);

  if (scripts.postversion) {
    steps.push('执行 postversion 脚本 (版本更新完成后)');
  }

  steps.push('推送提交和标签到远程仓库 (git push --follow-tags)');
  steps.push('如果配置了 CI/CD，将自动执行后续流程');

  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });

  console.log(chalk.gray('\n  提交信息预览: "chore: release ' + newVersion + '"'));

  // 确认执行
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '确认执行以上步骤？',
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.red('✖ 发布已取消'));
    process.exit(0);
  }

  // 执行版本更新流程
  console.log(chalk.green.bold('\n🏃 开始执行版本更新...\n'));

  try {
    // 1. 执行 preversion 钩子
    const preversionSuccess = executeNpmScript('preversion', 'preversion (版本更新前)');
    if (!preversionSuccess) {
      console.log(chalk.red('✖ preversion 脚本执行失败，版本更新已取消'));
      process.exit(1);
    }

    // 2. 更新版本号
    console.log(chalk.cyan(`📦 更新版本号到 ${newVersion}...`));

    // 备份当前版本号以便回滚
    const originalPackageJsonContent = readFileSync('./package.json', 'utf8');
    let originalPackageLockContent: string | null = null;
    try {
      originalPackageLockContent = readFileSync('./package-lock.json', 'utf8');
    } catch {
      // package-lock.json 可能不存在
    }

    // 手动更新 package.json 以保留构建元数据
    const packageJson = JSON.parse(originalPackageJsonContent);
    packageJson.version = newVersion;

    if (isDryRun) {
      console.log(chalk.gray('[DRY-RUN] 将更新 package.json 中的版本号'));
    } else {
      // 写回文件，保持原有格式
      const fs = await import('fs/promises');
      await fs.writeFile('./package.json', JSON.stringify(packageJson, null, 2) + '\n');
    }

    // 如果存在 package-lock.json，也更新它
    if (originalPackageLockContent) {
      try {
        const packageLock = JSON.parse(originalPackageLockContent);
        packageLock.version = newVersion;
        if (packageLock.packages && packageLock.packages['']) {
          packageLock.packages[''].version = newVersion;
        }
        if (isDryRun) {
          console.log(chalk.gray('[DRY-RUN] 将更新 package-lock.json 中的版本号'));
        } else {
          const fs = await import('fs/promises');
          await fs.writeFile('./package-lock.json', JSON.stringify(packageLock, null, 2) + '\n');
        }
      } catch {
        // 解析失败，忽略
      }
    }

    // 3. 执行 version 钩子
    const versionSuccess = executeNpmScript('version', 'version (版本更新后)');
    if (!versionSuccess) {
      // 回滚版本号更改
      if (!isDryRun) {
        const fs = await import('fs/promises');
        await fs.writeFile('./package.json', originalPackageJsonContent);
        if (originalPackageLockContent) {
          await fs.writeFile('./package-lock.json', originalPackageLockContent);
        }
      }
      console.log(chalk.red('✖ version 脚本执行失败，版本更新已取消'));
      process.exit(1);
    }

    // 4. 提交更改
    console.log(chalk.cyan('\n💾 提交版本更新...'));
    exec('git add package.json');
    // 如果存在 package-lock.json，也添加它
    try {
      exec('git add package-lock.json', true);
    } catch {
      // package-lock.json 可能不存在，忽略错误
    }
    exec(`git commit -m "chore: release ${newVersion} [skip ci]"`);

    // 5. 创建标签
    console.log(chalk.cyan(`\n🏷️  创建标签 ${tagName}...`));
    exec(`git tag -a ${tagName} -m "Release ${newVersion}"`);

    // 6. 执行 postversion 钩子
    const postversionSuccess = executeNpmScript('postversion', 'postversion (版本更新完成后)');
    if (!postversionSuccess) {
      console.log(chalk.yellow('⚠️  postversion 脚本执行失败，但版本更新已完成'));
    }

    // 7. 推送提交和标签 (除非在测试环境中)
    if (!process.env.BUMP_VERSION_SKIP_PUSH) {
      console.log(chalk.cyan('\n📤 推送提交和标签到远程仓库...'));
      exec('git push --follow-tags');
    }

    console.log(chalk.green.bold('\n✅ 版本更新成功！\n'));
    console.log(chalk.white(`版本 ${newVersion} 已创建并推送到远程仓库`));
  } catch (error) {
    console.error(chalk.red('\n❌ 版本更新过程中出现错误'));
    console.error(error);
    process.exit(1);
  }
}

// 处理 Ctrl+C
prompts.override(process.argv);

// 支持通过环境变量设置默认值（用于测试）
if (process.env.BUMP_VERSION_DEFAULTS) {
  const defaults = JSON.parse(process.env.BUMP_VERSION_DEFAULTS);
  prompts.override(defaults);
}

// 处理未捕获的错误
process.on('unhandledRejection', error => {
  console.error(chalk.red('未处理的错误:'), error);
  process.exit(1);
});

// 导出函数以便测试
export {
  exec,
  getCurrentVersion,
  getCurrentBranch,
  checkGitStatus,
  getNextVersion,
  validateVersion,
  executeNpmScript,
};

// 仅在直接运行时执行 main 函数
main().catch(console.error);
