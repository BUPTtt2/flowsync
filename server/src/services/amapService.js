// 高德地图服务：地点搜索、路线规划、天气、通勤推荐
const axios = require('axios');
const db = require('../db');

const AMAP_BASE = 'https://restapi.amap.com/v3';
const AMAP_V5_BASE = 'https://restapi.amap.com/v5';

// 动态读取 key（支持请求头 X-API-Keys 临时注入 process.env）
function getApiKey(){
  return process.env.AMAP_API_KEY;
}

// 是否启用真实 API（动态判断，便于运行时注入 key）
function isEnabled(){
  var k = getApiKey();
  return !!k && k !== 'your-amap-api-key';
}

// ============ 缓存机制 ============

function getCache(key) {
  try {
    const row = db.prepare(
      `SELECT cache_data FROM external_cache
       WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`
    ).get(key);
    if (!row || !row.cache_data) return null;
    return JSON.parse(row.cache_data);
  } catch (e) {
    return null;
  }
}

function setCache(key, data, ttlSeconds = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    db.prepare(
      `INSERT INTO external_cache (cache_key, cache_data, expires_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET cache_data = ?, expires_at = ?`
    ).run(key, JSON.stringify(data), expiresAt, JSON.stringify(data), expiresAt);
  } catch (e) {
    console.warn('[Amap] 缓存写入失败:', e.message);
  }
}

// ============ Mock 数据（无 API key 时使用） ============

function mockSearchResults(keyword) {
  return [
    {
      name: `${keyword}（示例地点）`,
      location: '116.397428,39.90923',
      address: `北京市东城区示例地址 1 号`,
      tel: '010-12345678',
      type: '示例类型'
    },
    {
      name: `${keyword} 分店`,
      location: '116.480053,39.996045',
      address: `北京市朝阳区示例路 88 号`,
      tel: '010-87654321',
      type: '示例类型'
    }
  ];
}

function mockRoute(origin, dest, mode) {
  const distance = Math.floor(Math.random() * 20000) + 1000;
  const duration = Math.floor(distance / (mode === 'walking' ? 80 : mode === 'driving' ? 600 : 300));
  return {
    origin,
    destination: dest,
    mode,
    distance,
    duration,
    steps: [
      { instruction: '从起点出发', distance: distance / 3, duration: duration / 3 },
      { instruction: '沿主干道前行', distance: distance / 3, duration: duration / 3 },
      { instruction: '到达终点', distance: distance / 3, duration: duration / 3 }
    ]
  };
}

function mockWeather(city) {
  const conditions = ['晴', '多云', '阴', '小雨', '雷阵雨'];
  return {
    city,
    weather: conditions[Math.floor(Math.random() * conditions.length)],
    temperature: Math.floor(Math.random() * 15) + 15,
    humidity: Math.floor(Math.random() * 40) + 40,
    wind: `${Math.floor(Math.random() * 5) + 1}级`,
    reportTime: new Date().toISOString()
  };
}

// ============ 地点搜索 ============

async function searchPlace(keyword, city = '') {
  const cacheKey = `search:${keyword}:${city}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!isEnabled()) {
    const mock = mockSearchResults(keyword);
    setCache(cacheKey, mock, 1800);
    return mock;
  }

  try {
    const res = await axios.get(`${AMAP_BASE}/place/text`, {
      params: {
        key: getApiKey(),
        keywords: keyword,
        city,
        citylimit: city ? 'true' : 'false',
        offset: 10,
        page: 1,
        extensions: 'all'
      },
      timeout: 8000
    });

    if (res.data.status !== '1') {
      throw new Error(res.data.info || '高德搜索失败');
    }

    const result = (res.data.pois || []).map(p => ({
      name: p.name,
      location: p.location,
      address: p.address || '',
      tel: p.tel || '',
      type: p.type || ''
    }));
    setCache(cacheKey, result, 1800);
    return result;
  } catch (err) {
    console.error('[Amap] 搜索失败:', err.message);
    return mockSearchResults(keyword);
  }
}

// ============ 路线规划 ============

async function planRoute(origin, destination, mode = 'driving') {
  // origin/destination 可以是 "lng,lat" 或地名
  const cacheKey = `route:${origin}->${destination}:${mode}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!isEnabled()) {
    const mock = mockRoute(origin, destination, mode);
    setCache(cacheKey, mock, 600);
    return mock;
  }

  const modeUrlMap = {
    walking: 'direction/walk',
    driving: 'direction/drive',
    transit: 'direction/transit/integrated',
    riding: 'direction/bike'
  };

  const urlSuffix = modeUrlMap[mode] || modeUrlMap.driving;

  try {
    const params = {
      key: getApiKey(),
      origin,
      destination
    };
    if (mode === 'transit') params.city = '北京';

    const res = await axios.get(`${AMAP_V5_BASE}/${urlSuffix}`, { params, timeout: 10000 });

    if (res.data.errcode !== 0 && res.data.status !== '1') {
      throw new Error(res.data.errmsg || res.data.info || '高德路线规划失败');
    }

    const path = res.data.route || res.data.route;
    const result = {
      origin,
      destination,
      mode,
      distance: path?.distance || 0,
      duration: path?.duration || 0,
      steps: path?.transits?.[0]?.segments?.map(s => ({
        instruction: s.instruction || s.bus?.buslines?.[0]?.name,
        distance: s.distance,
        duration: s.duration
      })) || []
    };
    setCache(cacheKey, result, 600);
    return result;
  } catch (err) {
    console.error('[Amap] 路线规划失败:', err.message);
    return mockRoute(origin, destination, mode);
  }
}

// ============ 天气查询 ============

async function getWeather(city = '北京') {
  const cacheKey = `weather:${city}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  if (!isEnabled()) {
    const mock = mockWeather(city);
    setCache(cacheKey, mock, 1800);
    return mock;
  }

  try {
    const res = await axios.get(`${AMAP_BASE}/weather/weatherInfo`, {
      params: {
        key: getApiKey(),
        city,
        extensions: 'base'
      },
      timeout: 8000
    });

    if (res.data.status !== '1') {
      throw new Error(res.data.info || '高德天气查询失败');
    }

    const live = res.data.lives?.[0] || {};
    const result = {
      city: live.city || city,
      weather: live.weather,
      temperature: live.temperature,
      humidity: live.humidity,
      wind: live.windpower + '级',
      reportTime: live.reporttime
    };
    setCache(cacheKey, result, 1800);
    return result;
  } catch (err) {
    console.error('[Amap] 天气查询失败:', err.message);
    return mockWeather(city);
  }
}

// ============ 通勤方式推荐 ============

async function recommendCommute(origin, destination, departureTime = null) {
  // 根据距离推荐通勤方式
  const modes = ['walking', 'riding', 'transit', 'driving'];
  const results = [];

  for (const mode of modes) {
    const route = await planRoute(origin, destination, mode);
    results.push({
      mode,
      modeLabel: { walking: '步行', riding: '骑行', transit: '公交', driving: '驾车' }[mode],
      distance: route.distance,
      duration: route.duration,
      durationMin: Math.ceil((route.duration || 0) / 60)
    });
  }

  // 按距离推荐
  const distance = results[0].distance;
  let recommended;

  if (distance < 1000) {
    recommended = 'walking';
  } else if (distance < 3000) {
    recommended = 'riding';
  } else if (distance < 15000) {
    recommended = 'transit';
  } else {
    recommended = 'driving';
  }

  // 天气考虑
  const weather = await getWeather('北京');
  const badWeather = ['雨', '雪', '雷', '暴'].some(w => String(weather.weather).includes(w));
  if (badWeather && (recommended === 'walking' || recommended === 'riding')) {
    recommended = 'transit';
  }

  const recommendedRoute = results.find(r => r.mode === recommended);

  return {
    origin,
    destination,
    departureTime,
    distance,
    recommendedMode: recommended,
    recommendedLabel: { walking: '步行', riding: '骑行', transit: '公交', driving: '驾车' }[recommended],
    recommendedDuration: recommendedRoute.durationMin,
    weather,
    allRoutes: results
  };
}

module.exports = {
  searchPlace,
  planRoute,
  getWeather,
  recommendCommute,
  get isEnabled(){ return isEnabled(); }
};
