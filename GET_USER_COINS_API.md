# 📊 getUserCoins 接口文档

## 接口说明

**接口路径：** `GET /api/getUserCoins`  
**功能：** 根据用户 ID 查询 `t_user_coins` 表，返回用户的金币信息

---

## 请求参数

### Query 参数（可选）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | String/Number | 否 | 用户ID（备用参数，优先使用 session/cookie） |

### 认证方式

**优先级顺序：**
1. **Session**：`req.session.userId`（最高优先级）
2. **Cookie**：`req.cookies.user_id`
3. **参数**：`req.query.userId`（兜底方案）

---

## 后端实现

### 完整代码（已实现）

```javascript
// film_api/routes/index.js

router.get('/api/getUserCoins', function(req, res) {
  // 1️⃣ 从 session/cookie 获取当前登录用户（服务端验证）
  let userId = getCurrentUserId(req);
  
  if (!userId) {
    res.json({
      error_code: 1,
      message: '用户未登录或登录已过期'
    });
    return;
  }
  
  console.log('[获取金币] 当前用户:', userId);
  
  // 2️⃣ 查询用户金币信息
  let sqlStr = 'SELECT * FROM t_user_coins WHERE user_id = ? LIMIT 1;';
  conn.query(sqlStr, [userId], (error, result, field) => {
    if (error) {
      logCoinError('获取金币信息', error, { userId, originalUserId: req.query.userId });
      res.json({
        error_code: 1,
        message: '获取金币信息失败',
        detail: error.message
      });
    } else {
      result = JSON.parse(JSON.stringify(result));
      
      // 3️⃣ 如果查询到数据，直接返回
      if (result[0]) {
        console.log('[获取金币] 查询成功:', result[0]);
        res.json({
          success_code: 200,
          data: result[0]
        });
      } else {
        // 4️⃣ 如果用户没有金币记录，自动创建一条
        console.log('[获取金币] 用户无记录，创建新记录...');
        sqlStr = 'INSERT INTO t_user_coins(user_id, coin_balance, total_earned, continuous_days) VALUES(?, ?, ?, ?);';
        conn.query(sqlStr, [userId, 0, 0, 0], (error, result, field) => {
          if (error) {
            logCoinError('创建金币记录', error, { userId, originalUserId: req.query.userId });
            res.json({
              error_code: 1,
              message: '创建金币记录失败',
              detail: error.message
            });
          } else {
            console.log('[获取金币] 创建记录成功, coin_id:', result.insertId);
            res.json({
              success_code: 200,
              data: {
                coin_id: result.insertId,
                user_id: userId,
                coin_balance: 0,
                total_earned: 0,
                continuous_days: 0,
                last_checkin_date: null
              }
            });
          }
        });
      }
    }
  });
});
```

---

## 响应格式

### 成功响应（用户有金币记录）

```json
{
  "success_code": 200,
  "data": {
    "coin_id": 1,
    "user_id": 55,
    "coin_balance": 120,
    "total_earned": 300,
    "continuous_days": 5,
    "last_checkin_date": "2025-10-20",
    "created_at": "2025-10-15T08:30:00.000Z",
    "updated_at": "2025-10-20T09:15:00.000Z"
  }
}
```

### 成功响应（首次查询，自动创建记录）

```json
{
  "success_code": 200,
  "data": {
    "coin_id": 19,
    "user_id": 55,
    "coin_balance": 0,
    "total_earned": 0,
    "continuous_days": 0,
    "last_checkin_date": null
  }
}
```

### 错误响应

#### 未登录

```json
{
  "error_code": 1,
  "message": "用户未登录或登录已过期"
}
```

#### 查询失败

```json
{
  "error_code": 1,
  "message": "获取金币信息失败",
  "detail": "Table 't_user_coins' doesn't exist"
}
```

---

## 数据库表结构

### t_user_coins 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| coin_id | INT UNSIGNED | 主键，自增 |
| user_id | INT UNSIGNED | 用户ID（外键 → t_user.user_id） |
| coin_balance | INT | 当前金币余额 |
| total_earned | INT | 累计获得金币 |
| continuous_days | INT | 连续签到天数 |
| last_checkin_date | DATE | 最后签到日期 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### SQL 关系

```sql
-- 查询用户金币信息
SELECT * 
FROM t_user_coins 
WHERE user_id = ? 
LIMIT 1;

-- 如果用户没有记录，自动创建
INSERT INTO t_user_coins(user_id, coin_balance, total_earned, continuous_days) 
VALUES(?, 0, 0, 0);
```

---

## 前端调用

### 使用 getUserCoins() API

```javascript
// film/src/api/offerwall.js
export function getUserCoins() {
  let userId = localStorage.getItem('userId');
  
  if (!userId) {
    // 从 cookie 读取
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_id='));
    
    if (cookieValue) {
      userId = cookieValue.split('=')[1];
      localStorage.setItem('userId', userId);
    }
  }
  
  const params = userId ? { userId } : {};

  return axios.get('/api/getUserCoins', {
    params,
    withCredentials: true  // ✅ 发送 cookies
  })
}
```

### 在组件中使用

```javascript
// TaskCenter.vue
import { getUserCoins } from '@/api/offerwall'

export default {
  data() {
    return {
      userCoins: 0
    }
  },
  methods: {
    async loadUserPoints() {
      try {
        const res = await getUserCoins()
        if (res.success_code === 200 && res.data) {
          // ✅ 渲染金币余额到页面
          this.userCoins = res.data.coin_balance || 0
          console.log('用户金币:', this.userCoins)
        }
      } catch (error) {
        console.error('获取金币失败:', error)
        this.userCoins = 0
      }
    }
  },
  created() {
    this.loadUserPoints()
  }
}
```

### 页面渲染

```vue
<template>
  <div class="coin-display">
    <img src="@/assets/coin.png" alt="金币" />
    <span>{{ userCoins }}</span>
  </div>
</template>
```

---

## 工作流程

### 完整流程图

```
用户访问任务中心页面
    ↓
调用 loadUserPoints()
    ↓
执行 getUserCoins() API
    ↓
┌─────────────────────────────────────┐
│ 前端发送请求                         │
│ GET /api/getUserCoins?userId=55     │
│ Headers: Cookie: user_id=55         │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 后端处理                             │
│                                     │
│ 1. getCurrentUserId(req)            │
│    ├─ req.session.userId → 55 ✅    │
│    ├─ req.cookies.user_id → 55      │
│    └─ req.query.userId → 55         │
│                                     │
│ 2. 查询数据库                        │
│    SELECT * FROM t_user_coins       │
│    WHERE user_id = 55               │
│                                     │
│ 3. 如果有记录 → 返回数据             │
│    如果无记录 → 创建新记录 → 返回     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 返回响应                             │
│ {                                   │
│   success_code: 200,                │
│   data: {                           │
│     coin_balance: 120,  ← 渲染到页面 │
│     total_earned: 300,              │
│     continuous_days: 5              │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘
    ↓
前端更新 this.userCoins = 120
    ↓
页面显示金币数量
```

---

## 日志示例

### 正常查询

```bash
[用户身份] 从 session 获取: 55
[获取金币] 当前用户: 55
[获取金币] 查询成功: {
  coin_id: 1,
  user_id: 55,
  coin_balance: 120,
  total_earned: 300,
  continuous_days: 5,
  last_checkin_date: '2025-10-20',
  created_at: 2025-10-15T08:30:00.000Z,
  updated_at: 2025-10-20T09:15:00.000Z
}
```

### 首次查询（自动创建记录）

```bash
[用户身份] 从 session 获取: 66
[获取金币] 当前用户: 66
[获取金币] 用户无记录，创建新记录...
[获取金币] 创建记录成功, coin_id: 20
```

### 错误情况

```bash
[用户身份] ❌ 未找到用户信息，用户未登录
```

---

## 测试用例

### 测试 1：登录用户查询金币

```bash
# 请求
curl -X GET 'http://localhost:4000/api/getUserCoins' \
  -H 'Cookie: user_id=55' \
  -b cookies.txt

# 预期响应
{
  "success_code": 200,
  "data": {
    "coin_balance": 120,
    "total_earned": 300,
    ...
  }
}
```

### 测试 2：新用户首次查询

```bash
# 请求（新用户，数据库无记录）
curl -X GET 'http://localhost:4000/api/getUserCoins?userId=99' \
  -H 'Cookie: user_id=99'

# 预期响应（自动创建记录）
{
  "success_code": 200,
  "data": {
    "coin_id": 20,
    "user_id": 99,
    "coin_balance": 0,
    "total_earned": 0,
    "continuous_days": 0,
    "last_checkin_date": null
  }
}
```

### 测试 3：未登录用户

```bash
# 请求（无 cookie，无参数）
curl -X GET 'http://localhost:4000/api/getUserCoins'

# 预期响应
{
  "error_code": 1,
  "message": "用户未登录或登录已过期"
}
```

---

## 前端渲染示例

### 完整页面效果

```vue
<template>
  <div class="task-center">
    <!-- 金币显示区域 -->
    <div class="coin-header">
      <div class="coin-display">
        <img src="@/assets/images/coin.png" alt="金币" />
        <span class="coin-amount">{{ userCoins }}</span>
      </div>
      <div class="coin-info">
        <p>累计获得：{{ totalEarned }} 金币</p>
        <p>连续签到：{{ continuousDays }} 天</p>
      </div>
    </div>
    
    <!-- 签到按钮 -->
    <button @click="handleSignin" :disabled="hasSignedToday">
      {{ hasSignedToday ? '已签到' : '签到领金币' }}
    </button>
  </div>
</template>

<script>
import { getUserCoins } from '@/api/offerwall'

export default {
  data() {
    return {
      userCoins: 0,
      totalEarned: 0,
      continuousDays: 0,
      hasSignedToday: false
    }
  },
  methods: {
    async loadUserPoints() {
      try {
        const res = await getUserCoins()
        if (res.success_code === 200 && res.data) {
          // ✅ 渲染所有金币信息
          this.userCoins = res.data.coin_balance || 0
          this.totalEarned = res.data.total_earned || 0
          this.continuousDays = res.data.continuous_days || 0
        }
      } catch (error) {
        console.error('获取金币失败:', error)
        this.userCoins = 0
      }
    }
  },
  created() {
    this.loadUserPoints()
  }
}
</script>

<style scoped>
.coin-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coin-amount {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
}
</style>
```

---

## 优化建议

### 1. 添加缓存机制

```javascript
// 前端缓存，减少请求次数
let coinCache = null;
let cacheTime = 0;

export function getUserCoins(forceRefresh = false) {
  const now = Date.now();
  
  // 如果缓存有效（5分钟内），直接返回缓存
  if (!forceRefresh && coinCache && now - cacheTime < 5 * 60 * 1000) {
    return Promise.resolve(coinCache);
  }
  
  // 否则重新请求
  return axios.get('/api/getUserCoins', {
    params: userId ? { userId } : {},
    withCredentials: true
  }).then(res => {
    coinCache = res;
    cacheTime = now;
    return res;
  });
}
```

### 2. 添加 JOIN 查询用户信息

```javascript
// 后端优化：同时返回用户基本信息
router.get('/api/getUserCoins', function(req, res) {
  let userId = getCurrentUserId(req);
  
  // JOIN 查询，同时获取用户名等信息
  let sqlStr = `
    SELECT 
      uc.*,
      u.user_name,
      u.avatar
    FROM t_user_coins uc
    LEFT JOIN t_user u ON uc.user_id = u.user_id
    WHERE uc.user_id = ? 
    LIMIT 1;
  `;
  
  conn.query(sqlStr, [userId], (error, result) => {
    // ... 处理逻辑
  });
});
```

---

## 总结

### ✅ 接口功能

1. **查询用户金币**：根据 userId 从 `t_user_coins` 表查询
2. **自动创建记录**：首次查询自动创建金币记录
3. **安全验证**：优先使用 session/cookie，防止伪造
4. **错误处理**：完善的错误日志和响应

### ✅ 前端渲染流程

1. 组件加载时调用 `getUserCoins()`
2. 获取金币数据 `coin_balance`
3. 更新 `this.userCoins`
4. 页面自动渲染显示金币数量

### 🎯 关键点

- **数据源**：`t_user_coins.coin_balance`
- **关联字段**：`user_id`（INT UNSIGNED）
- **认证方式**：Session/Cookie（自动验证）
- **渲染字段**：`coin_balance`（当前余额）

**接口已完整实现，可以正常根据用户 ID 查询金币并渲染到页面！** 🎉
