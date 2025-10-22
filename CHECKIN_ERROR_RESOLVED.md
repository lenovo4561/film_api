# 🔧 签到接口报错 "查询金币信息失败" 问题解决

## 问题描述

**报错信息：**
```json
{
  "error_code": 1,
  "message": "查询金币信息失败"
}
```

**用户情况：**
- 账户：admin（ID=55）
- 接口：`POST /api/userCheckin`

---

## 问题原因

### ❌ 根本原因：金币系统表不存在

执行诊断脚本发现：
```
❌ t_user_coins 表不存在
错误码: ER_NO_SUCH_TABLE
```

### ❌ 次要原因：字段类型不匹配

初次创建表时失败：
```
❌ 创建失败: Referencing column 'user_id' and referenced column 
'user_id' in foreign key constraint 'fk_user_coins_user' are incompatible.
```

**原因分析：**
- `t_user.user_id` 是 `INT UNSIGNED`（无符号整型）
- 创建的 `t_user_coins.user_id` 是 `INT`（有符号整型）
- MySQL 外键约束要求类型**完全一致**

---

## 解决步骤

### 1️⃣ 诊断问题

```bash
cd film_api
node quick_check.js
```

**输出：**
```
1. t_user 表中 user_id=55:
   ✅ 存在 - admin

2. t_user_coins 表中 user_id=55:
   ❌ 查询失败: Table 'db_film.t_user_coins' doesn't exist
```

### 2️⃣ 修复字段类型

修改 `init_coin_tables.js`，将 `INT` 改为 `INT UNSIGNED`：

```javascript
CREATE TABLE IF NOT EXISTS t_user_coins (
  coin_id INT UNSIGNED NOT NULL AUTO_INCREMENT,    -- ✅ 改为 UNSIGNED
  user_id INT UNSIGNED NOT NULL,                   -- ✅ 改为 UNSIGNED
  ...
)

CREATE TABLE IF NOT EXISTS t_coin_records (
  record_id INT UNSIGNED NOT NULL AUTO_INCREMENT,  -- ✅ 改为 UNSIGNED
  user_id INT UNSIGNED NOT NULL,                   -- ✅ 改为 UNSIGNED
  ...
)
```

### 3️⃣ 执行创建脚本

```bash
cd film_api
node init_coin_tables.js
```

**输出：**
```
✅ t_user_coins 表创建成功
✅ t_coin_records 表创建成功
✅ 为 19 个用户初始化金币
```

### 4️⃣ 验证结果

```bash
node quick_check.js
```

**输出：**
```
1. t_user 表中 user_id=55:
   ✅ 存在 - admin

2. t_user_coins 表中 user_id=55:
   ✅ 存在 - 余额: 0
```

---

## 数据库表结构

### t_user_coins（用户金币表）

| 字段 | 类型 | 说明 |
|------|------|------|
| coin_id | INT UNSIGNED | 主键，自增 |
| user_id | INT UNSIGNED | 外键 → t_user.user_id |
| coin_balance | INT | 金币余额 |
| total_earned | INT | 累计获得金币 |
| last_checkin_date | DATE | 最后签到日期 |
| continuous_days | INT | 连续签到天数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### t_coin_records（金币记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | INT UNSIGNED | 主键，自增 |
| user_id | INT UNSIGNED | 外键 → t_user.user_id |
| coin_change | INT | 金币变动（+增加 -减少）|
| change_type | VARCHAR(50) | 类型（checkin/reward/consume）|
| change_reason | VARCHAR(200) | 变动原因 |
| balance_after | INT | 变动后余额 |
| created_at | TIMESTAMP | 创建时间 |

---

## 测试验证

### 1. 检查表是否存在

```javascript
// 运行 quick_check.js
node quick_check.js
```

### 2. 测试签到接口

**前端测试：**
```javascript
// 确保 localStorage 有正确的 userId
localStorage.setItem('userId', '55')

// 调用签到
doSignin().then(res => {
  console.log('签到成功:', res)
})
```

**预期响应：**
```json
{
  "success_code": 200,
  "data": {
    "coin_balance": 20,
    "reward_coins": 20,
    "continuous_days": 1,
    "message": "签到成功！获得20金币"
  }
}
```

### 3. 查看金币余额

```javascript
getUserCoins().then(res => {
  console.log('当前金币:', res.data.coin_balance)
})
```

---

## 关键知识点

### ✅ MySQL 外键约束规则

1. **类型必须完全一致**
   - `INT` ≠ `INT UNSIGNED`
   - `VARCHAR(20)` ≠ `VARCHAR(50)`

2. **字符集和排序规则也要匹配**
   - `utf8` ≠ `utf8mb4`
   - `utf8mb4_general_ci` ≠ `utf8mb4_unicode_ci`

3. **索引要求**
   - 被引用的字段必须有索引（PRIMARY KEY 或 UNIQUE KEY）

### ✅ 双重验证机制

后端 `getCurrentUserId()` 函数：
```javascript
1. 优先从 session 获取 userId ✅（服务端验证）
2. 其次从 cookie 获取 userId ✅（服务端验证）
3. 比对前端传入的 userId（仅作校验）
4. 如果不一致，使用服务端值并记录警告
5. 如果服务端无，兜底使用前端值（仅开发环境）
```

---

## 相关文件

### 已创建/修改的文件

- ✅ `film_api/init_coin_tables.js` - 创建表脚本（已修复类型）
- ✅ `film_api/create_coin_tables.sql` - SQL 文件（已修复类型）
- ✅ `film_api/quick_check.js` - 快速诊断脚本
- ✅ `film_api/check_table_structure.js` - 查看表结构脚本

### 核心业务文件

- `film_api/routes/index.js` - 金币系统 API
- `film/src/api/points.js` - 前端签到 API
- `film/src/api/offerwall.js` - 前端金币查询 API

---

## 下一步

### 1. 测试签到功能

```bash
# 1. 确保 film_api 服务运行
cd film_api
npm start

# 2. 打开前端页面
# 进入任务中心 > 点击签到

# 3. 查看后端日志
```

### 2. 监控日志

**正常日志：**
```
[用户身份] 从 session 获取: 55
[签到] 当前用户: 55
[签到] 计算完成: { continuousDays: 1, rewardCoins: 20, ... }
[签到] 更新金币成功
[签到] 记录金币变动成功
[签到] 完成! 奖励: 20 金币
```

### 3. 如果仍有问题

检查清单：
- [ ] `t_user_coins` 表存在
- [ ] `t_coin_records` 表存在
- [ ] userId=55 在 `t_user` 表存在
- [ ] userId=55 在 `t_user_coins` 表有记录
- [ ] localStorage 有正确的 userId
- [ ] 请求携带 cookies（withCredentials: true）
- [ ] 后端日志无报错

---

## 总结

✅ **问题已解决！**

**根本原因：**
- 金币系统表不存在
- 字段类型不匹配（INT vs INT UNSIGNED）

**解决方案：**
- 创建 `t_user_coins` 和 `t_coin_records` 表
- 使用 `INT UNSIGNED` 匹配 `t_user.user_id` 的类型
- 为所有现有用户初始化金币记录（19个用户）

**现在可以正常使用签到功能了！** 🎉
