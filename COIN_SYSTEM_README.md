# 用户金币系统说明文档

## 系统概述
用户金币系统为影院管理系统新增了用户激励功能，用户可以通过每日签到获取金币奖励。系统支持连续签到奖励递增机制。

## 数据库表结构

### 1. t_user_coins（用户金币表）
存储用户的金币余额和签到信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| coin_id | INT | 主键ID |
| user_id | INT | 用户ID（外键关联t_user） |
| coin_balance | INT | 当前金币余额 |
| total_earned | INT | 累计获得金币 |
| last_checkin_date | DATE | 最后签到日期 |
| continuous_days | INT | 连续签到天数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. t_coin_records（金币变动记录表）
记录所有金币的增减记录

| 字段名 | 类型 | 说明 |
|--------|------|------|
| record_id | INT | 主键ID |
| user_id | INT | 用户ID（外键关联t_user） |
| coin_change | INT | 金币变动数量（正数增加，负数减少） |
| change_type | VARCHAR(50) | 变动类型：checkin-签到，reward-奖励，consume-消费 |
| change_reason | VARCHAR(200) | 变动原因描述 |
| balance_after | INT | 变动后的余额 |
| created_at | TIMESTAMP | 创建时间 |

## 部署步骤

### 1. 执行数据库脚本
```bash
# 在MySQL数据库中执行以下文件
mysql -u root -p db_film < create_coin_tables.sql
```

或者在MySQL客户端中：
```sql
USE db_film;
SOURCE create_coin_tables.sql;
```

### 2. 重启服务器
```bash
node app.js
```

## API接口文档

### 用户端接口

#### 1. 获取用户金币信息
- **接口地址**: `GET /api/getUserCoins`
- **请求参数**: 
  - `userId` (必填): 用户ID
- **返回示例**:
```json
{
  "success_code": 200,
  "data": {
    "coin_id": 1,
    "user_id": 1,
    "coin_balance": 120,
    "total_earned": 120,
    "continuous_days": 3,
    "last_checkin_date": "2025-10-19"
  }
}
```

#### 2. 用户签到领取金币
- **接口地址**: `POST /api/userCheckin`
- **请求参数**: 
  - `userId` (必填): 用户ID
- **签到奖励规则**:
  - 第1天: 20金币
  - 第2天: 20金币
  - 第3天: 30金币
  - 第4天: 40金币
  - 第5天: 50金币
  - 第6天及以上: 60金币
- **返回示例**:
```json
{
  "success_code": 200,
  "data": {
    "coin_balance": 140,
    "reward_coins": 20,
    "continuous_days": 4,
    "message": "签到成功！获得20金币"
  }
}
```

#### 3. 检查今天是否已签到
- **接口地址**: `GET /api/checkTodayCheckin`
- **请求参数**: 
  - `userId` (必填): 用户ID
- **返回示例**:
```json
{
  "success_code": 200,
  "checked": true
}
```

#### 4. 获取用户金币记录
- **接口地址**: `GET /api/getUserCoinRecords`
- **请求参数**: 
  - `userId` (必填): 用户ID
  - `limit` (可选): 返回记录数量，默认50
- **返回示例**:
```json
{
  "success_code": 200,
  "data": [
    {
      "record_id": 1,
      "user_id": 1,
      "coin_change": 20,
      "change_type": "checkin",
      "change_reason": "第1天签到奖励",
      "balance_after": 20,
      "created_at": "2025-10-19 10:30:00"
    }
  ]
}
```

### 管理员端接口

#### 1. 获取用户金币信息列表（分页）
- **接口地址**: `GET /api/admin/getCurrentPageUserCoins`
- **请求参数**: 
  - `currentPage` (必填): 当前页码
  - `pageSize` (必填): 每页条数
  - `input` (可选): 搜索关键词（用户名）
- **返回示例**:
```json
{
  "success_code": 200,
  "data": [
    {
      "user_id": 1,
      "user_name": "张三",
      "phone": "13800138000",
      "avatar": "/images/avatar/1.jpg",
      "coin_balance": 120,
      "total_earned": 120,
      "continuous_days": 3,
      "last_checkin_date": "2025-10-19"
    }
  ],
  "total": 100
}
```

#### 2. 管理员修改用户金币
- **接口地址**: `POST /api/admin/updateUserCoins`
- **请求参数**: 
  - `userId` (必填): 用户ID
  - `coinChange` (必填): 金币变动数量（正数增加，负数减少）
  - `changeReason` (可选): 变动原因
- **返回示例**:
```json
{
  "success_code": 200,
  "data": {
    "coin_balance": 150
  }
}
```

#### 3. 获取用户金币变动记录（分页）
- **接口地址**: `GET /api/admin/getUserCoinRecords`
- **请求参数**: 
  - `userId` (必填): 用户ID
  - `currentPage` (必填): 当前页码
  - `pageSize` (必填): 每页条数
- **返回示例**:
```json
{
  "success_code": 200,
  "data": [...],
  "total": 50
}
```

#### 4. 获取金币统计信息
- **接口地址**: `GET /api/admin/getCoinStatistics`
- **请求参数**: 无
- **返回示例**:
```json
{
  "success_code": 200,
  "data": {
    "total_earned": 5000,
    "user_count": 100,
    "total_balance": 3000,
    "today_checkin": 25
  }
}
```

## 业务逻辑说明

### 签到规则
1. 每天只能签到一次
2. 连续签到天数越多，奖励金币越多
3. 中断签到后，连续天数重置为1
4. 连续签到奖励阶梯：
   - 第1-2天：每天20金币
   - 第3天：30金币
   - 第4天：40金币
   - 第5天：50金币
   - 第6天及以上：每天60金币

### 金币记录
- 所有金币变动都会记录在`t_coin_records`表中
- 记录包含变动类型、变动原因、变动后余额等信息
- 方便追踪和审计

### 管理员功能
- 可以查看所有用户的金币信息
- 可以手动调整用户金币（增加或减少）
- 可以查看用户的金币变动历史
- 可以查看系统整体的金币统计信息

## 注意事项

1. 在创建新用户时，系统会自动为其创建金币记录（初始值为0）
2. 如果用户没有金币记录，第一次调用API时会自动创建
3. 金币余额不能为负数
4. 签到时间基于服务器时间，按日期判断
5. 连续签到的判断逻辑：如果昨天签到了就连续+1，否则重置为1

## 扩展建议

未来可以扩展的功能：
1. 金币商城：用户可以用金币兑换优惠券、电影票折扣等
2. 任务系统：完成特定任务（如观影、评论）可获得金币
3. 金币排行榜：展示金币最多的用户
4. 金币过期机制：设置金币有效期
5. 分享奖励：分享电影给好友可获得金币

## 测试建议

### 测试签到功能
```javascript
// 1. 测试首次签到
POST /api/userCheckin
{ "userId": 1 }

// 2. 测试重复签到（应该失败）
POST /api/userCheckin
{ "userId": 1 }

// 3. 查看金币余额
GET /api/getUserCoins?userId=1

// 4. 查看签到记录
GET /api/getUserCoinRecords?userId=1&limit=10
```

### 测试管理员功能
```javascript
// 1. 查看用户金币列表
GET /api/admin/getCurrentPageUserCoins?currentPage=1&pageSize=10&input=

// 2. 调整用户金币
POST /api/admin/updateUserCoins
{ "userId": 1, "coinChange": 100, "changeReason": "活动奖励" }

// 3. 查看统计信息
GET /api/admin/getCoinStatistics
```

## 常见问题

**Q: 如何修改签到奖励规则？**
A: 修改 `/api/userCheckin` 接口中的奖励金币计算逻辑即可。

**Q: 如何处理服务器时区问题？**
A: 建议在服务器上设置正确的时区，或在代码中明确指定时区。

**Q: 金币可以转让给其他用户吗？**
A: 当前版本不支持，如需此功能需要额外开发。

**Q: 如何防止作弊？**
A: 签到基于服务器时间，且每天只能签到一次。如需更强的防护，可以添加IP检测、设备指纹等机制。
