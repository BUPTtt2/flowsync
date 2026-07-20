// 项目模板库
// 包含面试、比赛、旅行、考试、搬家、活动策划、项目交付等预设模板

const TEMPLATES = {
  // 面试准备
  interview: {
    type: 'interview',
    name: '面试准备',
    icon: '💼',
    color: 'terracotta',
    difficulty: 4,
    estimatedHours: 20,
    suggestedPrepDays: 7,
    keywords: ['面试', 'interview', '面经', '技术面', 'hr面', '终面', '群面', '笔试'],
    modules: [
      {
        name: '简历准备',
        estimatedTime: '2h',
        tasks: [
          { title: '更新简历内容，突出最近项目经历' },
          { title: '针对岗位要求调整简历关键词' },
          { title: '检查格式排版，导出 PDF 版本' },
          { title: '准备 2-3 个不同版本（按岗位方向）' }
        ]
      },
      {
        name: '自我介绍',
        estimatedTime: '1h',
        tasks: [
          { title: '撰写 1 分钟简短版自我介绍' },
          { title: '撰写 3 分钟完整版自我介绍' },
          { title: '准备英文版（如需要）' },
          { title: '对镜练习，注意语速与神态' },
          { title: '录制视频复盘' }
        ]
      },
      {
        name: '技术复习',
        estimatedTime: '6h',
        tasks: [
          { title: '复习计算机基础（操作系统/网络/数据结构）' },
          { title: '复习岗位相关技术栈' },
          { title: '刷 LeetCode 高频题 10-20 道' },
          { title: '整理常见手撕题（如 LRU、快排、二叉树）' },
          { title: '复习设计模式与系统设计' }
        ]
      },
      {
        name: '项目复盘',
        estimatedTime: '3h',
        tasks: [
          { title: '梳理项目背景、目标、技术栈' },
          { title: '梳理自己在项目中的角色与贡献' },
          { title: '准备难点与解决方案 STAR 表述' },
          { title: '准备项目数据与成果量化' },
          { title: '思考可能的追问与延伸问题' }
        ]
      },
      {
        name: '模拟面试',
        estimatedTime: '2h',
        tasks: [
          { title: '找朋友/同事进行模拟面试' },
          { title: '使用 AI 模拟面试工具练习' },
          { title: '复盘录音，改进表达逻辑' }
        ]
      },
      {
        name: '面试当天准备',
        estimatedTime: '1h',
        tasks: [
          { title: '确认面试时间、地点、面试官信息' },
          { title: '准备着装（正式/商务休闲）' },
          { title: '打印简历 2-3 份' },
          { title: '准备要问面试官的问题 3-5 个' },
          { title: '提前规划通勤路线' }
        ]
      }
    ]
  },

  // 比赛准备
  competition: {
    type: 'competition',
    name: '比赛准备',
    icon: '🏆',
    color: 'sage',
    difficulty: 4,
    estimatedHours: 40,
    suggestedPrepDays: 14,
    keywords: ['比赛', 'competition', 'hackathon', '黑客松', '竞赛', 'contest', '挑战赛'],
    modules: [
      {
        name: '需求分析',
        estimatedTime: '4h',
        tasks: [
          { title: '仔细阅读比赛规则与评分标准' },
          { title: '明确比赛主题与提交要求' },
          { title: '调研往届获奖作品，提炼成功要素' },
          { title: '确定作品方向与核心创新点' },
          { title: '撰写需求文档与 MVP 范围' }
        ]
      },
      {
        name: '方案设计',
        estimatedTime: '4h',
        tasks: [
          { title: '设计整体架构图' },
          { title: '确定技术栈与依赖' },
          { title: '划分模块与分工' },
          { title: '设计数据模型与接口' },
          { title: '制定时间里程碑' }
        ]
      },
      {
        name: '开发实现',
        estimatedTime: '20h',
        tasks: [
          { title: '搭建项目脚手架与基础环境' },
          { title: '实现核心功能模块' },
          { title: '完成 UI/UX 设计与前端实现' },
          { title: '完成数据持久化与后端接口' },
          { title: '每日同步进度，调整任务' }
        ]
      },
      {
        name: '测试优化',
        estimatedTime: '6h',
        tasks: [
          { title: '编写单元测试与集成测试' },
          { title: '进行功能与性能测试' },
          { title: '修复 Bug，优化性能' },
          { title: '完善错误处理与边界情况' }
        ]
      },
      {
        name: '提交准备',
        estimatedTime: '4h',
        tasks: [
          { title: '撰写 README 与文档' },
          { title: '录制演示视频（3-5 分钟）' },
          { title: '准备演示 PPT' },
          { title: '准备现场答辩稿' },
          { title: '检查提交格式与材料完整性' },
          { title: '提交作品并确认状态' }
        ]
      }
    ]
  },

  // 旅行规划
  travel: {
    type: 'travel',
    name: '旅行规划',
    icon: '✈️',
    color: 'sand',
    difficulty: 2,
    estimatedHours: 8,
    suggestedPrepDays: 14,
    keywords: ['旅行', 'travel', '旅游', '出游', 'trip', '出行', '自由行', '跟团', '玩', '景点', '酒店', '机票', '高铁', '攻略', '行程'],
    modules: [
      {
        name: '行程规划',
        estimatedTime: '3h',
        tasks: [
          { title: '确定目的地与出行日期', tool: 'map-search', toolLabel: '搜索地点' },
          { title: '制定每日行程路线', tool: 'map-route', toolLabel: '规划路线' },
          { title: '预订景点门票' },
          { title: '查看天气预报，准备备选方案', tool: 'weather', toolLabel: '查天气' }
        ]
      },
      {
        name: '交通预订',
        estimatedTime: '1h',
        tasks: [
          { title: '预订往返机票/火车票' },
          { title: '预订当地交通（租车/接送）' },
          { title: '查询机场/车站到酒店路线', tool: 'map-route', toolLabel: '查路线' },
          { title: '保存电子票与离线地图' }
        ]
      },
      {
        name: '酒店预订',
        estimatedTime: '1h',
        tasks: [
          { title: '对比多家平台价格' },
          { title: '确认房型与入住政策' },
          { title: '查看位置与周边配套', tool: 'map-search', toolLabel: '搜周边' },
          { title: '预订并保存确认邮件' }
        ]
      },
      {
        name: '景点规划',
        estimatedTime: '2h',
        tasks: [
          { title: '列出必去景点清单', tool: 'map-search', toolLabel: '搜景点' },
          { title: '按地理位置优化游览顺序', tool: 'map-route', toolLabel: '优化路线' },
          { title: '查询开放时间与门票' },
          { title: '准备备选室内活动' }
        ]
      },
      {
        name: '美食推荐',
        estimatedTime: '1h',
        tasks: [
          { title: '收藏当地特色餐厅', tool: 'map-search', toolLabel: '搜餐厅' },
          { title: '查看评分与人均消费' },
          { title: '了解当地饮食禁忌与偏好' },
          { title: '准备外卖/便利店备选方案', tool: 'map-search', toolLabel: '搜便利店' }
        ]
      },
      {
        name: '行李准备',
        estimatedTime: '1h',
        tasks: [
          { title: '列出衣物清单（按天搭配）' },
          { title: '准备洗漱用品与药品' },
          { title: '检查电子设备与充电器' },
          { title: '准备证件复印件与重要文件' },
          { title: '预留行李空间用于购物' }
        ]
      },
      {
        name: '出行提醒',
        estimatedTime: '30min',
        tasks: [
          { title: '设置出发前提醒', tool: 'reminder', toolLabel: '设提醒' },
          { title: '检查证件有效期' },
          { title: '通知家人/朋友行程' },
          { title: '购买旅行保险' },
          { title: '兑换外币/准备支付方式' }
        ]
      }
    ]
  },

  // 实习准备
  internship: {
    type: 'internship',
    name: '实习准备',
    icon: '💼',
    color: 'terracotta',
    difficulty: 3,
    estimatedHours: 25,
    suggestedPrepDays: 30,
    keywords: ['实习', 'internship', 'intern', '大厂', '腾讯', '阿里', '字节', '百度', '美团', '滴滴', '京东', '网易', '华为', '小米', '实习岗位', '暑期实习', '日常实习', '转正', 'offer', '入职', '校招', '提前批', '找工作', '求职', '简历投递', '面经'],
    modules: [
      {
        name: '简历与投递',
        estimatedTime: '3h',
        tasks: [
          { title: '梳理个人项目经历，量化成果' },
          { title: '针对不同岗位定制简历版本' },
          { title: '在招聘网站/官网投递目标公司', tool: 'map-search', toolLabel: '搜公司' },
          { title: '找内推人，发送简历和内推语' },
          { title: '记录投递进度，跟踪状态' }
        ]
      },
      {
        name: '面试准备',
        estimatedTime: '8h',
        tasks: [
          { title: '整理目标公司面经和常考题' },
          { title: '复习岗位相关技术栈与八股文' },
          { title: '刷算法题，重点高频 50 道' },
          { title: '准备自我介绍和项目讲解' },
          { title: '模拟面试，录音复盘' }
        ]
      },
      {
        name: '通勤与住宿',
        estimatedTime: '2h',
        tasks: [
          { title: '确认公司地址和通勤时间', tool: 'map-route', toolLabel: '查通勤' },
          { title: '在公司附近找短租/房源', tool: 'map-search', toolLabel: '搜房源' },
          { title: '对比交通方式：地铁/公交/骑行', tool: 'map-route', toolLabel: '比交通' },
          { title: '确认入职当天的出行方案' }
        ]
      },
      {
        name: '入职准备',
        estimatedTime: '2h',
        tasks: [
          { title: '准备入职材料（身份证、学历证明等）' },
          { title: '确认入职时间和报到流程' },
          { title: '了解团队结构和技术栈' },
          { title: '准备开发环境，安装必要软件' },
          { title: '调整心态，准备融入新团队' }
        ]
      },
      {
        name: '实习期目标',
        estimatedTime: '1h',
        tasks: [
          { title: '制定实习期学习目标和产出计划' },
          { title: '主动约 mentor 沟通期望' },
          { title: '记录每日工作内容和学习笔记' },
          { title: '定期复盘，争取转正机会' }
        ]
      }
    ]
  },

  // 考试复习
  exam: {
    type: 'exam',
    name: '考试复习',
    icon: '📚',
    color: 'sage',
    difficulty: 4,
    estimatedHours: 30,
    suggestedPrepDays: 21,
    keywords: ['考试', 'exam', '复习', 'final', '期末', '认证', '考证', '备战'],
    modules: [
      {
        name: '复习规划',
        estimatedTime: '2h',
        tasks: [
          { title: '确认考试范围与重点' },
          { title: '制定每日复习计划表' },
          { title: '准备复习资料与笔记' },
          { title: '设置每日学习目标' }
        ]
      },
      {
        name: '知识梳理',
        estimatedTime: '10h',
        tasks: [
          { title: '梳理章节知识框架' },
          { title: '整理重点概念与公式' },
          { title: '制作思维导图' },
          { title: '标注薄弱环节' }
        ]
      },
      {
        name: '真题练习',
        estimatedTime: '8h',
        tasks: [
          { title: '收集近 3 年真题' },
          { title: '按章节完成分类练习' },
          { title: '模拟考试环境做整套' },
          { title: '整理错题本' }
        ]
      },
      {
        name: '查漏补缺',
        estimatedTime: '5h',
        tasks: [
          { title: '针对错题复习相关知识点' },
          { title: '请教老师/同学疑难问题' },
          { title: '针对性强化薄弱模块' },
          { title: '整理易混淆概念对比' }
        ]
      },
      {
        name: '考前冲刺',
        estimatedTime: '3h',
        tasks: [
          { title: '回顾错题本与重点笔记' },
          { title: '背诵必考知识点' },
          { title: '调整作息，保证睡眠' },
          { title: '准备考试用品（身份证、笔、计算器）' },
          { title: '提前查看考场位置' }
        ]
      }
    ]
  },

  // 搬家准备
  move: {
    type: 'move',
    name: '搬家准备',
    icon: '📦',
    color: 'sand',
    difficulty: 3,
    estimatedHours: 12,
    suggestedPrepDays: 14,
    keywords: ['搬家', 'move', '迁移', '迁居', '入住', 'relocation'],
    modules: [
      {
        name: '前期准备',
        estimatedTime: '2h',
        tasks: [
          { title: '确定搬家日期' },
          { title: '对比搬家公司报价' },
          { title: '预约搬家公司' },
          { title: '通知房东/物业' }
        ]
      },
      {
        name: '物品整理',
        estimatedTime: '4h',
        tasks: [
          { title: '断舍离不需要的物品' },
          { title: '分类整理书籍、衣物、厨具' },
          { title: '准备打包箱与缓冲材料' },
          { title: '贵重物品单独打包' }
        ]
      },
      {
        name: '打包标记',
        estimatedTime: '3h',
        tasks: [
          { title: '按房间分类打包' },
          { title: '在每个箱子外标记内容与房间' },
          { title: '准备"先开箱"专用箱（生活必需品）' },
          { title: '拍照记录贵重物品状态' }
        ]
      },
      {
        name: '地址变更',
        estimatedTime: '1h',
        tasks: [
          { title: '更新银行卡/信用卡地址' },
          { title: '更新淘宝/快递收货地址' },
          { title: '办理水电气过户' },
          { title: '通知朋友/单位新地址' }
        ]
      },
      {
        name: '搬家当天',
        estimatedTime: '2h',
        tasks: [
          { title: '现场监督搬运' },
          { title: '检查旧房无遗漏' },
          { title: '到达新家核对物品' },
          { title: '清洁新居' }
        ]
      }
    ]
  },

  // 活动策划
  event: {
    type: 'event',
    name: '活动策划',
    icon: '🎉',
    color: 'terracotta',
    difficulty: 3,
    estimatedHours: 25,
    suggestedPrepDays: 21,
    keywords: ['活动', 'event', 'party', '聚会', '策划', '会议', 'meetup', '生日'],
    modules: [
      {
        name: '活动立项',
        estimatedTime: '2h',
        tasks: [
          { title: '确定活动主题与目的' },
          { title: '确定活动时间与地点' },
          { title: '制定预算' },
          { title: '组建筹备小组' }
        ]
      },
      {
        name: '方案策划',
        estimatedTime: '4h',
        tasks: [
          { title: '撰写活动流程脚本' },
          { title: '设计互动环节' },
          { title: '确定嘉宾名单与邀请' },
          { title: '准备物料清单' }
        ]
      },
      {
        name: '场地布置',
        estimatedTime: '3h',
        tasks: [
          { title: '勘察场地并测量尺寸' },
          { title: '设计布置方案' },
          { title: '采购装饰物料' },
          { title: '安排布置人员与时间' }
        ]
      },
      {
        name: '宣传邀请',
        estimatedTime: '3h',
        tasks: [
          { title: '制作邀请函/海报' },
          { title: '发送邀请并统计 RSVP' },
          { title: '在社群/朋友圈宣传' },
          { title: '跟进确认出席名单' }
        ]
      },
      {
        name: '物料准备',
        estimatedTime: '4h',
        tasks: [
          { title: '采购餐饮与饮品' },
          { title: '准备礼品/纪念品' },
          { title: '准备签到表与名牌' },
          { title: '调试音响/投影设备' }
        ]
      },
      {
        name: '现场执行',
        estimatedTime: '4h',
        tasks: [
          { title: '提前到场布置' },
          { title: '签到引导' },
          { title: '按流程主持与衔接' },
          { title: '拍照记录' },
          { title: '活动结束清场' }
        ]
      },
      {
        name: '活动复盘',
        estimatedTime: '2h',
        tasks: [
          { title: '整理照片与视频' },
          { title: '发送感谢信给嘉宾' },
          { title: '收集参与者反馈' },
          { title: '总结经验与不足' }
        ]
      }
    ]
  },

  // 项目交付
  delivery: {
    type: 'delivery',
    name: '项目交付',
    icon: '🚀',
    color: 'sage',
    difficulty: 4,
    estimatedHours: 20,
    suggestedPrepDays: 10,
    keywords: ['交付', 'delivery', '上线', 'release', '部署', 'launch', '发布', 'deadline'],
    modules: [
      {
        name: '需求确认',
        estimatedTime: '2h',
        tasks: [
          { title: '核对需求清单完成情况' },
          { title: '确认变更与延期项' },
          { title: '获取客户/PM 验收' }
        ]
      },
      {
        name: '质量保证',
        estimatedTime: '6h',
        tasks: [
          { title: '完成回归测试' },
          { title: '进行性能与压力测试' },
          { title: '安全扫描与漏洞修复' },
          { title: '兼容性测试（多端/多浏览器）' },
          { title: '修复关键 Bug' }
        ]
      },
      {
        name: '部署准备',
        estimatedTime: '3h',
        tasks: [
          { title: '准备生产环境配置' },
          { title: '执行数据库迁移脚本' },
          { title: '准备回滚方案' },
          { title: '通知相关方上线时间' }
        ]
      },
      {
        name: '文档交付',
        estimatedTime: '4h',
        tasks: [
          { title: '更新 README 与部署文档' },
          { title: '编写用户使用手册' },
          { title: '整理接口文档' },
          { title: '准备运维手册' }
        ]
      },
      {
        name: '上线发布',
        estimatedTime: '2h',
        tasks: [
          { title: '执行上线部署' },
          { title: '冒烟测试验证' },
          { title: '监控告警配置' },
          { title: '发布公告与通知' }
        ]
      },
      {
        name: '收尾复盘',
        estimatedTime: '3h',
        tasks: [
          { title: '召开项目复盘会' },
          { title: '总结经验教训' },
          { title: '归档项目资料' },
          { title: '团队感谢与庆祝' }
        ]
      }
    ]
  }
};

// 关键词匹配：根据项目名称返回最佳匹配模板
function matchTemplate(name) {
  if (!name) return null;
  const lowerName = name.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const key in TEMPLATES) {
    const tpl = TEMPLATES[key];
    let score = 0;
    for (const kw of tpl.keywords) {
      if (lowerName.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// 获取所有模板列表（简要信息）
function listTemplates() {
  return Object.values(TEMPLATES).map(t => ({
    type: t.type,
    name: t.name,
    icon: t.icon,
    color: t.color,
    difficulty: t.difficulty,
    estimatedHours: t.estimatedHours,
    suggestedPrepDays: t.suggestedPrepDays,
    moduleCount: t.modules.length
  }));
}

// 根据 type 获取模板
function getTemplate(type) {
  return TEMPLATES[type] || null;
}

module.exports = {
  TEMPLATES,
  matchTemplate,
  listTemplates,
  getTemplate
};
