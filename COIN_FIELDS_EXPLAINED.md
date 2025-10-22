# 📊 金币系统字段说明

## t_user_coins 表结构

| 字段名 | 类型 | 说明 | 用途 |
|--------|------|------|------|
| `coin_id` | INT UNSIGNED | 主键，自增 | 唯一标识 |
| `user_id` | INT UNSIGNED | 用户ID（外键） | 关联 t_user 表 |
| **`coin_balance`** | INT | **总金币余额** ✅ | **前端显示的金币数** |
| `total_earned` | INT | 累计获得金币 | 统计用，包含已消费的 |
| `last_checkin_date` | DATE | 最后签到日期 | 判断今天是否已签到 |
| `continuous_days` | INT | 连续签到天数 | 计算签到奖励 |
| `created_at` | TIMESTAMP | 创建时间 | 记录创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 | 自动更新 |

---

## 字段详细说明

### 1. `coin_balance` - 总金币余额 ✅

**定义：** 用户当前可用的金币数量

**计算公式：**
```
coin_balance = 初始金币 + 所有获得的金币 - 所有消费的金币
```

**示例：**
```
初始: 0
签到获得: +20  → coin_balance = 20
签到获得: +20  → coin_balance = 40
任务奖励: +50  → coin_balance = 90
消费兑换: -30  → coin_balance = 60
```

**前端使用：**
```javascript
// TaskCenter.vue
this.userCoins = res.data.coin_balance || 0
```

**显示位置：**
- 任务中心顶部金币数
- 个人中心金币余额
- 兑换页面可用金币

---

### 2. `total_earned` - 累计获得金币

**定义：** 用户历史上累计获得的所有金币（不减少）

**计算公式：**
```
total_earned = 所有获得金币的总和（只增不减）
```

**示例：**
```
初始: 0
签到获得: +20  → total_earned = 20
签到获得: +20  → total_earned = 40
任务奖励: +50  → total_earned = 90
消费兑换: -30  → total_earned = 90 （不变！）
```

**用途：**
- 统计用户总共赚了多少金币
- 排行榜（赚币榜）
- 成就系统（累计金币达成）

**注意：** 
- ⚠️ 不用于前端显示当前金币
- ⚠️ 只记录获得，不记录消费

---

### 3. `last_checkin_date` - 最后签到日期

**定义：** 用户最后一次签到的日期

**格式：** `YYYY-MM-DD` (例如：`2025-10-21`)

**用途：**
```javascript
// 判断今天是否已签到
const today = new Date().toISOString().split('T')[0]
const hasSignedToday = (last_checkin_date === today)
```

**签到逻辑：**
```javascript
// 检查连续签到
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = yesterday.toISOString().split('T')[0]

if (last_checkin_date === yesterdayStr) {
  continuous_days += 1  // 昨天签到了，连续天数+1
} else {
  continuous_days = 1   // 没连续，重置为1
}
```

---

### 4. `continuous_days` - 连续签到天数

**定义：** 用户连续签到的天数

**奖励规则：**
```javascript
const rewardCoins = {
  1: 20,   // 第1天: 20金币
  2: 20,   // 第2天: 20金币
  3: 30,   // 第3天: 30金币
  4: 40,   // 第4天: 40金币
  5: 50,   // 第5天: 50金币
  '6+': 60 // 第6天及以上: 60金币
}
```

**断签重置：**
```
用户A: 连续签到3天 → continuous_days = 3
第4天没签到
第5天签到 → continuous_days = 1 （重置）
```

---

## API 接口说明

### GET `/api/getUserCoins`

**请求：**
```javascript
GET /api/getUserCoins?userId=55
Headers: Cookie: user_id=55
```

**响应：**
```json
{
  "success_code": 200,
  "data": {
    "coin_id": 1,
    "user_id": 55,
    "coin_balance": 120,        // ✅ 总金币余额（前端显示）
    "total_earned": 200,        // 累计获得金币
    "last_checkin_date": "2025-10-21",
    "continuous_days": 5
  }
}
```

**前端使用：**
```javascript
const res = await getUserCoins()
if (res.success_code === 200) {
  this.userCoins = res.data.coin_balance  // ✅ 显示总金币
}
```

---

### POST `/api/userCheckin`

**请求：**
```javascript
POST /api/userCheckin
Body: { userId: 55 }
Headers: Cookie: user_id=55
```

**响应：**
```json
{
  "success_code": 200,
  "data": {
    "coin_balance": 140,           // 签到后的余额
    "reward_coins": 20,            // 本次奖励
    "continuous_days": 6,          // 连续签到天数
    "message": "签到成功！获得20金币"
  }
}
```

**数据更新：**
```sql
UPDATE t_user_coins SET
  coin_balance = coin_balance + 20,      -- ✅ 余额增加
  total_earned = total_earned + 20,      -- ✅ 累计也增加
  last_checkin_date = '2025-10-21',
  continuous_days = 6
WHERE user_id = 55
```

---

## 金币变动记录表 (t_coin_records)

每次金币变动都会记录：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `record_id` | INT UNSIGNED | 记录ID |
| `user_id` | INT UNSIGNED | 用户ID |
| `coin_change` | INT | 金币变动（+增加 -减少） |
| `change_type` | VARCHAR(50) | 类型（checkin/reward/consume） |
| `change_reason` | VARCHAR(200) | 变动原因 |
| `balance_after` | INT | 变动后余额 |
| `created_at` | TIMESTAMP | 变动时间 |

**示例记录：**
```json
{
  "record_id": 1,
  "user_id": 55,
  "coin_change": 20,                    // +20
  "change_type": "checkin",
  "change_reason": "第6天签到奖励",
  "balance_after": 140,                 // 变动后余额
  "created_at": "2025-10-21 10:30:00"
}
```

---

## 前端显示示例

### 任务中心顶部

```vue
<template>
  <div class="coin-display">
    <img src="@/assets/coin-icon.png" alt="金币">
    <span class="coin-amount">{{ userCoins }}</span>  <!-- 显示 coin_balance -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      userCoins: 0  // coin_balance 的值
    }
  },
  async created() {
    const res = await getUserCoins()
    if (res.success_code === 200) {
      this.userCoins = res.data.coin_balance  // ✅ 总金币余额
    }
  }
}
</script>
```

### 个人中心金币详情

```vue
<template>
  <div class="coin-info">
    <div class="item">
      <span class="label">当前金币：</span>
      <span class="value">{{ coinData.coin_balance }}</span>  <!-- 可用余额 -->
    </div>
    <div class="item">
      <span class="label">累计获得：</span>
      <span class="value">{{ coinData.total_earned }}</span>  <!-- 历史总计 -->
    </div>
    <div class="item">
      <span class="label">连续签到：</span>
      <span class="value">{{ coinData.continuous_days }} 天</span>
    </div>
  </div>
</template>
```

---

## 常见问题

### Q1: coin_balance 和 total_earned 有什么区别？

**A:**
- **`coin_balance`**: 当前可用的金币，会减少（消费时）
- **`total_earned`**: 历史累计获得，只增不减（统计用）

**示例：**
```
用户获得100金币：
  coin_balance = 100
  total_earned = 100

用户消费30金币：
  coin_balance = 70   ← 减少了
  total_earned = 100  ← 不变

用户又获得50金币：
  coin_balance = 120
  total_earned = 150
```

### Q2: 前端应该显示哪个字段？

**A:**
- **任务中心/个人中心** → 显示 `coin_balance`（当前可用）
- **赚币排行榜** → 显示 `total_earned`（历史总计）
- **签到奖励提示** → 显示 `reward_coins`（本次获得）

### Q3: 签到时两个字段如何变化？

**A:**
```javascript
// 签到前
coin_balance: 100
total_earned: 100

// 签到获得20金币
UPDATE t_user_coins SET
  coin_balance = coin_balance + 20,  // 100 + 20 = 120
  total_earned = total_earned + 20   // 100 + 20 = 120

// 签到后
coin_balance: 120  ← 都增加
total_earned: 120  ← 都增加
```

### Q4: 如果用户消费金币呢？

**A:**
```javascript
// 消费前
coin_balance: 120
total_earned: 120

// 兑换商品消费30金币
UPDATE t_user_coins SET
  coin_balance = coin_balance - 30  // 120 - 30 = 90

// 消费后
coin_balance: 90    ← 减少了
total_earned: 120   ← 不变（只记录获得）
```

---

## 总结

### ✅ 关键要点

1. **`coin_balance`** = 总金币余额（前端显示）
2. **`total_earned`** = 累计获得金币（统计排行）
3. 签到时两个字段都增加
4. 消费时只有 `coin_balance` 减少

### 📊 前端使用

```javascript
// TaskCenter.vue
this.userCoins = res.data.coin_balance  // ✅ 正确
```

### 🎯 数据流向

```
签到 → 后端更新 coin_balance 和 total_earned
     ↓
     响应返回 coin_balance
     ↓
     前端显示 this.userCoins
```

**现在前端会正确显示用户的总金币余额了！** 🎉
