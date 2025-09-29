#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PACKAGE_JSON = path.join(__dirname, '../package.json');

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return pkg.version;
}

function updateVersion(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
  
  // Also update frontend package.json if it exists
  const frontendPackageJson = path.join(__dirname, '../frontend/package.json');
  if (fs.existsSync(frontendPackageJson)) {
    const frontendPkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
    frontendPkg.version = newVersion;
    fs.writeFileSync(frontendPackageJson, JSON.stringify(frontendPkg, null, 2) + '\n');
  }
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Invalid version type. Use: major, minor, or patch');
  }
}

function run(command) {
  console.log(`🔄 执行: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    process.exit(1);
  }
}

function createRelease() {
  const args = process.argv.slice(2);
  const versionType = args[0];
  
  if (!versionType) {
    console.log('📋 用法: npm run release <major|minor|patch|version>');
    console.log('📋 示例: npm run release patch');
    console.log('📋 示例: npm run release 1.2.3');
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  console.log(`📦 当前版本: v${currentVersion}`);

  let newVersion;
  if (['major', 'minor', 'patch'].includes(versionType)) {
    newVersion = bumpVersion(currentVersion, versionType);
  } else {
    // 假设用户提供了具体版本号
    newVersion = versionType;
    if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
      console.error('❌ 版本格式无效。请使用 x.y.z 格式');
      process.exit(1);
    }
  }

  console.log(`🚀 新版本: v${newVersion}`);

  // 确认发布
  if (process.env.NODE_ENV !== 'test') {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`确定要发布版本 v${newVersion} 吗? (y/N): `, (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ 发布已取消');
        process.exit(0);
      }
      performRelease(newVersion);
    });
  } else {
    performRelease(newVersion);
  }
}

function performRelease(newVersion) {
  console.log('\n🔄 开始发布流程...\n');

  // 1. 检查工作区是否干净
  console.log('1️⃣ 检查工作区状态...');
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
  } catch {
    console.error('❌ 工作区有未提交的更改。请先提交或暂存更改。');
    process.exit(1);
  }

  // 2. 运行测试构建
  console.log('2️⃣ 运行测试构建...');
  run('npm run build');

  // 3. 更新版本
  console.log('3️⃣ 更新版本号...');
  updateVersion(newVersion);

  // 4. 提交更改
  console.log('4️⃣ 提交版本更改...');
  run('git add package.json frontend/package.json');
  run(`git commit -m "chore: bump version to v${newVersion}"`);

  // 5. 创建标签
  console.log('5️⃣ 创建版本标签...');
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

  // 6. 推送到远程
  console.log('6️⃣ 推送到远程仓库...');
  run('git push origin main');
  run(`git push origin v${newVersion}`);

  console.log('\n✅ 发布完成！');
  console.log(`🎉 版本 v${newVersion} 已成功发布`);
  console.log(`🔗 GitHub Actions 将自动构建并创建 release`);
  console.log(`📦 构建完成后，可在 GitHub Releases 页面下载安装包`);
}

if (require.main === module) {
  createRelease();
}

module.exports = { createRelease, bumpVersion, getCurrentVersion };
