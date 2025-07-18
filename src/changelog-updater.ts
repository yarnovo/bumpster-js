#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getVersion(projectPath: string): Promise<string> {
  const packagePath = path.join(projectPath, 'package.json');
  const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  return packageData.version;
}

export async function updateChangelog(
  projectPath: string,
  version?: string,
  dryRun = false
): Promise<void> {
  const changelogPath = path.join(projectPath, 'CHANGELOG.md');

  try {
    await fs.access(changelogPath);
  } catch {
    if (!dryRun) {
      console.log('📝 未找到 CHANGELOG.md 文件，跳过更新');
    }
    return;
  }

  const content = await fs.readFile(changelogPath, 'utf8');

  const currentVersion = version || (await getVersion(projectPath));
  const date = getCurrentDate();

  const unreleasedPattern = /## \[Unreleased\]\s*\n/;

  if (content.match(unreleasedPattern)) {
    const newVersionHeader = `## [Unreleased]\n\n## [${currentVersion}] - ${date}\n`;
    const updatedContent = content.replace(unreleasedPattern, newVersionHeader);

    if (dryRun) {
      console.log(`📝 [DRY-RUN] 将更新 CHANGELOG.md: [${currentVersion}] - ${date}`);
    } else {
      await fs.writeFile(changelogPath, updatedContent, 'utf8');
      console.log(`📝 CHANGELOG.md 已更新: [${currentVersion}] - ${date}`);
    }
  } else {
    if (!dryRun) {
      console.log('⚠️  未找到 [Unreleased] 部分，跳过更新');
    }
  }
}

export async function checkChangelogExists(projectPath: string): Promise<boolean> {
  const changelogPath = path.join(projectPath, 'CHANGELOG.md');
  try {
    await fs.access(changelogPath);
    return true;
  } catch {
    return false;
  }
}

export async function hasUnreleasedSection(projectPath: string): Promise<boolean> {
  const changelogPath = path.join(projectPath, 'CHANGELOG.md');
  try {
    const content = await fs.readFile(changelogPath, 'utf8');
    return /## \[Unreleased\]\s*\n/.test(content);
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  try {
    const projectPath = process.cwd();
    await updateChangelog(projectPath);
  } catch (error) {
    console.error('❌ 更新 CHANGELOG 失败:', (error as Error).message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
