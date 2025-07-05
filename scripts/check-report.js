#!/usr/bin/env node

import { spawn } from 'child_process';

// 执行 npm run check (组合命令：lint, typecheck, test)
const check = spawn('npm', ['run', 'check'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// 直接输出标准输出
check.stdout.on('data', (data) => {
  process.stdout.write(data);
});

// 直接输出标准错误
check.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// 处理进程退出
check.on('close', (code) => {
  if (code === 0) {
    // 没有错误，正常退出
    process.exit(0);
  } else {
    // check 发现错误，返回退出码 2
    // 这样 Claude Code 会看到错误信息并继续对话
    console.error('\n=== Check 错误需要修复 ===');
    console.error('Claude Code 将帮助修复以下 check 错误：');
    console.error(`原始退出码: ${code}\n`);
    process.exit(2);
  }
});

// 处理错误事件
check.on('error', (err) => {
  console.error('执行 npm run check 时发生错误:', err);
  process.exit(2);
});