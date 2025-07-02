#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';

type ReleaseType = 'major' | 'minor' | 'patch';
type PrereleaseType = 'alpha' | 'beta' | 'rc';
type ReleaseChoice = 'production' | PrereleaseType;

interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  prereleaseType?: PrereleaseType;
  prereleaseNum?: number;
}

// 执行命令并返回结果
function exec(command: string, silent: boolean = false): string {
  try {
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

// 解析版本号
function parseVersion(version: string): VersionParts | null {
  const versionMatch = version.match(/^(\d+)\.(\d+)\.(\d+)(-((alpha|beta|rc)\.(\d+)))?$/);
  if (!versionMatch) {
    return null;
  }

  const [, major, minor, patch, , , prereleaseType, prereleaseNum] = versionMatch;
  
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch),
    prereleaseType: prereleaseType as PrereleaseType | undefined,
    prereleaseNum: prereleaseNum ? parseInt(prereleaseNum) : undefined
  };
}

// 计算下一个版本号
function getNextVersion(
  currentVersion: string, 
  releaseType: ReleaseType, 
  isPrerelease: boolean, 
  prereleaseType: PrereleaseType | null
): string {
  const versionParts = parseVersion(currentVersion);
  if (!versionParts) {
    throw new Error('无效的版本号格式');
  }

  const { major, minor, patch, prereleaseType: currentPrereleaseType, prereleaseNum } = versionParts;
  let newVersion: string;

  // 如果当前是预发布版本
  if (currentPrereleaseType) {
    if (isPrerelease && prereleaseType) {
      if (prereleaseType === currentPrereleaseType) {
        // 相同类型: 递增版本号
        newVersion = `${major}.${minor}.${patch}-${currentPrereleaseType}.${(prereleaseNum || 0) + 1}`;
      } else {
        // 不同类型: 检查升级路径
        const prereleaseOrder: PrereleaseType[] = ['alpha', 'beta', 'rc'];
        const currentIndex = prereleaseOrder.indexOf(currentPrereleaseType);
        const newIndex = prereleaseOrder.indexOf(prereleaseType);
        
        if (newIndex > currentIndex) {
          // 升级预发布类型 (alpha -> beta -> rc)
          newVersion = `${major}.${minor}.${patch}-${prereleaseType}.0`;
        } else {
          console.log(chalk.yellow(`\n⚠️  警告: 从 ${currentPrereleaseType} 切换到 ${prereleaseType} 是降级操作`));
          newVersion = `${major}.${minor}.${patch}-${prereleaseType}.0`;
        }
      }
    } else {
      // 预发布 -> 正式版: 去掉预发布后缀
      newVersion = `${major}.${minor}.${patch}`;
    }
  } else {
    // 当前是正式版本
    let newMajor = major;
    let newMinor = minor;
    let newPatch = patch;

    switch (releaseType) {
      case 'major':
        newMajor = major + 1;
        newMinor = 0;
        newPatch = 0;
        break;
      case 'minor':
        newMinor = minor + 1;
        newPatch = 0;
        break;
      case 'patch':
        newPatch = patch + 1;
        break;
    }

    newVersion = `${newMajor}.${newMinor}.${newPatch}`;

    if (isPrerelease && prereleaseType) {
      newVersion += `-${prereleaseType}.0`;
    }
  }

  return newVersion;
}

async function main(): Promise<void> {
  console.log(chalk.blue.bold('\n🔢 版本号管理工具\n'));

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
      initial: false
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
  const versionParts = parseVersion(currentVersion);
  const currentPrereleaseType = versionParts?.prereleaseType;

  // 构建发布类型选项
  const releaseTypeChoices: prompts.Choice[] = [
    { title: '正式版本 (Production)', value: 'production', description: '稳定版本，供生产环境使用' }
  ];

  if (!currentPrereleaseType || currentPrereleaseType === 'alpha') {
    releaseTypeChoices.push({ 
      title: 'Alpha 版本', 
      value: 'alpha', 
      description: '内部测试版本，功能可能不完整' 
    });
  }
  
  if (!currentPrereleaseType || currentPrereleaseType === 'alpha' || currentPrereleaseType === 'beta') {
    releaseTypeChoices.push({ 
      title: 'Beta 版本', 
      value: 'beta', 
      description: '公开测试版本，功能基本完整' 
    });
  }
  
  if (!currentPrereleaseType || currentPrereleaseType === 'alpha' || currentPrereleaseType === 'beta' || currentPrereleaseType === 'rc') {
    releaseTypeChoices.push({ 
      title: 'RC 版本', 
      value: 'rc', 
      description: '候选发布版本，即将成为正式版' 
    });
  }

  // 选择发布类型
  const { releaseTypeChoice } = await prompts({
    type: 'select',
    name: 'releaseTypeChoice',
    message: '选择发布类型',
    choices: releaseTypeChoices,
    initial: 0
  }) as { releaseTypeChoice: ReleaseChoice };

  if (!releaseTypeChoice) {
    console.log(chalk.red('✖ 发布已取消'));
    process.exit(0);
  }

  const isPrerelease = releaseTypeChoice !== 'production';
  const prereleaseType = isPrerelease ? releaseTypeChoice as PrereleaseType : null;

  // 选择版本号类型
  let versionBump: ReleaseType = 'patch';
  
  if (currentPrereleaseType) {
    // 当前是预发布版本
    if (isPrerelease && prereleaseType === currentPrereleaseType) {
      console.log(chalk.yellow(`\n当前是 ${currentPrereleaseType} 版本，将自动递增版本号`));
    } else if (isPrerelease) {
      const prereleaseNames = { alpha: 'Alpha', beta: 'Beta', rc: 'RC' };
      console.log(chalk.yellow(`\n当前是 ${prereleaseNames[currentPrereleaseType]} 版本，将切换到 ${prereleaseNames[prereleaseType!]} 版本`));
    } else {
      console.log(chalk.yellow(`\n当前是 ${currentPrereleaseType} 版本，将发布为正式版本`));
    }
  } else if (isPrerelease || releaseTypeChoice === 'production') {
    // 需要选择版本递增类型
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    const prereleaseSuffix = isPrerelease ? `-${prereleaseType}.0` : '';
    
    const { selectedVersionBump } = await prompts({
      type: 'select',
      name: 'selectedVersionBump',
      message: '选择版本号迭代类型',
      choices: [
        { 
          title: 'Patch (修订号)', 
          value: 'patch', 
          description: `错误修复 (${currentVersion} → ${major}.${minor}.${patch + 1}${prereleaseSuffix})` 
        },
        { 
          title: 'Minor (次版本号)', 
          value: 'minor', 
          description: `新功能，向后兼容 (${currentVersion} → ${major}.${minor + 1}.0${prereleaseSuffix})` 
        },
        { 
          title: 'Major (主版本号)', 
          value: 'major', 
          description: `重大更新，可能不兼容 (${currentVersion} → ${major + 1}.0.0${prereleaseSuffix})` 
        }
      ],
      initial: 0
    }) as { selectedVersionBump: ReleaseType };

    if (!selectedVersionBump) {
      console.log(chalk.red('✖ 发布已取消'));
      process.exit(0);
    }

    versionBump = selectedVersionBump;
  }

  // 计算新版本号
  const newVersion = getNextVersion(currentVersion, versionBump, isPrerelease, prereleaseType);
  const tagName = `v${newVersion}`;

  // 显示执行计划
  console.log(chalk.blue.bold('\n📋 执行计划:\n'));
  console.log(chalk.white(`  当前版本: ${currentVersion} → 新版本: ${newVersion}`));
  console.log(chalk.white(`  标签名称: ${tagName}`));
  
  let releaseTypeName = '正式版本';
  if (isPrerelease) {
    const prereleaseNames = { 
      alpha: 'Alpha (内部测试)', 
      beta: 'Beta (公开测试)', 
      rc: 'RC (候选发布)' 
    };
    releaseTypeName = prereleaseNames[prereleaseType!];
  }
  console.log(chalk.white(`  发布类型: ${releaseTypeName}`));
  
  console.log(chalk.blue.bold('\n📝 执行步骤:\n'));
  const steps = [
    `更新版本号到 ${newVersion}`,
    `提交版本更新 (commit message: "chore: release ${newVersion}")`,
    `创建 Git 标签 ${tagName}`,
    '推送提交和标签到远程仓库 (git push --follow-tags)',
    '如果配置了 CI/CD，将自动执行后续流程'
  ];

  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });
  
  console.log(chalk.gray('\n  提交信息预览: "chore: release ' + newVersion + '"'));

  // 确认执行
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '确认执行以上步骤？',
    initial: true
  });

  if (!confirm) {
    console.log(chalk.red('✖ 发布已取消'));
    process.exit(0);
  }

  // 执行版本更新流程
  console.log(chalk.green.bold('\n🏃 开始执行版本更新...\n'));

  try {
    // 1. 更新版本号
    console.log(chalk.cyan(`📦 更新版本号到 ${newVersion}...`));
    exec(`npm version ${newVersion} --no-git-tag-version`);

    // 2. 提交更改
    console.log(chalk.cyan('\n💾 提交版本更新...'));
    exec('git add package.json');
    // 如果存在 package-lock.json，也添加它
    try {
      exec('git add package-lock.json', true);
    } catch {
      // package-lock.json 可能不存在，忽略错误
    }
    exec(`git commit -m "chore: release ${newVersion}"`);

    // 3. 创建标签
    console.log(chalk.cyan(`\n🏷️  创建标签 ${tagName}...`));
    exec(`git tag -a ${tagName} -m "Release ${newVersion}"`);

    // 4. 推送提交和标签 (除非在测试环境中)
    if (!process.env.BUMP_VERSION_SKIP_PUSH) {
      console.log(chalk.cyan('\n📤 推送提交和标签到远程仓库...'));
      exec('git push --follow-tags');
    }

    console.log(chalk.green.bold('\n✅ 版本更新成功！\n'));
    console.log(chalk.white(`版本 ${newVersion} 已创建并推送到远程仓库`));
    console.log(chalk.white('如果配置了 CI/CD，将自动执行后续流程...'));
    
    // 显示部署后的访问地址
    const workerName = newVersion.replace(/\./g, '-').replace(/-(alpha|beta|rc)-/, '-$1');
    console.log(chalk.blue.bold('\n🌐 部署后访问地址:'));
    console.log(chalk.white(`  https://website-${workerName}.<your-subdomain>.workers.dev`));
    
    console.log(chalk.blue.bold('\n🔗 相关链接:'));
    console.log(chalk.white('  GitHub Actions: 查看部署进度'));
    console.log(chalk.white('  Cloudflare Dashboard: 管理 Workers'));
    
    console.log(chalk.yellow.bold('\n📌 下一步:'));
    console.log(chalk.white('  1. 等待 GitHub Actions 部署完成'));
    console.log(chalk.white('  2. 访问部署的 Worker URL 进行验证'));
    console.log(chalk.white('  3. 更新域名指向新版本 Worker'));

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
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('未处理的错误:'), error);
  process.exit(1);
});

// 导出函数以便测试
export { exec, getCurrentVersion, getCurrentBranch, checkGitStatus, getNextVersion, parseVersion };

// 仅在直接运行时执行 main 函数
main().catch(console.error);