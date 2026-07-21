// FlowSync 后端应用入口
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const db = require('./db');

// 路由引入
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const moduleRoutes = require('./routes/modules');
const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
const externalRoutes = require('./routes/external');
const energyRoutes = require('./routes/energy');
const demoRoutes = require('./routes/demo');
const feedbackRoutes = require('./routes/feedback');
const teamRoutes = require('./routes/teams');

// 启动时自动初始化数据库（执行 schema.sql）
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);
console.log('✅ 数据库初始化完成');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置：从环境变量读取白名单（逗号分隔），生产环境追加你的域名
// 设为 * 时允许任意来源（demo 阶段便于多域名访问，API Key 在服务端不暴露）
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173';
const corsOptions = corsOriginEnv.trim() === '*'
  ? { origin: true, credentials: true }
  : { origin: corsOriginEnv.split(',').map(s => s.trim()).filter(Boolean), credentials: true };
app.use(cors(corsOptions));

// 解析 JSON 请求体
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============ 简易速率限制 (内存实现) ============
// 登录接口：同一 IP + 账号 5 分钟内 5 次失败则锁定 15 分钟
// AI 生成接口：同一用户 1 分钟内 10 次
const rateLimit = {
  loginFails: {},      // key: ip:username -> { count, firstFail, lockUntil }
  generateCalls: {}    // key: userId -> [{time}, ...]
};

// 登录失败限流中间件
function loginRateLimit(req, res, next) {
  const key = (req.ip || 'unknown') + ':' + (req.body.username || 'anon');
  const now = Date.now();
  const record = rateLimit.loginFails[key];

  if (record && record.lockUntil && now < record.lockUntil) {
    const waitMin = Math.ceil((record.lockUntil - now) / 60000);
    return res.status(429).json({ error: true, message: '登录失败次数过多，请 ' + waitMin + ' 分钟后再试' });
  }

  // 清理过期记录
  if (record && record.lockUntil && now >= record.lockUntil) {
    delete rateLimit.loginFails[key];
  }

  res.on('finish', () => {
    if (res.statusCode === 401) {
      // 登录失败
      if (!rateLimit.loginFails[key] || now - rateLimit.loginFails[key].firstFail > 5 * 60 * 1000) {
        rateLimit.loginFails[key] = { count: 1, firstFail: now, lockUntil: 0 };
      } else {
        rateLimit.loginFails[key].count += 1;
        if (rateLimit.loginFails[key].count >= 5) {
          rateLimit.loginFails[key].lockUntil = now + 15 * 60 * 1000;
        }
      }
    } else if (res.statusCode === 200) {
      // 登录成功，清理
      delete rateLimit.loginFails[key];
    }
  });

  next();
}

// AI 生成限流中间件
function generateRateLimit(req, res, next) {
  const userId = req.user ? req.user.id : 'anon';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟
  const maxCalls = 10;

  if (!rateLimit.generateCalls[userId]) {
    rateLimit.generateCalls[userId] = [];
  }

  // 清理窗口外的记录
  rateLimit.generateCalls[userId] = rateLimit.generateCalls[userId].filter(t => now - t < windowMs);

  if (rateLimit.generateCalls[userId].length >= maxCalls) {
    return res.status(429).json({ error: true, message: '操作太频繁，请稍后再试' });
  }

  rateLimit.generateCalls[userId].push(now);
  next();
}

// 全局输入长度校验中间件（对主要字段做长度限制）
function validateInputLength(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object') return next();

  const limits = {
    text: 2000,           // AI 生成输入
    name: 200,            // 项目/模块名称
    title: 300,           // 任务标题
    description: 2000,    // 描述
    username: 50,         // 用户名
    email: 100,           // 邮箱
    password: 100         // 密码
  };

  for (const field of Object.keys(limits)) {
    if (body[field] !== undefined && typeof body[field] === 'string' && body[field].length > limits[field]) {
      return res.status(400).json({ error: true, message: field + ' 过长（最多 ' + limits[field] + ' 字符）' });
    }
  }

  next();
}

// 定期清理速率限制记录（每小时）
setInterval(() => {
  const now = Date.now();
  for (const k of Object.keys(rateLimit.loginFails)) {
    if (rateLimit.loginFails[k].lockUntil && now > rateLimit.loginFails[k].lockUntil + 3600000) {
      delete rateLimit.loginFails[k];
    }
  }
  for (const k of Object.keys(rateLimit.generateCalls)) {
    rateLimit.generateCalls[k] = rateLimit.generateCalls[k].filter(t => now - t < 60000);
    if (rateLimit.generateCalls[k].length === 0) delete rateLimit.generateCalls[k];
  }
}, 3600000).unref();

// 健康检查
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

// 全局输入长度校验
app.use(validateInputLength);

// 用户自定义 API key 中间件
// 解析请求头 X-API-Keys（JSON），存到 req.apiKeys 上下文，不写全局 process.env
app.use((req, res, next) => {
  const apiKeysHeader = req.headers['x-api-keys'];
  if (apiKeysHeader) {
    try {
      req.apiKeys = JSON.parse(apiKeysHeader);
    } catch(e) {
      req.apiKeys = null;
    }
  }
  next();
});

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api', moduleRoutes);
app.use('/api', taskRoutes);

// ============ 托管前端静态文件（Railway 部署时启用） ============
// 当环境变量 SERVE_STATIC=1 时，Express 同时服务前端 HTML
// 前端文件放在项目根目录的 flowsync/web/ 下
if (process.env.SERVE_STATIC === '1') {
  const webDir = path.join(__dirname, '..', '..', 'flowsync', 'web');
  if (fs.existsSync(webDir)) {
    app.use(express.static(webDir));
    // 根路径重定向到 app.html
    app.get('/', (req, res) => {
      res.sendFile(path.join(webDir, 'app.html'));
    });
    console.log('✅ 前端静态文件托管已启用:', webDir);
  } else {
    console.warn('⚠️  SERVE_STATIC=1 但找不到前端目录:', webDir);
  }
}

// 404 处理
app.use((req, res, next) => {
  // 如果是 API 请求返回 JSON，否则尝试返回 index
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: true, message: `路由不存在: ${req.method} ${req.path}` });
  } else {
    res.status(404).send('Page not found');
  }
});

// 统一错误处理中间件
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  // 生产环境不暴露内部错误细节
  const isProd = process.env.NODE_ENV === 'production';
  const message = (status < 500 || !isProd) ? (err.message || '服务器内部错误') : '服务器内部错误';
  res.status(status).json({
    error: true,
    message: message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ FlowSync 服务已启动: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
