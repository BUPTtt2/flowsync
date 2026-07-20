// 提醒服务：DDL 倒计时、出行前、通勤推荐、冲突提醒
const db = require('../db');
const { parseDDL } = require('./aiEngine');

// ============ DDL 倒计时提醒生成 ============

/**
 * 根据项目 DDL 生成倒计时提醒
 * 提前 1 天、3 天、7 天分别生成
 */
async function generateDDLReminders(project, userId) {
  if (!project.ddl) return [];

  const ddl = new Date(project.ddl);
  const reminders = [];
  const reminderPoints = [
    { days: 7, title: `⏰ "${project.name}" 还有 7 天` },
    { days: 3, title: `⏰ "${project.name}" 还有 3 天，加快进度` },
    { days: 1, title: `🚨 "${project.name}" 明天到期！` }
  ];

  for (const point of reminderPoints) {
    const remindAt = new Date(ddl.getTime() - point.days * 24 * 3600 * 1000);
    // 只生成未来的提醒
    if (remindAt > new Date()) {
      try {
        db.prepare(
          `INSERT OR IGNORE INTO reminders (user_id, project_id, type, title, message, remind_at, metadata)
           VALUES (?, ?, 'ddl', ?, ?, ?, ?)`
        ).run(
          userId,
          project.id,
          point.title,
          `项目"${project.name}"的 DDL 是 ${ddl.toLocaleDateString('zh-CN')}，请尽快完成`,
          remindAt.toISOString(),
          JSON.stringify({ days_before: point.days, ddl: project.ddl })
        );
        reminders.push({ title: point.title, remindAt });
      } catch (e) {
        console.warn('[Reminder] DDL 提醒创建失败:', e.message);
      }
    }
  }

  return reminders;
}

// ============ 出行前提醒 ============

/**
 * 根据项目日期生成出行提醒（用于旅行、面试等需要外出的项目）
 */
async function generateTravelReminder(project, userId, location = null) {
  if (!project.ddl) return null;
  if (!['travel', 'interview', 'event'].includes(project.type)) return null;

  const date = new Date(project.ddl);
  // 出行前一天晚上提醒
  const remindAt = new Date(date.getTime() - 12 * 3600 * 1000);

  if (remindAt < new Date()) return null;

  const message = location
    ? `明天需要前往 ${location}，记得检查路线与物品`
    : `明天有"${project.name}"相关出行，请确认路线与时间`;

  try {
    const result = db.prepare(
      `INSERT INTO reminders (user_id, project_id, type, title, message, remind_at, metadata)
       VALUES (?, ?, 'travel', ?, ?, ?, ?)`
    ).run(
      userId,
      project.id,
      `🧳 "${project.name}" 出行提醒`,
      message,
      remindAt.toISOString(),
      JSON.stringify({ location, project_date: project.ddl })
    );
    return { id: result.lastInsertRowid };
  } catch (e) {
    console.warn('[Reminder] 出行提醒创建失败:', e.message);
    return null;
  }
}

// ============ 通勤推荐提醒 ============

async function generateCommuteReminder(project, userId, origin, destination) {
  if (!project.ddl) return null;

  const date = new Date(project.ddl);
  // 出发前 2 小时提醒
  const remindAt = new Date(date.getTime() - 2 * 3600 * 1000);

  if (remindAt < new Date()) return null;

  let commuteInfo = null;
  try {
    const { recommendCommute } = require('./amapService');
    commuteInfo = await recommendCommute(origin, destination, date.toISOString());
  } catch (e) {
    console.warn('[Reminder] 通勤查询失败:', e.message);
  }

  const message = commuteInfo
    ? `推荐出行方式：${commuteInfo.recommendedLabel}，预计 ${commuteInfo.recommendedDuration} 分钟`
    : '请提前规划出行路线';

  try {
    const result = db.prepare(
      `INSERT INTO reminders (user_id, project_id, type, title, message, remind_at, metadata)
       VALUES (?, ?, 'commute', ?, ?, ?, ?)`
    ).run(
      userId,
      project.id,
      `🚗 "${project.name}" 通勤提醒`,
      message,
      remindAt.toISOString(),
      JSON.stringify({ origin, destination, commute: commuteInfo })
    );
    return { id: result.lastInsertRowid };
  } catch (e) {
    console.warn('[Reminder] 通勤提醒创建失败:', e.message);
    return null;
  }
}

// ============ 冲突提醒 ============

async function generateConflictReminder(userId, conflicts) {
  if (!conflicts || conflicts.length === 0) return null;

  const message = conflicts
    .map(c => c.message)
    .join('; ');

  try {
    const result = db.prepare(
      `INSERT INTO reminders (user_id, type, title, message, remind_at, metadata)
       VALUES (?, 'conflict', ?, ?, CURRENT_TIMESTAMP, ?)`
    ).run(
      userId,
      '⚠️ 时间冲突提醒',
      message,
      JSON.stringify({ conflicts })
    );
    return { id: result.lastInsertRowid };
  } catch (e) {
    console.warn('[Reminder] 冲突提醒创建失败:', e.message);
    return null;
  }
}

// ============ 检查并生成即将到期的提醒 ============

/**
 * 扫描用户所有项目，为接近 DDL 的项目生成提醒
 */
async function checkAndGenerateReminders(userId) {
  const result = { generated: 0, skipped: 0 };

  // 获取用户所有有 DDL 的活跃项目
  const projects = db.prepare(
    `SELECT id, name, type, ddl, status FROM projects
     WHERE user_id = ? AND status = 'active' AND ddl IS NOT NULL`
  ).all(userId);

  for (const project of projects) {
    const ddl = new Date(project.ddl);
    const now = new Date();
    const daysLeft = (ddl - now) / (24 * 3600 * 1000);

    // 只处理未来 30 天内的 DDL
    if (daysLeft < 0 || daysLeft > 30) continue;

    // 检查是否已有对应提醒
    const existing = db.prepare(
      `SELECT id FROM reminders
       WHERE user_id = ? AND project_id = ? AND type = 'ddl' AND is_sent = 0`
    ).get(userId, project.id);

    if (!existing) {
      await generateDDLReminders(project, userId);
      result.generated++;
    } else {
      result.skipped++;
    }
  }

  return result;
}

module.exports = {
  generateDDLReminders,
  generateTravelReminder,
  generateCommuteReminder,
  generateConflictReminder,
  checkAndGenerateReminders
};
