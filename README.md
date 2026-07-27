# FlowSync — 懂P型人的情绪任务伙伴

> 不push，陪你慢慢来。你的节奏，你说了算。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MBTI](https://img.shields.io/badge/MBTI-P%E5%9E%8B-orange.svg)]()
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20HarmonyOS%20%7C%20%E5%B0%8F%E8%89%BAAgent-green.svg)]()

---

## 🌟 项目简介

FlowSync 是**市面上第一个专为 P 型人格（MBTI 感知型）设计的情绪任务助手**。

传统效率工具都是为 J 型人（计划型）做的——严格日程、倒计时、待办清单。但对 P 型人来说，这些工具反而带来焦虑：越催越不想动，计划越多越拖延。

FlowSync 反其道而行之：**情绪优先于任务，陪伴优先于 push**。

---

## ✨ 核心功能

### 🌡️ 能量打卡
每日 30 秒自测能量档位，AI 根据状态匹配当天节奏
- 满电 → 给挑战性任务
- 一般 → 给轻松任务
- 低电量 → 只给最小任务，甚至建议休息

### ✂️ 任务微拆解
把大山拆成小土堆，第一步保证 2 分钟内能启动
- 降低心理门槛，解决"启动困难"
- 做不完也没关系，动起来就赢了

### 🍅 柔性番茄钟
25 分钟专注陪伴，想停就停，没有负罪感
- 没有"必须完成"的压力
- 专注结束给正向反馈

### 💡 想法桶
灵感随时记录，不 push 执行
- 想法就是想法，不是待办
- 降低心理负担，想记就记

### 🤍 情绪接住
心情不好的时候，先共情，再建议
- 不说"你应该振作起来"
- 说"我懂，这种感觉太难受了"

### 📊 温柔统计
只看收获，不说"你做得还不够"
- 完成一件事也是成就
- 状态不好的时候，休息也是收获

---

## 🖥️ Agent 控制台演示系统

8 页面完整 Agent 控制台，可直接用于比赛演示。打开 `flowsync/web/index.html` 即可体验。

| # | 页面 | 核心内容 | 交互动画 |
|---|---|---|---|
| 1 | 💬 聊天 | 主对话界面 + 快捷操作 | 一键演示自动播放、打字机效果、光标闪烁 |
| 2 | 📚 知识库 | 4篇专属文档（P型人格/番茄/情绪/拆解） | 点击列表切换文档 |
| 3 | 🔗 工作流 | 5节点流程图（输入→意图→记忆→模型→输出） | 自动流动画、点击节点高亮前置路径 |
| 4 | 🧠 记忆&变量 | 用户变量 + 计数变量 + 长期记忆 | 点击计数卡片+1缩放动画 |
| 5 | ⚡ 技能&插件 | 4大核心技能 + MCP连接状态 | 悬停上浮效果 |
| 6 | ⚙️ Agent设置 | 人设/开场白/模型配置/快捷指令 | 点击快捷指令跳聊天发送 |
| 7 | 🏗️ 技术架构 | 7层架构图 + 技术选型亮点 | 悬停右移动画 |
| 8 | 📊 数据看板 | 用户/对话/完成率/能量提升4大指标 | 数字滚动动画 + 进度条填充 |

### 全局功能

- 🎬 **一键演示** — 90秒自动播放四大功能对话
- 📢 **讲解模式** — 自动轮播8页 + 每页功能介绍气泡
- 🌓 **深浅模式** — 一键切换浅色/深色主题
- 📱 **移动端适配** — 顶部横滑导航，响应式布局

### 一键启动

```bash
# Windows
双击 start.bat

# Mac/Linux
./start.sh
```

脚本自动安装依赖 → 启动服务 → 打开浏览器。

---

## 🏗️ 项目架构

FlowSync 是一个**全栈 + 多端 + AI Agent**的完整项目：

```
FlowSync/
├── flowsync/               # 前端与产品
│   ├── web/                # Web 端（HTML/CSS/JS）
│   ├── pages/              # 产品页面
│   ├── harmonyos/          # HarmonyOS 端（ArkTS）
│   ├── assets/             # 设计素材
│   └── docs/               # 产品文档 + Agent工作流
├── server/                 # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑 + AI 引擎
│   │   └── middleware/     # 中间件
│   └── db/                 # 数据库 Schema
└── docs/                   # 项目文档
```

---

## 🤖 小艺 Agent（华为云工作流）

基于**小艺开放平台**构建的智能体，支持：
- 17 个意图精准分类
- 6 维度长期记忆（用户画像、任务、焦点、想法、能量、情绪）
- 5 个原子计数变量（番茄数、完成任务数、连续天数等）
- 知识库检索增强（P 型效率指南 + 番茄工作法 + 情绪调节）
- P 型心理学专属 Prompt 工程

工作流文件位于 `flowsync/docs/FlowSync-V17.json`，可直接导入小艺开放平台。

---

## 🎯 差异化与创新点

### 垂直人群精准定位
市面效率工具几乎全部服务于 J 型用户，我们第一个系统地将 MBTI-P 型心理学融入产品设计。

### 情绪优先于任务的产品哲学
| 传统工具 | FlowSync |
|---|---|
| 任务 → 情绪（完不成→焦虑） | 情绪 → 任务（状态好→多做） |
| "你应该..." | "我理解你..." |
| 失败 = 惩罚 | 失败 = 正常，随时可以重来 |

### 失败去污名化机制
- **重置今日**：一键清零，重新开始不可耻
- **想法桶**：灵感不等于待办，不用有心理负担
- **柔性番茄**：随时可以停，没有"没完成就是失败"

### Agent 级智能交互
- 17 个意图分支的深度理解
- 长期记忆驱动的个性化回复
- 知识库 + 记忆 + 计数的多维上下文
- 自然语言触发，不用记指令

---

## 🚀 快速开始

### Web 端
```bash
# 直接打开
open flowsync/web/index.html
```

### 后端服务
```bash
cd server
npm install
npm start
```

### 小艺 Agent
1. 打开[小艺开放平台](https://developer.huawei.com/consumer/cn/smart-assistant/)
2. 创建智能体
3. 导入 `flowsync/docs/FlowSync-V17.json`
4. 配置计数变量、用户变量、知识库
5. 测试并发布

详细步骤见 [flowsync/docs/V17_配置清单.md](flowsync/docs/V17_配置清单.md)

---

## 📚 知识库

P 型人专属知识库，包含 4 份核心文档：
- [P 型人格指南](flowsync/docs/knowledge-base/01_P型人格指南.md)
- [番茄工作法指南](flowsync/docs/knowledge-base/02_番茄工作法指南.md)
- [情绪调节微行动指南](flowsync/docs/knowledge-base/03_情绪调节微行动指南.md)
- [任务拆解方法论](flowsync/docs/knowledge-base/04_任务拆解方法论.md)

---

## 🎨 设计理念

**三词定义**：温暖、专注、自在

- 主色调：暖陶土色 #d97757（温暖有亲和力）
- 深色背景：#1b1b19（专注沉浸感）
- 大量留白，不拥挤，不焦虑
- 情绪化但不幼稚，克制但有温度

---

## 🛠️ 技术栈

| 层级 | 技术 |
|---|---|
| 前端 Web | HTML/CSS/JS + 响应式设计（单文件架构） |
| 移动端 | HarmonyOS ArkTS + 桌面卡片 |
| 后端 | Node.js + Express |
| 数据库 | SQLite / PostgreSQL |
| 大模型 | 智谱 GLM-4-Flash（免费可用） |
| AI Agent | 小艺开放平台 + 云工作流 |
| Agent 工作流 | 17 意图分类 / 5 节点 / 全链路可追溯 |
| 设计风格 | impeccable 极简文字风 · 暖陶土色 |

---

## 📋 项目文档

| 文档 | 说明 |
|---|---|
| [多版本简介文案](flowsync/docs/FlowSync_简介与说明_多版本.md) | Slogan、简介、功能介绍、差异化 |
| [PPT内容大纲（20页）](flowsync/docs/PPT内容大纲_20页.md) | 比赛PPT直接抄 |
| [演示视频脚本](flowsync/docs/演示视频脚本_Web版.md) | 5分钟视频逐字稿 |
| [演示操作指南](flowsync/docs/演示操作指南.md) | 上场演示操作步骤+讲解词 |
| [V17 配置清单](flowsync/docs/V17_配置清单.md) | 小艺平台配置步骤 |
| [试运行测试集](flowsync/docs/试运行测试集-V17.md) | Agent 测试用例 |
| [产品文档](flowsync/PRODUCT.md) | 产品设计理念 |
| [交接文档](HANDOVER.md) | 项目交接 + 快速开始 |

---

## 🤝 贡献指南

欢迎贡献！无论是代码、文档、还是建议，都非常感谢。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

---

## 💬 联系我们

有问题或建议？欢迎提 Issue 或联系我们。

---

> **"你的节奏，你说了算。"**
> 
> FlowSync — 不 push，陪你慢慢来 🤍
