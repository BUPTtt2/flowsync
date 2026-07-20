# FlowSync 项目交接文档（给 TRAE）

> 交接时间：2026-07-16
> 你是接手这个项目的 TRAE 助手，请通读本文档后全权推进部署工作

---

## 一、这个项目是什么

**FlowSync** — AI 驱动的任务拆解与执行工具。用户说一句话（如"我要养一只猫"），AI 自动拆解为可执行模块和任务，每个任务旁嵌入工具按钮（地图/路线/天气/航班/高铁/日历/提醒），一键直达外部服务。

项目完成度 **85%**，核心功能全部开发完毕。当前唯一目标是：**部署到公网，拿到可访问的在线体验地址，用于比赛提交**。

---

## 二、当前进度

### 已完成

- 完整前端应用（30+ 功能：AI 生成、任务管理、工具集成、能量自适应、番茄钟、想法桶、甘特图等）
- 后端服务（Node.js + Express + SQLite）
- AI 引擎（智谱 GLM-4-Flash，动态生成项目模块任务）
- 7 种任务级工具集成（高德地图/和风天气/12306/携程/Google Calendar/系统提醒）
- 安全加固（JWT 强密钥、CORS 配置、登录限流、AI 生成限流）
- 公开 Demo API 路由（免登录，IP 限流防滥用）
- 后端支持同时托管前端静态文件（通过环境变量 `SERVE_STATIC=1` 开启）
- Railway 部署配置文件（Dockerfile + railway.toml + nixpacks.toml）

### 待完成（你的任务）

1. 协助用户将项目推到 GitHub
2. 在 Railway 部署后端 + 前端
3. 配置环境变量
4. 拿到公网域名并验证一切正常
5. 把完整的 app.html 打包成 zip（备选提交方式）

---

## 三、你要做的事（完整流程）

### 第 1 步：确认项目结构

解压项目后，目录结构：

```
项目根目录/
├── server/                    # 后端服务（Node.js）
│   ├── src/
│   │   ├── app.js             # 入口文件（含静态文件托管逻辑）
│   │   ├── routes/            # 路由（auth/projects/modules/tasks/reminders/external/energy/demo）
│   │   ├── services/          # 服务（aiEngine/amapService/reminderService）
│   │   ├── utils/             # 工具（templateLibrary）
│   │   └── middleware/        # 中间件（auth）
│   ├── db/schema.sql          # 数据库初始化
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile             # Docker 构建配置（Node 22）
│   ├── railway.toml           # Railway 部署配置
│   ├── nixpacks.toml          # Nixpacks 构建配置
│   └── .env.example           # 环境变量模板
├── flowsync/
│   └── web/
│       ├── index.html         # 落地页（创意产物 HTML）
│       ├── app.html           # 完整 App（210KB，30+ 功能）
│       └── privacy.html       # 隐私政策
├── docs/
│   └── android-release-guide.md
└── HANDOVER.md                # 本文档
```

### 第 2 步：推到 GitHub

1. 在 GitHub 新建一个仓库（名字随意，如 `flowsync-app`）
2. 把项目所有文件推上去
3. 注意：`.env` 文件已被排除，不会推上去，环境变量在 Railway 里手动配置

### 第 3 步：部署到 Railway

**前置条件**：用户已注册 Railway 账号（用 GitHub 登录即可）

**部署步骤**：

1. 登录 Railway → **New Project** → **Deploy from GitHub repo**
2. 选择刚才推的仓库
3. **重要**：Railway 默认从仓库根目录构建，但后端代码在 `server/` 子目录。需要在 Railway 项目 **Settings** 里把 **Root Directory** 设为 `server/`
4. **设置环境变量**（在项目 Variables 页添加）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `fs7kP9vQx2mZn4Rb8Lc6Tt3WqY1Ha5Dj7Kg2Mp9Xw4Vr8Bn3Cs6Ft1Yh0Lw7Qe2` | JWT 签名密钥 |
| `AMAP_API_KEY` | 向用户要 | 高德地图 API Key |
| `LLM_API_KEY` | 向用户要 | 智谱 AI API Key |
| `LLM_API_URL` | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | 智谱 API 地址 |
| `LLM_MODEL` | `glm-4-flash` | 使用的模型 |
| `CORS_ORIGIN` | `*` | 允许所有来源访问（demo 阶段） |
| `SERVE_STATIC` | `1` | 开启前端静态文件托管（关键！开启后访问根路径即可看到完整应用） |

5. 点 **Deploy** 等待构建（2-3 分钟）
6. 构建成功后，去 **Settings → Networking → Generate Domain**，拿到公网域名，格式类似：
   `https://flowsync-app-production.up.railway.app`

### 第 4 步：验证部署

1. 浏览器打开 `https://你的域名/health`，应返回：
   `{"success":true,"data":{"status":"ok","time":"..."}}`
2. 浏览器打开 `https://你的域名/`，应看到 FlowSync 完整应用界面（terracotta 暖色系）
3. 在应用中输入"我要养一只猫"，点生成，应看到：
   - 加载动画"Agent 正在虚空排布…"
   - 2-5 秒后生成模块和任务列表
   - 每个任务旁有工具按钮（地图/路线/天气等）
   - 点击工具按钮能跳转到对应服务

### 第 5 步：打包 app.zip（备选提交）

比赛也接受 zip 格式的 HTML 文件上传。把 `flowsync/web/app.html` 单独压缩：
- 文件名：`FlowSync-Demo.zip`
- 里面只有 `app.html` 一个文件
- 注意：zip 里的 app.html 的 API 地址需要改为 Railway 域名，否则打开会连不上后端

---

## 四、最终交付物

部署完成后，告诉用户以下信息：

| 交付物 | 说明 |
|--------|------|
| **在线体验地址** | `https://xxx.up.railway.app`，评审直接打开即可体验完整应用 |
| `FlowSync-Demo.zip` | 打包好的 app.html，备选提交方式 |

---

## 五、常见问题

**Q: Railway 构建失败？**
A: 看构建日志。最常见的原因：(1) Root Directory 没设为 `server/`；(2) 环境变量没设全；(3) Dockerfile 路径问题。

**Q: 打开域名看到应用但 AI 生成失败？**
A: 检查 `LLM_API_KEY` 和 `LLM_API_URL` 是否正确。AI 生成需要有效的智谱 API Key。

**Q: CORS 跨域错误？**
A: 确认 `CORS_ORIGIN` 设为 `*`。如果 SERVE_STATIC=1 且前后端同域，通常不会有跨域问题。

**Q: 页面打开是空白？**
A: 确认 `SERVE_STATIC=1` 已设置。如果没有这个环境变量，后端不会托管前端文件，需要单独部署前端。

**Q: 429 限流错误？**
A: 正常，AI 生成接口有频率限制。等一分钟再试。

**Q: 应用需要登录吗？**
A: 完整应用有登录功能，但公开 Demo API（`/api/demo/generate`）免登录。用户可以在应用中注册账号使用完整功能，也可以直接在首页使用 Demo 输入框体验 AI 生成。

---

> 文档结束。接手后请先通读一遍，然后按步骤执行。有任何不确定的地方，直接问用户。祝顺利 ✦
