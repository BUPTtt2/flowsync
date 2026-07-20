import re
path = r"d:\Appt\大三下\Trae赛2\P人push\flowsync\web\app.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Delete view-voice
content = re.sub(
    r'\s+<!-- ============ VOICE INPUT ============ -->\s+<div class="view" id="view-voice">.*?</div>\s+',
    '\n',
    content,
    flags=re.DOTALL
)

# 2. Delete view-focus
content = re.sub(
    r'\s+<!-- ============ FOCUS MODE ============ -->\s+<div class="view" id="view-focus">.*?</div>\s+',
    '\n',
    content,
    flags=re.DOTALL
)

# 3. Delete view-mood
content = re.sub(
    r'\s+<!-- ============ MOOD ============ -->\s+<div class="view" id="view-mood">.*?</div>\s+',
    '\n',
    content,
    flags=re.DOTALL
)

# 4. Delete view-timeblock
content = re.sub(
    r'\s+<!-- ============ TIMEBLOCK 时间盲区 ============ -->\s+<div class="view" id="view-timeblock">.*?</div>\s+',
    '\n',
    content,
    flags=re.DOTALL
)

# 5. Update VIEW_TITLES
content = content.replace(
    "var VIEW_TITLES = {\n  projects:{title:'项目编排',sub:'orchestrator'},\n  dashboard:{title:'仪表盘',sub:'overview'},\n  voice:{title:'语音输入',sub:'voice to task'},\n  focus:{title:'沉浸聚焦',sub:'one thing at a time'},\n  team:{title:'团队同步',sub:'dependency map'},\n  mood:{title:'情绪自适应',sub:'energy-aware'}\n};",
    "var VIEW_TITLES = {\n  projects:{title:'项目编排',sub:'orchestrator'},\n  today:{title:'今日',sub:'today'},\n  team:{title:'团队同步',sub:'dependency map'}\n};"
)

# 6. Update switchView init logic
content = content.replace(
    "    if(view === 'mood') renderMoodRecs(70);\n    if(view === 'team') renderGantt();\n    if(view === 'focus') renderFocusTask(currentTaskIdx);\n    if(view === 'someday') renderSomeday();\n    if(view === 'timeblock') renderTimeblock();\n    if(view === 'projects') renderProjects();\n    if(view === 'settings') loadApiKeysPanel();",
    "    if(view === 'today') { renderTimeblock(); renderFocusTask(currentTaskIdx); renderMoodRecs(70); }\n    if(view === 'team') renderGantt();\n    if(view === 'someday') renderSomeday();\n    if(view === 'projects') renderProjects();\n    if(view === 'settings') loadApiKeysPanel();"
)

# 7. Update togglePomoFullscreen
content = content.replace("var view = document.getElementById('view-focus');", "var view = document.getElementById('today-focus-section');")

# 8. Update CSS immersive mode selectors
content = content.replace('#view-focus.focus--immersive', '#today-focus-section.focus--immersive')

# 9. Update acceptProactive
content = content.replace("switchView('timeblock');", "switchView('today');")

# 10. Update promoteSomeday
content = content.replace("switchView('focus');", "switchView('today');")

# 11. Update single-focus overlay button
content = content.replace('onclick="exitSingleFocus();switchView(\'focus\')"', 'onclick="exitSingleFocus();switchView(\'today\')"')

# 12. Update makeCardsClickable
content = content.replace("switchView('focus');", "switchView('today');")

# 13. Update CMD_ITEMS
content = content.replace("{label:'仪表盘', icon:'📊', shortcut:'G D', action:function(){switchView('dashboard')}},", "{label:'今日', icon:'📊', shortcut:'G D', action:function(){switchView('today')}},")
content = content.replace("{label:'专注模式', icon:'🎯', shortcut:'G F', action:function(){switchView('focus')}},", "{label:'专注模式', icon:'🎯', shortcut:'G F', action:function(){switchView('today')}},")
content = content.replace("{label:'任务列表', icon:'📋', shortcut:'G T', action:function(){switchView('dashboard')}},", "{label:'任务列表', icon:'📋', shortcut:'G T', action:function(){switchView('today')}},")
content = content.replace("{label:'时间块', icon:'⏱️', shortcut:'G B', action:function(){switchView('timeblock')}},", "{label:'时间块', icon:'⏱️', shortcut:'G B', action:function(){switchView('today')}},")
content = content.replace("{label:'情绪自适应', icon:'❤️', shortcut:'G M', action:function(){switchView('mood')}},", "{label:'情绪自适应', icon:'❤️', shortcut:'G M', action:function(){switchView('today')}},")
content = content.replace("{label:'能量打卡', icon:'🔋', shortcut:'E', action:function(){switchView('dashboard');document.querySelector('.energy-checkin').scrollIntoView({behavior:'smooth'})}},", "{label:'能量打卡', icon:'🔋', shortcut:'E', action:function(){switchView('today');document.getElementById('today-energy-section').scrollIntoView({behavior:'smooth'})}},")

# 14. Update init gauge selector
content = content.replace("var g = document.querySelector('#view-dashboard .gauge__fill[data-gauge-target]');", "var g = document.querySelector('#view-today .gauge__fill[data-gauge-target]');")

# 15. Update currentView default
content = content.replace("var currentView = 'projects';", "var currentView = 'today';")

# 16. Update sidebar active states
content = content.replace('<button class="nav-item active" data-view="projects">', '<button class="nav-item" data-view="projects">')
content = content.replace('<button class="nav-item" data-view="today">', '<button class="nav-item active" data-view="today">')

# 17. Update topbar initial text
content = content.replace('<h1 class="topbar__title" id="viewTitle">项目编排</h1>', '<h1 class="topbar__title" id="viewTitle">今日</h1>')
content = content.replace('<span class="topbar__title-sub" id="viewSub">orchestrator</span>', '<span class="topbar__title-sub" id="viewSub">today</span>')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print('done')
