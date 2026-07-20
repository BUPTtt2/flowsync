// 外部 API 路由：地点搜索、路线规划、天气、通勤推荐
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const amapService = require('../services/amapService');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// GET /api/external/search - 地点搜索
router.get('/search', async (req, res, next) => {
  try {
    const { keyword, city } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: true, message: 'keyword 不能为空' });
    }

    const result = await amapService.searchPlace(keyword, city);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/external/route - 路线规划
router.get('/route', async (req, res, next) => {
  try {
    const { origin, destination, mode } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: true, message: 'origin 和 destination 不能为空' });
    }

    const result = await amapService.planRoute(origin, destination, mode || 'driving');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/external/weather - 天气查询
router.get('/weather', async (req, res, next) => {
  try {
    const { city } = req.query;

    const result = await amapService.getWeather(city || '北京');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/external/directions - 通勤方式推荐
router.get('/directions', async (req, res, next) => {
  try {
    const { origin, destination, departure_time } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: true, message: 'origin 和 destination 不能为空' });
    }

    const result = await amapService.recommendCommute(origin, destination, departure_time);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/external/status - 检查外部服务状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      amap_enabled: amapService.isEnabled,
      message: amapService.isEnabled ? '高德 API 已启用' : '高德 API 未配置，使用 Mock 数据'
    }
  });
});

module.exports = router;
