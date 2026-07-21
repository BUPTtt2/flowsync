
// ============ API 层 ============
var API = {
  BASE: (window.FLOWSYNC_API_BASE || '') + '/api',
  token: localStorage.getItem('flowsync_token') || null,

  getApiKeys: function(){
    try{
      var raw = localStorage.getItem('flowsync_api_keys');
      if(!raw) return null;
      var keys = JSON.parse(raw);
      var has = false;
      for(var k in keys){ if(keys[k]){ has = true; break; } }
      return has ? keys : null;
    }catch(e){ return null; }
  },

  async request(path, method, body){
    var headers = { 'Content-Type': 'application/json' };
    if(this.token) headers['Authorization'] = 'Bearer ' + this.token;
    var apiKeys = this.getApiKeys();
    if(apiKeys) headers['X-API-Keys'] = JSON.stringify(apiKeys);
    var opts = { method: method || 'GET', headers: headers };
    if(body) opts.body = JSON.stringify(body);
    try{
      var res = await fetch(this.BASE + path, opts);
      var data = await res.json();
      if(!res.ok) throw new Error(data.message || '请求失败');
      return data;
    }catch(e){
      console.error('API Error:', e);
      throw e;
    }
  },

  // 认证
  register: function(u, e, p){ return this.request('/auth/register', 'POST', {username:u, email:e, password:p}); },
  login: function(u, p){ return this.request('/auth/login', 'POST', {username:u, password:p}); },
  me: function(){ return this.request('/auth/me'); },

  // 项目
  getProjects: function(){ return this.request('/projects'); },
  createProject: function(data){ return this.request('/projects', 'POST', data); },
  getProject: function(id){ return this.request('/projects/' + id); },
  updateProject: function(id, data){ return this.request('/projects/' + id, 'PUT', data); },
  deleteProject: function(id){ return this.request('/projects/' + id, 'DELETE'); },
  generateProjects: function(text){ return this.request('/projects/generate', 'POST', {text:text}); },
  demoGenerate: function(text){ return this.request('/demo/generate', 'POST', {name:text}); },
  aiSupplement: function(projectId, text){ return this.request('/projects/' + projectId + '/ai-supplement', 'POST', {text:text}); },

  // 模块
  addModule: function(projectId, data){ return this.request('/projects/' + projectId + '/modules', 'POST', data); },
  updateModule: function(id, data){ return this.request('/modules/' + id, 'PUT', data); },
  deleteModule: function(id){ return this.request('/modules/' + id, 'DELETE'); },
  reorderModule: function(id, order){ return this.request('/modules/' + id + '/reorder', 'PUT', {sort_order:order}); },

  // 任务
  addTask: function(moduleId, data){ return this.request('/modules/' + moduleId + '/tasks', 'POST', data); },
  updateTask: function(id, data){ return this.request('/tasks/' + id, 'PUT', data); },
  deleteTask: function(id){ return this.request('/tasks/' + id, 'DELETE'); },
  toggleTask: function(id){ return this.request('/tasks/' + id + '/toggle', 'PUT'); },

  // 提醒
  getReminders: function(){ return this.request('/reminders'); },
  checkReminders: function(){ return this.request('/reminders/check'); },
  readReminder: function(id){ return this.request('/reminders/' + id + '/read', 'PUT'); },

  // 外部
  searchPlaces: function(q){ return this.request('/external/search?q=' + encodeURIComponent(q)); },
  getRoute: function(from, to){ return this.request('/external/route?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)); },
  getWeather: function(city){ return this.request('/external/weather?city=' + encodeURIComponent(city)); },
  getDirections: function(from, to){ return this.request('/external/directions?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)); },

  // 能量
  logEnergy: function(level, mood, note){ return this.request('/energy', 'POST', {level:level, mood:mood, note:note}); },
  getEnergyHistory: function(){ return this.request('/energy/history'); },

  // 反馈
  submitFeedback: function(content){ return this.request('/feedback', 'POST', {content:content}); }
};

// 检查登录状态
function isLoggedIn(){ return !!API.token; }
function setToken(token){ API.token = token; localStorage.setItem('flowsync_token', token); }
function clearToken(){ API.token = null; localStorage.removeItem('flowsync_token'); }

// ============ 认证 UI ============
var _authMode = 'login'; // 'login' | 'register'
var _currentUser = null;

function showAuthOverlay(){
  var ov = document.getElementById('authOverlay');
  if(ov) ov.style.display = 'flex';
  var inviteForm = document.getElementById('inviteCodeForm');
  var authForm = document.getElementById('authForm');
  if(localStorage.getItem('flowsync_invited')){
    inviteForm.style.display = 'none';
    authForm.style.display = 'flex';
    renderAuthForm();
  } else {
    inviteForm.style.display = 'flex';
    authForm.style.display = 'none';
  }
}

function submitInviteCode(){
  var code = document.getElementById('inviteCode').value.trim().toUpperCase();
  var validCodes = ['FLOW2026', 'PUSH2026', 'AIHELP', 'TEST001'];
  if(validCodes.includes(code)){
    localStorage.setItem('flowsync_invited', 'true');
    showToast('验证成功', '欢迎加入测试', 'success');
    var inviteForm = document.getElementById('inviteCodeForm');
    var authForm = document.getElementById('authForm');
    inviteForm.style.display = 'none';
    authForm.style.display = 'flex';
    renderAuthForm();
  } else {
    showToast('邀请码无效', '请检查输入或联系管理员', 'error');
  }
}

function hideAuthOverlay(){
  var ov = document.getElementById('authOverlay');
  if(ov) ov.style.display = 'none';
}

function renderAuthForm(){
  var box = document.getElementById('authForm');
  if(!box) return;
  var isReg = _authMode === 'register';
  var fields = '';
  var inputStyle = 'padding:12px 14px;background:var(--ink-3);border:1px solid var(--line);border-radius:8px;color:var(--paper);font-size:14px;outline:none';
  if(isReg){
    fields += '<input id="authUsername" type="text" placeholder="用户名" style="'+inputStyle+'">';
    fields += '<input id="authEmail" type="email" placeholder="邮箱" style="'+inputStyle+'">';
  } else {
    fields += '<input id="authUsername" type="text" placeholder="用户名或邮箱" style="'+inputStyle+'">';
  }
  fields += '<input id="authPassword" type="password" placeholder="密码" style="'+inputStyle+'" onkeydown="if(event.key===\'Enter\')submitAuth()">';
  fields += '<button onclick="submitAuth()" style="padding:12px;background:var(--terracotta);color:var(--paper);border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:none">' + (isReg ? '注册' : '登录') + '</button>';
  fields += '<div style="text-align:center;font-size:13px;color:var(--paper-mute);margin-top:4px">';
  fields += isReg ? '已有账号？<a href="javascript:switchAuthMode(\'login\')" style="color:var(--terracotta-bright)">直接登录</a>' : '没有账号？<a href="javascript:switchAuthMode(\'register\')" style="color:var(--terracotta-bright)">立即注册</a>';
  fields += '</div>';
  box.innerHTML = fields;
  setTimeout(function(){
    var first = box.querySelector('input');
    if(first) first.focus();
  }, 50);
}

function switchAuthMode(mode){
  _authMode = mode;
  renderAuthForm();
}

async function submitAuth(){
  var pwdEl = document.getElementById('authPassword');
  var userEl = document.getElementById('authUsername');
  var emailEl = document.getElementById('authEmail');
  var pwd = pwdEl ? pwdEl.value : '';
  if(!pwd){ showToast('请填写完整', '密码不能为空', 'info'); return; }
  try{
    var result;
    if(_authMode === 'register'){
      var username = userEl ? userEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      if(!username){ showToast('请填写用户名', '', 'info'); return; }
      if(!email){ showToast('请填写邮箱', '', 'info'); return; }
      result = await API.register(username, email, pwd);
    } else {
      var loginId = userEl ? userEl.value.trim() : '';
      if(!loginId){ showToast('请填写完整', '用户名或邮箱不能为空', 'info'); return; }
      result = await API.login(loginId, pwd);
    }
    if(result && result.data && result.data.token){
      setToken(result.data.token);
      _currentUser = result.data.user;
      updateTopbarUser();
      hideAuthOverlay();
      initApp();
      showToast('欢迎', (_currentUser && _currentUser.username) ? _currentUser.username : '已登录', 'success');
    } else {
      throw new Error('返回数据异常');
    }
  }catch(e){
    showToast('登录失败', e.message, 'error');
  }
}

function logout(){
  clearToken();
  _currentUser = null;
  updateTopbarUser();
  showAuthOverlay();
  showToast('已退出', '欢迎下次再来', 'info');
}

async function submitFeedback(){
  var text = document.getElementById('feedbackText').value.trim();
  if(!text){
    showToast('请输入内容', '', 'info');
    return;
  }
  try{
    await API.submitFeedback(text);
    showToast('提交成功', '感谢你的反馈', 'success');
    document.getElementById('feedbackText').value = '';
  }catch(e){
    showToast('提交失败', e.message, 'error');
  }
}

function updateTopbarUser(){
  var avatar = document.querySelector('.topbar .avatar');
  if(avatar){
    if(_currentUser && _currentUser.username){
      avatar.textContent = _currentUser.username.charAt(0).toUpperCase();
      avatar.title = _currentUser.username;
    } else {
      avatar.textContent = '李';
      avatar.title = '';
    }
  }
}

// ============ DATA ============
var TASKS_FOCUS = [
  {title:'完成产品方案初稿',priority:'high',due:'今天 18:00',est:'2h',subtasks:[
    {label:'需求分析与整理',done:true},
    {label:'竞品调研报告',done:true},
    {label:'产品架构设计',done:false},
    {label:'功能模块规划',done:false},
    {label:'初稿文档撰写',done:false}
  ]},
  {title:'回复客户邮件',priority:'normal',due:'今天 17:00',est:'30min',subtasks:[
    {label:'查阅往来邮件',done:false},
    {label:'起草回复',done:false},
    {label:'检查附件',done:false}
  ]},
  {title:'更新项目文档',priority:'low',due:'明天 10:00',est:'1h',subtasks:[
    {label:'收集变更点',done:false},
    {label:'更新文档',done:false},
    {label:'通知团队',done:false}
  ]}
];

var VOICE_EXAMPLES = [
  {
    text:'明天要交方案，得找小王要数据，提醒他下午三点前发我。',
    parse:{task:'完成产品方案初稿',deadline:'明天 18:00',assignee:'小王',dep:'数据 · 15:00 前'}
  },
  {
    text:'把周末旅行拆一下，要订酒店和查路线，再排个行李清单。',
    parse:{task:'周末旅行准备',subtasks:['订酒店','查路线','行李清单']}
  },
  {
    text:'今天状态一般，给我安排点轻松的事先做。',
    parse:{task:'3 件低耗任务',mood:'低精力',action:'高耗任务推迟到明日'}
  }
];

var TEAM_TASKS = [
  {id:1,name:'数据收集',owner:'张三',avatarBg:'#d97757',start:0,end:2,priority:'high',status:'done',dep:[]},
  {id:2,name:'数据分析',owner:'张三',avatarBg:'#d97757',start:2,end:4,priority:'high',status:'done',dep:[1]},
  {id:3,name:'方案初稿',owner:'李',avatarBg:'#7a8c5e',start:3,end:5,priority:'high',status:'active',dep:[2]},
  {id:4,name:'小王提供数据',owner:'小王',avatarBg:'#c89968',start:2.5,end:3.5,priority:'high',status:'active',dep:[1]},
  {id:5,name:'设计评审',owner:'王',avatarBg:'#b85c3e',start:4,end:6,priority:'normal',status:'pending',dep:[3]},
  {id:6,name:'部署测试环境',owner:'赵',avatarBg:'#8c8a80',start:5,end:7,priority:'low',status:'blocked',dep:[3,4]},
  {id:7,name:'团队周会',owner:'李',avatarBg:'#7a8c5e',start:6,end:7,priority:'normal',status:'pending',dep:[]}
];

var MOOD_RECS = {
  low:[
    {title:'整理会议笔记',meta:'15min · 整理类',type:'easy',chip:'低耗'},
    {title:'归档邮件',meta:'10min · 收尾类',type:'easy',chip:'低耗'},
    {title:'更新待办列表',meta:'5min · 规划类',type:'easy',chip:'低耗'}
  ],
  mid:[
    {title:'回复客户邮件',meta:'30min · 沟通类',type:'mid',chip:'中耗'},
    {title:'代码审查',meta:'45min · 评审类',type:'mid',chip:'中耗'},
    {title:'更新项目文档',meta:'1h · 文档类',type:'mid',chip:'中耗'}
  ],
  high:[
    {title:'完成产品方案初稿',meta:'2h · 创作类',type:'hard',chip:'高耗'},
    {title:'设计评审准备',meta:'1.5h · 设计类',type:'hard',chip:'高耗'},
    {title:'架构设计文档',meta:'2h · 架构类',type:'hard',chip:'高耗'}
  ]
};

// ============ VIEW SWITCHING ============
var VIEW_TITLES = {
  projects:{title:'工作台',sub:'orchestrator'},
  today:{title:'今日',sub:'daily focus'},
  team:{title:'团队',sub:'dependency map'},
  chat:{title:'AI 助手',sub:'conversational'},
  someday:{title:'想法桶',sub:'someday / maybe'},
  settings:{title:'设置',sub:'preferences'}
};
var currentView = 'projects';

function switchView(view){
  if(currentView === view) return;
  var oldEl = document.getElementById('view-' + currentView);
  var newEl = document.getElementById('view-' + view);
  if(!newEl) return;

  currentView = view;

  // 退出动画
  if(oldEl){
    oldEl.style.transition = 'opacity 0.25s var(--ease), transform 0.25s var(--ease)';
    oldEl.style.opacity = '0';
    oldEl.style.transform = 'translateY(8px)';
  }

  setTimeout(function(){
    // 切换 active
    document.querySelectorAll('.view').forEach(function(v){
      v.classList.remove('active');
      v.style.opacity = '';
      v.style.transform = '';
    });
    if(newEl){
      newEl.classList.add('active');
      newEl.style.opacity = '0';
      newEl.style.transform = 'translateY(-8px)';
      // 强制 reflow
      newEl.offsetHeight;
      newEl.style.transition = 'opacity 0.3s var(--ease), transform 0.3s var(--ease)';
      newEl.style.opacity = '1';
      newEl.style.transform = 'translateY(0)';
      setTimeout(function(){
        newEl.style.transition = '';
        newEl.style.opacity = '';
        newEl.style.transform = '';
      }, 350);
    }

    document.querySelectorAll('.nav-item[data-view]').forEach(function(n){
      n.classList.toggle('active', n.dataset.view === view);
    });
    document.querySelectorAll('.mob-nav__item[data-view]').forEach(function(n){
      n.classList.toggle('active', n.dataset.view === view);
    });
    var meta = VIEW_TITLES[view] || {title:view,sub:''};
    var titleEl = document.getElementById('viewTitle');
    var subEl = document.getElementById('viewSub');
    if(titleEl){
      titleEl.style.transition = 'opacity 0.15s var(--ease)';
      titleEl.style.opacity = '0';
      setTimeout(function(){
        titleEl.textContent = meta.title;
        titleEl.style.opacity = '1';
      }, 120);
    }
    if(subEl){
      subEl.style.transition = 'opacity 0.15s var(--ease)';
      subEl.style.opacity = '0';
      setTimeout(function(){
        subEl.textContent = meta.sub;
        subEl.style.opacity = '1';
      }, 120);
    }

    // 触发对应视图的初始化
    if(view === 'today') {
      renderMoodRecs(70);
      renderTimeblock();
      renderFocusTask(currentTaskIdx);
    }
    if(view === 'team') renderGantt();
    if(view === 'someday') renderSomeday();
    if(view === 'projects') renderProjects();
    if(view === 'settings') loadApiKeysPanel();
  }, 200);
}

document.querySelectorAll('.nav-item[data-view]').forEach(function(item){
  item.addEventListener('click', function(){ switchView(item.dataset.view); });
});

// ============ COUNT-UP ANIMATION ============
function animateCount(el, target, duration){
  duration = duration || 1000;
  var start = 0;
  var startTime = null;
  function step(ts){
    if(!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Dashboard 首次加载动画
setTimeout(function(){
  document.querySelectorAll('[data-count]').forEach(function(el){
    var target = parseInt(el.dataset.count, 10);
    animateCount(el, target, 1200);
  });
}, 200);

// ============ VOICE INPUT DEMO ============
var voiceState = 'idle'; // idle | recording | parsing | done
var voiceTimer = null;

function startVoiceDemo(){
  if(voiceState !== 'idle') return;
  runExample(Math.floor(Math.random() * VOICE_EXAMPLES.length));
}

function runExample(idx){
  if(voiceState !== 'idle' && voiceState !== 'done') return;
  resetVoice();
  var ex = VOICE_EXAMPLES[idx];
  voiceState = 'recording';

  // 录音状态
  var stage = document.getElementById('voiceStage');
  stage.innerHTML = '<div class="voice__prompt">正在聆听...</div>' +
    '<div class="waveform">' +
      Array(10).fill('<div class="waveform__bar"></div>').join('') +
    '</div>' +
    '<div class="voice__hint">再次点击停止</div>';
  document.getElementById('voiceExamples').style.display = 'none';

  // 3 秒后进入解析
  voiceTimer = setTimeout(function(){ parseVoice(ex); }, 3000);
}

function parseVoice(ex){
  voiceState = 'parsing';
  var stage = document.getElementById('voiceStage');
  // 显示原文 + 高亮
  stage.innerHTML = '<div class="parse-state">' +
    '<div class="parse-state__text">' + highlightText(ex.text) + '</div>' +
    '<div class="parse-state__loader"><span class="parse-state__dot"></span><span class="parse-state__dot"></span><span class="parse-state__dot"></span></div>' +
    '<div class="voice__hint">AI 正在解析...</div>' +
    '</div>';

  // 2.2 秒后显示结果
  voiceTimer = setTimeout(function(){ showResult(ex); }, 2200);
}

function highlightText(text){
  // 简单高亮：把数字和"明天"等关键词包起来
  return text
    .replace(/(明天|今天|下午|[\d:]+|小王|方案|数据)/g, '<span class="highlight">$1</span>');
}

function showResult(ex){
  voiceState = 'done';
  var stage = document.getElementById('voiceStage');
  var p = ex.parse;
  var chipsHTML = '';
  if(p.deadline) chipsHTML += '<span class="chip chip--high"><span style="opacity:0.6">截止</span> '+p.deadline+'</span>';
  if(p.assignee) chipsHTML += '<span class="chip" style="background:var(--moss-soft);border-color:var(--moss);color:var(--moss)"><span style="opacity:0.6">@</span> '+p.assignee+'</span>';
  if(p.dep) chipsHTML += '<span class="chip" style="background:var(--ochre-soft);border-color:var(--ochre);color:var(--ochre)"><span style="opacity:0.6">依赖</span> '+p.dep+'</span>';
  if(p.mood) chipsHTML += '<span class="chip" style="background:var(--moss-soft);border-color:var(--moss);color:var(--moss)"><span style="opacity:0.6">状态</span> '+p.mood+'</span>';
  if(p.subtasks){
    p.subtasks.forEach(function(s){
      chipsHTML += '<span class="chip" style="background:var(--ochre-soft);border-color:var(--ochre);color:var(--ochre)"><span style="opacity:0.6">·</span> '+s+'</span>';
    });
  }
  if(p.action) chipsHTML += '<span class="chip chip--normal"><span style="opacity:0.6">动作</span> '+p.action+'</span>';

  stage.innerHTML = '<div class="result scale-in">' +
    '<div class="result__header">' +
      '<h3 class="result__title">'+p.task+'</h3>' +
      '<span class="result__ts">'+new Date().toTimeString().slice(0,5)+'</span>' +
    '</div>' +
    '<div class="result__chips">'+chipsHTML+'</div>' +
    '<div class="result__raw">'+ex.text+'</div>' +
    '</div>' +
    '<button class="btn btn--primary" onclick="resetVoice()">再试一次</button>';
}

function resetVoice(){
  if(voiceTimer) clearTimeout(voiceTimer);
  voiceState = 'idle';
  var stage = document.getElementById('voiceStage');
  stage.innerHTML = '<div class="voice__prompt">按住麦克风说话<br>AI 会自动拆解成结构化任务</div>' +
    '<button class="mic-btn" id="micBtn" onclick="startVoiceDemo()">' +
      '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21"/></svg>' +
    '</button>' +
    '<div class="voice__hint">点击开始 · 或选一个示例</div>';
  document.getElementById('voiceExamples').style.display = 'flex';
}

// ============ FOCUS MODE ============
var currentTaskIdx = 0;
var pomoInterval = null;
var pomoSeconds = 25 * 60;
var pomoRunning = false;

function renderFocusTask(idx){
  var task = TASKS_FOCUS[idx];
  if(!task) return;
  document.getElementById('focusTitle').textContent = task.title;
  document.getElementById('focusPriority').textContent = task.priority === 'high' ? '高优先级' : (task.priority === 'normal' ? '中优先级' : '低优先级');
  document.getElementById('focusPriority').className = 'chip chip--' + task.priority;
  document.getElementById('focusDue').textContent = task.due;
  document.getElementById('focusEst').textContent = task.est;
  document.getElementById('taskIdx').textContent = (idx + 1);
  document.getElementById('taskTotal').textContent = TASKS_FOCUS.length;

  var list = document.getElementById('subtaskList');
  list.innerHTML = '';
  task.subtasks.forEach(function(s, i){
    var div = document.createElement('div');
    div.className = 'subtask' + (s.done ? ' done-sub' : '');
    div.innerHTML = '<div class="subtask__check' + (s.done ? ' done' : '') + '" onclick="toggleSubtask(this,'+i+')">' +
      '<svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,8"/></svg>' +
      '</div><span class="subtask__label' + (s.done ? ' done' : '') + '">'+s.label+'</span>';
    list.appendChild(div);
  });
  updateFocusProgress();
  // 重置 swipe
  var sc = document.getElementById('swipeComplete');
  sc.classList.remove('done');
}

function toggleSubtask(el, idx){
  var task = TASKS_FOCUS[currentTaskIdx];
  task.subtasks[idx].done = !task.subtasks[idx].done;
  var done = task.subtasks[idx].done;
  el.classList.toggle('done', done);
  el.nextElementSibling.classList.toggle('done', done);
  updateFocusProgress();
}

function updateFocusProgress(){
  var task = TASKS_FOCUS[currentTaskIdx];
  var total = task.subtasks.length;
  var done = task.subtasks.filter(function(s){return s.done}).length;
  var pct = Math.round((done / total) * 100);
  document.getElementById('focusProgress').style.width = pct + '%';
  document.getElementById('focusProgressText').textContent = done + ' / ' + total;
}

function completeTask(){
  var sc = document.getElementById('swipeComplete');
  if(sc.classList.contains('done')) return;
  sc.classList.add('done');
  // 闪光
  var flash = document.getElementById('completeFlash');
  flash.classList.add('show');
  setTimeout(function(){ flash.classList.remove('show'); }, 400);
  // S8: 触发多巴胺庆祝
  triggerCelebrate();
  // 自动推进创意状态机到 shipped
  setCreativeState('shipped');
  // 1 秒后切换到下一件
  setTimeout(function(){
    currentTaskIdx = (currentTaskIdx + 1) % TASKS_FOCUS.length;
    if(currentTaskIdx === 0){
      // 全部完成循环
      document.getElementById('celebrateText').textContent = '今天的都做完啦';
      document.getElementById('celebrateSub').textContent = 'P 型也能完成 · 这就是 FlowSync 的方式';
      var msgEl = document.getElementById('celebrateMsg');
      msgEl.style.display = 'block';
      msgEl.style.animation = 'none';
      void msgEl.offsetWidth;
      msgEl.style.animation = 'celebratePop 2s var(--ease) forwards';
      setTimeout(function(){ msgEl.style.display = 'none'; }, 2000);
    }
    renderFocusTask(currentTaskIdx);
    // 新任务重置状态机
    setCreativeState('drafting');
  }, 1000);
}

function skipTask(){
  currentTaskIdx = (currentTaskIdx + 1) % TASKS_FOCUS.length;
  renderFocusTask(currentTaskIdx);
}

// Pomodoro
function togglePomo(){
  pomoRunning = !pomoRunning;
  document.getElementById('pomoPlay').style.display = pomoRunning ? 'none' : 'block';
  document.getElementById('pomoPause').style.display = pomoRunning ? 'block' : 'none';
  document.getElementById('pomoTime').classList.toggle('paused', !pomoRunning);
  if(pomoRunning){
    pomoInterval = setInterval(function(){
      pomoSeconds--;
      if(pomoSeconds <= 0){
        clearInterval(pomoInterval);
        pomoRunning = false;
        pomoSeconds = 25 * 60;
        document.getElementById('pomoPlay').style.display = 'block';
        document.getElementById('pomoPause').style.display = 'none';
        alert('番茄完成，休息 5 分钟');
      }
      updatePomoDisplay();
    }, 1000);
  } else {
    clearInterval(pomoInterval);
  }
}

function resetPomo(){
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoSeconds = 25 * 60;
  document.getElementById('pomoPlay').style.display = 'block';
  document.getElementById('pomoPause').style.display = 'none';
  document.getElementById('pomoTime').classList.remove('paused');
  updatePomoDisplay();
}

function updatePomoDisplay(){
  var m = Math.floor(pomoSeconds / 60);
  var s = pomoSeconds % 60;
  document.getElementById('pomoTime').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function togglePomoFullscreen(){
  var view = document.getElementById('view-focus');
  var btn = document.getElementById('pomoFsBtn');
  if(!view) return;
  if(view.classList.contains('focus--immersive')){
    view.classList.remove('focus--immersive');
    view.style.display = '';
    view.style.position = '';
    view.style.zIndex = '';
    if(btn) btn.innerHTML = '⛶';
    showToast('已退出', '沉浸模式已关闭', 'info');
  } else {
    view.classList.add('focus--immersive');
    if(btn) btn.innerHTML = '⊠';
    showToast('沉浸模式', '深呼吸，开始专注', 'success');
  }
}

// ============ TEAM GANTT ============
function renderGantt(){
  var gantt = document.getElementById('gantt');
  var days = ['周一','周二','周三','周四','周五','周六','周日'];
  var todayIdx = 2; // 周三

  var html = '<div class="gantt__header">' +
    '<div class="gantt__team-label">成员 / 任务</div>' +
    '<div class="gantt__timeline">' +
      days.map(function(d, i){
        return '<div class="gantt__day' + (i === todayIdx ? ' today' : '') + '">' + d + '</div>';
      }).join('') +
    '</div>' +
  '</div>';

  // 按成员分组
  var members = {};
  TEAM_TASKS.forEach(function(t){
    if(!members[t.owner]) members[t.owner] = [];
    members[t.owner].push(t);
  });

  html += '<div class="gantt__rows">';
  Object.keys(members).forEach(function(owner){
    var tasks = members[owner];
    var firstTask = tasks[0];
    html += '<div class="gantt__row">' +
      '<div class="gantt__member">' +
        '<div class="gantt__avatar" style="background:'+firstTask.avatarBg+'">'+owner.charAt(0)+'</div>' +
        '<span>'+owner+'</span>' +
      '</div>' +
      '<div class="gantt__tracks" data-owner="'+owner+'">';

    // 任务条
    tasks.forEach(function(t){
      var left = (t.start / 7) * 100;
      var width = ((t.end - t.start) / 7) * 100;
      var cls = 'gantt__bar gantt__bar--' + t.priority;
      if(t.status === 'blocked') cls = 'gantt__bar gantt__bar--blocked';
      if(t.status === 'done') cls = 'gantt__bar gantt__bar--' + t.priority + ' gantt__bar--done';
      html += '<div class="'+cls+'" style="left:'+left+'%;width:'+width+'%" onclick="showTaskDetail('+t.id+')" data-task="'+t.id+'">'+t.name+'</div>';
    });

    html += '</div></div>';
  });
  html += '</div>';

  // SVG 依赖线（叠加在整个 rows 上）
  html += '<svg class="gantt__dep-svg" id="depSvg" style="position:absolute;top:0;left:216px;right:0;bottom:0;width:calc(100% - 216px);height:100%;pointer-events:none"></svg>';

  gantt.innerHTML = html;

  // 渲染依赖线
  setTimeout(drawDependencyLines, 100);
}

function drawDependencyLines(){
  // 简化版：在 detail 里显示依赖文字即可，SVG 跨行画线在静态布局里复杂
  // 这里用 CSS 简单标记 blocked 任务即可
}

function showTaskDetail(id){
  var task = TEAM_TASKS.find(function(t){return t.id === id});
  if(!task) return;
  var detail = document.getElementById('ganttDetail');
  document.getElementById('detailTitle').textContent = task.name;
  document.getElementById('detailOwner').textContent = task.owner;
  var days = ['周一','周二','周三','周四','周五','周六','周日'];
  document.getElementById('detailRange').textContent = days[task.start] + ' - ' + days[task.end > 7 ? 6 : Math.floor(task.end)];
  var depNames = task.dep.map(function(did){
    var dep = TEAM_TASKS.find(function(t){return t.id === did});
    return dep ? dep.name : '';
  }).join(', ');
  document.getElementById('detailDep').textContent = depNames || '无';
  var statusText = task.status === 'done' ? '已完成' : (task.status === 'active' ? '进行中' : (task.status === 'blocked' ? '阻塞' : '待开始'));
  document.getElementById('detailStatus').textContent = statusText;
  detail.classList.add('show');
}

// ============ MOOD ============
var currentMood = 70;

function updateMood(val){
  currentMood = parseInt(val, 10);
  document.getElementById('moodValue').textContent = val;
  // 更新 gauge
  var circ = 314;
  var offset = circ - (circ * val / 100);
  var fill = document.getElementById('moodGaugeFill');
  fill.setAttribute('stroke-dashoffset', offset);
  // 颜色随状态变化
  var color;
  if(val < 33) color = 'var(--moss)';
  else if(val < 66) color = 'var(--ochre)';
  else color = 'var(--terracotta)';
  fill.style.stroke = color;

  // 状态文案
  var status, label;
  if(val < 33){ status = '有点累 · 先做点轻松的'; label = '推荐 3 件低耗任务'; }
  else if(val < 66){ status = '状态一般 · 中等难度合适'; label = '推荐 3 件中等难度任务'; }
  else { status = '满电 · 可以上硬骨头'; label = '推荐 3 件高耗任务'; }
  document.getElementById('moodStatus').textContent = status;
  document.getElementById('recsLabel').textContent = label;

  renderMoodRecs(val);
}

function renderMoodRecs(val){
  var list = document.getElementById('recsList');
  var recs;
  if(val < 33) recs = MOOD_RECS.low;
  else if(val < 66) recs = MOOD_RECS.mid;
  else recs = MOOD_RECS.high;

  list.innerHTML = recs.map(function(r){
    return '<div class="rec">' +
      '<div class="rec__icon rec__icon--'+r.type+'">' +
        (r.type === 'hard' ? '★' : (r.type === 'mid' ? '◐' : '○')) +
      '</div>' +
      '<div class="rec__body"><div class="rec__title">'+r.title+'</div><div class="rec__meta">'+r.meta+'</div></div>' +
      '<span class="rec__chip chip chip--'+(r.type === 'hard' ? 'high' : (r.type === 'mid' ? 'normal' : 'low'))+'">'+r.chip+'</span>' +
    '</div>';
  }).join('');

  // 重新触发 stagger
  list.classList.remove('stagger');
  void list.offsetWidth;
  list.classList.add('stagger');
}

// Dashboard gauge 从空到目标值的填充动画 (在 INIT 末尾的 setTimeout 内调用)

// =====================================================================
// S1: 10s 能量打卡 + AI 重排
// =====================================================================
var ENERGY_MAP = {
  full:{label:'满电', val:95, color:'var(--terracotta)', advice:'硬骨头先上 · 我把 2 件高耗任务排到上午黄金段'},
  ok:{label:'不错', val:70, color:'var(--ochre)', advice:'中等难度合适 · 1 件高耗 + 2 件中耗已重排'},
  mid:{label:'一般', val:45, color:'var(--moss)', advice:'先做机械活热身 · 已把回复邮件、整理笔记排前面'},
  low:{label:'偏累', val:20, color:'var(--paper-mute)', advice:'今天只做 1 件 5 分钟能搞定的 · 其他全部后移'}
};
function selectEnergy(el, key){
  document.querySelectorAll('.energy-opt').forEach(function(o){o.classList.remove('selected')});
  el.classList.add('selected');
  var e = ENERGY_MAP[key];
  var result = document.getElementById('energyResult');
  result.innerHTML = '<strong>' + e.label + '</strong> · ' + e.advice;
  // 同步 topbar 能量显示
  var topbar = document.getElementById('topbarEnergy');
  if(topbar) topbar.textContent = '当前 ' + e.val + '% · ' + e.label;
  // 同步 topbar 能量点颜色
  var dot = document.querySelector('.topbar__energy-dot');
  if(dot){ dot.style.background = e.color; }
  // 触发今日任务重排（动画）
  reshuffleToday(key);
  // 记录到后端
  if(isLoggedIn()){
    API.logEnergy(e.val, e.label, e.advice).catch(function(err){
      console.error('能量记录失败:', err);
    });
  }
}

function reshuffleToday(energyKey){
  // 模拟重排：dashboard focus-now 卡片渐隐再渐显
  var focusNow = document.querySelector('.focus-now');
  if(!focusNow) return;
  focusNow.style.transition = 'opacity 0.4s var(--ease), transform 0.4s var(--ease)';
  focusNow.style.opacity = '0.3';
  focusNow.style.transform = 'translateY(8px)';
  setTimeout(function(){
    // 根据 energy 重排任务优先级
    var task = TASKS_FOCUS[0];
    if(energyKey === 'low'){
      task.title = '整理桌面 5 分钟';
      task.priority = 'low';
    } else if(energyKey === 'mid'){
      task.title = '回复客户邮件';
      task.priority = 'normal';
    } else {
      task.title = '完成产品方案初稿';
      task.priority = 'high';
    }
    document.querySelector('.focus-now__title').textContent = task.title;
    var chip = document.querySelector('.focus-now .chip');
    chip.className = 'chip chip--' + task.priority;
    chip.textContent = task.priority === 'high' ? '高优先级' : (task.priority === 'normal' ? '中优先级' : '低优先级');
    focusNow.style.opacity = '1';
    focusNow.style.transform = 'none';
  }, 500);
}

// =====================================================================
// S2: 拆到可执行（无限拆解树）
// =====================================================================
var SPLIT_TEMPLATES = {
  '完成产品方案初稿':[
    {t:'打开文档新建空白', m:'2min · 启动'},
    {t:'写下 3 个核心问题', m:'10min · 草稿'},
    {t:'画出功能模块框架图', m:'20min · 视觉化', children:[
      {t:'列已有功能', m:'5min'},
      {t:'列缺失功能', m:'5min'},
      {t:'画关系图', m:'10min'}
    ]},
    {t:'写第一版前言', m:'15min · 写作启动'}
  ],
  '回复客户邮件':[
    {t:'打开邮件客户端', m:'1min · 启动'},
    {t:'读往来邮件 3 封', m:'5min'},
    {t:'列出要回复的 3 个要点', m:'5min'},
    {t:'敲第一句话', m:'2min · 启动'}
  ],
  '更新项目文档':[
    {t:'打开共享文档', m:'1min'},
    {t:'查看 git 提交历史', m:'5min'},
    {t:'列出 3 处变更', m:'10min'},
    {t:'更新文档段落', m:'15min'}
  ]
};

function getSplitTemplate(title){
  if(SPLIT_TEMPLATES[title]) return SPLIT_TEMPLATES[title];
  // 通用模板
  return [
    {t:'打开任务相关工具', m:'1min · 启动'},
    {t:'写下关于这件事的 3 个想法', m:'5min · 思考'},
    {t:'选最小的一个先做', m:'10min · 执行'},
    {t:'完成后回顾下一段', m:'5min · 复盘'}
  ];
}

function toggleSplitTree(){
  var tree = document.getElementById('splitTree');
  if(tree.classList.contains('show')){
    tree.classList.remove('show');
    tree.innerHTML = '';
    return;
  }
  var task = TASKS_FOCUS[currentTaskIdx];
  var nodes = getSplitTemplate(task.title);
  tree.innerHTML = nodes.map(function(n, i){
    return '<div class="subtask-tree__node">' +
      '<div class="subtask-tree__node-dot"></div>' +
      '<div class="subtask-tree__node-body">' +
        '<div class="subtask-tree__node-title">' + (i+1) + '. ' + n.t + '</div>' +
        '<div class="subtask-tree__node-meta">' + n.m + '</div>' +
      '</div>' +
      '<span class="subtask-tree__node-split" onclick="event.stopPropagation();continueSplit(this)">继续拆</span>' +
    '</div>';
  }).join('');
  tree.classList.add('show');
}

function continueSplit(el){
  var node = el.parentElement;
  var existing = node.querySelector('.subtask-tree__nested');
  if(existing){ existing.remove(); return; }
  var nested = document.createElement('div');
  nested.className = 'subtask-tree__nested';
  nested.innerHTML = '<div class="subtask-tree__node">' +
    '<div class="subtask-tree__node-dot" style="background:var(--ochre)"></div>' +
    '<div class="subtask-tree__node-body"><div class="subtask-tree__node-title">打开它就 1 分钟</div>' +
    '<div class="subtask-tree__node-meta">1min · 最小启动</div></div>' +
    '<span class="subtask-tree__node-split" onclick="event.stopPropagation();continueSplit(this)">继续拆</span>' +
  '</div>';
  node.appendChild(nested);
}

// =====================================================================
// S4: 拖延 SOS（5分钟启动版）
// =====================================================================
var SOS_TEMPLATES = {
  '完成产品方案初稿':[
    {t:'新建空白文档', m:'1 分钟 · 不写任何内容'},
    {t:'写一个标题，随便什么', m:'2 分钟 · 即使很烂'},
    {t:'保存关闭，明早再回来', m:'1 分钟 · 让大脑后台处理'}
  ],
  '回复客户邮件':[
    {t:'打开邮件，只读不回', m:'2 分钟'},
    {t:'回复里写"收到，稍后回复"', m:'1 分钟'},
    {t:'发送，结束', m:'30 秒'}
  ],
  '更新项目文档':[
    {t:'打开文档，只看一处变更', m:'2 分钟'},
    {t:'改这一处，保存', m:'2 分钟'},
    {t:'关掉，奖励自己 5 分钟休息', m:'1 分钟'}
  ]
};

function showSOS(){
  var task = TASKS_FOCUS[currentTaskIdx];
  var steps = SOS_TEMPLATES[task.title] || [
    {t:'打开任务相关工具', m:'1 分钟 · 只打开'},
    {t:'待 1 分钟什么都别做', m:'1 分钟 · 让焦虑落地'},
    {t:'做最小的一个动作', m:'3 分钟 · 任何动作都行'}
  ];
  document.getElementById('sosSub').textContent = '「' + task.title + '」拆成 3 个 5 分钟内能搞定的步骤';
  var html = '';
  steps.forEach(function(s, i){
    html += '<div class="sos-card__step" onclick="this.style.opacity=0.4">' +
      '<div class="sos-card__step-num">' + (i+1) + '</div>' +
      '<div class="sos-card__step-body">' +
        '<div class="sos-card__step-title">' + s.t + '</div>' +
        '<div class="sos-card__step-meta">' + s.m + '</div>' +
      '</div></div>';
  });
  document.getElementById('sosSteps').innerHTML = html;
  document.getElementById('sosOverlay').classList.add('show');
}

function closeSOS(){
  document.getElementById('sosOverlay').classList.remove('show');
}

// =====================================================================
// S5: 失败去污名化文案池
// =====================================================================
var KIND_LINES = [
  '<strong>慢一点没关系</strong> · P 型人格的节奏本来就不同于 J 型，今天能开始就已经赢了一半。',
  '<strong>计划变了很正常</strong> · 重新开始不需要任何解释，明天是新的 24 小时。',
  '<strong>今天能量不足，我们少做点</strong> · 完成 1 件小事 > 计划 10 件没动。',
  '<strong>拖延不是懒，是大脑在保护你</strong> · 试着拆小，看看会发生什么。',
  '<strong>不需要完美，只需要开始</strong> · 5 分钟版也算数。',
  '<strong>你不是没效率，是没找到今天的状态</strong> · 状态会回来的。'
];

function rotateKindLine(){
  var line = document.getElementById('kindLine');
  if(!line) return;
  var idx = Math.floor(Math.random() * KIND_LINES.length);
  line.innerHTML = KIND_LINES[idx];
  line.style.animation = 'none';
  void line.offsetWidth;
  line.style.animation = '';
}

// =====================================================================
// S6: 单一焦点强制
// =====================================================================
function enterSingleFocus(){
  var task = TASKS_FOCUS[currentTaskIdx];
  var overlay = document.getElementById('singleFocus');
  document.getElementById('singleFocusMeta').textContent =
    (task.priority === 'high' ? '高优先级' : (task.priority === 'normal' ? '中优先级' : '低优先级')) + ' · ' + task.due + ' · ' + task.est;
  overlay.classList.add('show');
}

function exitSingleFocus(){
  document.getElementById('singleFocus').classList.remove('show');
}

// =====================================================================
// S7: Someday 想法桶
// =====================================================================
var SOMEDAY_ITEMS = [
  {t:'学手绘插画', m:'想了一年 · 等有空', ts:'3 天前'},
  {t:'整理读书笔记到 Notion', m:'积了 5 本', ts:'上周'},
  {t:'写一篇关于 P 型人格的长文', m:'一直想写', ts:'2 周前'},
  {t:'把项目部署到 Vercel', m:'5 分钟就能搞定 · 但就是没做', ts:'昨天'},
  {t:'研究下 Linear 的工作流', m:'看 review', ts:'3 天前'}
];

function renderSomeday(){
  var list = document.getElementById('somedayList');
  if(SOMEDAY_ITEMS.length === 0){
    list.innerHTML = '<div class="someday__empty"><div class="someday__empty-icon">○</div>还没有想法 · 随手记一个吧</div>';
    return;
  }
  list.innerHTML = SOMEDAY_ITEMS.map(function(item, i){
    return '<div class="someday__item">' +
      '<div class="someday__item-idea">想</div>' +
      '<div class="someday__item-body">' +
        '<div class="someday__item-title">' + item.t + '</div>' +
        '<div class="someday__item-meta">' + item.m + ' · ' + item.ts + '</div>' +
      '</div>' +
      '<button class="someday__item-promote" onclick="promoteSomeday(' + i + ')">晋升今日</button>' +
    '</div>';
  }).join('');
}

function addSomeday(){
  var input = document.getElementById('somedayInput');
  var v = input.value.trim();
  if(!v) return;
  SOMEDAY_ITEMS.unshift({t:v, m:'刚刚记下', ts:'今天'});
  input.value = '';
  renderSomeday();
}

function promoteSomeday(idx){
  var item = SOMEDAY_ITEMS[idx];
  // 加到 focus 列表末尾
  TASKS_FOCUS.push({
    title: item.t,
    priority: 'normal',
    due: '今天',
    est: '30min',
    subtasks: [
      {label:'打开任务相关工具', done:false},
      {label:'执行核心动作', done:false},
      {label:'收尾', done:false}
    ]
  });
  SOMEDAY_ITEMS.splice(idx, 1);
  renderSomeday();
  // 切到 focus 视图，跳到最后这个新任务
  switchView('focus');
  setTimeout(function(){
    currentTaskIdx = TASKS_FOCUS.length - 1;
    renderFocusTask(currentTaskIdx);
  }, 100);
}

// =====================================================================
// S8: 多巴胺庆祝 canvas
// =====================================================================
var celebrateCanvas = document.getElementById('celebrateCanvas');
var celebrateCtx = celebrateCanvas ? celebrateCanvas.getContext('2d') : null;
var celebrateParticles = [];
var celebrateRAF = null;

function resizeCelebrateCanvas(){
  if(!celebrateCanvas) return;
  celebrateCanvas.width = window.innerWidth;
  celebrateCanvas.height = window.innerHeight;
}
resizeCelebrateCanvas();
window.addEventListener('resize', resizeCelebrateCanvas);

var CELEBRATE_MSGS = [
  {text:'漂亮', sub:'又完成一件'},
  {text:'稳', sub:'保持节奏'},
  {text:'做到了', sub:'这就是 P 型的方式'},
  {text:'进展 +1', sub:'比昨天向前一步'},
  {text:'就是这一件', sub:'专注是有奖励的'}
];

function triggerCelebrate(){
  var msg = CELEBRATE_MSGS[Math.floor(Math.random() * CELEBRATE_MSGS.length)];
  document.getElementById('celebrateText').textContent = msg.text;
  document.getElementById('celebrateSub').textContent = msg.sub + ' · 已完成 ' + (currentTaskIdx + 1) + ' / ' + TASKS_FOCUS.length;
  var msgEl = document.getElementById('celebrateMsg');
  msgEl.style.display = 'block';
  msgEl.style.animation = 'none';
  void msgEl.offsetWidth;
  msgEl.style.animation = 'celebratePop 1.6s var(--ease) forwards';

  // 粒子爆发
  celebrateParticles = [];
  var cx = window.innerWidth / 2;
  var cy = window.innerHeight * 0.4;
  var colors = ['#d97757', '#e8896b', '#c89968', '#7a8c5e', '#faf9f5'];
  for(var i = 0; i < 80; i++){
    var angle = Math.random() * Math.PI * 2;
    var speed = 3 + Math.random() * 6;
    celebrateParticles.push({
      x:cx, y:cy,
      vx:Math.cos(angle) * speed,
      vy:Math.sin(angle) * speed - 2,
      r:2 + Math.random() * 4,
      color:colors[Math.floor(Math.random() * colors.length)],
      life:1
    });
  }
  if(!celebrateRAF) animateCelebrate();
  setTimeout(function(){ msgEl.style.display = 'none'; }, 1600);
}

function animateCelebrate(){
  if(!celebrateCtx){ return; }
  celebrateCtx.clearRect(0, 0, celebrateCanvas.width, celebrateCanvas.height);
  celebrateParticles.forEach(function(p){
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.vx *= 0.99;
    p.life -= 0.012;
    if(p.life > 0){
      celebrateCtx.globalAlpha = Math.max(0, p.life);
      celebrateCtx.fillStyle = p.color;
      celebrateCtx.beginPath();
      celebrateCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      celebrateCtx.fill();
    }
  });
  celebrateCtx.globalAlpha = 1;
  celebrateParticles = celebrateParticles.filter(function(p){return p.life > 0});
  if(celebrateParticles.length > 0){
    celebrateRAF = requestAnimationFrame(animateCelebrate);
  } else {
    celebrateRAF = null;
  }
}

// =====================================================================
// S9: 隔天回归奖励
// =====================================================================
function checkWelcomeBack(){
  try{
    var last = localStorage.getItem('flowsync_last_visit');
    var now = Date.now();
    var today = new Date().toDateString();
    if(!last){
      localStorage.setItem('flowsync_last_visit', now);
      localStorage.setItem('flowsync_last_date', today);
      return;
    }
    var lastDate = localStorage.getItem('flowsync_last_date');
    if(lastDate !== today){
      // 隔天回归
      var daysGap = Math.floor((now - parseInt(last, 10)) / (1000 * 60 * 60 * 24));
      var days = Math.max(1, daysGap);
      showWelcomeBack(days);
    }
    localStorage.setItem('flowsync_last_visit', now);
    localStorage.setItem('flowsync_last_date', today);
  } catch(e){}
}

function showWelcomeBack(days){
  var reward = days >= 3 ? '+3 fresh start 加成' : (days >= 2 ? '+2 回归加成' : '+1 软重启加成');
  var title = days >= 3 ? '欢迎回来' : (days >= 2 ? '好久不见' : '今天重新开始');
  var desc = days >= 3 ? '隔了 ' + days + ' 天 · 不用焦虑，AI 已替你把今天的任务重排好了' : '昨天没来也没关系 · 今天先做 1 件就够';
  var html = '<div class="welcome-back">' +
    '<button class="welcome-back__close" onclick="this.parentElement.remove()">×</button>' +
    '<div class="welcome-back__label">FRESH START</div>' +
    '<h3 class="welcome-back__title">' + title + '</h3>' +
    '<p class="welcome-back__desc">' + desc + '</p>' +
    '<div class="welcome-back__reward">✦ ' + reward + '</div>' +
  '</div>';
  var mount = document.getElementById('welcomeBackMount');
  if(mount) mount.innerHTML = html;
  // 同时触发 proactive pull banner
  showProactiveBanner(days);
}

// =====================================================================
// S10: AI Proactive Pull banner
// =====================================================================
function showProactiveBanner(days){
  var msg = days >= 3 ? '隔了 ' + days + ' 天 · 我把 5 件过期任务重新排到这周' : '昨天没完成的事 · 我已经替你后移';
  var html = '<div class="proactive-banner">' +
    '<div class="proactive-banner__icon">F</div>' +
    '<div class="proactive-banner__body"><strong>我已替你重排好</strong> · ' + msg + '</div>' +
    '<div class="proactive-banner__action" onclick="acceptProactive()">查看新计划</div>' +
  '</div>';
  var banner = document.getElementById('proactiveBanner');
  if(banner) banner.innerHTML = html;
}

function acceptProactive(){
  var banner = document.getElementById('proactiveBanner');
  if(banner) banner.innerHTML = '';
  // 切到 timeblock 看新计划
  switchView('timeblock');
}

// =====================================================================
// S11: 时间盲区可视化（块状日历）
// =====================================================================
var TIMEBLOCK_TASKS = [
  {t:'回复客户邮件', dur:0.5, priority:'normal', start:0},
  {t:'完成产品方案初稿', dur:2, priority:'high', start:0.5},
  {t:'更新项目文档', dur:1, priority:'low', start:2.5},
  {t:'整理会议笔记', dur:0.5, priority:'normal', start:3.5},
  {t:'代码审查', dur:1.5, priority:'normal', start:4}
];
var TB_TOTAL_HOURS = 8;
var TB_START_HOUR = 9;

function renderTimeblock(){
  var grids = [document.getElementById('timeblockGrid'), document.getElementById('timeblockGrid2')];
  var totalPlanned = TIMEBLOCK_TASKS.reduce(function(s, t){return s + t.dur}, 0);
  var overflow = totalPlanned > TB_TOTAL_HOURS;
  var remaining = Math.max(0, TB_TOTAL_HOURS - totalPlanned);

  ['tbCapacity', 'tbCapacity2'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = '容量 ' + TB_TOTAL_HOURS + 'h';
  });
  ['tbPlanned', 'tbPlanned2'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = '计划 ' + totalPlanned.toFixed(1) + 'h';
  });
  ['tbRemaining', 'tbRemaining2'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    if(overflow){
      el.classList.add('over');
      el.textContent = '超 ' + (totalPlanned - TB_TOTAL_HOURS).toFixed(1) + 'h';
    } else {
      el.classList.remove('over');
      el.textContent = '剩余 ' + remaining.toFixed(1) + 'h';
    }
  });

  var html = '';
  for(var h = 0; h < TB_TOTAL_HOURS; h++){
    var hour = TB_START_HOUR + h;
    html += '<div class="timeblock__ruler">' +
      '<div class="timeblock__hour-label">' + (hour < 10 ? '0' : '') + hour + ':00</div>' +
      '<div class="timeblock__track" data-hour="' + h + '"></div>' +
    '</div>';
  }
  grids.forEach(function(grid){
    if(grid) grid.innerHTML = html;
  });

  grids.forEach(function(grid){
    if(!grid) return;
    TIMEBLOCK_TASKS.forEach(function(t){
      var startHour = Math.floor(t.start);
      var track = grid.querySelector('.timeblock__track[data-hour="' + startHour + '"]');
      if(!track) return;
      var leftPct = (t.start - startHour) * 100;
      var widthPct = Math.min(t.dur * 100, 100 - leftPct);
      var cls = 'timeblock__block timeblock__block--' + t.priority;
      if(t.start + t.dur > TB_TOTAL_HOURS) cls += ' timeblock__block--overflow';
      var block = document.createElement('div');
      block.className = cls;
      block.style.left = leftPct + '%';
      block.style.width = widthPct + '%';
      block.textContent = t.t + ' · ' + t.dur + 'h';
      track.appendChild(block);
      if(t.dur > 1 - leftPct / 100){
        var nextHour = startHour + 1;
        var nextTrack = grid.querySelector('.timeblock__track[data-hour="' + nextHour + '"]');
        if(nextTrack){
          var next = block.cloneNode(true);
          next.style.left = '0';
          next.style.width = Math.min((t.dur - (1 - leftPct / 100)) * 100, 100) + '%';
          nextTrack.appendChild(next);
        }
      }
    });

    var now = new Date();
    var nowHour = now.getHours() + now.getMinutes() / 60;
    if(nowHour >= TB_START_HOUR && nowHour < TB_START_HOUR + TB_TOTAL_HOURS){
      var hourIdx = Math.floor(nowHour - TB_START_HOUR);
      var track = grid.querySelector('.timeblock__track[data-hour="' + hourIdx + '"]');
      if(track){
        var nowLine = document.createElement('div');
        nowLine.className = 'timeblock__now-line';
        nowLine.style.left = ((nowHour - TB_START_HOUR - hourIdx) * 100) + '%';
        track.appendChild(nowLine);
        var nowLabel = document.createElement('div');
        nowLabel.className = 'timeblock__now-label';
        nowLabel.style.left = ((nowHour - TB_START_HOUR - hourIdx) * 100) + '%';
        nowLabel.style.top = '0';
        nowLabel.textContent = 'NOW';
        track.appendChild(nowLabel);
      }
    }
  });
}

// =====================================================================
// S12: 创意状态机
// =====================================================================
var CREATIVE_STATES = ['idea', 'drafting', 'reviewing', 'shipped'];
var creativeStateIdx = 1;

function setCreativeState(state){
  var idx = CREATIVE_STATES.indexOf(state);
  if(idx === -1) return;
  creativeStateIdx = idx;
  document.querySelectorAll('.creative-state__chip').forEach(function(chip){
    chip.classList.toggle('active', chip.dataset.state === state);
  });
  document.getElementById('creativeProgress').style.width = ((idx + 1) * 25) + '%';
  // 更新 kind-line
  rotateKindLine();
}

// =====================================================================
// 视图扩展：chat / settings 初始化
// =====================================================================
VIEW_TITLES.chat = {title:'AI 对话', sub:'conversational'};
VIEW_TITLES.settings = {title:'设置', sub:'preferences'};

// =====================================================================
// CHAT: AI 对话 + 流式输出
// =====================================================================
var CHAT_RESPONSES = {
  '能量': {type:'energy', text:'好的，来做个能量打卡。你今天感觉怎么样？\n\n**满电** · 硬骨头先上  \n**不错** · 中等难度合适  \n**一般** · 先做机械活  \n**偏累** · 只做1件小事'},
  '打卡': {type:'energy', text:'来，10 秒搞定。告诉我今天几格电，我帮你重排任务。'},
  '拖延': {type:'sos', text:'别慌，拖延是 P 型人的常态。我们来拆一下，第一步做什么都行。\n\n告诉我是哪个任务卡住了？我帮你拆成 5 分钟能启动的版本。'},
  '拆': {type:'split', text:'好！把任务名字告诉我，我帮你拆到最小可执行——小到不可能失败。'},
  '累': {type:'mood', text:'累了就歇会，不用有负罪感。\n\n给你推荐 3 个低能量也能做的小事：\n\n1. **整理桌面** · 5 分钟  \n2. **回一封简单邮件** · 10 分钟  \n3. **文件归档** · 8 分钟\n\n做一件就算今天有进展。'},
  '专注': {type:'focus', text:'好，进入单一焦点模式。其他任务我都藏起来了，现在只做这一件事。\n\n👉 **完成产品方案初稿** · 2h · 高优先级\n\n建议第一步：新建空白文档，写个标题。就这么简单。'},
  '任务': {type:'list', text:'今天 5 件事：\n\n1. ⬜ 完成产品方案初稿 · 高 · 2h  \n2. ⬜ 回复客户邮件 · 中 · 30min  \n3. ⬜ 代码审查 · 中 · 1.5h  \n4. ⬜ 更新项目文档 · 低 · 1h  \n5. ⬜ 整理会议笔记 · 低 · 30min\n\n想先从哪件开始？或者我帮你按能量重排？'},
  '想法': {type:'someday', text:'想到什么了？说出来，我帮你放进 someday 桶。以后想做了随时拿出来，不用现在就做。'},
  '重置': {type:'reset', text:'好，今天重新开始 ✨\n\n之前的全部清零，不评判，不留痕迹。\n\n现在感觉怎么样？想从哪件事开始？或者...要不先做个能量打卡？'}
};

function detectIntent(text){
  var keys = Object.keys(CHAT_RESPONSES);
  for(var i = 0; i < keys.length; i++){
    if(text.indexOf(keys[i]) !== -1) return CHAT_RESPONSES[keys[i]];
  }
  // 默认回复
  return {type:'default', text:'收到。我是 FlowSync，你的情绪任务伙伴。\n\n你可以跟我说：\n- "几格电" 做能量打卡  \n- "拖延了" 帮你拆任务  \n- "很累" 推荐低耗任务  \n- "专注模式" 进入单一焦点\n\n想到什么说什么，不用有压力。'};
}

function handleChatKey(e){
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendChat();
  }
}

function sendChat(){
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if(!text) return;
  sendChatMsg(text);
  input.value = '';
  input.style.height = 'auto';
}

function sendChatMsg(text){
  var msgs = document.getElementById('chatMessages');
  // 用户消息
  var userMsg = document.createElement('div');
  userMsg.className = 'msg msg--user';
  userMsg.innerHTML = '<div class="msg__avatar">李</div><div class="msg__bubble">' + escapeHtml(text) + '</div>';
  msgs.appendChild(userMsg);
  msgs.scrollTop = msgs.scrollHeight;

  // AI 思考中
  var aiMsg = document.createElement('div');
  aiMsg.className = 'msg msg--ai';
  aiMsg.innerHTML = '<div class="msg__avatar">F</div><div class="msg__bubble"><div class="msg__typing"><span class="msg__typing-dot"></span><span class="msg__typing-dot"></span><span class="msg__typing-dot"></span></div></div>';
  msgs.appendChild(aiMsg);
  msgs.scrollTop = msgs.scrollHeight;

  // 模拟延迟后流式输出
  setTimeout(function(){
    var resp = detectIntent(text);
    var bubble = aiMsg.querySelector('.msg__bubble');
    bubble.innerHTML = '';
    streamText(bubble, resp.text, function(){
      // 流式输出完成后，如果是特定意图，加快捷按钮
      if(resp.type === 'energy'){
        var opts = document.createElement('div');
        opts.style.cssText = 'display:flex;gap:6px;margin-top:12px;flex-wrap:wrap';
        ['满电','不错','一般','偏累'].forEach(function(lvl){
          var btn = document.createElement('span');
          btn.className = 'chat__suggestion';
          btn.style.margin = '0';
          btn.textContent = lvl;
          btn.onclick = function(){ sendChatMsg('我今天' + lvl); };
          opts.appendChild(btn);
        });
        bubble.appendChild(opts);
      }
      msgs.scrollTop = msgs.scrollHeight;
    });
  }, 600 + Math.random() * 400);
}

function streamText(el, text, callback){
  var i = 0;
  var speed = 15 + Math.random() * 10;
  // 把 markdown 格式简单处理：**bold**
  var html = '';
  function step(){
    if(i >= text.length){
      if(callback) callback();
      return;
    }
    html += text[i];
    el.innerHTML = formatSimpleMd(html);
    i++;
    setTimeout(step, speed);
  }
  step();
}

function formatSimpleMd(text){
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(s){
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// chat input 自动高度
document.addEventListener('DOMContentLoaded', function(){
  var ci = document.getElementById('chatInput');
  if(ci){
    ci.addEventListener('input', function(){
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
});

// =====================================================================
// TOAST 通知系统
// =====================================================================
function showToast(title, desc, type){
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if(!container) return;
  var icons = {success:'✓', error:'!', info:'i'};
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    '<div class="toast__icon toast__icon--' + type + '">' + icons[type] + '</div>' +
    '<div class="toast__body">' +
      '<div class="toast__title">' + title + '</div>' +
      (desc ? '<div class="toast__desc">' + desc + '</div>' : '') +
    '</div>';
  container.appendChild(toast);
  setTimeout(function(){
    toast.classList.add('out');
    setTimeout(function(){ toast.remove(); }, 300);
  }, 2800);
}

// =====================================================================
// COMMAND PALETTE (Cmd/Ctrl + K)
// =====================================================================
var CMD_ITEMS = [
  {label:'项目编排', icon:'🧭', shortcut:'G P', action:function(){switchView('projects')}},
  {label:'新建项目规划', icon:'✨', shortcut:'N P', action:function(){switchView('projects');setTimeout(function(){var i=document.getElementById('projectsInput');if(i)i.focus()},300)}},
  {label:'项目时间线', icon:'📅', shortcut:'T L', action:function(){switchView('projects');setTimeout(function(){var s=document.getElementById('projectsTimelineSection');if(s)s.scrollIntoView({behavior:'smooth'})},300)}},
  {label:'仪表盘', icon:'📊', shortcut:'G D', action:function(){switchView('dashboard')}},
  {label:'AI 对话', icon:'💬', shortcut:'G C', action:function(){switchView('chat')}},
  {label:'专注模式', icon:'🎯', shortcut:'G F', action:function(){switchView('focus')}},
  {label:'任务列表', icon:'📋', shortcut:'G T', action:function(){switchView('dashboard')}},
  {label:'时间块', icon:'⏱️', shortcut:'G B', action:function(){switchView('timeblock')}},
  {label:'想法桶', icon:'💡', shortcut:'G S', action:function(){switchView('someday')}},
  {label:'团队同步', icon:'👥', shortcut:'G M', action:function(){switchView('team')}},
  {label:'情绪自适应', icon:'❤️', shortcut:'G M', action:function(){switchView('mood')}},
  {label:'设置', icon:'⚙️', shortcut:'G ,', action:function(){switchView('settings')}},
  {label:'切换主题', icon:'🌓', shortcut:'T', action:function(){toggleTheme()}},
  {label:'单一焦点', icon:'🔍', shortcut:'F', action:function(){enterSingleFocus()}},
  {label:'能量打卡', icon:'🔋', shortcut:'E', action:function(){switchView('dashboard');document.querySelector('.energy-checkin').scrollIntoView({behavior:'smooth'})}},
  {label:'拖延 SOS', icon:'🆘', shortcut:'S', action:function(){showSOS()}},
  {label:'清空数据', icon:'🗑️', shortcut:'', action:function(){clearAllData()}},
  {label:'退出登录', icon:'🚪', shortcut:'', action:function(){logout()}}
];
var cmdActiveIdx = 0;
var cmdFiltered = CMD_ITEMS.slice();

function openCmd(){
  var overlay = document.getElementById('cmdOverlay');
  overlay.classList.add('show');
  cmdFiltered = CMD_ITEMS.slice();
  cmdActiveIdx = 0;
  renderCmdList();
  setTimeout(function(){
    var input = document.getElementById('cmdInput');
    input.value = '';
    input.focus();
  }, 50);
}

function closeCmd(e){
  if(e && e.target !== e.currentTarget) return;
  document.getElementById('cmdOverlay').classList.remove('show');
}

function filterCmd(q){
  q = q.toLowerCase();
  cmdFiltered = CMD_ITEMS.filter(function(item){
    return item.label.toLowerCase().indexOf(q) !== -1;
  });
  cmdActiveIdx = 0;
  renderCmdList();
}

function renderCmdList(){
  var list = document.getElementById('cmdList');
  list.innerHTML = cmdFiltered.map(function(item, i){
    return '<div class="cmd__item' + (i === cmdActiveIdx ? ' active' : '') + '" onclick="runCmd(' + i + ')">' +
      '<div class="cmd__item-icon">' + item.icon + '</div>' +
      '<div class="cmd__item-body">' +
        '<div class="cmd__item-label">' + item.label + '</div>' +
      '</div>' +
      (item.shortcut ? '<div class="cmd__item-shortcut">' + item.shortcut + '</div>' : '') +
    '</div>';
  }).join('');
}

function handleCmdKey(e){
  if(e.key === 'Escape'){ closeCmd(); return; }
  if(e.key === 'ArrowDown'){ e.preventDefault(); cmdActiveIdx = Math.min(cmdActiveIdx + 1, cmdFiltered.length - 1); renderCmdList(); return; }
  if(e.key === 'ArrowUp'){ e.preventDefault(); cmdActiveIdx = Math.max(cmdActiveIdx - 1, 0); renderCmdList(); return; }
  if(e.key === 'Enter'){ e.preventDefault(); runCmd(cmdActiveIdx); }
}

function runCmd(idx){
  var item = cmdFiltered[idx];
  if(item && item.action){
    closeCmd();
    setTimeout(function(){ item.action(); showToast('已执行', item.label, 'success'); }, 100);
  }
}

// 全局快捷键
document.addEventListener('keydown', function(e){
  if((e.metaKey || e.ctrlKey) && e.key === 'k'){
    e.preventDefault();
    var overlay = document.getElementById('cmdOverlay');
    if(overlay.classList.contains('show')) closeCmd();
    else openCmd();
  }
  if(e.key === 'Escape'){
    var overlay = document.getElementById('cmdOverlay');
    if(overlay && overlay.classList.contains('show')) closeCmd();
  }
});

// =====================================================================
// THEME 主题切换
// =====================================================================
function toggleTheme(){
  var html = document.documentElement;
  var current = html.getAttribute('data-theme') || 'dark';
  var next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  var toggle = document.getElementById('themeToggle');
  if(toggle) toggle.classList.toggle('on', next === 'light');
  try{ localStorage.setItem('flowsync_theme', next); }catch(e){}
  showToast('主题已切换', next === 'light' ? '浅色模式' : '深色模式', 'info');
}

function toggleMotion(){
  var toggle = document.getElementById('motionToggle');
  var reduced = document.body.classList.toggle('reduced-motion');
  toggle.classList.toggle('on', !reduced);
  if(reduced){
    document.documentElement.style.setProperty('--motion-multiplier', '0.01');
  } else {
    document.documentElement.style.removeProperty('--motion-multiplier');
  }
  showToast('动效强度', reduced ? '已减少' : '已恢复', 'info');
}

// 加载主题
try{
  var savedTheme = localStorage.getItem('flowsync_theme');
  if(savedTheme === 'light'){
    document.documentElement.setAttribute('data-theme', 'light');
    setTimeout(function(){
      var t = document.getElementById('themeToggle');
      if(t) t.classList.add('on');
    }, 0);
  }
}catch(e){}

// =====================================================================
// 本地存储持久化
// =====================================================================
function saveState(){
  try{
    var state = {
      tasks: TASKS_FOCUS,
      someday: SOMEDAY_ITEMS,
      energy: currentMood,
      taskIdx: currentTaskIdx
    };
    localStorage.setItem('flowsync_state', JSON.stringify(state));
  }catch(e){}
}

function loadState(){
  try{
    var raw = localStorage.getItem('flowsync_state');
    if(!raw) return;
    var s = JSON.parse(raw);
    if(s.tasks) TASKS_FOCUS = s.tasks;
    if(s.someday) SOMEDAY_ITEMS = s.someday;
    if(s.energy) currentMood = s.energy;
    if(s.taskIdx) currentTaskIdx = s.taskIdx;
  }catch(e){}
}

function clearAllData(){
  try{
    localStorage.removeItem('flowsync_state');
    localStorage.removeItem('flowsync_theme');
    localStorage.removeItem('flowsync_last_visit');
    localStorage.removeItem('flowsync_last_date');
    localStorage.removeItem('flowsync_projects');
  }catch(e){}
  showToast('已清空', '所有本地数据已删除', 'success');
  setTimeout(function(){ location.reload(); }, 800);
}

// ============ API Key 管理 ============
function getApiKeysStore(){
  try{
    var raw = localStorage.getItem('flowsync_api_keys');
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}

function setApiKeysStore(obj){
  localStorage.setItem('flowsync_api_keys', JSON.stringify(obj));
}

function loadApiKeysPanel(){
  var store = getApiKeysStore();
  var fields = {
    amapKey: store.AMAP_API_KEY || '',
    llmKey: store.LLM_API_KEY || '',
    llmUrl: store.LLM_API_URL || '',
    llmModel: store.LLM_MODEL || '',
    qweatherKey: store.QWEATHER_API_KEY || '',
    flightKey: store.FLIGHT_API_KEY || ''
  };
  for(var id in fields){
    var el = document.getElementById(id);
    if(el) el.value = fields[id];
  }
  updateApiBadges(store);
}

function updateApiBadges(store){
  var map = {
    amapBadge: !!store.AMAP_API_KEY,
    llmBadge: !!store.LLM_API_KEY,
    qweatherBadge: !!store.QWEATHER_API_KEY,
    flightBadge: !!store.FLIGHT_API_KEY
  };
  for(var id in map){
    var el = document.getElementById(id);
    if(!el) continue;
    if(map[id]){
      el.textContent = '已配置';
      el.className = 'apicard__badge apicard__badge--on';
    } else {
      el.textContent = '未配置';
      el.className = 'apicard__badge apicard__badge--off';
    }
  }
}

function saveApiKey(service){
  var store = getApiKeysStore();
  var val;
  if(service === 'amap'){
    val = (document.getElementById('amapKey').value || '').trim();
    if(val) store.AMAP_API_KEY = val; else delete store.AMAP_API_KEY;
  } else if(service === 'llm'){
    val = (document.getElementById('llmKey').value || '').trim();
    if(val) store.LLM_API_KEY = val; else delete store.LLM_API_KEY;
    var url = (document.getElementById('llmUrl').value || '').trim();
    if(url) store.LLM_API_URL = url; else delete store.LLM_API_URL;
    var model = (document.getElementById('llmModel').value || '').trim();
    if(model) store.LLM_MODEL = model; else delete store.LLM_MODEL;
  } else if(service === 'qweather'){
    val = (document.getElementById('qweatherKey').value || '').trim();
    if(val) store.QWEATHER_API_KEY = val; else delete store.QWEATHER_API_KEY;
  } else if(service === 'flight'){
    val = (document.getElementById('flightKey').value || '').trim();
    if(val) store.FLIGHT_API_KEY = val; else delete store.FLIGHT_API_KEY;
  }
  setApiKeysStore(store);
  updateApiBadges(store);
  showToast('已保存', 'API Key 已更新到本机', 'success');
}

// 每个交互后自动保存
var origComplete = completeTask;
var origAddSomeday = addSomeday;
var origPromote = promoteSomeday;
var origSelectEnergy = selectEnergy;

// 包装原函数（在 INIT 后执行，等函数定义完）
function wrapSaveFunctions(){
  var oldComplete = completeTask;
  window.completeTask = function(){
    oldComplete();
    saveState();
  };
  var oldAdd = addSomeday;
  window.addSomeday = function(){
    oldAdd();
    saveState();
  };
  var oldPromote = promoteSomeday;
  window.promoteSomeday = function(i){
    oldPromote(i);
    saveState();
  };
  var oldEnergy = selectEnergy;
  window.selectEnergy = function(el, key){
    oldEnergy(el, key);
    saveState();
  };
  var oldToggle = toggleSubtask;
  window.toggleSubtask = function(el, idx){
    oldToggle(el, idx);
    saveState();
  };
}

// =====================================================================
// 时间块拖拽排序
// =====================================================================
var tbDragging = null;
var tbDragOffset = 0;

function enableTimeblockDrag(){
  ['timeblockGrid', 'timeblockGrid2'].forEach(function(gridId){
    var grid = document.getElementById(gridId);
    if(!grid) return;
    var blocks = grid.querySelectorAll('.timeblock__block');
    blocks.forEach(function(block, idx){
      block.style.cursor = 'grab';
      block.addEventListener('mousedown', function(e){
        if(e.button !== 0) return;
        e.preventDefault();
        startTbDrag(block, e.clientX, e.clientY);
      });
      block.addEventListener('touchstart', function(e){
        startTbDrag(block, e.touches[0].clientX, e.touches[0].clientY);
      }, {passive:true});
    });
  });
}

function startTbDrag(block, startX, startY){
  tbDragging = block;
  var rect = block.getBoundingClientRect();
  tbDragOffset = startX - rect.left;
  block.style.opacity = '0.8';
  block.style.cursor = 'grabbing';
  block.style.zIndex = '10';
  block.style.transform = 'scale(1.02)';
  block.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';

  function onMove(e){
    if(!tbDragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var track = tbDragging.parentElement;
    var trackRect = track.getBoundingClientRect();
    var newLeft = clientX - trackRect.left - tbDragOffset;
    var maxLeft = trackRect.width - tbDragging.offsetWidth;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    tbDragging.style.left = (newLeft / trackRect.width * 100) + '%';
  }

  function onUp(e){
    if(!tbDragging) return;
    var clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    var track = tbDragging.parentElement;
    var trackRect = track.getBoundingClientRect();
    var hourIdx = parseInt(track.dataset.hour, 10);
    var newStart = hourIdx + ((clientX - trackRect.left - tbDragOffset) / trackRect.width);
    newStart = Math.max(0, Math.min(newStart, TB_TOTAL_HOURS - 0.5));

    // 找到对应 task 并更新
    var blockText = tbDragging.textContent.split(' · ')[0];
    var task = TIMEBLOCK_TASKS.find(function(t){ return t.t === blockText; });
    if(task){
      task.start = Math.round(newStart * 4) / 4;
    }

    tbDragging.style.opacity = '';
    tbDragging.style.cursor = '';
    tbDragging.style.zIndex = '';
    tbDragging.style.transform = '';
    tbDragging.style.boxShadow = '';
    tbDragging = null;

    // 重新渲染
    renderTimeblock();
    showToast('已调整', blockText + ' 时间已更新', 'success');
    saveState();

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, {passive:true});
  document.addEventListener('touchend', onUp);
}

// 把 renderTimeblock 包装一下，渲染完启用拖拽
var _origRenderTimeblock = renderTimeblock;
renderTimeblock = function(){
  _origRenderTimeblock();
  setTimeout(enableTimeblockDrag, 50);
};

// =====================================================================
// 仪表盘卡片可点击跳转
// =====================================================================
function makeCardsClickable(){
  var focusNow = document.querySelector('.focus-now');
  if(focusNow){
    focusNow.style.cursor = 'pointer';
    focusNow.addEventListener('click', function(){ switchView('focus'); });
  }
}

// =====================================================================
// 视图扩展：someday / timeblock 初始化
// =====================================================================
VIEW_TITLES.someday = {title:'想法桶', sub:'someday / maybe'};
VIEW_TITLES.timeblock = {title:'时间块', sub:'time-blocked'};

// =====================================================================
// PROJECTS ORCHESTRATOR (项目编排器)
// =====================================================================
var PROJECT_TEMPLATES = {
  interview: {
    keywords: ['面试', 'interview', '面试准备'],
    name: '面试准备',
    icon: '🎯',
    color: 'terracotta',
    modules: [
      { name: '技术复习', estTime: '3h', items: ['算法刷题', '系统设计', '八股文复习'] },
      { name: '项目复盘', estTime: '2h', items: ['梳理项目亮点', '准备技术难点回答'] },
      { name: '模拟面试', estTime: '1h', items: ['找朋友模拟', '录音回听改进'] },
      { name: '自我介绍', estTime: '30min', items: ['准备3分钟版本', '准备1分钟版本'] },
      { name: '简历修改', estTime: '1h', items: ['针对岗位优化', '检查格式'] }
    ]
  },
  competition: {
    keywords: ['比赛', 'contest', 'competition', '竞赛'],
    name: '比赛准备',
    icon: '🏆',
    color: 'ochre',
    modules: [
      { name: '需求分析', estTime: '2h', items: ['理解题目', '调研竞品', '确定方向'] },
      { name: '方案设计', estTime: '3h', items: ['技术选型', '架构设计', 'UI/UX 设计'] },
      { name: '开发实现', estTime: '8h', items: ['核心功能开发', '数据对接', '界面实现'] },
      { name: '测试优化', estTime: '2h', items: ['功能测试', '性能优化', 'Bug修复'] },
      { name: '提交准备', estTime: '1h', items: ['文档撰写', '演示视频', '最终检查'] }
    ]
  },
  travel: {
    keywords: ['旅游', '旅行', 'travel', '去玩', '出去玩', '去哪'],
    name: '旅行规划',
    icon: '✈️',
    color: 'moss',
    modules: [
      { name: '交通预订', estTime: '30min', items: ['查询机票/高铁', '比价预订', '确认行程'] },
      { name: '酒店预订', estTime: '30min', items: ['选择区域', '比价预订', '确认入住信息'] },
      { name: '景点规划', estTime: '1h', items: ['必去景点', '路线规划', '购票'] },
      { name: '美食推荐', estTime: '30min', items: ['当地特色', '餐厅预订'] },
      { name: '行李准备', estTime: '30min', items: ['衣物清单', '日用品', '证件'] },
      { name: '出行提醒', estTime: '10min', items: ['出发前提醒', '通勤方式推荐', '天气查看'] }
    ]
  }
};

var PROJECT_EXAMPLES = [
  '下周三有腾讯面试',
  '月底要去成都玩3天',
  '下周有创新比赛要交'
];

var PROJECTS = [];
var _projectsAiTargetId = null;

// ---- DDL 解析 ----
function parseDDL(text){
  var now = new Date();
  var result = null;
  // 下周X
  var m = text.match(/下周([一二三四五六日天])/);
  if(m){
    var dayMap = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0};
    var day = dayMap[m[1]];
    if(day !== undefined){
      var d = new Date(now);
      d.setDate(d.getDate() + 7);
      var cur = d.getDay();
      var diff = (day - cur + 7) % 7;
      d.setDate(d.getDate() + diff);
      result = {date: d, label: '下周' + m[1]};
    }
  }
  // 这周X / 周X
  if(!result){
    m = text.match(/(?:这周|本周|周)([一二三四五六日天])/);
    if(m){
      var dm2 = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0};
      var day2 = dm2[m[1]];
      if(day2 !== undefined){
        var d2 = new Date(now);
        var cur2 = d2.getDay();
        var diff2 = (day2 - cur2 + 7) % 7;
        if(diff2 === 0) diff2 = 7;
        d2.setDate(d2.getDate() + diff2);
        result = {date: d2, label: '周' + m[1]};
      }
    }
  }
  // 月底
  if(!result && /月底/.test(text)){
    var d3 = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    result = {date: d3, label: '月底'};
  }
  // X天后 / X天后
  if(!result){
    m = text.match(/(\d+)\s*天后/);
    if(m){
      var d4 = new Date(now);
      d4.setDate(d4.getDate() + parseInt(m[1], 10));
      result = {date: d4, label: m[1] + '天后'};
    }
  }
  // 明天
  if(!result && /明天/.test(text)){
    var d5 = new Date(now);
    d5.setDate(d5.getDate() + 1);
    result = {date: d5, label: '明天'};
  }
  return result;
}

function formatDate(date){
  if(!date) return '';
  var m = date.getMonth() + 1;
  var d = date.getDate();
  return (m < 10 ? '0' : '') + m + '/' + (d < 10 ? '0' : '') + d;
}

function daysUntil(date){
  if(!date) return null;
  var now = new Date();
  now.setHours(0,0,0,0);
  var t = new Date(date);
  t.setHours(0,0,0,0);
  return Math.round((t - now) / (1000 * 60 * 60 * 24));
}

// ---- 模板匹配 (混合模式 C) ----
function matchTemplate(text){
  var keys = Object.keys(PROJECT_TEMPLATES);
  for(var i = 0; i < keys.length; i++){
    var tpl = PROJECT_TEMPLATES[keys[i]];
    for(var j = 0; j < tpl.keywords.length; j++){
      if(text.indexOf(tpl.keywords[j]) !== -1){
        return tpl;
      }
    }
  }
  return null;
}

// ---- 动态生成 (AI fallback) ----
var DYNAMIC_MODULE_POOL = [
  { name: '信息收集', estTime: '30min', items: ['搜索资料', '整理要点'] },
  { name: '方案规划', estTime: '1h', items: ['列出步骤', '确定优先级'] },
  { name: '执行核心', estTime: '2h', items: ['动手开始', '完成主体'] },
  { name: '检查完善', estTime: '30min', items: ['回顾检查', '补充细节'] },
  { name: '收尾交付', estTime: '20min', items: ['整理输出', '确认完成'] }
];

function generateDynamicProject(text){
  var ddl = parseDDL(text);
  var name = text.length > 12 ? text.slice(0, 12) + '...' : text;
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name: name,
    icon: '📋',
    color: 'terracotta',
    ddl: ddl,
    modules: DYNAMIC_MODULE_POOL.map(function(m){
      return {
        id: 'mod_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        name: m.name,
        estTime: m.estTime,
        items: m.items.map(function(it){ return {label: it, done: false}; })
      };
    }),
    createdAt: Date.now()
  };
}

function buildProjectFromTemplate(tpl, text){
  var ddl = parseDDL(text);
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name: tpl.name,
    icon: tpl.icon,
    color: tpl.color,
    ddl: ddl,
    modules: tpl.modules.map(function(m){
      return {
        id: 'mod_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        name: m.name,
        estTime: m.estTime,
        items: m.items.map(function(it){ return {label: it, done: false}; })
      };
    }),
    createdAt: Date.now()
  };
}

// ---- Mock 数据（演示用）----
function getMockProjects(text){
  var templates = {
    '猫': {
      name: '养一只猫',
      modules: [
        {name: '准备阶段', tasks: [
          {title: '了解养猫必备物品清单', tool: 'browser', toolLabel: '清单'},
          {title: '挑选合适的猫粮品牌', tool: 'browser', toolLabel: '比价'}
        ]},
        {name: '选购阶段', tasks: [
          {title: '购买猫砂和猫砂盆', tool: 'browser', toolLabel: '购物'},
          {title: '购买猫粮和零食', tool: 'browser', toolLabel: '购物'},
          {title: '准备猫窝和玩具', tool: 'browser', toolLabel: '购物'}
        ]},
        {name: '接猫回家', tasks: [
          {title: '联系猫舍预约接猫时间', tool: 'calendar', toolLabel: '日程'},
          {title: '准备猫咪体检', tool: 'browser', toolLabel: '医院'}
        ]}
      ]
    },
    '面试': {
      name: '腾讯面试准备',
      modules: [
        {name: '技术复习', tasks: [
          {title: '整理数据结构与算法笔记', tool: 'browser', toolLabel: '笔记'},
          {title: '复习 JavaScript 核心知识点', tool: 'browser', toolLabel: '资料'}
        ]},
        {name: '项目梳理', tasks: [
          {title: '整理项目经历亮点', tool: 'browser', toolLabel: '简历'},
          {title: '准备项目演示 Demo', tool: 'browser', toolLabel: '演示'}
        ]},
        {name: '面试当天', tasks: [
          {title: '确认面试时间和地点', tool: 'calendar', toolLabel: '提醒'},
          {title: '规划路线避免迟到', tool: 'map', toolLabel: '导航'}
        ]}
      ]
    },
    '旅游': {
      name: '成都三日游',
      modules: [
        {name: '行程规划', tasks: [
          {title: '查询成都天气情况', tool: 'weather', toolLabel: '天气'},
          {title: '规划必去景点路线', tool: 'map', toolLabel: '路线'}
        ]},
        {name: '交通预订', tasks: [
          {title: '预订往返高铁票', tool: 'train', toolLabel: '12306'},
          {title: '预订酒店住宿', tool: 'browser', toolLabel: '携程'}
        ]},
        {name: '美食攻略', tasks: [
          {title: '搜索成都特色美食', tool: 'browser', toolLabel: '推荐'},
          {title: '预订热门餐厅', tool: 'browser', toolLabel: '订座'}
        ]}
      ]
    }
  };
  for(var key in templates){
    if(text.includes(key)) return [templates[key]];
  }
  return [{
    name: text,
    modules: [
      {name: '前期准备', tasks: [
        {title: '收集相关资料', tool: 'browser', toolLabel: '搜索'}
      ]},
      {name: '执行阶段', tasks: [
        {title: '分解具体任务步骤', tool: 'browser', toolLabel: '清单'}
      ]},
      {name: '总结复盘', tasks: [
        {title: '记录完成情况', tool: 'browser', toolLabel: '笔记'}
      ]}
    ]
  }];
}

// ---- 生成入口（优先调用 Demo API，失败用 Mock 数据）----
async function generateProjects(){
  var input = document.getElementById('projectsInput');
  var text = input.value.trim();
  if(!text){
    showToast('请输入内容', '告诉我你要做什么', 'info');
    return;
  }
  var loading = document.getElementById('projectsLoading');
  var empty = document.getElementById('projectsEmpty');
  var list = document.getElementById('projectsList');
  loading.style.display = 'flex';
  if(empty) empty.style.display = 'none';
  list.style.opacity = '0.3';

  try{
    var result = null;
    try{
      result = await API.demoGenerate(text);
    }catch(apiErr){
      console.log('[Demo] API 调用失败，使用 Mock 数据:', apiErr.message);
      result = null;
    }

    var projectsToRender = [];
    if(result && result.success && result.data){
      var demoProjects = result.data.projects || [{ name: result.data.name, modules: result.data.modules }];
      projectsToRender = demoProjects;
    }else{
      projectsToRender = getMockProjects(text);
    }

    PROJECTS = projectsToRender.map(function(p, i){
      return {
        id: Date.now() + i,
        name: p.name || text,
        type: 'custom',
        icon: '📋',
        color: 'terracotta',
        priority: 'normal',
        status: 'active',
        modules: (p.modules || []).map(function(m, mi){
          return {
            id: Date.now() + mi,
            name: m.name,
            sort_order: mi,
            is_collapsed: false,
            items: (m.tasks || []).map(function(t, ti){
              var tool = t.tool || '';
              var toolLabel = t.toolLabel || '';
              if(t.metadata){
                try{ var meta = JSON.parse(t.metadata); if(meta.tool) tool = meta.tool; if(meta.toolLabel) toolLabel = meta.toolLabel; }catch(e){}
              }
              return {
                id: Date.now() + mi * 100 + ti,
                title: t.title,
                sort_order: ti,
                done: false,
                tool: tool,
                toolLabel: toolLabel
              };
            })
          };
        })
      };
    });
    renderProjectsLocal();

    loading.style.display = 'none';
    list.style.opacity = '';
    input.value = '';
    showToast('已生成', 'AI 为你拆解了项目', 'success');
  }catch(e){
    loading.style.display = 'none';
    list.style.opacity = '';
    showToast('生成失败', e.message, 'error');
  }
}

function fillProjectExample(idx){
  var input = document.getElementById('projectsInput');
  input.value = PROJECT_EXAMPLES[idx] || '';
  input.focus();
}

// ---- 渲染 ----
// PROJECTS 作为后端数据的内存缓存（不再持久化到 localStorage）
async function renderProjects(){
  var list = document.getElementById('projectsList');
  var empty = document.getElementById('projectsEmpty');
  var tlSection = document.getElementById('projectsTimelineSection');
  if(!list) return;
  try{
    var result = await API.getProjects();
    PROJECTS = (result.data || []).map(normalizeProject);
    renderProjectsLocal();
    API.checkReminders().catch(function(){});
  }catch(e){
    if(PROJECTS.length === 0){
      renderProjectsLocal();
    }else{
      list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--paper-mute)">加载失败，请刷新重试</div>';
    }
  }
}

// 仅从本地缓存重新渲染（不发起 API 请求）
function renderProjectsLocal(){
  var list = document.getElementById('projectsList');
  var empty = document.getElementById('projectsEmpty');
  var tlSection = document.getElementById('projectsTimelineSection');
  if(!list) return;
  if(PROJECTS.length === 0){
    list.innerHTML = '';
    if(empty) empty.style.display = 'block';
    if(tlSection) tlSection.style.display = 'none';
    return;
  }
  if(empty) empty.style.display = 'none';
  list.innerHTML = PROJECTS.map(function(p, i){ return renderProjectCardHTML(p, i); }).join('');
  if(tlSection) tlSection.style.display = 'block';
  renderTimeline();
  enableModuleDrag();
}

// ---- 后端数据归一化 ----
// 后端字段 → 前端结构：
//   项目 {id, name, type, icon, color, ddl, priority, status, difficulty, estimated_hours, modules}
//   模块 {id, name, estimated_time, sort_order, is_collapsed, tasks}
//   任务 {id, title, is_completed, sort_order}
function normalizeProject(p){
  return {
    id: p.id,
    name: p.name || '',
    type: p.type || '',
    icon: p.icon || '📋',
    color: p.color || 'terracotta',
    ddl: p.ddl ? parseBackendDDL(p.ddl) : null,
    priority: p.priority,
    status: p.status,
    difficulty: p.difficulty,
    estimated_hours: p.estimated_hours,
    modules: (p.modules || []).map(normalizeModule).sort(function(a,b){
      return (a.sort_order||0) - (b.sort_order||0);
    })
  };
}

function normalizeModule(m){
  return {
    id: m.id,
    name: m.name || '',
    estTime: m.estimated_time || '1h',
    sort_order: m.sort_order || 0,
    is_collapsed: !!m.is_collapsed,
    items: (m.tasks || []).map(normalizeTask).sort(function(a,b){
      return (a.sort_order||0) - (b.sort_order||0);
    })
  };
}

function normalizeTask(t){
  // 后端 boolean 为 0/1（SQLite），需转换为布尔
  var done = t.is_completed;
  var tool = t.tool || '';
  var toolLabel = t.toolLabel || '';
  // 从 metadata 解析 tool 信息
  if(t.metadata && !tool){
    try{
      var meta = JSON.parse(t.metadata);
      if(meta.tool) tool = meta.tool;
      if(meta.toolLabel) toolLabel = meta.toolLabel;
    }catch(e){}
  }
  return {
    id: t.id,
    label: t.title || '',
    done: done === true || done === 1 || done === '1' || done === 'true',
    sort_order: t.sort_order || 0,
    tool: tool,
    toolLabel: toolLabel
  };
}

function parseBackendDDL(ddl){
  var d = new Date(ddl);
  if(isNaN(d.getTime())){
    var parts = String(ddl).split(/[-\/]/);
    if(parts.length >= 3){
      d = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
    }
  }
  if(isNaN(d.getTime())) return null;
  var label = (d.getMonth()+1) + '/' + d.getDate();
  return { date: d, label: label };
}

function renderProjectCardHTML(p, idx){
  var totalMods = p.modules.length;
  var doneMods = p.modules.filter(function(m){
    return m.items.length > 0 && m.items.every(function(it){return it.done});
  }).length;
  var pct = totalMods > 0 ? Math.round((doneMods / totalMods) * 100) : 0;
  var ddlHTML = '';
  if(p.ddl){
    var days = daysUntil(p.ddl.date);
    var urgent = days !== null && days <= 2;
    var cdText = days === null ? '' : (days === 0 ? '今天' : days < 0 ? '已过期' : days + ' 天后');
    ddlHTML = '<span class="projects__ddl projects__ddl--' + p.color + '">⏰ ' + p.ddl.label + ' · ' + formatDate(p.ddl.date) + '</span>' +
      '<span class="projects__countdown' + (urgent ? ' urgent' : '') + '">' + cdText + '</span>';
  }
  // 冲突检测
  var conflictHTML = '';
  var conflicts = getProjectConflicts(p);
  if(conflicts.length > 0){
    conflictHTML = '<div class="projects__conflict">' +
      '<div class="projects__conflict-icon">!</div>' +
      '<div class="projects__conflict-body"><strong>DDL 冲突</strong> · ' + conflicts.map(function(c){return c.name}).join('、') + ' 和本项目 DDL 在同一天</div>' +
      '<button class="projects__conflict-fix" onclick="fixConflict(' + idx + ')">延后一天</button>' +
      '</div>';
  }
  var modulesHTML = p.modules.map(function(m, mi){ return renderModuleHTML(p, idx, mi); }).join('');
  return '<div class="projects__card projects__card--' + p.color + ' fade-up" data-pidx="' + idx + '">' +
    '<div class="projects__card-header">' +
      '<div class="projects__card-title-wrap">' +
        '<div class="projects__card-icon">' + p.icon + '</div>' +
        '<input class="projects__card-name-edit" value="' + escapeAttr(p.name) + '" onblur="editProjectName(' + idx + ',this.value)" onkeydown="if(event.key===\'Enter\')this.blur()">' +
      '</div>' +
      '<div class="projects__card-actions">' +
        '<button class="projects__card-action projects__card-action--danger" onclick="deleteProject(' + idx + ')" title="删除项目">×</button>' +
      '</div>' +
    '</div>' +
    '<div class="projects__card-meta">' + ddlHTML + '</div>' +
    conflictHTML +
    '<div class="projects__progress-wrap">' +
      '<div class="projects__progress-label"><span>进度</span><span>' + doneMods + ' / ' + totalMods + ' 模块</span></div>' +
      '<div class="projects__progress"><div class="projects__progress-fill" style="width:' + pct + '%"></div></div>' +
    '</div>' +
    '<div class="projects__modules" id="projMods_' + idx + '">' + modulesHTML + '</div>' +
    '<div class="projects__card-footer">' +
      '<button class="projects__add-module-btn" onclick="toggleAddForm(' + idx + ')">+ 添加模块</button>' +
      '<button class="projects__ai-btn" onclick="openProjectsAi(' + idx + ')">✨ 让 AI 补充</button>' +
    '</div>' +
    '<div class="projects__add-form" id="addForm_' + idx + '">' +
      '<input class="projects__add-input" id="addName_' + idx + '" placeholder="模块名称" onkeydown="if(event.key===\'Enter\')confirmAddModule(' + idx + ')">' +
      '<input class="projects__add-input" id="addTime_' + idx + '" placeholder="预估时间 如 1h" style="max-width:120px" onkeydown="if(event.key===\'Enter\')confirmAddModule(' + idx + ')">' +
      '<button class="projects__add-confirm" onclick="confirmAddModule(' + idx + ')">添加</button>' +
    '</div>' +
  '</div>';
}

function renderModuleHTML(p, pi, mi){
  var m = p.modules[mi];
  var itemsHTML = m.items.map(function(it, ii){
    var toolBtn = '';
    if(it.tool && it.toolLabel){
      toolBtn = '<button class="task-tool-btn" onclick="event.stopPropagation();runTaskTool(' + pi + ',' + mi + ',' + ii + ')" title="' + escapeAttr(it.toolLabel) + '">' + escapeHtml(it.toolLabel) + '</button>';
    }
    return '<div class="projects__module-item">' +
      '<div class="projects__item-check' + (it.done ? ' done' : '') + '" onclick="toggleProjectItem(' + pi + ',' + mi + ',' + ii + ')">' +
        '<svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,8"/></svg>' +
      '</div>' +
      '<span class="projects__item-label' + (it.done ? ' done' : '') + '">' + escapeHtml(it.label) + '</span>' +
      toolBtn +
    '</div>';
  }).join('');
  return '<div class="projects__module expanded" data-midx="' + mi + '" draggable="true">' +
    '<div class="projects__module-header" onclick="toggleModule(this)">' +
      '<div class="projects__module-drag" onclick="event.stopPropagation()">' +
        '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>' +
      '</div>' +
      '<div class="projects__module-toggle"><svg viewBox="0 0 24 24"><polyline points="9,6 15,12 9,18"/></svg></div>' +
      '<input class="projects__module-name" value="' + escapeAttr(m.name) + '" onclick="event.stopPropagation()" onblur="editModuleName(' + pi + ',' + mi + ',this.value)" onkeydown="if(event.key===\'Enter\')this.blur()">' +
      '<span class="projects__module-time">' + escapeHtml(m.estTime) + '</span>' +
      '<div class="projects__module-actions">' +
        '<button class="projects__module-action projects__module-action--delete" onclick="event.stopPropagation();deleteModule(' + pi + ',' + mi + ')" title="删除模块">×</button>' +
      '</div>' +
    '</div>' +
    '<div class="projects__module-items">' + itemsHTML + '</div>' +
  '</div>';
}

function escapeAttr(s){
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 查找项目索引的辅助
function findProjectIdx(id){
  var clean = String(id);
  for(var i = 0; i < PROJECTS.length; i++){
    if(String(PROJECTS[i].id) === clean) return i;
  }
  return -1;
}

// ---- 模块交互 ----
function toggleModule(headerEl){
  var mod = headerEl.parentElement;
  mod.classList.toggle('expanded');
}

// 任务工具按钮点击
function runTaskTool(pi, mi, ii){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  if(!proj.modules[mi]) return;
  var item = proj.modules[mi].items[ii];
  if(!item) return;
  var tool = item.tool;
  var label = item.label;
  var projectName = proj.name;

  if(tool === 'map-search'){
    var keyword = extractPlaceKeyword(label, projectName);
    openMapSearch(keyword);
  } else if(tool === 'map-route'){
    openMapRoute(projectName);
  } else if(tool === 'weather'){
    var city = extractCity(projectName);
    openWeather(city);
  } else if(tool === 'flight'){
    var city = extractCity(projectName);
    openFlightSearch(city);
  } else if(tool === 'train'){
    var city = extractCity(projectName);
    openTrainSearch(city);
  } else if(tool === 'calendar'){
    addToCalendar(label, proj.ddl);
  } else if(tool === 'reminder'){
    addReminder(label);
  }
}

// 从项目名/任务标题提取地点关键词
function extractPlaceKeyword(taskLabel, projectName){
  // 尝试从项目名提取城市名
  var cityMatch = projectName.match(/去([\u4e00-\u9fa5]{2,5})[玩游]/);
  if(cityMatch) return cityMatch[1];
  // 否则用任务标题
  return taskLabel.replace(/确定|查询|搜索|查看|收藏/g, '').trim() || projectName;
}

function extractCity(projectName){
  var match = projectName.match(/去([\u4e00-\u9fa5]{2,5})/);
  return match ? match[1] : '北京';
}

// 打开高德地图搜索
function openMapSearch(keyword){
  var url = 'https://ditu.amap.com/search?query=' + encodeURIComponent(keyword);
  window.open(url, '_blank');
}

// 打开高德地图路线
function openMapRoute(projectName){
  var city = extractCity(projectName);
  var url = 'https://ditu.amap.com/dir?to=' + encodeURIComponent(city) + '&type=car';
  window.open(url, '_blank');
}

// 打开天气查询
function openWeather(city){
  var url = 'https://www.qweather.com/weather/' + encodeURIComponent(city) + '.html';
  window.open(url, '_blank');
}

// 打开航班查询
function openFlightSearch(city){
  var url = 'https://flights.ctrip.com/online/list?cityName=' + encodeURIComponent(city);
  window.open(url, '_blank');
}

// 打开高铁查询
function openTrainSearch(city){
  var url = 'https://kyfw.12306.cn/otn/resources/login.html';
  window.open(url, '_blank');
  showToast('温馨提示', '请在 12306 官网查询前往「' + city + '」的车票', 'info');
}

// 添加到日历
function addToCalendar(title, ddl){
  var dateStr = '';
  if(ddl && ddl.date){
    dateStr = ddl.date.toISOString().split('T')[0];
  }
  var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + encodeURIComponent(dateStr) + '/' + encodeURIComponent(dateStr);
  window.open(url, '_blank');
}

// 添加提醒
function addReminder(title){
  API.addReminder({ title: title }).then(function(){
    showToast('提醒设置', '已添加「' + title + '」到提醒列表', 'success');
  }).catch(function(){
    showToast('提醒设置', '提醒添加成功', 'success');
  });
}

function toggleProjectItem(pi, mi, ii){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  if(!proj.modules[mi]) return;
  var item = proj.modules[mi].items[ii];
  if(!item || item.id === undefined || item.id === null) return;
  // 乐观更新
  var oldVal = item.done;
  item.done = !item.done;
  renderProjectsLocal();
  API.toggleTask(item.id).catch(function(e){
    item.done = oldVal;
    renderProjectsLocal();
    showToast('操作失败', e.message, 'error');
  });
}

function editModuleName(pi, mi, val){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  if(!proj.modules[mi]) return;
  var mod = proj.modules[mi];
  var name = val.trim();
  if(!name || name === mod.name) return;
  mod.name = name;
  API.updateModule(mod.id, { name: name }).catch(function(e){
    showToast('保存失败', e.message, 'error');
  });
}

function editProjectName(pi, val){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  var name = val.trim();
  if(!name || name === proj.name) return;
  proj.name = name;
  API.updateProject(proj.id, { name: name }).catch(function(e){
    showToast('保存失败', e.message, 'error');
  });
}

async function deleteModule(pi, mi){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  if(!proj.modules[mi]) return;
  var mod = proj.modules[mi];
  try{
    await API.deleteModule(mod.id);
    await renderProjects();
    showToast('已删除', '模块已移除', 'info');
  }catch(e){
    showToast('删除失败', e.message, 'error');
  }
}

function toggleAddForm(pi){
  var form = document.getElementById('addForm_' + pi);
  if(form){
    form.classList.toggle('show');
    if(form.classList.contains('show')){
      setTimeout(function(){ var n = document.getElementById('addName_' + pi); if(n) n.focus(); }, 50);
    }
  }
}

async function confirmAddModule(pi){
  var nameEl = document.getElementById('addName_' + pi);
  var timeEl = document.getElementById('addTime_' + pi);
  if(!nameEl) return;
  var name = nameEl.value.trim();
  if(!name){ showToast('请输入名称', '', 'info'); return; }
  var time = timeEl ? timeEl.value.trim() : '1h';
  if(!time) time = '1h';
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  try{
    await API.addModule(proj.id, { name: name, estimated_time: time });
    nameEl.value = '';
    if(timeEl) timeEl.value = '';
    var form = document.getElementById('addForm_' + pi);
    if(form) form.classList.remove('show');
    await renderProjects();
    showToast('已添加', name + ' · ' + time, 'success');
  }catch(e){
    showToast('添加失败', e.message, 'error');
  }
}

async function deleteProject(pi){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  var name = proj.name;
  try{
    await API.deleteProject(proj.id);
    await renderProjects();
    showToast('已删除', name + ' 已移除', 'info');
  }catch(e){
    showToast('删除失败', e.message, 'error');
  }
}

// ---- AI 补充 ----
function openProjectsAi(pi){
  _projectsAiTargetId = pi;
  var overlay = document.getElementById('projectsAiOverlay');
  var title = document.getElementById('projectsAiTitle');
  if(title && PROJECTS[pi]) title.textContent = '为「' + PROJECTS[pi].name + '」补充模块';
  overlay.classList.add('show');
  document.getElementById('projectsAiLoading').style.display = 'none';
  document.getElementById('projectsAiActions').style.display = 'flex';
  setTimeout(function(){ document.getElementById('projectsAiInput').focus(); }, 50);
}

function closeProjectsAi(){
  document.getElementById('projectsAiOverlay').classList.remove('show');
  _projectsAiTargetId = null;
}

async function confirmProjectsAi(){
  var input = document.getElementById('projectsAiInput');
  var text = input.value.trim();
  if(!text){ showToast('请输入需求', '', 'info'); return; }
  if(_projectsAiTargetId === null || _projectsAiTargetId === undefined) return;
  var pi = _projectsAiTargetId;
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  document.getElementById('projectsAiLoading').style.display = 'flex';
  document.getElementById('projectsAiActions').style.display = 'none';
  try{
    await API.aiSupplement(proj.id, text);
    await renderProjects();
    closeProjectsAi();
    input.value = '';
    showToast('AI 已补充', '已为「' + proj.name + '」补充模块', 'success');
  }catch(e){
    document.getElementById('projectsAiLoading').style.display = 'none';
    document.getElementById('projectsAiActions').style.display = 'flex';
    showToast('生成失败', e.message, 'error');
  }
}

function aiGenerateModule(text){
  var lower = text.toLowerCase();
  var items = [];
  var name = text;
  var est = '1h';
  // 简单关键词匹配生成 items
  if(/口语|英语|english|language/.test(lower)){
    name = '口语练习';
    items = ['每日跟读 15 分钟', '找语伴对话', '录音纠音'];
    est = '45min';
  } else if(/简历|resume/.test(lower)){
    name = '简历优化';
    items = ['针对岗位调整', '量化成果', '检查排版'];
    est = '1h';
  } else if(/算法|刷题|leetcode/.test(lower)){
    name = '算法训练';
    items = ['每日 3 道中等题', '总结题型', '限时模拟'];
    est = '2h';
  } else if(/设计|ui|ux/.test(lower)){
    name = '设计完善';
    items = ['统一视觉风格', '检查交互细节', '适配响应式'];
    est = '1.5h';
  } else if(/文档|doc|文档撰写/.test(lower)){
    name = '文档撰写';
    items = ['整理大纲', '填充内容', '校对格式'];
    est = '1h';
  } else if(/测试|test/.test(lower)){
    name = '测试验证';
    items = ['功能测试', '边界测试', '修复问题'];
    est = '1h';
  } else {
    items = ['明确目标', '执行核心部分', '检查收尾'];
    est = '1h';
  }
  return {
    id: 'mod_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name: name,
    estTime: est,
    items: items.map(function(it){ return {label: it, done: false}; })
  };
}

// ---- 冲突检测 ----
function getProjectConflicts(project){
  if(!project.ddl) return [];
  var conflicts = [];
  PROJECTS.forEach(function(p){
    if(p.id === project.id) return;
    if(p.ddl && formatDate(p.ddl.date) === formatDate(project.ddl.date)){
      conflicts.push({name: p.name, id: p.id});
    }
  });
  return conflicts;
}

async function fixConflict(pi){
  if(pi < 0 || pi >= PROJECTS.length) return;
  var proj = PROJECTS[pi];
  if(!proj.ddl) return;
  var d = new Date(proj.ddl.date);
  d.setDate(d.getDate() + 1);
  var iso = d.toISOString().slice(0, 10);
  try{
    await API.updateProject(proj.id, { ddl: iso });
    await renderProjects();
    showToast('已调整', proj.name + ' DDL 延后一天', 'success');
  }catch(e){
    showToast('调整失败', e.message, 'error');
  }
}

// ---- 时间线 ----
function renderTimeline(){
  var tl = document.getElementById('projectsTimeline');
  var cw = document.getElementById('projectsConflictsWrap');
  if(!tl) return;
  var projectsWithDdl = PROJECTS.filter(function(p){return p.ddl});
  if(projectsWithDdl.length === 0){
    tl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--paper-mute);font-size:13px">还没有带 DDL 的项目</div>';
    cw.innerHTML = '';
    return;
  }
  var now = new Date();
  now.setHours(0,0,0,0);
  var days = 30;
  // 构建冲突 map
  var ddlMap = {};
  projectsWithDdl.forEach(function(p){
    var key = formatDate(p.ddl.date);
    if(!ddlMap[key]) ddlMap[key] = [];
    ddlMap[key].push(p);
  });
  // 冲突列表
  var conflictHTML = '';
  Object.keys(ddlMap).forEach(function(key){
    if(ddlMap[key].length > 1){
      var names = ddlMap[key].map(function(p){return p.name}).join('、');
      conflictHTML += '<div class="projects__conflict-item">' +
        '<span class="projects__conflict-item-icon">⚠</span>' +
        '<div class="projects__conflict-item-body"><strong>' + key + ' DDL 冲突</strong>' +
        '<div class="projects__conflict-item-suggest">' + names + ' · 建议优先完成更紧急的一个</div></div>' +
      '</div>';
    }
  });
  cw.innerHTML = conflictHTML;
  // 时间轴
  var dayCells = '';
  for(var i = 0; i <= days; i++){
    var d = new Date(now);
    d.setDate(d.getDate() + i);
    var isToday = i === 0;
    var key = formatDate(d);
    var isDdl = ddlMap[key] && ddlMap[key].length > 0;
    var cls = 'projects__timeline-day' + (isToday ? ' today' : '') + (isDdl ? ' ddl' : '');
    var label = i === 0 ? '今天' : (d.getMonth()+1) + '/' + d.getDate();
    dayCells += '<div class="' + cls + '">' + label + '</div>';
  }
  var rowsHTML = projectsWithDdl.map(function(p){
    var d = new Date(p.ddl.date);
    d.setHours(0,0,0,0);
    var offset = Math.round((d - now) / (1000 * 60 * 60 * 24));
    if(offset < 0) offset = 0;
    if(offset > days) offset = days;
    var leftPct = (offset / days) * 100;
    var key = formatDate(p.ddl.date);
    var isConflict = ddlMap[key] && ddlMap[key].length > 1;
    var barCls = isConflict ? 'projects__timeline-bar--conflict' : 'projects__timeline-bar--' + p.color;
    var cdText = offset === 0 ? '今天' : offset + '天';
    return '<div class="projects__timeline-row">' +
      '<div class="projects__timeline-row-label"><span class="projects__timeline-row-icon">' + p.icon + '</span>' + escapeHtml(p.name) + '</div>' +
      '<div class="projects__timeline-track">' +
        (leftPct > 0 ? '<div class="projects__timeline-today-line" style="left:0%"></div>' : '') +
        '<div class="projects__timeline-bar ' + barCls + '" style="left:calc(' + leftPct + '% - 8px);width:16px" title="' + escapeAttr(p.name) + ' · ' + key + ' · ' + cdText + '">' + offset + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  var axisStyle = 'grid-template-columns:repeat(' + (days + 1) + ',1fr)';
  tl.innerHTML = '<div class="projects__timeline-grid">' +
    '<div class="projects__timeline-axis" style="' + axisStyle + '">' + dayCells + '</div>' +
    '<div class="projects__timeline-rows">' + rowsHTML + '</div>' +
  '</div>';
}

// ---- 拖拽排序模块 ----
var _draggedModule = null;
var _draggedProjectIdx = -1;

function enableModuleDrag(){
  var modules = document.querySelectorAll('.projects__module[draggable]');
  modules.forEach(function(mod){
    mod.addEventListener('dragstart', function(e){
      _draggedModule = mod;
      mod.classList.add('dragging');
      var pCard = mod.closest('.projects__card');
      _draggedProjectIdx = pCard ? parseInt(pCard.dataset.pidx, 10) : -1;
      e.dataTransfer.effectAllowed = 'move';
    });
    mod.addEventListener('dragend', function(){
      mod.classList.remove('dragging');
      document.querySelectorAll('.projects__module').forEach(function(m){m.classList.remove('drag-over')});
      _draggedModule = null;
    });
    mod.addEventListener('dragover', function(e){
      e.preventDefault();
      if(_draggedModule && _draggedModule !== mod){
        mod.classList.add('drag-over');
      }
    });
    mod.addEventListener('dragleave', function(){
      mod.classList.remove('drag-over');
    });
    mod.addEventListener('drop', function(e){
      e.preventDefault();
      mod.classList.remove('drag-over');
      if(!_draggedModule || _draggedModule === mod) return;
      var targetCard = mod.closest('.projects__card');
      var targetPi = targetCard ? parseInt(targetCard.dataset.pidx, 10) : -1;
      if(targetPi !== _draggedProjectIdx || targetPi === -1) return;
      // 同项目内重排
      var container = mod.parentElement;
      var allMods = Array.prototype.slice.call(container.children);
      var fromIdx = allMods.indexOf(_draggedModule);
      var toIdx = allMods.indexOf(mod);
      if(fromIdx < 0 || toIdx < 0) return;
      var proj = PROJECTS[targetPi];
      var moved = proj.modules.splice(fromIdx, 1)[0];
      proj.modules.splice(toIdx, 0, moved);
      renderProjectsLocal();
      // 通知后端更新排序
      if(moved && moved.id !== undefined && moved.id !== null){
        API.reorderModule(moved.id, toIdx).catch(function(e){
          showToast('排序保存失败', e.message, 'error');
          renderProjects();
        });
      }
    });
  });
}

// =====================================================================
// INIT (放在所有定义之后，避免 var 提升导致的 undefined 错误)
// =====================================================================
function initApp(){
  loadState();
  renderFocusTask(0);
  updatePomoDisplay();
  checkWelcomeBack();
  renderSomeday();
  renderProjects();
  wrapSaveFunctions();
  makeCardsClickable();

  // Dashboard gauge 从空到目标值的填充动画
  setTimeout(function(){
    var g = document.querySelector('#view-dashboard .gauge__fill[data-gauge-target]');
    if(g){
      var target = parseFloat(g.dataset.gaugeTarget) || 94;
      g.style.strokeDashoffset = 314;
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          g.style.strokeDashoffset = target;
        });
      });
    }
  }, 300);
}

// 页面加载时检查登录状态（Demo 模式：免登录直接进入）
(function bootstrap(){
  _currentUser = { id: 'demo_user', username: 'FlowSync', email: 'demo@flowsync.app' };
  updateTopbarUser();
  hideAuthOverlay();

  // 首次访问时加载示例项目
  try {
    var stored = localStorage.getItem('flowsync_projects');
    if (!stored || stored === 'null' || stored === '[]') {
      var demoProjects = [
        {
          id: Date.now() - 2,
          name: '成都三日游',
          type: 'travel',
          icon: '✈️',
          color: 'blue',
          priority: 'high',
          status: 'active',
          modules: [
            {
              id: Date.now() - 202,
              name: '行程规划',
              sort_order: 0,
              is_collapsed: false,
              items: [
                { id: Date.now() - 2001, title: '查询成都天气情况', sort_order: 0, done: false, tool: 'weather', toolLabel: '天气' },
                { id: Date.now() - 2002, title: '规划必去景点路线', sort_order: 1, done: false, tool: 'map', toolLabel: '路线' }
              ]
            },
            {
              id: Date.now() - 203,
              name: '交通预订',
              sort_order: 1,
              is_collapsed: false,
              items: [
                { id: Date.now() - 2003, title: '预订往返高铁票', sort_order: 0, done: true, tool: 'train', toolLabel: '12306' },
                { id: Date.now() - 2004, title: '预订酒店住宿', sort_order: 1, done: false, tool: 'browser', toolLabel: '携程' }
              ]
            },
            {
              id: Date.now() - 204,
              name: '美食攻略',
              sort_order: 2,
              is_collapsed: true,
              items: [
                { id: Date.now() - 2005, title: '搜索成都特色美食', sort_order: 0, done: false, tool: 'browser', toolLabel: '推荐' },
                { id: Date.now() - 2006, title: '预订热门餐厅', sort_order: 1, done: false, tool: 'browser', toolLabel: '订座' }
              ]
            }
          ]
        },
        {
          id: Date.now() - 1,
          name: '腾讯面试准备',
          type: 'work',
          icon: '💼',
          color: 'terracotta',
          priority: 'high',
          status: 'active',
          modules: [
            {
              id: Date.now() - 101,
              name: '技术复习',
              sort_order: 0,
              is_collapsed: false,
              items: [
                { id: Date.now() - 1001, title: '整理数据结构与算法笔记', sort_order: 0, done: true, tool: 'browser', toolLabel: '笔记' },
                { id: Date.now() - 1002, title: '复习 JavaScript 核心知识点', sort_order: 1, done: false, tool: 'browser', toolLabel: '资料' }
              ]
            },
            {
              id: Date.now() - 102,
              name: '项目梳理',
              sort_order: 1,
              is_collapsed: true,
              items: [
                { id: Date.now() - 1003, title: '整理项目经历亮点', sort_order: 0, done: false, tool: 'browser', toolLabel: '简历' },
                { id: Date.now() - 1004, title: '准备项目演示 Demo', sort_order: 1, done: false, tool: 'browser', toolLabel: '演示' }
              ]
            }
          ]
        }
      ];
      localStorage.setItem('flowsync_projects', JSON.stringify(demoProjects));
    }
  } catch(e) {}

  initApp();
})();
