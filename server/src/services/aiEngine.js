// AI 引擎：Agent 动态生成 + 模板兜底
require('dotenv').config();
const axios = require('axios');
const { matchTemplate, getTemplate, listTemplates } = require('../utils/templateLibrary');

function getLLMConfig(req) {
  // 优先从 req.apiKeys 取（用户自定义 key），否则用全局环境变量
  const keys = (req && req.apiKeys) || {};
  const config = {
    apiKey: keys.LLM_API_KEY || process.env.LLM_API_KEY,
    apiUrl: keys.LLM_API_URL || process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: keys.LLM_MODEL || process.env.LLM_MODEL || 'gpt-3.5-turbo'
  };
  if (!config.apiKey) {
    console.warn('[AIEngine] LLM_API_KEY 未设置（环境变量和请求头都没有）');
  }
  return config;
}

// ============ DDL 解析（支持中文相对时间） ============

/**
 * 解析中文/英文 DDL 表达式，返回 Date 对象
 * 支持：下周三、月底、3天后、下周五、本周五、明天、后天等
 */
function parseDDL(text, baseDate = new Date()) {
  if (!text) return null;

  // 如果已经是 ISO 日期格式
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return new Date(text);
  }

  const now = new Date(baseDate);
  const result = new Date(now);
  const lower = String(text).toLowerCase();

  // 明天
  if (text.includes('明天') || lower.includes('tomorrow')) {
    result.setDate(now.getDate() + 1);
    return result;
  }
  // 后天
  if (text.includes('后天')) {
    result.setDate(now.getDate() + 2);
    return result;
  }
  // 大后天
  if (text.includes('大后天')) {
    result.setDate(now.getDate() + 3);
    return result;
  }
  // 昨天（不应该作为 DDL，但解析）
  if (text.includes('昨天') || lower.includes('yesterday')) {
    result.setDate(now.getDate() - 1);
    return result;
  }
  // 今天
  if (text.includes('今天') || lower.includes('today')) {
    return result;
  }

  // N 天后/周后/月后
  const relMatch = text.match(/(\d+)\s*(天|周|月)后?/);
  if (relMatch) {
    const n = parseInt(relMatch[1]);
    const unit = relMatch[2];
    if (unit === '天') result.setDate(now.getDate() + n);
    if (unit === '周') result.setDate(now.getDate() + n * 7);
    if (unit === '月') result.setMonth(now.getMonth() + n);
    return result;
  }

  // 下周X / 本周X
  const weekDayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
  const weekMatch = text.match(/(下|本)?周([一二三四五六日天])/);
  if (weekMatch) {
    const prefix = weekMatch[1];
    const day = weekDayMap[weekMatch[2]];
    const curDay = now.getDay();
    let diff = day - curDay;
    if (prefix === '下') {
      diff += 7;
    } else if (prefix === '本' && diff < 0) {
      diff += 7;
    } else if (!prefix && diff < 0) {
      diff += 7;
    }
    result.setDate(now.getDate() + diff);
    return result;
  }

  // 月底
  if (text.includes('月底') || text.includes('月末')) {
    result.setMonth(result.getMonth() + 1, 0); // 下个月第 0 天 = 本月最后一天
    return result;
  }
  // 下月底
  if (text.includes('下月底')) {
    result.setMonth(result.getMonth() + 2, 0);
    return result;
  }

  // 月初
  if (text.includes('月初')) {
    result.setDate(1);
    return result;
  }

  // X月X日
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]);
    const day = parseInt(dateMatch[2]);
    result.setMonth(month - 1, day);
    if (result < now) result.setFullYear(now.getFullYear() + 1);
    return result;
  }

  return null;
}

// ============ 关键词匹配 ============

function matchProjectType(name) {
  const tpl = matchTemplate(name);
  return tpl ? tpl.type : 'custom';
}

// ============ 动态生成（未匹配模板时的规则生成） ============

function generateGenericProject(name, ddl) {
  const today = new Date();
  const target = ddl ? new Date(ddl) : new Date(today.getTime() + 7 * 24 * 3600 * 1000);
  const daysLeft = Math.max(1, Math.ceil((target - today) / (24 * 3600 * 1000)));

  return {
    type: 'custom',
    name: name,
    icon: '📋',
    color: 'terracotta',
    difficulty: 3,
    estimatedHours: Math.min(40, Math.max(4, daysLeft * 2)),
    modules: [
      {
        name: '前期准备',
        estimatedTime: '2h',
        tasks: [
          { title: `明确"${name}"的目标与范围` },
          { title: '收集相关资料与参考' },
          { title: '制定时间计划表' }
        ]
      },
      {
        name: '核心执行',
        estimatedTime: `${Math.max(2, Math.floor(daysLeft / 3))}h`,
        tasks: [
          { title: '完成核心内容第一版' },
          { title: '优化细节与质量' },
          { title: '寻求反馈与迭代' }
        ]
      },
      {
        name: '收尾交付',
        estimatedTime: '1h',
        tasks: [
          { title: '检查整体完成度' },
          { title: '准备交付材料' },
          { title: '最终确认并提交' }
        ]
      }
    ]
  };
}

// ============ LLM 接口（预留） ============

function cleanLLMResponse(text) {
  if (!text) return text;
  var cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

function parseLLMJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('[AIEngine] JSON解析失败，尝试正则提取...');
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.warn('[AIEngine] 正则提取也失败:', e2.message);
      }
    }
    return null;
  }
}

async function callLLM(prompt, req) {
  var config = getLLMConfig(req);
  if (!config.apiKey) {
    console.warn('[AIEngine] 跳过 LLM：apiKey 为空');
    return null;
  }

  console.log('[AIEngine] LLM 请求:', config.apiUrl, 'model:', config.model);

  try {
    var response = await axios.post(
      config.apiUrl,
      {
        model: config.model,
        messages: [
          { role: 'system', content: '你是项目管理专家。把用户需求拆成2-4个模块，每模块3-5个可执行任务。只返回纯JSON，不要markdown。格式:{modules:[{name,estimatedTime,tasks:[{title,tool?,toolLabel?}]}]}。tool只在涉及地点/路线/天气/提醒时使用，可选:map-search,map-route,weather,reminder' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.apiKey
        },
        timeout: 60000
      }
    );

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      var content = response.data.choices[0].message.content;
      console.log('[AIEngine] LLM 响应成功，长度:', content.length);
      return cleanLLMResponse(content);
    } else {
      console.warn('[AIEngine] LLM 响应格式异常:', JSON.stringify(response.data).slice(0, 200));
      return null;
    }
  } catch (err) {
    // 打印完整错误，包括状态码和响应体
    if (err.response) {
      console.error('[AIEngine] LLM HTTP 错误:', err.response.status, err.response.statusText);
      console.error('[AIEngine] LLM 错误响应体:', JSON.stringify(err.response.data).slice(0, 500));
    } else {
      console.error('[AIEngine] LLM 调用异常:', err.message);
    }
    return null;
  }
}

// ============ 项目生成主入口 ============

/**
 * 根据用户输入生成项目结构（模块 + 任务）
 * @param {Object} params { name, type, ddl, description }
 * @returns {Object} { type, modules, ddl, ... }
 */
async function generateProject(params, req) {
  const { name, type, ddl, description } = params;

  // 解析 DDL
  let ddlDate = null;
  if (ddl) {
    ddlDate = parseDDL(ddl) || (new Date(ddl).toString() !== 'Invalid Date' ? new Date(ddl) : null);
  }

  // ===== 1. LLM 优先动态生成（Agent 模式） =====
  if (getLLMConfig(req).apiKey) {
    const prompt = `用户说："${name}"。请分析用户意图，生成合适的项目管理模块和任务。
要求：
- 模块名要具体，如"准备食材"、"学习课程"等，不要用"项目"这种笼统词
- 任务要可执行，避免空话，每个任务都是一个明确的行动
- 根据任务内容自动匹配工具：
  - map-search: 查询地点、搜索店铺、找地址
  - map-route: 规划路线、查通勤方式、导航
  - weather: 查询目的地天气
  - flight: 查机票、航班信息
  - train: 查高铁/火车票
  - calendar: 同步到日历、设置时间
  - reminder: 设置提醒
- DDL: ${ddlDate || '未指定'}
严格只返回纯 JSON，不要 markdown、不要解释。格式：
{ "modules": [{"name":"模块名","estimatedTime":"时长","tasks":[{"title":"任务标题","tool":"工具类型","toolLabel":"按钮文字"}]}] }`;

    const llmResult = await callLLM(prompt, req);
    if (llmResult) {
      console.log('[AIEngine] LLM 返回内容预览:', llmResult.slice(0, 200));
      const parsed = parseLLMJSON(llmResult);
      if (parsed && parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
        return {
          type: 'custom',
          name: name,
          icon: '📋',
          color: 'terracotta',
          difficulty: 3,
          estimatedHours: 10,
          ddl: ddlDate,
          modules: parsed.modules
        };
      }
      console.warn('[AIEngine] LLM 返回解析失败，回退到模板');
    }
  }

  // ===== 2. 模板匹配兜底 =====
  let template = type && type !== 'custom' ? getTemplate(type) : null;
  if (!template) {
    template = matchTemplate(name);
  }

  if (template) {
    return {
      type: template.type,
      name: name || template.name,
      icon: template.icon,
      color: template.color,
      difficulty: template.difficulty,
      estimatedHours: template.estimatedHours,
      ddl: ddlDate,
      modules: template.modules.map(m => ({
        name: m.name,
        estimatedTime: m.estimatedTime,
        tasks: m.tasks.map(t => ({ title: t.title, tool: t.tool, toolLabel: t.toolLabel }))
      }))
    };
  }

  // ===== 3. 最终兜底 =====
  const generic = generateGenericProject(name, ddlDate);
  generic.ddl = ddlDate;
  return generic;
}

// ============ 模块 AI 补充 ============

async function supplementModule(projectName, moduleName, existingTasks = [], ddl, req) {
  // 查找匹配模板
  const template = matchTemplate(projectName);
  if (template) {
    const tplModule = template.modules.find(m => m.name === moduleName);
    if (tplModule) {
      const existingTitles = new Set(existingTasks.map(t => t.title));
      const newTasks = tplModule.tasks
        .filter(t => !existingTitles.has(t.title))
        .map(t => ({ title: t.title }));
      if (newTasks.length > 0) return newTasks;
    }
  }

  // LLM 补充
  if (getLLMConfig(req).apiKey) {
    const llmResult = await callLLM(
      `项目"${projectName}"的模块"${moduleName}"需要补充任务，现有任务: ${JSON.stringify(existingTasks.map(t => t.title))}。请生成 3-5 个补充任务。返回 JSON: { tasks: [{ title }] }`,
      req
    );
    if (llmResult) {
      try {
        const parsed = JSON.parse(llmResult);
        if (parsed.tasks) return parsed.tasks;
      } catch (e) {}
    }
  }

  // 规则补充
  return [
    { title: `完善"${moduleName}"相关资料` },
    { title: `检查"${moduleName}"完成情况` },
    { title: '总结复盘' }
  ];
}

// ============ 冲突检测 ============

/**
 * 检测项目之间的冲突（DDL 重叠、时间冲突等）
 * @param {Array} projects 用户的所有项目
 * @param {Object} newProject 新项目
 * @returns {Array} 冲突列表
 */
function detectConflicts(projects, newProject) {
  const conflicts = [];

  if (!newProject.ddl) return conflicts;

  const newDdl = new Date(newProject.ddl);
  const conflictWindow = 2 * 24 * 3600 * 1000; // 2 天窗口

  for (const proj of projects) {
    if (!proj.ddl) continue;
    const projDdl = new Date(proj.ddl);
    const diff = Math.abs(newDdl - projDdl);

    if (diff < conflictWindow) {
      conflicts.push({
        type: 'ddl_overlap',
        projectId: proj.id,
        projectName: proj.name,
        ddl: proj.ddl,
        daysDiff: Math.round(diff / (24 * 3600 * 1000)),
        message: `DDL 与项目"${proj.name}"接近（相差 ${Math.round(diff / (24 * 3600 * 1000))} 天）`
      });
    }
  }

  return conflicts;
}

module.exports = {
  parseDDL,
  matchProjectType,
  generateProject,
  supplementModule,
  detectConflicts,
  listTemplates,
  callLLM
};
