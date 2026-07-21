const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: true, message: '反馈内容不能为空' });
    }
    db.prepare(
      'INSERT INTO feedback (user_id, content, created_at) VALUES (?, ?, ?)'
    ).run(req.user.id, content.trim(), new Date().toISOString());
    res.json({ success: true, message: '反馈已提交' });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const feedbacks = db.prepare(
      'SELECT f.*, u.username, u.display_name FROM feedback f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC LIMIT 50'
    ).all();
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    next(err);
  }
});

module.exports = router;