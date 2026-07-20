// 数据库初始化脚本：执行 schema.sql
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

console.log('🚀 开始初始化数据库...');

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf-8');

try {
  db.exec(sql);
  console.log('✅ 数据库 schema 执行成功');
} catch (err) {
  console.error('❌ schema 执行失败:', err.message);
  process.exit(1);
}
