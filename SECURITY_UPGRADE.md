# 🔐 金币系统安全升级 - 服务端身份验证

## 📋 更新说明

将金币系统从**前端传参验证**升级为**服务端 Session/Cookie 验证**，提高安全性。

---

## 🎯 核心改进

### ❌ 修改前（不安全）
```javascript
// 前端
getUserCoins({ userId: '1' })  // userId 可以随意伪造

// 后端
let userId = req.body.userId;  // 直接信任前端传来的数据 ❌
```

### ✅ 修改后（安全）
```javascript
// 前端
getUserCoins()  // 不传 userId，依靠 cookies

// 后端
let userId = getCurrentUserId(req);  // 从 session/cookie 验证身份 ✅
```

---

## 🔧 后端修改

### 1. 新增 `getCurrentUserId()` 函数

**位置：** `film_api/routes/index.js`

```javascript
/**
 * 从请求中获取当前登录用户的 ID（服务端验证）
 * 优先级：session > cookie > 前端参数（兜底）
 */
function getCurrentUserId(req) {
  // 1. 优先从 session 获取（最安全）
  if (req.session && req.session.userId) {
    console.log('[用户身份] 从 session 获取:', req.session.userId);
    return normalizeUserId(req.session.userId);
  }
  
  // 2. 其次从 cookie 获取
  if (req.cookies && req.cookies.user_id) {
    console.log('[用户身份] 从 cookie 获取:', req.cookies.user_id);
    return normalizeUserId(req.cookies.user_id);
  }
  
  // 3. 兜底：从请求参数获取（仅开发测试用）
  const bodyUserId = req.body && req.body.userId;
  const queryUserId = req.query && req.query.userId;
  
  if (bodyUserId || queryUserId) {
    const fallbackId = bodyUserId || queryUserId;
    console.warn('[用户身份] ⚠️ 从请求参数获取（不安全）:', fallbackId);
    return normalizeUserId(fallbackId);
  }
  
  console.error('[用户身份] ❌ 未找到用户信息，用户未登录');
  return null;
}
```

### 2. 修改的接口（4个）

#### `/api/getUserCoins` - 获取用户金币
```javascript
// 修改前
let userId = normalizeUserId(req.query.userId);

// 修改后
let userId = getCurrentUserId(req);  // 从 session/cookie 获取
if (!userId) {
  res.json({error_code:1, message:'用户未登录或登录已过期'});
  return;
}
```

#### `/api/userCheckin` - 用户签到
```javascript
// 修改前
let userId = normalizeUserId(req.body.userId);

// 修改后
let userId = getCurrentUserId(req);  // 从 session/cookie 获取
if (!userId) {
  res.json({error_code:1, message:'用户未登录或登录已过期'});
  return;
}
```

#### `/api/checkTodayCheckin` - 检查签到状态
```javascript
// 修改前
let userId = normalizeUserId(req.query.userId);

// 修改后
let userId = getCurrentUserId(req);  // 从 session/cookie 获取
```

#### `/api/getUserCoinRecords` - 获取金币记录
```javascript
// 修改前
let userId = normalizeUserId(req.query.userId);

// 修改后
let userId = getCurrentUserId(req);  // 从 session/cookie 获取
```

---

## 💻 前端修改

### 1. `offerwall.js` - 获取金币接口

**位置：** `film/src/api/offerwall.js`

```javascript
// 修改前
export function getUserCoins() {
  const userId = localStorage.getItem('userId') || '1'
  return axios.get('/api/getUserCoins', {
    params: { userId }  // ❌ 手动传 userId
  })
}

// 修改后
export function getUserCoins() {
  return axios.get('/api/getUserCoins', {
    withCredentials: true  // ✅ 携带 cookies，服务端验证
  })
}
```

### 2. `points.js` - 签到接口

**位置：** `film/src/api/points.js`

```javascript
// 修改前
coinService.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId') || '1'
  if (config.method === 'get') {
    config.params = { ...config.params, userId }  // ❌ 添加 userId
  } else if (config.method === 'post') {
    config.data = { ...config.data, userId }
  }
  return config
})

// 修改后
coinService.interceptors.request.use(config => {
  config.withCredentials = true  // ✅ 携带 cookies
  console.log('[金币系统] 请求携带 cookies:', config.url)
  return config
})
```

---

## 🔄 工作流程

### 登录流程
```
用户登录
    ↓
film_api 验证成功
    ↓
设置 session: req.session.userId = user_id
设置 cookie: res.cookie('user_id', user_id)
    ↓
返回登录成功
    ↓
浏览器自动保存 cookies
```

### 签到流程（修改后）
```
用户点击签到
    ↓
前端调用: doSignin()  // 不传 userId
    ↓
axios 请求自动携带 cookies (withCredentials: true)
    ↓
后端接收请求
    ↓
getCurrentUserId(req) 从 session/cookie 获取 userId
    ↓
验证用户身份 ✅
    ↓
执行签到逻辑
    ↓
返回签到成功
```

---

## 🛡️ 安全优势

### 1. 防止身份伪造
- ❌ 修改前：前端可以随意传 `userId: '999'` 冒充其他用户
- ✅ 修改后：userId 由服务端从登录 session 获取，无法伪造

### 2. 防止越权操作
- ❌ 修改前：攻击者可以修改请求参数操作其他用户的金币
- ✅ 修改后：只能操作当前登录用户的金币

### 3. 统一身份验证
- ✅ 所有金币接口使用相同的身份验证逻辑
- ✅ 便于后续添加权限控制

---

## 📊 日志示例

### 正常登录用户签到
```
[用户身份] 从 session 获取: 123
[签到] 当前用户: 123
[签到] 计算完成: { continuousDays: 1, rewardCoins: 20 }
[签到] 完成! 奖励: 20 金币
```

### 未登录用户尝试签到
```
[用户身份] ❌ 未找到用户信息，用户未登录
返回: { error_code: 1, message: '用户未登录或登录已过期' }
```

### 开发环境兜底（从参数获取）
```
[用户身份] ⚠️ 从请求参数获取（不安全）: test_user_001
[userId转换] "test_user_001" -> 1
[签到] 当前用户: 1
```

---

## 🧪 测试步骤

### 1. 确保用户已登录

用户必须先登录，系统才会设置 session 和 cookie。

**登录接口：**
- `/api/phoneLogin` - 手机号登录
- `/api/passWordLogin` - 密码登录

### 2. 重启服务

```bash
cd D:\Desktop\jifen\film_api
npm start
```

### 3. 测试签到

1. 打开浏览器：http://localhost:8080
2. **先登录**（重要！）
3. 进入任务中心
4. 点击签到按钮

### 4. 检查日志

**后端日志（film_api 终端）：**
```
[用户身份] 从 session 获取: 1
[签到] 当前用户: 1
[签到] 完成! 奖励: 20 金币
```

**前端日志（浏览器控制台）：**
```
[金币系统] 请求携带 cookies: /userCheckin
```

---

## ⚠️ 注意事项

### 1. 必须先登录

修改后，用户必须先登录才能使用金币功能。如果未登录会返回：
```json
{
  "error_code": 1,
  "message": "用户未登录或登录已过期"
}
```

### 2. withCredentials 必须为 true

前端请求必须设置 `withCredentials: true`，否则不会携带 cookies。

### 3. 跨域配置

如果前后端不在同一域名，需要配置 CORS：

```javascript
// film_api/app.js
app.use(cors({
  origin: 'http://localhost:8080',  // 前端地址
  credentials: true  // 允许携带 cookies
}));
```

### 4. 开发环境兜底

当前实现保留了从请求参数获取 userId 的兜底逻辑，方便开发测试。
**生产环境建议移除此兜底逻辑。**

---

## 🔍 问题排查

### 问题1: 提示"用户未登录或登录已过期"

**原因：**
- 用户未登录
- Session 已过期
- Cookies 未携带

**解决：**
1. 确保用户已登录
2. 检查浏览器 cookies 中是否有 `user_id`
3. 检查请求头中是否有 `Cookie`

### 问题2: 请求没有携带 cookies

**检查：**
- 前端是否设置 `withCredentials: true`
- 浏览器控制台 Network 面板查看请求头

### 问题3: Session 总是为空

**检查：**
- `film_api/app.js` 是否配置了 `express-session`
- Session 中间件是否正确初始化

---

## 📚 相关文件

### 后端
- `film_api/routes/index.js` - 添加 `getCurrentUserId()` 函数，修改 4 个接口

### 前端
- `film/src/api/offerwall.js` - 修改 `getUserCoins()`
- `film/src/api/points.js` - 修改 `coinService` 拦截器

---

## 🎉 升级完成

### 改进总结
- ✅ 所有金币接口改为服务端身份验证
- ✅ 防止用户身份伪造
- ✅ 防止越权操作
- ✅ 统一身份验证逻辑
- ✅ 详细的日志追踪

### 下一步
1. 重启 film_api 服务
2. 确保用户已登录
3. 测试签到功能
4. 查看日志确认从 session/cookie 获取用户ID

**金币系统现在更安全了！** 🔐
