## film_api 任务回调接口说明

### 接口地址

```
POST http://localhost:4000/api/task/callback
```

### 请求参数

```json
{
  "userId": "55",
  "taskId": "1",
  "orderId": "ORD1729757923456ABC",
  "coins": 100,
  "totalCount": 10,
  "completedCount": 1,
  "timestamp": 1729757923456,
  "timezone": "Asia/Shanghai"
}
```

### 响应示例（成功）

```json
{
  "success": true,
  "message": "奖励发放成功",
  "data": {
    "userId": 55,
    "orderId": "ORD1729757923456ABC",
    "coins": 100,
    "newBalance": 1500
  }
}
```

### 响应示例（订单已处理）

```json
{
  "success": true,
  "message": "订单已处理",
  "data": {
    "userId": 55,
    "orderId": "ORD1729757923456ABC",
    "coins": 100,
    "duplicate": true
  }
}
```

### 功能说明

1. 接收来自积分墙服务端（server）的任务完成回调通知
2. 根据 `userId` 和 `coins` 更新用户金币
3. 记录回调日志到 `task_callback_records` 表
4. 支持防重复（根据 `orderId` 判断）
5. 如果用户金币记录不存在，自动创建

### 数据库操作

1. 更新 `t_user_coins` 表：

   - `coin_balance` += coins
   - `total_earned` += coins

2. 插入 `task_callback_records` 表：
   - order_id（唯一）
   - user_id
   - task_id
   - reward_coins
   - total_count
   - completed_count
   - callback_timestamp
   - timezone
   - status

### 测试方法

#### 方法 1: 使用 PowerShell (推荐)

```powershell
$body = @{
    userId = "55"
    taskId = "1"
    orderId = "ORD$(Get-Date -UFormat %s)TEST"
    coins = 100
    totalCount = 10
    completedCount = 1
    timestamp = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds)
    timezone = "Asia/Shanghai"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/task/callback" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content
```

#### 方法 2: 使用 curl

```bash
curl -X POST http://localhost:4000/api/task/callback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "55",
    "taskId": "1",
    "orderId": "ORD1729757923456TEST",
    "coins": 100,
    "totalCount": 10,
    "completedCount": 1,
    "timestamp": 1729757923456,
    "timezone": "Asia/Shanghai"
  }'
```

#### 方法 3: 使用 Node.js 测试脚本

```bash
# 确保 film_api 服务正在运行
cd C:\Users\Administrator\Desktop\积分墙项目\film_api
node test_callback_flow.js
```

### 启动服务

```powershell
cd C:\Users\Administrator\Desktop\积分墙项目\film_api
node app.js
```

服务将在 http://localhost:4000 启动
