// 认证路由：注册、登录、获取当前用户
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, signToken } = require('../middleware/auth');

const router = express.Router();

// 登录失败限流（内存实现）
const loginFails = {};
function loginRateLimit(req, res, next) {
  var key = (req.ip || 'unknown') + ':' + (req.body.username || 'anon');
  var now = Date.now();
  var record = loginFails[key];
  if (record && record.lockUntil && now < record.lockUntil) {
    var waitMin = Math.ceil((record.lockUntil - now) / 60000);
    return res.status(429).json({ error: true, message: '登录失败次数过多，请 ' + waitMin + ' 分钟后再试' });
  }
  if (record && record.lockUntil && now >= record.lockUntil) {
    delete loginFails[key];
  }
  res.on('finish', function() {
    if (res.statusCode === 401) {
      if (!loginFails[key] || now - loginFails[key].firstFail > 5 * 60 * 1000) {
        loginFails[key] = { count: 1, firstFail: now, lockUntil: 0 };
      } else {
        loginFails[key].count += 1;
        if (loginFails[key].count >= 5) {
          loginFails[key].lockUntil = now + 15 * 60 * 1000;
        }
      }
    } else if (res.statusCode === 200) {
      delete loginFails[key];
    }
  });
  next();
}

// 注册限流：同一 IP 每小时最多 3 次
const registerLimit = {};
const REGISTER_WINDOW = 60 * 60 * 1000;
const REGISTER_MAX = 3;
function registerRateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').toString().split(',')[0].trim();
  const now = Date.now();
  if (!registerLimit[ip]) registerLimit[ip] = [];
  registerLimit[ip] = registerLimit[ip].filter(t => now - t < REGISTER_WINDOW);
  if (registerLimit[ip].length >= REGISTER_MAX) {
    return res.status(429).json({ error: true, message: '注册过于频繁，请稍后再试' });
  }
  registerLimit[ip].push(now);
  next();
}

// POST /api/auth/register - 注册
router.post('/register', registerRateLimit, async (req, res, next) => {
  try {
    const { username, email, password, display_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: true, message: '用户名、邮箱、密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: true, message: '密码至少 6 位' });
    }

    // 检查用户名/邮箱是否已存在
    const existing = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email);
    if (existing) {
      return res.status(409).json({ error: true, message: '用户名或邮箱已被使用' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES (?, ?, ?, ?)`
    ).run(username, email, passwordHash, display_name || username);

    const user = db.prepare(
      'SELECT id, username, email, display_name, energy_level, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - 登录
router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: true, message: '用户名和密码不能为空' });
    }

    // 支持用户名或邮箱登录
    const user = db.prepare(
      `SELECT id, username, email, password_hash, display_name, energy_level
       FROM users WHERE username = ? OR email = ?`
    ).get(username, username);

    if (!user) {
      return res.status(401).json({ error: true, message: '用户名或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: true, message: '用户名或密码错误' });
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    delete user.password_hash;

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = db.prepare(
      `SELECT id, username, email, display_name, energy_level, created_at
       FROM users WHERE id = ?`
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: true, message: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
