import re

path = r'd:\Appt\大三下\Trae赛2\P人push\flowsync\web\app.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace view-dashboard with view-today
old_dashboard = '''    <!-- ============ DASHBOARD ============ -->
    <div class="view" id="view-dashboard">
      <!-- S10: Proactive Pull banner (动态显示) -->
      <div id="proactiveBanner"></div>

      <!-- S1: 10s 能量打卡 -->
      <div class="energy-checkin fade-up" style="margin-bottom:24px">
        <div class="card__label">每日 10 秒 · 能量打卡</div>
        <h3 class="energy-checkin__title">今天感觉几格电？</h3>
        <div class="energy-checkin__sub">AI 会根据你的状态重排今日任务</div>
        <div class="energy-checkin__options">
          <div class="energy-opt" data-energy="full" onclick="selectEnergy(this,'full')">
            <div class="energy-opt__dot energy-opt__dot--full">满</div>
            <span class="energy-opt__label">满电</span>
          </div>
          <div class="energy-opt" data-energy="ok" onclick="selectEnergy(this,'ok')">
            <div class="energy-opt__dot energy-opt__dot--ok">良</div>
            <span class="energy-opt__label">不错</span>
          </div>
          <div class="energy-opt" data-energy="mid" onclick="selectEnergy(this,'mid')">
            <div class="energy-opt__dot energy-opt__dot--mid">中</div>
            <span class="energy-opt__label">一般</span>
          </div>
          <div class="energy-opt" data-energy="low" onclick="selectEnergy(this,'low')">
            <div class="energy-opt__dot energy-opt__dot--low">累</div>
            <span class="energy-opt__label">偏累</span>
          </div>
        </div>
        <div class="energy-checkin__result" id="energyResult"></div>
      </div>

      <div class="dash">
        <div class="dash__left">
          <div class="focus-now fade-up">
            <div class="card__label">下一个动作</div>
            <h2 class="focus-now__title">完成产品方案初稿</h2>
            <div class="focus-now__meta">
              <span class="focus-now__meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                今天 18:00
              </span>
              <span class="chip chip--high">高优先级</span>
              <span class="focus-now__meta-item">2/5 子任务</span>
            </div>
            <div class="progress"><div class="progress__fill" style="width:40%"></div></div>
            <button class="btn btn--primary" onclick="switchView('focus')">
              开始聚焦
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>

          <div class="card fade-up" style="animation-delay:0.1s">
            <div class="card__label">今日活动</div>
            <div class="feed">
              <div class="feed__item"><span>张三 完成了「数据收集」</span><span class="feed__time">10:32</span></div>
              <div class="feed__item"><span>你 创建了「回复客户邮件」</span><span class="feed__time">09:15</span></div>
              <div class="feed__item"><span>AI 推荐了 3 个低耗任务</span><span class="feed__time">08:00</span></div>
              <div class="feed__item"><span>小王 更新了依赖项状态</span><span class="feed__time">昨天</span></div>
            </div>
          </div>
        </div>

        <div class="dash__right">
          <div class="card fade-up" style="animation-delay:0.15s">
            <div class="card__label">能量状态</div>
            <div class="gauge-wrap">
              <div class="gauge">
                <svg class="gauge__svg" viewBox="0 0 120 120">
                  <circle class="gauge__track" cx="60" cy="60" r="50"/>
                  <circle class="gauge__fill" cx="60" cy="60" r="50" stroke-dasharray="314" stroke-dashoffset="94" data-gauge-target="94"/>
                </svg>
                <div class="gauge__value">
                  <span class="gauge__num" data-count="70">0</span>
                  <span class="gauge__unit">%</span>
                </div>
              </div>
              <div class="gauge__status">状态不错 · 可上硬骨头</div>
            </div>
          </div>

          <div class="card fade-up" style="animation-delay:0.2s">
            <div class="card__label">本周数据</div>
            <div class="stats">
              <div class="stat">
                <div class="stat__label">今日完成</div>
                <div class="stat__value" data-count="2">0</div>
              </div>
              <div class="stat">
                <div class="stat__label">连续天数</div>
                <div class="stat__value" data-count="3">0</div>
              </div>
              <div class="stat">
                <div class="stat__label">本周效率</div>
                <div class="stat__value"><span data-count="78">0</span>%</div>
              </div>
              <div class="stat">
                <div class="stat__label">待处理</div>
                <div class="stat__value" data-count="6">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>'''

new_today = '''    <!-- ============ TODAY ============ -->
    <div class="view active" id="view-today">
      <!-- S10: Proactive Pull banner (动态显示) -->
      <div id="proactiveBanner"></div>

      <!-- 区域 1：今日概览卡片行 -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:24px;max-width:1200px">
        <!-- 能量状态 -->
        <div class="card fade-up" id="today-energy-section">
          <div class="card__label">能量状态</div>
          <div class="mood__slider-wrap" style="padding:20px">
            <div class="mood__gauge" style="width:140px;height:140px">
              <svg class="gauge__svg" viewBox="0 0 120 120">
                <circle class="gauge__track" cx="60" cy="60" r="50"/>
                <circle class="gauge__fill" id="moodGaugeFill" cx="60" cy="60" r="50" stroke-dasharray="314" stroke-dashoffset="94" data-gauge-target="94" style="stroke:var(--terracotta)"/>
              </svg>
              <div class="gauge__value">
                <span class="mood__value" id="moodValue">70</span>
                <span class="gauge__unit">%</span>
              </div>
            </div>
            <input type="range" min="0" max="100" value="70" class="mood__slider" id="moodSlider" oninput="updateMood(this.value)">
            <div class="mood__labels">
              <span>没电</span>
              <span>一般</span>
              <span>满电</span>
            </div>
            <div class="mood__status" id="moodStatus">状态不错 · 可以上硬骨头</div>
          </div>
          <div class="mood__recs" style="margin-top:12px">
            <div class="mood__recs-label" id="recsLabel">推荐 3 件中等难度任务</div>
            <div id="recsList" class="stagger" style="display:flex;flex-direction:column;gap:12px">
              <!-- 由 JS 渲染 -->
            </div>
          </div>
        </div>

        <!-- 今日统计 -->
        <div class="card fade-up" style="animation-delay:0.1s">
          <div class="card__label">今日统计</div>
          <div class="stats" style="grid-template-columns:1fr 1fr 1fr">
            <div class="stat">
              <div class="stat__label">今日完成</div>
              <div class="stat__value" data-count="2">0</div>
            </div>
            <div class="stat">
              <div class="stat__label">待处理</div>
              <div class="stat__value" data-count="6">0</div>
            </div>
            <div class="stat">
              <div class="stat__label">连续天数</div>
              <div class="stat__value" data-count="3">0</div>
            </div>
          </div>
        </div>

        <!-- 下一个动作 -->
        <div class="focus-now fade-up" style="animation-delay:0.15s">
          <div class="card__label">下一个动作</div>
          <h2 class="focus-now__title">完成产品方案初稿</h2>
          <div class="focus-now__meta">
            <span class="focus-now__meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              今天 18:00
            </span>
            <span class="chip chip--high">高优先级</span>
            <span class="focus-now__meta-item">2/5 子任务</span>
          </div>
          <div class="progress"><div class="progress__fill" style="width:40%"></div></div>
          <button class="btn btn--primary" onclick="switchView('today');setTimeout(function(){document.getElementById('today-focus-section').scrollIntoView({behavior:'smooth'})},300)">
            开始聚焦
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>

      <!-- 区域 2：时间块 + 番茄钟 -->
      <div class="dash" style="margin-bottom:24px">
        <div class="dash__left">
          <div class="timeblock fade-up">
            <div class="timeblock__head">
              <div>
                <h2 class="timeblock__title">今日时间块</h2>
                <p class="timeblock__sub">让时间可见 · 任务按预估时长放进 8h 工作日</p>
              </div>
              <div class="timeblock__summary">
                <div class="timeblock__summary-item" id="tbCapacity">容量 8h</div>
                <div class="timeblock__summary-item" id="tbPlanned">计划 5.5h</div>
                <div class="timeblock__summary-item" id="tbRemaining">剩余 2.5h</div>
              </div>
            </div>
            <div class="timeblock__grid" id="timeblockGrid"></div>
          </div>
        </div>
        <div class="dash__right">
          <div class="fade-up" style="animation-delay:0.1s">
            <div class="pomodoro" style="flex-direction:column;align-items:center;gap:16px;padding:24px;height:100%;justify-content:center">
              <div class="pomodoro__ring" style="width:160px;height:160px">
                <div class="pomodoro__time" id="pomoTime">25:00</div>
                <div class="pomodoro__breathe"></div>
              </div>
              <div class="pomodoro__controls" style="flex-direction:row;margin-left:0">
                <button class="pomodoro__btn" id="pomoToggle" onclick="togglePomo()" title="开始/暂停">
                  <svg id="pomoPlay" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>
                  <svg id="pomoPause" viewBox="0 0 24 24" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                </button>
                <button class="pomodoro__btn" onclick="resetPomo()" title="重置">
                  <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 区域 3：任务聚焦 -->
      <div id="today-focus-section" class="fade-up" style="margin-bottom:24px">
        <div class="focus-mode">
          <div class="focus-mode__topbar">
            <div class="focus-mode__counter">第 <strong id="taskIdx">1</strong> 件 · 共 <strong id="taskTotal">3</strong> 件待办</div>
            <div class="focus-mode__topbar-actions">
              <button class="btn btn--ghost" id="pomoFsBtn" onclick="togglePomoFullscreen()" title="沉浸模式">⛶</button>
              <button class="btn btn--ghost" onclick="skipTask()">跳过</button>
            </div>
          </div>

          <div class="task-focus-card" id="focusCard">
            <h2 class="task-focus-card__title" id="focusTitle">完成产品方案初稿</h2>
            <div class="task-focus-card__meta">
              <span class="chip chip--high" id="focusPriority">高优先级</span>
              <span class="focus-now__meta-item" id="focusDue">今天 18:00</span>
              <span class="focus-now__meta-item" id="focusEst">预估 2h</span>
            </div>
            <div class="task-focus-card__divider"></div>
            <div class="subtasks" id="subtaskList">
              <!-- 由 JS 渲染 -->
            </div>
            <div class="task-focus-card__progress">
              <div class="task-focus-card__progress-label">
                <span>进度</span>
                <span id="focusProgressText">0 / 5</span>
              </div>
              <div class="progress"><div class="progress__fill" id="focusProgress" style="width:0%"></div></div>
            </div>

            <!-- S12: 创意状态机 -->
            <div class="creative-state" id="creativeState">
              <span class="creative-state__label">阶段</span>
              <span class="creative-state__chip" data-state="idea" onclick="setCreativeState('idea')">想法</span>
              <span class="creative-state__chip active" data-state="drafting" onclick="setCreativeState('drafting')">起草</span>
              <span class="creative-state__chip" data-state="reviewing" onclick="setCreativeState('reviewing')">审阅</span>
              <span class="creative-state__chip" data-state="shipped" onclick="setCreativeState('shipped')">交付</span>
              <div class="creative-state__progress"><div class="creative-state__progress-fill" id="creativeProgress" style="width:25%"></div></div>
            </div>

            <!-- S2+S3+S4: 工具栏 + S5: kind line -->
            <div class="task-tools">
              <button class="tool-btn" onclick="toggleSplitTree()">
                <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                拆到可执行
              </button>
              <span class="tool-btn est-tooltip" style="cursor:help">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                AI 估时 <span id="estTime">2h</span>
                <span class="est-tooltip__body">基于类型「创作类」+ 历史 5 次 · 中位 1.8h · 区间 1.2-2.5h</span>
              </span>
              <button class="tool-btn" onclick="showSOS()">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
                拖延 SOS
              </button>
            </div>

            <div class="subtask-tree" id="splitTree">
              <!-- 由 JS 渲染 -->
            </div>

            <div class="kind-line" id="kindLine">
              <strong>慢一点没关系</strong> · P 型人格的节奏本来就不同于 J 型，今天能开始就已经赢了一半。
            </div>

            <div class="swipe-complete" id="swipeComplete" onclick="completeTask()">
              <div class="swipe-complete__fill"></div>
              <div class="swipe-complete__hint">滑动标记完成 →</div>
              <div class="swipe-complete__knob">
                <svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 区域 4：今日活动 -->
      <div class="card fade-up" style="max-width:1200px">
        <div class="card__label">今日活动</div>
        <div class="feed">
          <div class="feed__item"><span>张三 完成了「数据收集」</span><span class="feed__time">10:32</span></div>
          <div class="feed__item"><span>你 创建了「回复客户邮件」</span><span class="feed__time">09:15</span></div>
          <div class="feed__item"><span>AI 推荐了 3 个低耗任务</span><span class="feed__time">08:00</span></div>
          <div class="feed__item"><span>小王 更新了依赖项状态</span><span class="feed__time">昨天</span></div>
        </div>
      </div>
    </div>'''

content = content.replace(old_dashboard, new_today)

# 2. Delete view-voice
old_voice = '''    <!-- ============ VOICE INPUT ============ -->
    <div class="view" id="view-voice">
      <div class="voice">
        <div class="voice__stage" id="voiceStage">
          <div class="voice__prompt" id="voicePrompt">按住麦克风说话<br>AI 会自动拆解成结构化任务</div>
          <button class="mic-btn" id="micBtn" onclick="startVoiceDemo()">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21"/></svg>
          </button>
          <div class="voice__hint" id="voiceHint">点击开始 · 或选一个示例</div>
        </div>

        <div class="voice__examples" id="voiceExamples">
          <div class="voice__examples-label">示例</div>
          <button class="voice__example" onclick="runExample(0)">明天要交方案，得找小王要数据，提醒他下午三点前发我。</button>
          <button class="voice__example" onclick="runExample(1)">把周末旅行拆一下，要订酒店和查路线，再排个行李清单。</button>
          <button class="voice__example" onclick="runExample(2)">今天状态一般，给我安排点轻松的事先做。</button>
        </div>
      </div>
    </div>

'''
content = content.replace(old_voice, '')

# 3. Delete view-focus
old_focus = '''    <!-- ============ FOCUS MODE ============ -->
    <div class="view" id="view-focus">
      <div class="focus-mode">
        <div class="focus-mode__topbar">
          <div class="focus-mode__counter">第 <strong id="taskIdx">1</strong> 件 · 共 <strong id="taskTotal">3</strong> 件待办</div>
          <div class="focus-mode__topbar-actions">
            <button class="btn btn--ghost" id="pomoFsBtn" onclick="togglePomoFullscreen()" title="沉浸模式">⛶</button>
            <button class="btn btn--ghost" onclick="skipTask()">跳过</button>
          </div>
        </div>

        <div class="pomodoro">
          <div class="pomodoro__ring">
            <div class="pomodoro__time" id="pomoTime">25:00</div>
            <div class="pomodoro__breathe"></div>
          </div>
          <div class="pomodoro__controls">
            <button class="pomodoro__btn" id="pomoToggle" onclick="togglePomo()" title="开始/暂停">
              <svg id="pomoPlay" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>
              <svg id="pomoPause" viewBox="0 0 24 24" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button class="pomodoro__btn" onclick="resetPomo()" title="重置">
              <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>
            </button>
          </div>
        </div>

        <div class="task-focus-card" id="focusCard">
          <h2 class="task-focus-card__title" id="focusTitle">完成产品方案初稿</h2>
          <div class="task-focus-card__meta">
            <span class="chip chip--high" id="focusPriority">高优先级</span>
            <span class="focus-now__meta-item" id="focusDue">今天 18:00</span>
            <span class="focus-now__meta-item" id="focusEst">预估 2h</span>
          </div>
          <div class="task-focus-card__divider"></div>
          <div class="subtasks" id="subtaskList">
            <!-- 由 JS 渲染 -->
          </div>
          <div class="task-focus-card__progress">
            <div class="task-focus-card__progress-label">
              <span>进度</span>
              <span id="focusProgressText">0 / 5</span>
            </div>
            <div class="progress"><div class="progress__fill" id="focusProgress" style="width:0%"></div></div>
          </div>

          <!-- S12: 创意状态机 -->
          <div class="creative-state" id="creativeState">
            <span class="creative-state__label">阶段</span>
            <span class="creative-state__chip" data-state="idea" onclick="setCreativeState('idea')">想法</span>
            <span class="creative-state__chip active" data-state="drafting" onclick="setCreativeState('drafting')">起草</span>
            <span class="creative-state__chip" data-state="reviewing" onclick="setCreativeState('reviewing')">审阅</span>
            <span class="creative-state__chip" data-state="shipped" onclick="setCreativeState('shipped')">交付</span>
            <div class="creative-state__progress"><div class="creative-state__progress-fill" id="creativeProgress" style="width:25%"></div></div>
          </div>

          <!-- S2+S3+S4: 工具栏 + S5: kind line -->
          <div class="task-tools">
            <button class="tool-btn" onclick="toggleSplitTree()">
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
              拆到可执行
            </button>
            <span class="tool-btn est-tooltip" style="cursor:help">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              AI 估时 <span id="estTime">2h</span>
              <span class="est-tooltip__body">基于类型「创作类」+ 历史 5 次 · 中位 1.8h · 区间 1.2-2.5h</span>
            </span>
            <button class="tool-btn" onclick="showSOS()">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
              拖延 SOS
            </button>
          </div>

          <div class="subtask-tree" id="splitTree">
            <!-- 由 JS 渲染 -->
          </div>

          <div class="kind-line" id="kindLine">
            <strong>慢一点没关系</strong> · P 型人格的节奏本来就不同于 J 型，今天能开始就已经赢了一半。
          </div>

          <div class="swipe-complete" id="swipeComplete" onclick="completeTask()">
            <div class="swipe-complete__fill"></div>
            <div class="swipe-complete__hint">滑动标记完成 →</div>
            <div class="swipe-complete__knob">
              <svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>

'''
content = content.replace(old_focus, '')

# 4. Delete view-mood
old_mood = '''    <!-- ============ MOOD ============ -->
    <div class="view" id="view-mood">
      <div class="mood">
        <div class="mood__head">
          <h2 class="mood__title">今天几格电？</h2>
          <p class="mood__sub">AI 会根据你的状态，挑合适难度的任务</p>
        </div>

        <div class="mood__slider-wrap">
          <div class="mood__gauge">
            <svg class="gauge__svg" viewBox="0 0 120 120">
              <circle class="gauge__track" cx="60" cy="60" r="50"/>
              <circle class="gauge__fill" id="moodGaugeFill" cx="60" cy="60" r="50" stroke-dasharray="314" stroke-dashoffset="94" style="stroke:var(--terracotta)"/>
            </svg>
            <div class="gauge__value">
              <span class="mood__value" id="moodValue">70</span>
              <span class="gauge__unit">%</span>
            </div>
          </div>

          <input type="range" min="0" max="100" value="70" class="mood__slider" id="moodSlider" oninput="updateMood(this.value)">

          <div class="mood__labels">
            <span>没电</span>
            <span>一般</span>
            <span>满电</span>
          </div>

          <div class="mood__status" id="moodStatus">状态不错 · 可以上硬骨头</div>
        </div>

        <div class="mood__recs">
          <div class="mood__recs-label" id="recsLabel">推荐 3 件中等难度任务</div>
          <div id="recsList" class="stagger" style="display:flex;flex-direction:column;gap:12px">
            <!-- 由 JS 渲染 -->
          </div>
        </div>
      </div>
    </div>

'''
content = content.replace(old_mood, '')

# 5. Delete view-timeblock
old_timeblock = '''    <!-- ============ TIMEBLOCK 时间盲区 ============ -->
    <div class="view" id="view-timeblock">
      <div class="timeblock">
        <div class="timeblock__head">
          <div>
            <h2 class="timeblock__title">今日时间块</h2>
            <p class="timeblock__sub">让时间可见 · 任务按预估时长放进 8h 工作日</p>
          </div>
          <div class="timeblock__summary">
            <div class="timeblock__summary-item" id="tbCapacity">容量 8h</div>
            <div class="timeblock__summary-item" id="tbPlanned">计划 5.5h</div>
            <div class="timeblock__summary-item" id="tbRemaining">剩余 2.5h</div>
          </div>
        </div>
        <div class="timeblock__grid" id="timeblockGrid">
        </div>
      </div>
    </div>

'''
content = content.replace(old_timeblock, '')

# 6. Update CSS selectors for immersive mode
content = content.replace('#view-focus.focus--immersive', '#today-focus-section.focus--immersive')

# 7. Update VIEW_TITLES
old_titles = '''var VIEW_TITLES = {
  projects:{title:'项目编排',sub:'orchestrator'},
  dashboard:{title:'仪表盘',sub:'overview'},
  voice:{title:'语音输入',sub:'voice to task'},
  focus:{title:'沉浸聚焦',sub:'one thing at a time'},
  team:{title:'团队同步',sub:'dependency map'},
  mood:{title:'情绪自适应',sub:'energy-aware'}
};'''
new_titles = '''var VIEW_TITLES = {
  projects:{title:'项目编排',sub:'orchestrator'},
  today:{title:'今日',sub:'today'},
  team:{title:'团队同步',sub:'dependency map'}
};'''
content = content.replace(old_titles, new_titles)

# 8. Update switchView init logic
old_switch = '''    if(view === 'mood') renderMoodRecs(70);
    if(view === 'team') renderGantt();
    if(view === 'focus') renderFocusTask(currentTaskIdx);
    if(view === 'someday') renderSomeday();
    if(view === 'timeblock') renderTimeblock();
    if(view === 'projects') renderProjects();
    if(view === 'settings') loadApiKeysPanel();'''
new_switch = '''    if(view === 'today') { renderTimeblock(); renderFocusTask(currentTaskIdx); renderMoodRecs(70); }
    if(view === 'team') renderGantt();
    if(view === 'someday') renderSomeday();
    if(view === 'projects') renderProjects();
    if(view === 'settings') loadApiKeysPanel();'''
content = content.replace(old_switch, new_switch)

# 9. Update togglePomoFullscreen
content = content.replace("var view = document.getElementById('view-focus');", "var view = document.getElementById('today-focus-section');")

# 10. Update acceptProactive
content = content.replace("switchView('timeblock');", "switchView('today');")

# 11. Update promoteSomeday
content = content.replace("switchView('focus');", "switchView('today');")

# 12. Update single-focus overlay button
old_single = '''  <button class="single-focus__start" onclick="exitSingleFocus();switchView('focus')">'''
new_single = '''  <button class="single-focus__start" onclick="exitSingleFocus();switchView('today')">'''
content = content.replace(old_single, new_single)

# 13. Update makeCardsClickable
old_cards = '''    focusNow.addEventListener('click', function(){ switchView('focus'); });'''
new_cards = '''    focusNow.addEventListener('click', function(){ switchView('today'); });'''
content = content.replace(old_cards, new_cards)

# 14. Update CMD_ITEMS
content = content.replace("{label:'仪表盘', icon:'📊', shortcut:'G D', action:function(){switchView('dashboard')}},", "{label:'今日', icon:'📊', shortcut:'G D', action:function(){switchView('today')}},")
content = content.replace("{label:'专注模式', icon:'🎯', shortcut:'G F', action:function(){switchView('focus')}},", "{label:'专注模式', icon:'🎯', shortcut:'G F', action:function(){switchView('today')}},")
content = content.replace("{label:'任务列表', icon:'📋', shortcut:'G T', action:function(){switchView('dashboard')}},", "{label:'任务列表', icon:'📋', shortcut:'G T', action:function(){switchView('today')}},")
content = content.replace("{label:'时间块', icon:'⏱️', shortcut:'G B', action:function(){switchView('timeblock')}},", "{label:'时间块', icon:'⏱️', shortcut:'G B', action:function(){switchView('today')}},")
content = content.replace("{label:'情绪自适应', icon:'❤️', shortcut:'G M', action:function(){switchView('mood')}},", "{label:'情绪自适应', icon:'❤️', shortcut:'G M', action:function(){switchView('today')}},")
content = content.replace("{label:'能量打卡', icon:'🔋', shortcut:'E', action:function(){switchView('dashboard');document.querySelector('.energy-checkin').scrollIntoView({behavior:'smooth'})}},", "{label:'能量打卡', icon:'🔋', shortcut:'E', action:function(){switchView('today');document.getElementById('today-energy-section').scrollIntoView({behavior:'smooth'})}},")

# 15. Update init gauge selector
content = content.replace("var g = document.querySelector('#view-dashboard .gauge__fill[data-gauge-target]');", "var g = document.querySelector('#view-today .gauge__fill[data-gauge-target]');")

# 16. Update currentView default
content = content.replace("var currentView = 'projects';", "var currentView = 'today';")

# 17. Update sidebar active states
content = content.replace('<button class="nav-item active" data-view="projects">', '<button class="nav-item" data-view="projects">')
content = content.replace('<button class="nav-item" data-view="today">', '<button class="nav-item active" data-view="today">')

# 18. Update topbar initial text
content = content.replace('<h1 class="topbar__title" id="viewTitle">项目编排</h1>', '<h1 class="topbar__title" id="viewTitle">今日</h1>')
content = content.replace('<span class="topbar__title-sub" id="viewSub">orchestrator</span>', '<span class="topbar__title-sub" id="viewSub">today</span>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
