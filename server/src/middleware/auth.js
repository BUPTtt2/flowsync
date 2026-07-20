// JWT 认证中间件
const jwt = require('jsonwebtoken');

// 生产环境强制校验 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('[FATAL] 生产环境必须设置 JWT_SECRET 环境变量且长度 ≥ 32 字符');
  }
}
if (JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('[WARN] 正在使用默认 JWT_SECRET，仅限开发环境！');
}

// 验证 JWT Token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: true, message: '未提供认证令牌' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: true, message: '认证令牌格式错误' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: '令牌已过期，请重新登录' });
    }
    return res.status(401).json({ error: true, message: '无效的认证令牌' });
  }
}

// 生成 JWT Token
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = {
  authMiddleware,
  signToken
};
