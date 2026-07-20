// SQLite 数据库配置（使用 Node.js 内置 node:sqlite 模块）
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// 支持通过环境变量 DATABASE_PATH 指定数据库路径
// Railway 部署时挂载 Persistent Volume 到 /data，设 DATABASE_PATH=/data/flowsync.db
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'flowsync.db');

// 确保目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

console.log('[DB] 数据库路径:', DB_PATH);

module.exports = db;
