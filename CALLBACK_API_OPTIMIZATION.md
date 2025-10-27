# film_api 回调接口优化说明

## 📋 优化内容

### 1. **增强参数验证**

- ✅ 验证 `coins` 是否为有效数字（非负数）
- ✅ 使用 `Number()` 进行类型转换，避免字符串类型问题
- ✅ 更详细的错误日志输出

### 2. **统一响应格式**

确保符合积分墙后端的期望格式：

**成功响应：**

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "userId": 55,
    "orderId": "ORD...",
    "taskId": "14",
    "coins": 10,
    "newBalance": 150,
    "totalEarned": 500,
    "completedCount": 1,
    "totalCount": 2,
    "processTime": 45,
    "timestamp": 1729757923456
  }
}
```

**失败响应：**

```json
{
  "success": false,
  "message": "错误描述"
}
```

### 3. **改进日志输出**

- ✅ 添加请求时间戳
- ✅ 格式化 JSON 输出（便于阅读）
- ✅ 记录处理耗时
- ✅ 显示完成进度 (completedCount/totalCount)
- ✅ 显示累计收益 (totalEarned)
- ✅ 每个步骤的详细日志

**优化后的日志示例：**

```
========== 收到任务完成回调 ==========
请求时间: 2025-10-27T10:30:45.123Z
请求参数: {
  "userId": "55",
  "taskId": "14",
  "orderId": "ORD1729757923456abc123",
  "coins": 10,
  "totalCount": 2,
  "completedCount": 1,
  "timestamp": 1729757923456,
  "timezone": "Asia/Shanghai"
}
[回调] 用户ID规范化: 55 -> 55
[回调] 任务ID: 14
[回调] 订单ID: ORD1729757923456abc123
[回调] 奖励金币: 10
[回调] 完成进度: 1/2
[回调] 开始更新用户 55 的金币，增加 10
[回调] 数据库更新结果: affectedRows=1
[回调] ✅ 用户金币更新成功，增加 10 金币
[回调] 开始记录回调日志到 task_callback_records 表...
[回调] ✅ 回调日志记录成功
[回调] ✅ 事务提交成功
✅ 回调处理成功!
   - 用户ID: 55
   - 任务ID: 14
   - 订单ID: ORD1729757923456abc123
   - 奖励金币: +10
   - 当前余额: 150
   - 累计收益: 500
   - 完成进度: 1/2
   - 处理耗时: 45ms
========================================
```

### 4. **幂等性优化**

重复调用返回格式：

```json
{
  "success": true,
  "message": "ok",
  "data": {
    "userId": 55,
    "orderId": "ORD...",
    "coins": 10,
    "duplicate": true,
    "processTime": 5
  }
}
```

### 5. **错误处理增强**

- ✅ 统一使用 `res.status(200).json()` 返回响应
- ✅ 错误消息包含具体错误原因
- ✅ 数据库查询失败时也能正常返回响应
- ✅ 事务回滚时的错误处理

### 6. **数据完整性**

- ✅ 查询金币余额时同时获取 `coin_balance` 和 `total_earned`
- ✅ 返回数据包含更多有用信息（任务进度、处理耗时等）
- ✅ 使用 `coinsNum` 变量统一管理金币数值

## 🔄 主要变更对比

### 变更 1: 参数验证

**之前：**

```javascript
if (!userId || !orderId || !coins) {
  return res.json({ success: false, message: "参数缺失" });
}
```

**现在：**

```javascript
if (!userId || !orderId || coins === undefined || coins === null) {
  return res.status(200).json({ success: false, message: "参数缺失" });
}

const coinsNum = Number(coins);
if (isNaN(coinsNum) || coinsNum < 0) {
  return res.status(200).json({ success: false, message: "金币数量无效" });
}
```

### 变更 2: 返回消息

**之前：**

```javascript
res.json({
  success: true,
  message: "奖励发放成功",
  data: { ... }
});
```

**现在：**

```javascript
res.status(200).json({
  success: true,
  message: "ok",  // 符合积分墙后端期望
  data: { ... }
});
```

### 变更 3: 数据查询

**之前：**

```javascript
const getBalanceSql = "SELECT coin_balance FROM t_user_coins WHERE user_id = ?";
```

**现在：**

```javascript
const getBalanceSql =
  "SELECT coin_balance, total_earned FROM t_user_coins WHERE user_id = ?";
```

### 变更 4: 返回数据

**之前：**

```javascript
data: {
  userId: normalizedUserId,
  orderId,
  coins,
  newBalance,
}
```

**现在：**

```javascript
data: {
  userId: normalizedUserId,
  orderId,
  taskId,
  coins: coinsNum,
  newBalance,
  totalEarned,
  completedCount,
  totalCount,
  processTime,
  timestamp: Date.now(),
}
```

## 🧪 测试方法

### 方法 1: 使用测试脚本

```bash
cd film_api
node test_callback_directly.js
```

这个脚本会：

1. ✅ 模拟积分墙后端调用回调接口
2. ✅ 验证响应格式是否正确
3. ✅ 测试幂等性（重复调用同一订单）
4. ✅ 显示详细的测试结果

### 方法 2: 使用 curl 命令

```bash
curl -X POST http://localhost:4000/api/task/callback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "55",
    "taskId": "14",
    "orderId": "ORD_TEST_123",
    "coins": 10,
    "totalCount": 2,
    "completedCount": 1,
    "timestamp": 1729757923456,
    "timezone": "Asia/Shanghai"
  }'
```

### 方法 3: 完整流程测试

```bash
# 在 server 目录运行
cd server
node test_callback_flow.js
```

这会测试完整的任务完成流程，包括回调调用。

## 📊 验证标准

### ✅ 成功标准

1. **响应状态码**: 200
2. **响应格式**: `{ success: true, message: "ok", data: {...} }`
3. **数据完整性**: data 包含所有必要字段
4. **日志清晰**: 每个步骤都有对应日志
5. **处理耗时**: 正常情况下 < 100ms
6. **幂等性**: 重复调用返回 duplicate: true

### ❌ 失败情况

1. 参数缺失或无效
2. 数据库连接失败
3. 事务提交失败
4. 订单 ID 已存在（幂等性处理）

## 🔍 故障排查

### 问题 1: 回调接口返回 success: false

**检查：**

1. 查看 film_api 控制台日志，确认错误原因
2. 检查数据库连接是否正常
3. 验证参数格式是否正确

### 问题 2: 金币未更新

**检查：**

```sql
-- 查询用户金币记录
SELECT * FROM t_user_coins WHERE user_id = 55;

-- 查询回调记录
SELECT * FROM task_callback_records WHERE user_id = 55 ORDER BY created_at DESC LIMIT 5;
```

### 问题 3: 响应格式不符合预期

**检查：**

1. 确认 film_api 使用的是最新代码
2. 查看响应数据中的 `message` 字段是否为 "ok"
3. 验证 `data` 对象是否包含所有字段

## 💡 与积分墙后端的配合

积分墙后端会：

1. ✅ 调用此回调接口
2. ✅ 检查 `response.status === 200`
3. ✅ 检查 `response.data.success === true`
4. ✅ 检查 `response.data.message` 是否为 "ok" 或包含"成功"
5. ✅ 如果以上条件满足，更新 `reward_callbacks` 表状态为 1（成功）
6. ✅ 然后返回任务列表给客户端前端
7. ❌ 如果回调失败，抛出异常，不返回任务列表

## 📝 数据库表检查

### task_callback_records 表

```sql
-- 查看最近的回调记录
SELECT
  order_id,
  user_id,
  task_id,
  reward_coins,
  completed_count,
  total_count,
  status,
  created_at
FROM task_callback_records
WHERE user_id = 55
ORDER BY created_at DESC
LIMIT 10;
```

### t_user_coins 表

```sql
-- 查看用户金币变化
SELECT
  user_id,
  coin_balance,
  total_earned,
  updated_at
FROM t_user_coins
WHERE user_id = 55;
```

## 🎯 总结

这次优化主要确保了：

1. ✅ 响应格式完全符合积分墙后端的期望
2. ✅ 参数验证更加严格
3. ✅ 日志输出更加详细和清晰
4. ✅ 返回数据更加完整（包含任务进度、累计收益等）
5. ✅ 错误处理更加健壮
6. ✅ 处理耗时可追踪

整个回调流程现在更加可靠和易于调试！🚀
