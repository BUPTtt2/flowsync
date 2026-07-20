# FlowSync Android 上架准备清单

> 更新日期：2026-07-14
> 目标市场：华为应用市场、小米应用商店、OPPO 开放平台、vivo 开发者平台、应用宝

---

## 一、应用图标

### 1.1 即梦 AI 生成 Prompt

**主图标（512×512）**：
```
极简扁平风格 app 图标，圆形底色深墨黑 #1b1b19，中央是一个流动的毛笔笔触形成的"Fl"字母变体，笔触末端渐变为暖陶土色 #d97757，背景有微妙的八卦卦象纹理若隐若现，整体克制温暖，像一枚玉佩，无文字，无立体阴影，flat design，适合安卓 launcher 图标
```

**自适应图标前景层（1024×1024，透明背景）**：
```
flat icon design, a flowing calligraphic brushstroke forming an abstract "F" shape in terracotta color #d97757 on transparent background, minimalist, no text, no shadow, centered, suitable for Android adaptive icon foreground layer
```

**自适应图标背景层（1024×1024）**：
```
solid color background #1b1b19 with subtle bagua trigram texture pattern, very faint, minimal, flat design
```

**启动页 Logo（1024×1024）**：
```
minimalist logo on dark background #1b1b19, a single flowing brushstroke in terracotta #d97757 forming an abstract circular shape suggesting flow and sync, with faint ink wash texture around it, elegant and warm, no text, centered composition
```

### 1.2 图标尺寸清单

生成后需要裁剪为以下尺寸（放至 `flowsync/android/app/src/main/res/` 下对应目录）：

| 目录 | 尺寸 | 用途 |
|------|------|------|
| `mipmap-mdpi/` | 48×48 | 低密度 |
| `mipmap-hdpi/` | 72×72 | 中密度 |
| `mipmap-xhdpi/` | 96×96 | 高密度 |
| `mipmap-xxhdpi/` | 144×144 | 超高密度 |
| `mipmap-xxxhdpi/` | 192×192 | 最高密度 |
| `mipmap-anydpi-v26/` | 自适应图标 XML | Android 8.0+ |

> 用 Capacitor 命令自动生成：`npx capacitor-assets generate --android`

---

## 二、应用截图

### 2.1 实机截图方案（推荐）

> 已尝试用 AI 图像 API 生成截图，但返回结果为占位图（与真实界面不符），市场审核也不接受 AI 生成截图。改为实机截图。

**操作步骤**：
1. 将 `flowsync/android/app/build/outputs/apk/release/app-release.apk` 传到 Android 手机（API 29+）
2. 安装并启动 FlowSync（需先启动后端服务，或在 app.html 注入线上 API 地址）
3. 依次截取以下 5 个页面（电源键 + 音量下键截图）
4. 截图传回电脑，确保 1080×1920 或更高，无通知栏/截图水印干扰

**需要截取的 5 个页面**：
1. **启动/登录页** - 应用启动后第一个界面（登录或注册）
2. **工作台主页** - 登录后主界面，显示项目列表和 AI 输入框
3. **AI 生成加载状态** - 输入需求（如"我要养一只猫"）后，显示加载动画"Agent 正在虚空排布..."
4. **项目详情页** - 点开一个项目，显示模块和任务展开的界面
5. **设置/API 接入面板** - 设置页，显示 API Key 配置区域

**备注**：如果暂时没有后端服务，可先用 debug APK + localhost 后端截图（仅供占位，正式上架前需替换为线上版本的截图）。

### 2.2 截图要求

| 市场 | 尺寸要求 | 最少张数 | 格式 |
|------|---------|---------|------|
| 华为 | 1080×1920 或 1440×2560 | 3-5 张 | JPG/PNG，单张≤5MB |
| 小米 | 1080×1920 | 3-5 张 | JPG/PNG |
| OPPO | 1080×1920 | 3-5 张 | JPG/PNG |
| vivo | 1080×1920 | 3-5 张 | JPG/PNG |
| 应用宝 | 480×800 ~ 1080×1920 | 3-5 张 | JPG/PNG |

---

## 三、应用描述文案

### 3.1 一句话简介（80字内）

```
FlowSync — 给 P 型人格的 AI 任务伙伴。说一句话，Agent 自动拆解为可执行模块，地图/天气/提醒一步直达。
```

### 3.2 完整描述（500字内）

```
FlowSync 是一款 AI 驱动的任务管理工具，专为 P 型人格（MBTI）及创意工作者打造。

【核心功能】
• AI Agent 动态生成：输入任何需求，Agent 自动拆解为模块和可执行任务，不是模板匹配，而是 AI 实时生成
• 任务级工具嵌入：每个任务旁显示工具按钮，一键查询地图、路线、天气、航班、高铁，设置日历提醒
• 沉浸式聚焦：一次只看一个任务，完成自动切换，降低启动心理阻力
• 语音输入：说一句话就能创建任务，AI 自动解析为结构化模块
• 情绪自适应：根据精力状态推荐下一步行动

【适用场景】
• 旅行计划（自动生成行程，嵌入地图搜索、天气查询、航班查询）
• 实习准备（简历投递、面试准备、通勤方式、入职准备全流程）
• 学习计划（课程拆解、复习安排、考试倒计时）
• 生活事务（养宠物、搬家、装修，任何需求都能拆解）

【产品特色】
• Agent 优先：LLM 动态生成优先，模板库兜底，任意输入都能智能响应
• 功能联动：任务与工具深度整合，不是各管各的独立功能
• 暖色设计：terracotta 主色调，温暖克制，不焦虑不冷漠
• 隐私安全：API Key 仅保存在本机，不上传服务器

【开发者】
FlowSync 团队
```

### 3.3 关键词标签

```
任务管理, AI, 效率, 时间管理, 待办事项, 计划, 提醒, P型人格, ADHD, 创意工作者, 语音输入, 沉浸式, 地图, 天气, 航班
```

---

## 四、签名 Release APK

### 4.1 生成签名密钥

```bash
# 在项目根目录执行
keytool -genkey -v ^
  -keystore flowsync.keystore ^
  -alias flowsync ^
  -keyalg RSA -keysize 2048 ^
  -validity 10000 ^
  -storepass YOUR_STORE_PASSWORD ^
  -keypass YOUR_KEY_PASSWORD ^
  -dname "CN=FlowSync, OU=Dev, O=FlowSync, L=Beijing, ST=Beijing, C=CN"
```

### 4.2 配置签名

在 `flowsync/android/app/build.gradle` 中添加：
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../../flowsync.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'flowsync'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4.3 构建 Release APK

```bash
cd flowsync\android
.\gradlew assembleRelease --no-daemon
```

输出路径：`flowsync/android/app/build/outputs/apk/release/app-release.apk`

---

## 五、隐私政策

### 5.1 需要准备的隐私政策页面

FlowSync 涉及以下用户数据：
- 用户账号（用户名、密码——bcrypt 加密存储）
- 用户项目数据（任务、模块）
- API Key（高德地图、智谱 AI、和风天气——仅存浏览器 localStorage，不上传服务器）
- 网络请求（调用高德/智谱/和风 API）

### 5.2 隐私政策模板要点

```
隐私政策 URL 需要一个可访问的网页地址。建议：
1. 在 GitHub Pages 创建一个简单的 privacy.html
2. 或者部署到你的服务器上
```

需包含：
1. 收集的信息类型
2. 信息使用方式
3. 信息存储位置（本地 vs 服务器）
4. 第三方 SDK 说明（高德地图、智谱 AI、和风天气）
5. 用户权利（删除账号、导出数据）
6. 联系方式

### 5.3 第三方 SDK 清单

| SDK | 用途 | 数据收集 | 隐私政策 |
|-----|------|---------|---------|
| 高德地图 SDK | 地点搜索、路线规划、天气查询 | 位置信息（仅查询时） | https://lbs.amap.com/pages/privacy/ |
| 智谱 AI API | 文本生成（任务拆解） | 用户输入文本 | https://www.zhipuai.cn/privacy |
| 和风天气 API | 天气查询 | 城市名称 | https://www.qweather.com/terms/privacy |

---

## 六、后端部署

### 6.1 部署清单

| 项目 | 说明 | 状态 |
|------|------|------|
| 云服务器 | 阿里云 ECS / 腾讯云轻量（2核4G即可） | ❌ 待购买 |
| 域名 | 需备案（国内服务器必须） | ❌ 待购买 |
| HTTPS 证书 | Let's Encrypt 免费证书 | ❌ 待配置 |
| Nginx 反向代理 | 80/443 → 3000 | ❌ 待配置 |
| PM2 进程管理 | `npm i -g pm2 && pm2 start src/app.js` | ❌ 待配置 |
| 环境变量 | .env 文件（API Key、JWT Secret） | ❌ 待配置 |
| 数据库 | SQLite（已有，迁移即可） | ✅ 已有 |

### 6.2 修改前端 API 地址

在 `app.html` 的 `<head>` 中加入：
```html
<script>window.FLOWSYNC_API_BASE = 'https://你的域名';</script>
```

然后重新构建 APK：
```bash
cd flowsync
npx cap sync android
cd android
.\gradlew assembleRelease --no-daemon
```

### 6.3 Nginx 配置参考

```nginx
server {
    listen 443 ssl;
    server_name api.你的域名.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 七、各市场上架材料清单

### 7.1 通用材料

| 材料 | 规格 | 状态 |
|------|------|------|
| 应用图标 | 512×512 PNG（透明背景） | ❌ 待生成 |
| 应用截图 | 5 张 1080×1920 | ❌ 待生成 |
| 应用描述 | 500字内 | ✅ 已写好 |
| 一句话简介 | 80字内 | ✅ 已写好 |
| 关键词标签 | 3-15 个 | ✅ 已写好 |
| 签名 APK | release 版 | ❌ 待构建 |
| 隐私政策 URL | 可访问网页 | ❌ 待创建 |

### 7.2 各市场特殊要求

| 市场 | 额外要求 | 备注 |
|------|---------|------|
| 华为应用市场 | 软件著作权证书 | 需提前申请，周期约 30 个工作日 |
| 小米应用商店 | 企业开发者需营业执照 | 个人开发者可注册 |
| OPPO | 应用安全检测报告 | 提交后自动检测 |
| vivo | 首次提交需人工审核 | 周期约 3-5 个工作日 |
| 应用宝 | QQ 互联审核 | 如果不需要登录可跳过 |

### 7.3 软件著作权申请（华为市场必需）

申请地址：https://register.ccopyright.com.cn/
所需材料：
- 软件源代码（前 30 页 + 后 30 页）
- 软件说明书（操作手册）
- 申请人身份证明
- 费用：约 200-400 元（加急另算）
- 周期：普通 30 个工作日，加急 5-10 个工作日

### 7.4 开发者账号注册详细指南

| 市场 | 注册入口 | 账号类型 | 费用 | 审核周期 | 所需材料 |
|------|---------|---------|------|---------|---------|
| 华为应用市场 | https://developer.huawei.com/consumer/cn/apphub/ | 个人/企业 | 个人 0 元；企业 0 元（需认证） | 1-3 个工作日 | 身份证（个人）/营业执照（企业）+ 软件著作权 |
| 小米应用商店 | https://dev.mi.com/console/app/list | 个人/企业 | 个人 0 元；企业 0 元 | 1-2 个工作日 | 身份证 / 营业执照 + 对公账户验证 |
| OPPO 开放平台 | https://open.oppomobile.com/ | 个人/企业 | 0 元 | 1-3 个工作日 | 身份证 / 营业执照 |
| vivo 开发者平台 | https://dev.vivo.com.cn/ | 个人/企业 | 0 元 | 3-5 个工作日（首次人工审核） | 身份证 / 营业执照 |
| 应用宝 | https://open.tencent.com/ | 个人/企业 | 0 元 | 1-3 个工作日 | 身份证 / 营业执照 + QQ 号 |

**注册通用流程**：
1. 用手机号注册开发者账号
2. 选择"个人开发者"或"企业开发者"
3. 上传身份证照片（个人）或营业执照（企业）
4. 等待实名审核（通常 1-3 个工作日）
5. 审核通过后即可创建应用、上传 APK

**个人 vs 企业选择建议**：
- **个人开发者**：0 费用，只需身份证，适合个人项目。但部分市场（如华为）上架某些类型应用需企业资质
- **企业开发者**：需营业执照和对公账户，可上架所有类型应用，审核更顺利
- **FlowSync 建议**：先用个人开发者上架小米/OPPO/vivo/应用宝；华为市场如要求软著，同步申请

**注册顺序建议**（按审核速度）：
1. 小米应用商店（最快，1-2 天）
2. 应用宝（1-3 天）
3. OPPO（1-3 天）
4. vivo（3-5 天，首次人工审核）
5. 华为（需软著，最后提交）

**注意事项**：
- 同一应用在所有市场保持相同的 applicationId（`com.flowsync.app`）和包名
- 签名 APK 的 keystore 务必备份（`flowsync.keystore` + 密码 `FlowSync@Release2026!Store`），丢失后无法更新应用
- 各市场应用名称、图标、截图、描述保持一致，便于用户识别
- 隐私政策 URL 必须可访问（部署后端后填入 `https://你的域名/privacy.html`）

---

## 八、上线前自检清单

### 8.1 功能测试

- [ ] 用户注册/登录正常
- [ ] AI 生成功能正常（输入任意内容能生成模块和任务）
- [ ] 任务工具按钮可点击（地图搜索、天气、提醒等）
- [ ] 任务复选框可勾选
- [ ] 项目删除正常
- [ ] 设置页 API Key 配置可保存
- [ ] 网络断开时错误提示正常

### 8.2 兼容性测试

- [ ] Android 12 (API 31) 以上正常
- [ ] Android 10 (API 29) 最低版本正常
- [ ] 不同屏幕尺寸适配（手机/平板）
- [ ] 深色/浅色模式

### 8.3 安全检查

- [ ] API Key 不打包进 APK
- [ ] JWT Secret 已修改为强随机串
- [ ] CORS 已限制为你的域名
- [ ] 输入长度校验已生效
- [ ] 登录限速已生效
- [ ] AI 生成限速已生效

### 8.4 性能检查

- [ ] 冷启动时间 < 3 秒
- [ ] AI 生成超时有友好提示
- [ ] 长列表滚动流畅
- [ ] 内存占用正常

---

## 九、版本规划

| 版本 | 功能 | 状态 |
|------|------|------|
| v1.0.0 | AI 动态生成 + 任务管理 + 工具按钮 | ✅ 开发完成 |
| v1.0.1 | Bug 修复 + 性能优化 | 上线后迭代 |
| v1.1.0 | 推送通知 + 离线模式 | 后续迭代 |
| v1.2.0 | 语音输入 + OCR 识别 | 后续迭代 |
| v2.0.0 | 多设备同步 + 团队协作 | 长期规划 |

---

## 十、联系方式

如有审核问题，联系邮箱：[你的邮箱]

---

> 本文档随开发进度持续更新。最后修改：2026-07-14
