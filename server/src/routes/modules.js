// 模块路由：添加、更新、删除、排序
// 注意：本路由使用绝对路径风格，挂载于 /api
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// POST /api/projects/:id/modules - 添加模块
router.post('/projects/:id/modules', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, estimated_time, is_collapsed } = req.body;

    if (!name) {
      return res.status(400).json({ error: true, message: '模块名称不能为空' });
    }

    // 验证项目归属
    const proj = db.prepare(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);
    if (!proj) {
      return res.status(404).json({ error: true, message: '项目不存在' });
    }

    // 获取下一个 sort_order
    const orderRow = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM modules WHERE project_id = ?'
    ).get(id);

    const result = db.prepare(
      `INSERT INTO modules (project_id, name, description, estimated_time, sort_order, is_collapsed)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, name, description || null, estimated_time || null, orderRow.next_order, is_collapsed ? 1 : 0);

    const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: mod });
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:id - 更新模块
router.put('/modules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'description', 'estimated_time', 'is_collapsed'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // 布尔值转 0/1
        if (key === 'is_collapsed' && typeof req.body[key] === 'boolean') {
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
      `UPDATE modules SET ${setClause}
       WHERE id = ?
       AND project_id IN (SELECT id FROM projects WHERE user_id = ?)`
    ).run(...values, id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '模块不存在' });
    }

    const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);

    res.json({ success: true, data: mod });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/modules/:id - 删除模块（级联删除任务）
router.delete('/modules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare(
      `DELETE FROM modules
       WHERE id = ?
       AND project_id IN (SELECT id FROM projects WHERE user_id = ?)`
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '模块不存在' });
    }

    res.json({ success: true, data: { id: parseInt(id), deleted: true } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:id/reorder - 拖拽排序
router.put('/modules/:id/reorder', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_order } = req.body;

    if (new_order === undefined) {
      return res.status(400).json({ error: true, message: 'new_order 不能为空' });
    }

    // 验证归属
    const mod = db.prepare(
      `SELECT id FROM modules WHERE id = ? AND project_id IN
       (SELECT id FROM projects WHERE user_id = ?)`
    ).get(id, req.user.id);
    if (!mod) {
      return res.status(404).json({ error: true, message: '模块不存在' });
    }

    db.prepare(
      'UPDATE modules SET sort_order = ? WHERE id = ?'
    ).run(new_order, id);

    res.json({ success: true, data: { id: parseInt(id), new_order } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
