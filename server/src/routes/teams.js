const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth.verifyToken);

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: true, message: '团队名称不能为空' });
  const userId = req.user.id;
  
  const result = db.prepare(`
    INSERT INTO teams (name, description, owner_id) VALUES (?, ?, ?)
  `).run(name, description || '', userId);
  
  res.json({ success: true, data: { id: result.lastInsertRowid, name, description, owner_id: userId } });
});

router.get('/', (req, res) => {
  const userId = req.user.id;
  
  const teams = db.prepare(`
    SELECT t.*, u.username as owner_name FROM teams t
    JOIN users u ON t.owner_id = u.id
    WHERE t.owner_id = ?
    UNION
    SELECT t.*, u.username as owner_name FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    JOIN users u ON t.owner_id = u.id
    WHERE tm.user_id = ?
    ORDER BY t.created_at DESC
  `).all(userId, userId);
  
  res.json({ success: true, data: teams });
});

router.get('/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  
  const team = db.prepare(`
    SELECT t.*, u.username as owner_name FROM teams t
    JOIN users u ON t.owner_id = u.id
    WHERE t.id = ?
  `).get(teamId);
  
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  
  const isMember = db.prepare(`
    SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?
  `).get(teamId, userId);
  
  if (!isMember && team.owner_id !== userId) {
    return res.status(403).json({ error: true, message: '无权访问该团队' });
  }
  
  const members = db.prepare(`
    SELECT u.id, u.username, u.display_name, tm.role, tm.joined_at 
    FROM team_members tm JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ? ORDER BY tm.joined_at ASC
  `).all(teamId);
  
  const projects = db.prepare(`
    SELECT p.id, p.name, p.type, p.icon, p.color, p.status 
    FROM team_projects tp JOIN projects p ON tp.project_id = p.id
    WHERE tp.team_id = ? ORDER BY p.created_at DESC
  `).all(teamId);
  
  res.json({ success: true, data: { ...team, members, projects } });
});

router.put('/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  const { name, description } = req.body;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  if (team.owner_id !== userId) return res.status(403).json({ error: true, message: '无权限修改' });
  
  db.prepare(`UPDATE teams SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(name, description || '', teamId);
  
  res.json({ success: true, message: '团队信息已更新' });
});

router.delete('/:id', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  if (team.owner_id !== userId) return res.status(403).json({ error: true, message: '无权限删除' });
  
  db.prepare(`DELETE FROM teams WHERE id = ?`).run(teamId);
  
  res.json({ success: true, message: '团队已删除' });
});

router.post('/:id/members', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  const { email } = req.body;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  if (team.owner_id !== userId) return res.status(403).json({ error: true, message: '无权限邀请成员' });
  
  const user = db.prepare(`SELECT id, username FROM users WHERE email = ?`).get(email);
  if (!user) return res.status(404).json({ error: true, message: '用户不存在' });
  
  const exists = db.prepare(`SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`).get(teamId, user.id);
  if (exists) return res.status(400).json({ error: true, message: '用户已在团队中' });
  
  db.prepare(`INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member')`).run(teamId, user.id);
  
  res.json({ success: true, data: { user_id: user.id, username: user.username } });
});

router.delete('/:id/members/:userId', (req, res) => {
  const teamId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);
  const userId = req.user.id;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  if (team.owner_id !== userId) return res.status(403).json({ error: true, message: '无权限移除成员' });
  
  db.prepare(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`).run(teamId, targetUserId);
  
  res.json({ success: true, message: '成员已移除' });
});

router.post('/:id/projects', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  const { project_id } = req.body;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  
  const isMember = db.prepare(`SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`).get(teamId, userId);
  if (!isMember && team.owner_id !== userId) {
    return res.status(403).json({ error: true, message: '无权访问该团队' });
  }
  
  const exists = db.prepare(`SELECT 1 FROM team_projects WHERE team_id = ? AND project_id = ?`).get(teamId, project_id);
  if (exists) return res.status(400).json({ error: true, message: '项目已在团队中' });
  
  db.prepare(`INSERT INTO team_projects (team_id, project_id) VALUES (?, ?)`).run(teamId, project_id);
  
  res.json({ success: true, message: '项目已共享到团队' });
});

router.delete('/:id/projects/:projectId', (req, res) => {
  const teamId = parseInt(req.params.id);
  const projectId = parseInt(req.params.projectId);
  const userId = req.user.id;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  if (team.owner_id !== userId) return res.status(403).json({ error: true, message: '无权限移除项目' });
  
  db.prepare(`DELETE FROM team_projects WHERE team_id = ? AND project_id = ?`).run(teamId, projectId);
  
  res.json({ success: true, message: '项目已从团队移除' });
});

router.get('/:id/projects', (req, res) => {
  const teamId = parseInt(req.params.id);
  const userId = req.user.id;
  
  const team = db.prepare(`SELECT owner_id FROM teams WHERE id = ?`).get(teamId);
  if (!team) return res.status(404).json({ error: true, message: '团队不存在' });
  
  const isMember = db.prepare(`SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`).get(teamId, userId);
  if (!isMember && team.owner_id !== userId) {
    return res.status(403).json({ error: true, message: '无权访问该团队' });
  }
  
  const projects = db.prepare(`
    SELECT p.*, u.username as owner_name 
    FROM team_projects tp 
    JOIN projects p ON tp.project_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE tp.team_id = ? ORDER BY p.created_at DESC
  `).all(teamId);
  
  res.json({ success: true, data: projects });
});

module.exports = router;