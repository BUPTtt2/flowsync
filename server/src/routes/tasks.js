// 任务路由：添加、更新、删除、切换完成状态
// 注意：本路由使用绝对路径风格，挂载于 /api
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// POST /api/modules/:id/tasks - 添加任务到指定模块
router.post('/modules/:id/tasks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, estimated_time, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: true, message: '任务标题不能为空' });
    }

    // 验证模块归属
    const mod = db.prepare(
      `SELECT id FROM modules WHERE id = ?
       AND project_id IN (SELECT id FROM projects WHERE user_id = ?)`
    ).get(id, req.user.id);
    if (!mod) {
      return res.status(404).json({ error: true, message: '模块不存在' });
    }

    // 获取下一个 sort_order
    const orderRow = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM tasks WHERE module_id = ?'
    ).get(id);

    const result = db.prepare(
      `INSERT INTO tasks (module_id, title, description, sort_order, estimated_time, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, title, description || null, orderRow.next_order, estimated_time || null, due_date || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id - 更新任务
router.put('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'description', 'estimated_time', 'due_date', 'sort_order', 'is_completed'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // 布尔值转 0/1
        if (key === 'is_completed' && typeof req.body[key] === 'boolean') {
          updates[key] = req.body[key] ? 1 : 0;
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: '没有要更新的字段' });
    }

    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(updates);

    const result = db.prepare(
      `UPDATE tasks SET ${setClause}
       WHERE id = ?
       AND module_id IN (
         SELECT m.id FROM modules m
         JOIN projects p ON m.project_id = p.id
         WHERE p.user_id = ?
       )`
    ).run(...values, id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '任务不存在' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id - 删除任务
router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare(
      `DELETE FROM tasks
       WHERE id = ?
       AND module_id IN (
         SELECT m.id FROM modules m
         JOIN projects p ON m.project_id = p.id
         WHERE p.user_id = ?
       )`
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '任务不存在' });
    }

    res.json({ success: true, data: { id: parseInt(id), deleted: true } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id/toggle - 切换完成状态
router.put('/tasks/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare(
      `UPDATE tasks SET is_completed = 1 - is_completed
       WHERE id = ?
       AND module_id IN (
         SELECT m.id FROM modules m
         JOIN projects p ON m.project_id = p.id
         WHERE p.user_id = ?
       )`
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '任务不存在' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
