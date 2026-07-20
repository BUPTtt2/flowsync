// 项目路由：CRUD + AI 生成
const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const aiEngine = require('../services/aiEngine');
const { generateDDLReminders, generateConflictReminder } = require('../services/reminderService');

const router = express.Router();

// AI 生成接口速率限制：同一用户 1 分钟最多 10 次
const generateCallLog = {};
function generateRateLimit(req, res, next) {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxCalls = 10;

  if (!generateCallLog[userId]) generateCallLog[userId] = [];
  generateCallLog[userId] = generateCallLog[userId].filter(t => now - t < windowMs);

  if (generateCallLog[userId].length >= maxCalls) {
    return res.status(429).json({ error: true, message: '操作太频繁，请稍后再试' });
  }
  generateCallLog[userId].push(now);
  next();
}

// 解析项目 metadata 字段
function parseProjectMeta(row) {
  if (row && row.metadata && typeof row.metadata === 'string') {
    try { row.metadata = JSON.parse(row.metadata); } catch (e) {}
  }
  return row;
}

// 所有路由都需要认证
router.use(authMiddleware);

// GET /api/projects - 获取用户所有项目（含模块/任务完整数据）
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM modules m WHERE m.project_id = p.id) AS module_count,
        (SELECT COUNT(*) FROM tasks t JOIN modules m ON t.module_id = m.id WHERE m.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t JOIN modules m ON t.module_id = m.id WHERE m.project_id = p.id AND t.is_completed = 1) AS completed_task_count
      FROM projects p
      WHERE p.user_id = ?
    `;
    const params = [req.user.id];
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY p.created_at DESC';

    const rows = db.prepare(sql).all(...params);
    rows.forEach(parseProjectMeta);

    // 为每个项目加载完整的模块和任务
    for (const project of rows) {
      const modules = db.prepare(
        'SELECT * FROM modules WHERE project_id = ? ORDER BY sort_order, id'
      ).all(project.id);

      for (const mod of modules) {
        mod.tasks = db.prepare(
          'SELECT * FROM tasks WHERE module_id = ? ORDER BY sort_order, id'
        ).all(mod.id);
      }

      project.modules = modules;
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/generate - AI 生成项目（必须在 /:id 之前定义）
// 接收 { text }，解析出多个项目，写入数据库，返回创建的项目列表
router.post('/generate', generateRateLimit, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: true, message: '请输入内容' });
    }

    // 按逗号/分号/换行分割成多个子任务描述
    var parts = text.split(/[，,;；\n]/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });

    var createdProjects = [];

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      // AI 引擎生成项目结构
      var generated = await aiEngine.generateProject({ name: part, text: part }, req);

      // 写入数据库
      var ddlDate = generated.ddl ? (generated.ddl instanceof Date ? generated.ddl.toISOString().split('T')[0] : generated.ddl) : null;

      var projResult = db.prepare(
        `INSERT INTO projects (user_id, name, type, icon, color, description, ddl, priority, difficulty, estimated_hours, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        req.user.id,
        generated.name || part,
        generated.type || 'custom',
        generated.icon || '📋',
        generated.color || 'terracotta',
        '',
        ddlDate,
        'normal',
        generated.difficulty || 3,
        generated.estimatedHours || 10,
        JSON.stringify({ source: 'ai_generate', rawText: part })
      );

      var projectId = projResult.lastInsertRowid;

      // 创建模块和任务
      if (generated.modules && generated.modules.length > 0) {
        for (var mi = 0; mi < generated.modules.length; mi++) {
          var mod = generated.modules[mi];
          var modResult = db.prepare(
            `INSERT INTO modules (project_id, name, estimated_time, sort_order) VALUES (?, ?, ?, ?)`
          ).run(projectId, mod.name, mod.estimatedTime || mod.estimated_time || '', mi);

          var moduleId = modResult.lastInsertRowid;

          if (mod.tasks && mod.tasks.length > 0) {
            for (var ti = 0; ti < mod.tasks.length; ti++) {
              var task = mod.tasks[ti];
              var meta = null;
              if (task.tool) {
                meta = JSON.stringify({ tool: task.tool, toolLabel: task.toolLabel });
              }
              db.prepare(
                `INSERT INTO tasks (module_id, title, sort_order, metadata) VALUES (?, ?, ?, ?)`
              ).run(moduleId, task.title || task, ti, meta);
            }
          }
        }
      }

      // 查询完整项目返回（含模块和任务）
      var fullProject = db.prepare(
        `SELECT p.*,
          (SELECT COUNT(*) FROM modules m WHERE m.project_id = p.id) AS module_count,
          (SELECT COUNT(*) FROM tasks t JOIN modules m ON t.module_id = m.id WHERE m.project_id = p.id) AS task_count,
          (SELECT COUNT(*) FROM tasks t JOIN modules m ON t.module_id = m.id WHERE m.project_id = p.id AND t.is_completed = 1) AS completed_task_count
        FROM projects p WHERE p.id = ?`
      ).get(projectId);

      parseProjectMeta(fullProject);

      // 加载模块和任务
      var modules = db.prepare('SELECT * FROM modules WHERE project_id = ? ORDER BY sort_order, id').all(projectId);
      for (var mi = 0; mi < modules.length; mi++) {
        modules[mi].tasks = db.prepare('SELECT * FROM tasks WHERE module_id = ? ORDER BY sort_order, id').all(modules[mi].id);
      }
      fullProject.modules = modules;

      createdProjects.push(fullProject);
    }

    // 生成提醒
    try {
      var { generateDDLReminders } = require('../services/reminderService');
      for (var p of createdProjects) {
        await generateDDLReminders(req.user.id, p.id, p);
      }
    } catch (e) {
      console.warn('[Reminders] 生成提醒失败:', e.message);
    }

    res.json({ success: true, data: createdProjects });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/templates - 获取模板列表
router.get('/templates', async (req, res, next) => {
  try {
    res.json({ success: true, data: aiEngine.listTemplates() });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - 获取项目详情（含模块和任务）
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = db.prepare(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: true, message: '项目不存在' });
    }

    parseProjectMeta(project);

    const modules = db.prepare(
      `SELECT * FROM modules WHERE project_id = ? ORDER BY sort_order, id`
    ).all(id);

    for (const mod of modules) {
      const tasks = db.prepare(
        'SELECT * FROM tasks WHERE module_id = ? ORDER BY sort_order, id'
      ).all(mod.id);
      mod.tasks = tasks;
    }

    project.modules = modules;

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - 创建项目（可基于 AI 生成结果保存）
router.post('/', async (req, res, next) => {
  try {
    const {
      name, type, icon, color, description, ddl,
      priority, difficulty, estimated_hours, metadata,
      modules // 如果传入 modules，会一并创建模块和任务
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: true, message: '项目名称不能为空' });
    }

    // 解析 DDL（支持中文表达）
    let ddlDate = null;
    if (ddl) {
      const parsed = aiEngine.parseDDL(ddl);
      ddlDate = parsed ? parsed.toISOString().split('T')[0] : ddl;
    }

    db.exec('BEGIN');
    let project;
    try {
      const result = db.prepare(
        `INSERT INTO projects
         (user_id, name, type, icon, color, description, ddl, priority, difficulty, estimated_hours, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        req.user.id, name, type || 'custom', icon || '📋', color || 'terracotta',
        description || null, ddlDate, priority || 'normal',
        difficulty || 3, estimated_hours || null,
        JSON.stringify(metadata || {})
      );

      const projectId = result.lastInsertRowid;

      // 创建模块和任务
      if (modules && Array.isArray(modules)) {
        for (let i = 0; i < modules.length; i++) {
          const mod = modules[i];
          const modRes = db.prepare(
            `INSERT INTO modules (project_id, name, description, estimated_time, sort_order)
             VALUES (?, ?, ?, ?, ?)`
          ).run(projectId, mod.name, mod.description || null, mod.estimated_time || null, i);

          if (mod.tasks && Array.isArray(mod.tasks)) {
            for (let j = 0; j < mod.tasks.length; j++) {
              const task = mod.tasks[j];
              db.prepare(
                `INSERT INTO tasks (module_id, title, description, sort_order, estimated_time)
                 VALUES (?, ?, ?, ?, ?)`
              ).run(modRes.lastInsertRowid, task.title, task.description || null, j, task.estimated_time || null);
            }
          }
        }
      }

      project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
    parseProjectMeta(project);

    // 异步生成 DDL 提醒
    generateDDLReminders(project, req.user.id).catch(e => {
      console.warn('[Projects] DDL 提醒生成失败:', e.message);
    });

    // 冲突检测
    const allProjects = db.prepare(
      'SELECT id, name, ddl FROM projects WHERE user_id = ? AND id != ? AND ddl IS NOT NULL'
    ).all(req.user.id, project.id);
    const conflicts = aiEngine.detectConflicts(allProjects, project);
    if (conflicts.length > 0) {
      generateConflictReminder(req.user.id, conflicts).catch(() => {});
    }

    res.status(201).json({ success: true, data: project, conflicts });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'type', 'icon', 'color', 'description', 'ddl', 'priority', 'status', 'difficulty', 'estimated_hours', 'metadata'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // 解析 DDL
    if (updates.ddl) {
      const parsed = aiEngine.parseDDL(updates.ddl);
      updates.ddl = parsed ? parsed.toISOString().split('T')[0] : updates.ddl;
    }
    if (updates.metadata) {
      updates.metadata = JSON.stringify(updates.metadata);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: '没有要更新的字段' });
    }

    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(updates);

    const result = db.prepare(
      `UPDATE projects SET ${setClause} WHERE id = ? AND user_id = ?`
    ).run(...values, id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '项目不存在' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    parseProjectMeta(project);

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - 删除项目（级联删除模块和任务）
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db.prepare(
      'DELETE FROM projects WHERE id = ? AND user_id = ?'
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: true, message: '项目不存在' });
    }

    res.json({ success: true, data: { id: parseInt(id), deleted: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/modules/:moduleId/ai-supplement - AI 补充模块任务
router.post('/:id/modules/:moduleId/ai-supplement', async (req, res, next) => {
  try {
    const { id, moduleId } = req.params;

    // 验证项目和模块归属
    const proj = db.prepare(
      'SELECT name FROM projects WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);
    if (!proj) {
      return res.status(404).json({ error: true, message: '项目不存在' });
    }

    const mod = db.prepare(
      'SELECT name FROM modules WHERE id = ? AND project_id = ?'
    ).get(moduleId, id);
    if (!mod) {
      return res.status(404).json({ error: true, message: '模块不存在' });
    }

    // 获取现有任务
    const existingTasks = db.prepare(
      'SELECT title FROM tasks WHERE module_id = ?'
    ).all(moduleId);

    // AI 生成补充任务
  const newTasks = await aiEngine.supplementModule(proj.name, mod.name, existingTasks, null, req);

    // 保存到数据库（事务）
    db.exec('BEGIN');
    const created = [];
    try {
      const sortOrderRow = db.prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM tasks WHERE module_id = ?'
      ).get(moduleId);
      let nextOrder = sortOrderRow.next_order;

      for (const t of newTasks) {
        const r = db.prepare(
          `INSERT INTO tasks (module_id, title, sort_order)
           VALUES (?, ?, ?)`
        ).run(moduleId, t.title, nextOrder++);
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(r.lastInsertRowid);
        created.push(task);
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, data: { tasks: created, count: created.length } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
