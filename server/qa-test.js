// FlowSync QA 自检脚本
const http = require('http');

const BASE = 'http://localhost:3000';
let pass = 0, fail = 0;
const results = [];

function req(method, path, body, headers) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json', ...(headers||{}) }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', e => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function check(name, cond, detail) {
  if (cond) { pass++; results.push('✅ ' + name); }
  else { fail++; results.push('❌ ' + name + (detail ? ' :: ' + detail : '')); }
}

async function main() {
  console.log('=== FlowSync QA 自检 ===\n');

  // 1. 健康检查
  const health = await req('GET', '/health');
  check('健康检查 200', health.status === 200);
  check('健康检查返回 ok', health.body && health.body.data && health.body.data.status === 'ok');

  // 2. 注册 - 正常
  const ts = Date.now();
  const reg = await req('POST', '/api/auth/register', {
    username: 'qa_' + ts, email: 'qa_' + ts + '@test.com', password: '123456'
  });
  check('注册成功 201', reg.status === 201, JSON.stringify(reg).slice(0,100));
  check('注册返回 token', !!(reg.body && reg.body.data && reg.body.data.token));
  const token = reg.body && reg.body.data && reg.body.data.token;
  const userId = reg.body && reg.body.data && reg.body.data.user && reg.body.data.user.id;

  // 3. 注册 - 密码太短
  const regShort = await req('POST', '/api/auth/register', {
    username: 'qa_short_' + ts, email: 'qa_short@test.com', password: '123'
  });
  check('密码短拒绝 400', regShort.status === 400);

  // 4. 注册 - 重复用户名
  const regDup = await req('POST', '/api/auth/register', {
    username: 'qa_' + ts, email: 'another@test.com', password: '123456'
  });
  check('重复用户名 409', regDup.status === 409);

  // 5. 登录 - 正确密码
  const login = await req('POST', '/api/auth/login', {
    username: 'qa_' + ts, password: '123456'
  });
  check('登录成功 200', login.status === 200);
  check('登录返回 token', !!(login.body && login.body.data && login.body.data.token));

  // 6. 登录 - 错误密码
  const loginBad = await req('POST', '/api/auth/login', {
    username: 'qa_' + ts, password: 'wrongpass'
  });
  check('错误密码 401', loginBad.status === 401);

  // 7. /me 无 token
  const meNoToken = await req('GET', '/api/auth/me');
  check('/me 无 token 401', meNoToken.status === 401);

  // 8. /me 有 token
  const me = await req('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + token });
  check('/me 有 token 200', me.status === 200);
  check('/me 返回当前用户', me.body && me.body.data && me.body.data.id === userId);

  // 9. 无 token 调用受保护接口
  const projNoAuth = await req('GET', '/api/projects');
  check('无 token 调 /projects 401', projNoAuth.status === 401);

  // 10. 创建项目（带 token）
  const createProj = await req('POST', '/api/projects', {
    name: 'QA 测试项目', type: 'custom', icon: '🧪', color: 'terracotta'
  }, { Authorization: 'Bearer ' + token });
  check('创建项目 201', createProj.status === 201, JSON.stringify(createProj.body).slice(0,150));
  const projId = createProj.body && createProj.body.data && createProj.body.data.id;

  // 11. 获取项目列表
  const listProj = await req('GET', '/api/projects', null, { Authorization: 'Bearer ' + token });
  check('获取项目列表 200', listProj.status === 200);
  check('项目列表包含新建项目', listProj.body && listProj.body.data && listProj.body.data.some(p => p.id === projId));

  // 12. 添加模块
  const addMod = await req('POST', '/api/projects/' + projId + '/modules', {
    name: '测试模块'
  }, { Authorization: 'Bearer ' + token });
  check('添加模块 201', addMod.status === 201);
  const modId = addMod.body && addMod.body.data && addMod.body.data.id;

  // 13. 添加任务
  const addTask = await req('POST', '/api/modules/' + modId + '/tasks', {
    title: '测试任务'
  }, { Authorization: 'Bearer ' + token });
  check('添加任务 201', addTask.status === 201);
  const taskId = addTask.body && addTask.body.data && addTask.body.data.id;

  // 14. 切换任务完成状态
  const toggle = await req('PUT', '/api/tasks/' + taskId + '/toggle', null, { Authorization: 'Bearer ' + token });
  check('切换任务完成 200', toggle.status === 200);

  // 15. 删除任务
  const delTask = await req('DELETE', '/api/tasks/' + taskId, null, { Authorization: 'Bearer ' + token });
  check('删除任务 200', delTask.status === 200);

  // 16. 越权 - 用 A 的 token 但伪造别人的 userId（JWT 校验 user_id 是否匹配 resource owner）
  // 直接用一个新 token 但访问别人的 projectId（数据库层面有 user_id 过滤）
  // 这里改用：A 删除 B 的项目（B 不存在）应该 404
  const fakeId = 999999;
  const crossDel = await req('DELETE', '/api/projects/' + fakeId, null, { Authorization: 'Bearer ' + token });
  check('删除不存在项目 404', crossDel.status === 404, 'status=' + crossDel.status);

  // 17. 用 A 的 token 更新 B 的项目（模拟越权）
  const crossUpd = await req('PUT', '/api/projects/' + fakeId, { name: 'hack' }, { Authorization: 'Bearer ' + token });
  check('更新不存在项目 404', crossUpd.status === 404, 'status=' + crossUpd.status);

  // 18. demo 接口 - 空 name
  const demoEmpty = await req('POST', '/api/demo/generate', { name: '' });
  check('demo 空 name 400', demoEmpty.status === 400);

  // 19. demo 接口 - 超长 name
  const demoLong = await req('POST', '/api/demo/generate', { name: 'a'.repeat(200) });
  check('demo 超长 name 400', demoLong.status === 400);

  // 20. 404 路由（带 token 访问不存在的路由）
  const notFound = await req('GET', '/api/nonexistent', null, { Authorization: 'Bearer ' + token });
  check('不存在路由 404', notFound.status === 404, 'status=' + notFound.status);

  // 21. 输入长度校验
  const longText = await req('POST', '/api/auth/register', {
    username: 'a'.repeat(300), email: 'a@b.com', password: '123456'
  });
  check('输入超长被拒 400', longText.status === 400);

  // 输出结果
  console.log('\n=== 测试结果 ===');
  results.forEach(r => console.log(r));
  console.log('\n通过: ' + pass + ', 失败: ' + fail + ', 总计: ' + (pass+fail));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(2); });
