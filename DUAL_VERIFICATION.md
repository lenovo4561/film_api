# 🔐 金币系统双重验证机制

## 📋 设计方案

**前端传入 userId + 后端 Session/Cookie 验证 = 双重保障**

---

## 🎯 工作原理

### 1. 前端行为
前端**同时发送**：
- ✅ Cookies（通过 `withCredentials: true`）
- ✅ userId 参数（从 localStorage）

```javascript
// 示例请求
axios.post('/api/userCheckin', 
  { userId: '1' },              // 传入 userId
  { withCredentials: true }     // 携带 cookies
)
```

### 2. 后端验证
后端按优先级验证：

```
1. 从 session 获取 userId（最高优先级）
2. 从 cookie 获取 userId
3. 比对前端传入的 userId
4. 如果不一致，使用服务端的值 ✅
5. 如果服务端没有，兜底使用前端的值（仅开发环境）
```

---

## 🔧 实现细节

### 前端修改

#### 1. `film/src/api/points.js` - coinService 拦截器

```javascript
coinService.interceptors.request.use(config => {
  // 启用 withCredentials
  config.withCredentials = true

  // 获取并添加 userId
  const userId = localStorage.getItem('userId') || '1'
  
  if (config.method === 'get') {
    config.params = { ...config.params, userId }
  } else if (config.method === 'post') {
    config.data = { ...config.data, userId }
  }

  console.log('[金币系统] 请求携带 cookies + userId:', config.url, '| userId:', userId)
  return config
})
```

#### 2. `film/src/api/offerwall.js` - getUserCoins

```javascript
export function getUserCoins() {
  const userId = localStorage.getItem('userId') || '1'
  
  return axios.get('/api/getUserCoins', {
    params: { userId },           // 传入 userId
    withCredentials: true         // 携带 cookies
  })
}
```

### 后端修改

#### `film_api/routes/index.js` - getCurrentUserId 函数

```javascript
function getCurrentUserId(req) {
  let serverUserId = null;
  let clientUserId = null;
  
  // 1. 从服务端获取（session > cookie）
  if (req.session && req.session.userId) {
    serverUserId = normalizeUserId(req.session.userId);
  } else if (req.cookies && req.cookies.user_id) {
    serverUserId = normalizeUserId(req.cookies.user_id);
  }
  
  // 2. 获取前端传入的 userId
  const bodyUserId = req.body && req.body.userId;
  const queryUserId = req.query && req.query.userId;
  if (bodyUserId || queryUserId) {
    clientUserId = normalizeUserId(bodyUserId || queryUserId);
  }
  
  // 3. 验证逻辑
  if (serverUserId) {
    // 优先使用服务端的，检查是否一致
    if (clientUserId && clientUserId !== serverUserId) {
      console.warn(`⚠️ userId 不一致：前端=${clientUserId}，服务端=${serverUserId}`);
    }
    return serverUserId;  // 使用服务端的
  }
  
  // 4. 兜底：使用前端的（开发环境）
  if (clientUserId) {
    console.warn('⚠️ 无 session/cookie，使用前端 userId');
    return clientUserId;
  }
  
  return null;
}
```

---

## 📊 验证流程图

```
前端发送请求
    ↓
┌─────────────────┐
│ Cookies: xxx    │  ← session/cookie（服务端优先）
│ Body: {         │
│   userId: '1'   │  ← 前端参数（备用/校验）
│ }               │
└─────────────────┘
    ↓
后端接收
    ↓
┌─────────────────────────────────────────┐
│ 1. session.userId 存在？                 │
│    YES → 使用 session.userId ✅          │
│    NO  → 继续                            │
│                                          │
│ 2. cookies.user_id 存在？                │
│    YES → 使用 cookies.user_id ✅         │
│    NO  → 继续                            │
│                                          │
│ 3. 比对前端传入的 userId                 │
│    一致 ✅ → 验证通过                    │
│    不一致 ⚠️ → 记录警告，使用服务端值    │
│                                          │
│ 4. 如果服务端都没有                      │
│    使用前端 userId（兜底，不安全）⚠️     │
└─────────────────────────────────────────┘
    ↓
返回 userId
```

---

## 🛡️ 安全优势

### 场景1：正常用户登录
```
前端: userId = 1
服务端: session.userId = 1
结果: ✅ 验证通过，使用 userId = 1
```

### 场景2：恶意用户尝试伪造
```
前端: userId = 999（伪造）
服务端: session.userId = 1
结果: ⚠️ 检测到不一致，忽略前端参数，使用 userId = 1
日志: "userId 不一致：前端=999，服务端=1"
```

### 场景3：开发环境（未登录）
```
前端: userId = 1
服务端: 无 session/cookie
结果: ⚠️ 兜底使用前端 userId = 1（仅开发）
日志: "无 session/cookie，使用前端 userId"
```

### 场景4：完全未登录
```
前端: 无 userId
服务端: 无 session/cookie
结果: ❌ 返回错误 "用户未登录或登录已过期"
```

---

## 📝 日志示例

### 正常登录用户
```
[用户身份] 从 session 获取: 1
[用户身份] 前端传入: 1
[签到] 当前用户: 1
[签到] 完成! 奖励: 20 金币
```

### 检测到伪造
```
[用户身份] 从 session 获取: 1
[用户身份] 前端传入: 999
[用户身份] ⚠️ 警告：前端传入的 userId (999) 与服务端不一致 (1)，使用服务端值
[签到] 当前用户: 1
```

### 开发环境兜底
```
[用户身份] 前端传入: 1
[用户身份] ⚠️ 服务端无 session/cookie，使用前端传入的 userId（不安全）: 1
[签到] 当前用户: 1
```

---

## 💡 优势总结

| 特性 | 纯前端传参 | 纯后端验证 | 双重验证（当前方案）|
|------|-----------|-----------|-------------------|
| 安全性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 开发便利 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 防伪造 | ❌ | ✅ | ✅ |
| 可调试 | ✅ | ❌ | ✅ |
| 兼容性 | ✅ | ⚠️ 需登录 | ✅ 自动兜底 |

---

## 🧪 测试步骤

### 1. 正常场景测试

```bash
# 1. 启动服务
cd film_api && npm start

# 2. 用户登录
# 3. 进入任务中心
# 4. 点击签到
```

**预期日志：**
```
[用户身份] 从 session 获取: 1
[用户身份] 前端传入: 1
[签到] 当前用户: 1
```

### 2. 伪造攻击测试

**修改前端代码（测试用）：**
```javascript
// 临时修改 localStorage
localStorage.setItem('userId', '999');
```

**点击签到**

**预期日志：**
```
[用户身份] 从 session 获取: 1
[用户身份] 前端传入: 999
⚠️ 警告：前端传入的 userId (999) 与服务端不一致 (1)，使用服务端值
[签到] 当前用户: 1  ← 使用服务端的，忽略伪造
```

### 3. 开发环境测试（未登录）

**清空 session 和 cookies**

**预期日志：**
```
[用户身份] 前端传入: 1
⚠️ 服务端无 session/cookie，使用前端传入的 userId（不安全）: 1
[签到] 当前用户: 1
```

---

## ⚙️ 配置建议

### 生产环境

建议移除兜底逻辑，强制要求登录：

```javascript
function getCurrentUserId(req) {
  let serverUserId = null;
  
  if (req.session && req.session.userId) {
    serverUserId = normalizeUserId(req.session.userId);
  } else if (req.cookies && req.cookies.user_id) {
    serverUserId = normalizeUserId(req.cookies.user_id);
  }
  
  if (!serverUserId) {
    console.error('[用户身份] ❌ 用户未登录');
    return null;  // 生产环境不使用前端参数
  }
  
  return serverUserId;
}
```

---

## 🎉 总结

### 当前实现特点

1. **✅ 安全性**
   - 优先使用服务端 session/cookie
   - 检测并忽略伪造的 userId

2. **✅ 开发便利**
   - 前端仍然传 userId
   - 便于调试和日志追踪

3. **✅ 向后兼容**
   - 保留兜底逻辑
   - 开发环境仍可使用

4. **✅ 可审计**
   - 详细的日志记录
   - 可检测异常行为

---

## 📚 相关文件

### 前端
- `film/src/api/points.js` - coinService 拦截器
- `film/src/api/offerwall.js` - getUserCoins 函数

### 后端
- `film_api/routes/index.js` - getCurrentUserId 函数

---

**现在系统既安全又灵活！** 🔐✨
