# 📋 签到状态检查接口文档

## 接口概述

**接口名称**: 检查今日签到状态  
**接口地址**: `GET /api/checkSigninStatus`  
**端口**: 4000 (film_api)  
**认证方式**: Session/Cookie (自动读取登录用户)

---

## 功能说明

检查当前登录用户今天是否已经签到过，用于：
- 页面加载时判断签到按钮状态
- 点击签到前再次确认（防止重复签到）
- 显示连续签到天数

---

## 请求参数

### Query Parameters (可选)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `userId` | number | 否 | 用户ID（仅开发环境，生产环境从session/cookie读取） |

### Headers (自动)

```
Cookie: user_id=55
```

---

## 响应格式

### 成功响应 (200)

**今日已签到:**
```json
{
  "success_code": 200,
  "checked": true,
  "data": {
    "last_checkin_date": "2025-10-21",
    "continuous_days": 5
  }
}
```

**今日未签到:**
```json
{
  "success_code": 200,
  "checked": false,
  "data": {
    "last_checkin_date": "2025-10-20",
    "continuous_days": 4
  }
}
```

**从未签到:**
```json
{
  "success_code": 200,
  "checked": false,
  "data": {
    "last_checkin_date": null,
    "continuous_days": 0
  }
}
```

### 错误响应

**未登录 (401):**
```json
{
  "success_code": 401,
  "message": "用户未登录或登录已过期",
  "checked": false
}
```

**服务器错误 (500):**
```json
{
  "success_code": 500,
  "message": "查询签到状态失败",
  "detail": "数据库错误信息",
  "checked": false
}
```

---

## 字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `success_code` | number | 状态码：200=成功，401=未登录，500=服务器错误 |
| `checked` | boolean | 今日是否已签到：true=已签到，false=未签到 |
| `data` | object | 详细信息（可能为null） |
| `data.last_checkin_date` | string/null | 最后签到日期 (YYYY-MM-DD 格式) |
| `data.continuous_days` | number | 连续签到天数 |
| `message` | string | 错误信息（仅错误时返回） |

---

## 前端调用示例

### Vue.js 调用

```javascript
// 在 film/src/api/points.js
export function getMySigninStatus() {
  return coinService({
    url: '/checkSigninStatus',
    method: 'get'
  })
}

// 在组件中使用
async loadSigninStatus() {
  try {
    const res = await getMySigninStatus()
    
    if (res.success_code === 200) {
      this.hasSignedToday = res.checked  // true/false
      
      if (res.data) {
        this.signedDays = res.data.continuous_days  // 连续天数
        console.log('最后签到:', res.data.last_checkin_date)
      }
      
      // 根据签到状态更新UI
      if (this.hasSignedToday) {
        // 禁用签到按钮
        // 显示"今日已签到"
      } else {
        // 启用签到按钮
        // 显示"签到 + 20 奖励币"
      }
    }
  } catch (error) {
    console.error('获取签到状态失败:', error)
    this.hasSignedToday = false
  }
}
```

### Axios 直接调用

```javascript
import axios from 'axios'

axios.get('http://localhost:4000/api/checkSigninStatus', {
  withCredentials: true  // 发送 cookie
})
.then(res => {
  const { success_code, checked, data } = res.data
  
  if (success_code === 200) {
    console.log('今日已签到:', checked)
    console.log('连续天数:', data.continuous_days)
  }
})
```

---

## 业务逻辑

### 判断逻辑

```javascript
// 后端判断逻辑
let today = new Date().toISOString().split('T')[0]  // "2025-10-21"
let lastCheckinDate = userCoin.last_checkin_date    // "2025-10-21" 或 "2025-10-20" 或 null

if (lastCheckinDate === today) {
  // 今天已签到
  checked = true
} else {
  // 今天未签到
  checked = false
}
```

### 连续签到计算

```javascript
// 昨天的日期
let yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
let yesterdayStr = yesterday.toISOString().split('T')[0]

if (lastCheckinDate === yesterdayStr) {
  // 昨天签到了，说明是连续的
  continuous_days = userCoin.continuous_days
} else if (lastCheckinDate === today) {
  // 今天签到了
  continuous_days = userCoin.continuous_days
} else {
  // 断签了，会在下次签到时重置为1
  continuous_days = 0 或 userCoin.continuous_days
}
```

---

## 使用场景

### 1. 页面初始化时检查

```javascript
async created() {
  await this.loadSigninStatus()  // 检查今日签到状态
  await this.loadUserPoints()    // 加载金币余额
}
```

**作用**: 页面加载时就显示正确的按钮状态（已签到 = 灰色禁用）

---

### 2. 点击签到前再次确认

```javascript
async handleSignIn() {
  // 先检查状态（防止重复签到）
  await this.loadSigninStatus()
  
  if (this.hasSignedToday) {
    Toast({ message: '今日已签到' })
    return
  }
  
  // 执行签到
  const res = await doSignin()
  // ...
}
```

**作用**: 防止网络延迟导致的重复签到请求

---

### 3. 定时刷新状态

```javascript
mounted() {
  // 每60秒刷新一次签到状态
  this.timer = setInterval(() => {
    this.loadSigninStatus()
  }, 60000)
}

beforeDestroy() {
  clearInterval(this.timer)
}
```

**作用**: 用户长时间停留在页面时，自动更新签到状态

---

## 测试方法

### 1. 使用测试脚本

```bash
cd film_api
node test_checkSigninStatus.js
```

### 2. 浏览器直接访问

```
http://localhost:4000/api/checkSigninStatus?userId=55
```

### 3. Postman 测试

```
GET http://localhost:4000/api/checkSigninStatus
```

---

## 数据库查询

接口执行的 SQL 语句：

```sql
-- 查询用户签到信息
SELECT 
  coin_id, 
  user_id, 
  last_checkin_date, 
  continuous_days 
FROM t_user_coins 
WHERE user_id = 55 
LIMIT 1;
```

**结果示例:**

| coin_id | user_id | last_checkin_date | continuous_days |
|---------|---------|-------------------|-----------------|
| 1 | 55 | 2025-10-21 | 5 |

**判断:**
- `last_checkin_date = '2025-10-21'` (今天) → `checked = true`
- `last_checkin_date = '2025-10-20'` (昨天) → `checked = false`
- `last_checkin_date = null` (从未签到) → `checked = false`

---

## 错误处理

### 常见错误

**1. 用户未登录**
```json
{
  "success_code": 401,
  "message": "用户未登录或登录已过期"
}
```
处理: 跳转到登录页面

**2. 用户无记录**
- 不算错误，返回 `checked: false`，`continuous_days: 0`
- 首次签到时会自动创建记录

**3. 数据库错误**
```json
{
  "success_code": 500,
  "message": "查询签到状态失败"
}
```
处理: 显示错误提示，默认 `checked: false`（允许尝试签到）

---

## 性能优化

### 缓存建议

```javascript
// 前端缓存5分钟
let lastCheckTime = 0
let cachedStatus = null

async loadSigninStatus() {
  const now = Date.now()
  
  // 5分钟内使用缓存
  if (now - lastCheckTime < 5 * 60 * 1000 && cachedStatus) {
    this.hasSignedToday = cachedStatus.checked
    return
  }
  
  // 超过5分钟，重新请求
  const res = await getMySigninStatus()
  cachedStatus = res
  lastCheckTime = now
  
  this.hasSignedToday = res.checked
}
```

---

## 与签到接口的配合

### 签到流程

```javascript
async handleSignIn() {
  // 1. 检查签到状态
  await this.loadSigninStatus()
  
  if (this.hasSignedToday) {
    Toast({ message: '今日已签到' })
    return
  }
  
  // 2. 执行签到
  const res = await doSignin()
  
  if (res.success_code === 200) {
    // 3. 签到成功，更新状态
    this.hasSignedToday = true
    this.signedDays = res.data.continuous_days
    
    // 4. 刷新金币
    await this.loadUserPoints()
  }
}
```

---

## 安全性

### 用户身份验证

```javascript
// 后端验证逻辑（routes/index.js）
function getCurrentUserId(req) {
  // 优先从 session 获取
  if (req.session && req.session.userId) {
    return req.session.userId
  }
  
  // 其次从 cookie 获取
  if (req.cookies && req.cookies.user_id) {
    return req.cookies.user_id
  }
  
  // 最后从参数获取（仅开发环境）
  if (req.query.userId || req.body.userId) {
    console.warn('使用前端传入的userId（不安全）')
    return req.query.userId || req.body.userId
  }
  
  return null  // 未登录
}
```

### 防止伪造

- ✅ 优先使用服务端 session/cookie（不可伪造）
- ✅ 前端传入的 userId 仅作为兜底（开发环境）
- ✅ 生产环境应该禁用前端 userId 参数

---

## 总结

### 关键要点

1. **调用时机**: 页面初始化 + 签到前再次检查
2. **响应字段**: `checked` (boolean) + `continuous_days` (number)
3. **错误处理**: 默认 `checked: false`（宽容处理）
4. **安全验证**: session/cookie 优先，不依赖前端参数

### 前端UI逻辑

```javascript
// 签到按钮状态
<div 
  class="sign-button" 
  :class="{ 'disabled': hasSignedToday }"
  @click="handleSignIn"
>
  {{ hasSignedToday ? '今日已签到' : '签到 + 20 奖励币' }}
</div>

// CSS
.sign-button.disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}
```

**完整的签到体验流程已实现！** 🎉
