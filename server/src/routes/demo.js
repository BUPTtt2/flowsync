// Demo 路由：免登录体验 AI 生成，带 IP 限流防滥用
const express = require('express');
const router = express.Router();
const { generateProject } = require('../services/aiEngine');

// 简易 IP 限流：同一 IP 每分钟最多 3 次，每小时最多 10 次
const demoLimit = {};
const WINDOW_MIN = 60 * 1000;
const WINDOW_HOUR = 60 * 60 * 1000;
const MAX_PER_MIN = 3;
const MAX_PER_HOUR = 10;

function demoRateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').toString().split(',')[0].trim();
  const now = Date.now();
  if (!demoLimit[ip]) demoLimit[ip] = { min: [], hour: [] };
  const rec = demoLimit[ip];
  rec.min = rec.min.filter(t => now - t < WINDOW_MIN);
  rec.hour = rec.hour.filter(t => now - t < WINDOW_HOUR);
  if (rec.min.length >= MAX_PER_MIN) {
    return res.status(429).json({ error: true, message: '操作太快了，请 1 分钟后再试' });
  }
  if (rec.hour.length >= MAX_PER_HOUR) {
    return res.status(429).json({ error: true, message: '本小时体验次数已达上限，请稍后再来' });
  }
  rec.min.push(now);
  rec.hour.push(now);
  next();
}

// POST /api/demo/generate
// body: { name: "我要养一只猫" }
// 返回: { success, data: { name, modules: [...] } }
router.post('/generate', demoRateLimit, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: true, message: '请输入你想做的事' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: true, message: '输入过长，请精简到 100 字以内' });
    }

    console.log('[Demo] 收到生成请求:', name);
    const result = await generateProject({ name: name.trim() });

    if (!result || !result.modules || result.modules.length === 0) {
      return res.status(500).json({ error: true, message: 'AI 暂时无法生成，请换个说法试试' });
    }

    res.json({
      success: true,
      data: {
        name: name.trim(),
        modules: result.modules
      }
    });
  } catch (err) {
    console.error('[Demo] 生成失败:', err.message);
    res.status(500).json({ error: true, message: '生成失败：' + (err.message || '未知错误') });
  }
});

module.exports = router;
