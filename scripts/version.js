#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PACKAGE_JSON = path.join(__dirname, '../package.json');
const FRONTEND_PACKAGE_JSON = path.join(__dirname, '../frontend/package.json');

function getVersion(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return pkg.version;
}

function checkVersions() {
  const rootVersion = getVersion(PACKAGE_JSON);
  const frontendVersion = getVersion(FRONTEND_PACKAGE_JSON);

  console.log('📦 版本信息:');
  console.log(`   根目录: ${rootVersion || '未找到'}`);
  console.log(`   前端:   ${frontendVersion || '未找到'}`);

  if (rootVersion && frontendVersion && rootVersion !== frontendVersion) {
    console.log('⚠️  版本不匹配！');
    process.exit(1);
  } else {
    console.log('✅ 版本一致');
  }
}

if (require.main === module) {
  checkVersions();
}
