// 能量打卡路由：记录能量、查询历史
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// POST /api/energy - 记录能量
router.post('/', async (req, res, next) => {
  try {
    const { level, mood, note } = req.body;

    if (level === undefined || level === null) {
      return res.status(400).json({ error: true, message: 'level 不能为空' });
    }

    const energyLevel = parseInt(level);
    if (isNaN(energyLevel) || energyLevel < 0 || energyLevel > 100) {
      return res.status(400).json({ error: true, message: 'level 必须是 0-100 之间的整数' });
    }

    // 根据数值自动判断 mood（如果未提供）
    let moodValue = mood;
    if (!moodValue) {
      if (energyLevel >= 80) moodValue = 'full';
      else if (energyLevel >= 60) moodValue = 'ok';
      else if (energyLevel >= 30) moodValue = 'mid';
      else moodValue = 'low';
    }

    const result = db.prepare(
      `INSERT INTO energy_logs (user_id, level, mood, note)
       VALUES (?, ?, ?, ?)`
    ).run(req.user.id, energyLevel, moodValue, note || null);

    const log = db.prepare('SELECT * FROM energy_logs WHERE id = ?').get(result.lastInsertRowid);

    // 同步更新用户的 energy_level
    db.prepare(
      'UPDATE users SET energy_level = ? WHERE id = ?'
    ).run(energyLevel, req.user.id);

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// GET /api/energy/history - 历史记录
router.get('/history', async (req, res, next) => {
  try {
    const { days = 30, limit = 100 } = req.query;

    const logs = db.prepare(
      `SELECT * FROM energy_logs
       WHERE user_id = ?
         AND logged_at >= datetime('now', ? || ' days')
       ORDER BY logged_at DESC
       LIMIT ?`
    ).all(req.user.id, `-${parseInt(days)}`, parseInt(limit));

    // 计算统计信息
    let avgLevel = 0;
    if (logs.length > 0) {
      avgLevel = Math.round(logs.reduce((sum, l) => sum + l.level, 0) / logs.length);
    }

    const moodCount = {};
    for (const log of logs) {
      moodCount[log.mood] = (moodCount[log.mood] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        logs,
        stats: {
          count: logs.length,
          avg_level: avgLevel,
          mood_distribution: moodCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/energy/latest - 获取最新一条记录
router.get('/latest', async (req, res, next) => {
  try {
    const latest = db.prepare(
      'SELECT * FROM energy_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
    ).get(req.user.id);

    const user = db.prepare(
      'SELECT energy_level FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({
      success: true,
      data: {
        latest: latest || null,
        current_level: user ? user.energy_level : null
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
