// 提醒路由：查询、创建、标记已读、检查生成
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { checkAndGenerateReminders } = require('../services/reminderService');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// GET /api/reminders/check - 检查并生成即将到期的提醒
// 注意：必须在 /:id 路由之前定义，避免被当成 id
router.get('/check', async (req, res, next) => {
  try {
    const result = await checkAndGenerateReminders(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/reminders - 获取用户提醒列表
router.get('/', async (req, res, next) => {
  try {
    const { type, is_read, limit = 50 } = req.query;

    let sql = `SELECT r.*, p.name AS project_name
               FROM reminders r
               LEFT JOIN projects p ON r.project_id = p.id
               WHERE r.user_id = ?`;
    const params = [req.user.id];
    let idx = 1;

    if (type) {
      sql += ` AND r.type = ?`;
      params.push(type);
      idx++;
    }
    if (is_read !== undefined) {
      sql += ` AND r.is_read = ?`;
      params.push(is_read === 'true' ? 1 : 0);
      idx++;
    }

    sql += ` ORDER BY r.remind_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const rows = db.prepare(sql).all(...params);

    // 解析 metadata 字段
    for (const row of rows) {
      if (row.metadata && typeof row.metadata === 'string') {
        try { row.metadata = JSON.parse(row.metadata); } catch (e) {}
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/reminders - 创建提醒
router.post('/', async (req, res, next) => {
  try {
    const { project_id, task_id, type, title, message, remind_at, metadata } = req.body;

    if (!title || !remind_at) {
      return res.status(400).json({ error: true, message: 'title 和 remind_at 不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO reminders
       (user_id, project_id, task_id, type, title, message, remind_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.id, project_id || null, task_id || null,
      type || 'custom', title, message || null, remind_at,
      JSON.stringify(metadata || {})
    );

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid);

    if (reminder.metadata && typeof reminder.metadata === 'string') {
      try { reminder.metadata = JSON.parse(reminder.metadata); } catch (e) {}
    }

    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reminders/:id/read - 标记已读
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare(
      `UPDATE reminders SET is_read = 1
       WHERE id = ? AND user_id = ?`
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '提醒不存在' });
    }

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    if (reminder.metadata && typeof reminder.metadata === 'string') {
      try { reminder.metadata = JSON.parse(reminder.metadata); } catch (e) {}
    }

    res.json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reminders/read-all - 批量标记已读
router.put('/read-all', async (req, res, next) => {
  try {
    db.prepare(
      'UPDATE reminders SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    ).run(req.user.id);
    res.json({ success: true, data: { message: '所有提醒已标记为已读' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
