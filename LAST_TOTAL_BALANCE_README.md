# last_total_balance 字段实现说明

## 📋 字段信息

- **字段名**: `last_total_balance`
- **数据类型**: `INT`
- **默认值**: `0`
- **注释**: 上一次总余额
- **位置**: `total_earned` 字段之后

## 🎯 功能说明

`last_total_balance` 字段用于**记录金币变动前一次的余额**。

每次用户金币发生变动时：

1. 先将当前的 `coin_balance` 保存到 `last_total_balance`
2. 然后更新 `coin_balance` 和 `total_earned`

这样可以追踪每次金币变动的历史。

## 📊 数据结构

```sql
CREATE TABLE t_user_coins (
  coin_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  coin_balance INT NOT NULL DEFAULT 0 COMMENT '当前金币余额',
  total_earned INT NOT NULL DEFAULT 0 COMMENT '累计获得金币',
  last_total_balance INT DEFAULT 0 COMMENT '上一次总余额',
  last_checkin_date DATE,
  continuous_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 💻 代码实现

### 1. 添加字段 SQL

**文件**: `film_api/add_last_total_balance_field.sql`

```sql
ALTER TABLE t_user_coins
ADD COLUMN last_total_balance INT DEFAULT 0 COMMENT '上一次总余额' AFTER total_earned;
```

### 2. 回调接口更新逻辑

**文件**: `film_api/routes/index.js`

**更新现有记录** (第 2703-2710 行):

```javascript
const updateCoinsSql = `
  UPDATE t_user_coins 
  SET last_total_balance = coin_balance,  -- 保存变动前的余额
      coin_balance = coin_balance + ?,     -- 更新当前余额
      total_earned = total_earned + ?,     -- 更新累计收益
      updated_at = NOW()
  WHERE user_id = ?
`;
```

**插入新记录** (第 2737-2740 行):

```javascript
const insertCoinsSql = `
  INSERT INTO t_user_coins 
  (user_id, coin_balance, total_earned, last_total_balance, continuous_days, last_checkin_date, created_at, updated_at)
  VALUES (?, ?, ?, 0, 0, NULL, NOW(), NOW())  -- 初始 last_total_balance = 0
`;
```

## 📝 使用示例

### 场景 1: 用户完成任务获得奖励

```
初始状态:
  coin_balance = 100
  total_earned = 100
  last_total_balance = 80 (上次变动前的余额)

完成任务 +20:
  last_total_balance = 100  (保存变动前的余额)
  coin_balance = 120        (增加奖励)
  total_earned = 120        (增加奖励)

结果:
  可以看到余额从 100 变为 120
  变化量 = coin_balance - last_total_balance = 120 - 100 = 20
```

### 场景 2: 新用户首次获得金币

```
初始状态: (用户记录不存在)

首次完成任务 +10:
  INSERT 新记录
  coin_balance = 10
  total_earned = 10
  last_total_balance = 0    (初始值)

结果:
  新用户首次获得 10 金币
  变化量 = coin_balance - last_total_balance = 10 - 0 = 10
```

## 🔍 应用场景

### 1. 显示金币变化历史

```javascript
// 前端显示
余额变化: {last_total_balance} → {coin_balance}
变化量: +{coin_balance - last_total_balance}
```

### 2. 计算本次变化

```javascript
const change = user.coin_balance - user.last_total_balance;
console.log(`用户金币 ${change > 0 ? "增加" : "减少"} ${Math.abs(change)}`);
```

### 3. 异常检测

```javascript
// 检测异常大额变动
const change = user.coin_balance - user.last_total_balance;
if (Math.abs(change) > 1000) {
  console.warn("检测到异常大额变动:", change);
}
```

### 4. 用户金币流水

```javascript
// 记录每次变动
{
  user_id: 55,
  action: '完成任务',
  before: last_total_balance,
  after: coin_balance,
  change: coin_balance - last_total_balance,
  timestamp: updated_at
}
```

## 🧪 测试

### 测试脚本

**文件**: `film_api/test_last_total_balance.js`

运行测试:

```bash
cd film_api
node test_last_total_balance.js
```

测试内容:

1. 查询用户当前金币数据
2. 发送回调请求增加金币
3. 验证 `last_total_balance` 是否等于变动前的 `coin_balance`
4. 验证金币增加是否正确

### 预期结果

```
变动前:
  coin_balance = 310
  last_total_balance = 0

回调 +15:
  coin_balance = 325
  last_total_balance = 310  ← 保存了变动前的值

验证:
  ✅ last_total_balance (310) = 变动前的 coin_balance (310)
  ✅ coin_balance 增加了 15
  ✅ total_earned 增加了 15
```

## ⚠️ 注意事项

### 1. 重启服务

修改代码后需要**重启 film_api 服务**才能生效:

```bash
cd film_api
# 停止当前服务 (Ctrl+C)
# 重新启动
node app.js
```

或使用重启脚本:

```bash
film_api/restart-film-api-updated.bat
```

### 2. 字段更新时机

`last_total_balance` 字段在以下情况下更新:

- ✅ 完成任务获得奖励
- ✅ 签到获得金币
- ✅ 其他任何增加或减少金币的操作

建议所有涉及 `coin_balance` 更新的 SQL 都添加 `last_total_balance = coin_balance`。

### 3. 历史数据

已存在的用户记录，`last_total_balance` 初始值为 `0`。

第一次变动后会正确记录：

```
第一次变动前: last_total_balance = 0
第一次变动后: last_total_balance = (变动前的 coin_balance)
第二次变动前: last_total_balance = (第一次变动后的 coin_balance)
...
```

### 4. 只记录上一次

`last_total_balance` 只记录**上一次**的余额，不保存完整历史。

如需完整历史，建议创建独立的金币流水表：

```sql
CREATE TABLE coin_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  change_amount INT NOT NULL,
  transaction_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📄 相关文件

- `film_api/add_last_total_balance_field.sql` - 添加字段的 SQL 脚本
- `film_api/add_last_total_balance_field.js` - 添加字段的 Node.js 脚本
- `film_api/test_last_total_balance.js` - 测试脚本
- `film_api/routes/index.js` (第 2703-2760 行) - 回调接口实现

## ✅ 总结

`last_total_balance` 字段成功实现了以下功能:

1. ✅ 记录金币变动前的余额
2. ✅ 支持计算本次变化量
3. ✅ 可用于显示变化历史
4. ✅ 支持异常检测
5. ✅ 新用户和现有用户都能正确处理

**使用方式**: 每次金币变动时，SQL 自动将当前 `coin_balance` 保存到 `last_total_balance`，然后更新 `coin_balance`。
