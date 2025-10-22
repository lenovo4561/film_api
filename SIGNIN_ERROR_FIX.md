# 签到功能"查询金币信息失败"问题解决方案

## 📋 问题描述

**错误信息：**
```json
{
  "error_code": 1,
  "message": "查询金币信息失败"
}
```

**出现场景：** 用户点击签到按钮，调用 `/api/userCheckin` 接口时

## 🔍 问题分析

### 根本原因
数据库表 `t_user_coins` 和 `t_coin_records` 的 `user_id` 字段被定义为 **INT 类型**，但前端传递的 userId 是 **字符串类型**（如 `'test_user_001'`）。

### 代码流程
```
前端 (points.js)
  ↓
coinService.interceptors.request 添加 userId
  ↓ 
发送: { userId: "test_user_001" }  // 字符串类型
  ↓
film_api (/api/userCheckin)
  ↓
执行SQL: SELECT * FROM t_user_coins WHERE user_id = ?
  ↓
❌ 查询失败：无法将字符串 'test_user_001' 与 INT 类型字段匹配
  ↓
返回: { error_code: 1, message: "查询金币信息失败" }
```

### 表结构问题
```sql
-- 当前错误的表结构
CREATE TABLE `t_user_coins` (
  `user_id` INT NOT NULL,  -- ❌ INT 类型
  ...
);

CREATE TABLE `t_coin_records` (
  `user_id` INT NOT NULL,  -- ❌ INT 类型
  ...
);
```

## ✅ 解决方案

### 方案：修改数据库表结构（推荐）

将 `user_id` 字段从 INT 改为 VARCHAR(50)，以支持字符串类型的用户ID。

## 🛠️ 修复步骤

### 方法 1: 使用 SQL 文件（推荐）

1. **找到修复文件**
   - 文件路径：`film_api/fix_user_id_type.sql`

2. **在 MySQL 中执行**
   
   **选项 A - 使用 MySQL 命令行：**
   ```bash
   # Windows PowerShell
   cd D:\Desktop\jifen\film_api
   mysql -u root -p film < fix_user_id_type.sql
   ```

   **选项 B - 使用 MySQL Workbench：**
   - 打开 MySQL Workbench
   - 连接到数据库
   - 打开 `fix_user_id_type.sql` 文件
   - 点击"执行"按钮（⚡ 图标）

   **选项 C - 使用 phpMyAdmin：**
   - 登录 phpMyAdmin
   - 选择 `film` 数据库
   - 点击"SQL"标签
   - 复制粘贴 `fix_user_id_type.sql` 的内容
   - 点击"执行"

### 方法 2: 手动执行 SQL 语句

如果上述方法不可用，可以在 MySQL 命令行或工具中逐条执行：

```sql
-- 1. 切换到 film 数据库
USE film;

-- 2. 临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 3. 删除唯一索引
ALTER TABLE t_user_coins DROP INDEX IF EXISTS uk_user_id;

-- 4. 修改 t_user_coins 的 user_id 字段类型
ALTER TABLE t_user_coins 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 5. 修改 t_coin_records 的 user_id 字段类型
ALTER TABLE t_coin_records 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 6. 重新添加唯一索引
ALTER TABLE t_user_coins ADD UNIQUE KEY uk_user_id (user_id);

-- 7. 为测试用户插入初始记录
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days)
VALUES ('test_user_001', 0, 0, 0)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 8. 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 9. 验证修复
DESCRIBE t_user_coins;
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';
```

## 🔍 验证修复

### 1. 检查表结构
```sql
DESCRIBE t_user_coins;
```

**预期结果：**
```
Field             Type         Null    Key     Default
user_id           varchar(50)  NO      UNI     NULL
coin_balance      int          NO              0
total_earned      int          NO              0
...
```

### 2. 检查测试用户数据
```sql
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';
```

**预期结果：**
应该返回一条记录，包含用户的金币信息。

### 3. 测试签到功能

**在浏览器中测试：**
1. 启动 film_api 服务：
   ```bash
   cd film_api
   npm start
   ```

2. 启动前端服务：
   ```bash
   cd film
   npm run dev
   ```

3. 访问 http://localhost:8080
4. 进入任务中心页面
5. 点击签到按钮

**预期结果：**
- 显示"签到成功！获得 20 金币"
- Network 面板显示 `success_code: 200`
- 数据库中金币余额增加

## 📊 修复前后对比

### 修复前
```sql
-- 表结构
user_id INT NOT NULL

-- 前端请求
{ userId: "test_user_001" }

-- SQL 查询
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001'
-- ❌ 失败：字符串无法匹配 INT 类型

-- 结果
{ error_code: 1, message: "查询金币信息失败" }
```

### 修复后
```sql
-- 表结构
user_id VARCHAR(50) NOT NULL

-- 前端请求
{ userId: "test_user_001" }

-- SQL 查询
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001'
-- ✅ 成功：字符串可以匹配 VARCHAR 类型

-- 结果
{ 
  success_code: 200, 
  data: { 
    reward_coins: 20, 
    continuous_days: 1 
  } 
}
```

## ⚠️ 注意事项

1. **备份数据库**
   在执行修复前，建议备份数据库：
   ```bash
   mysqldump -u root -p film > film_backup.sql
   ```

2. **停止服务**
   在执行数据库修改时，建议停止 film_api 服务。

3. **测试环境**
   建议先在测试环境中执行修复，确认无误后再在生产环境执行。

4. **外键约束**
   如果有外键约束指向 t_user 表，需要确保 t_user 表的 user_id 也是 VARCHAR 类型。

## 🐛 常见问题

### Q1: 执行 SQL 时报错 "Cannot drop index 'uk_user_id': needed in a foreign key constraint"

**解决：**
先删除外键约束：
```sql
ALTER TABLE t_user_coins DROP FOREIGN KEY fk_user_coins_user;
ALTER TABLE t_coin_records DROP FOREIGN KEY fk_coin_records_user;
```

### Q2: 修复后仍然报错"查询金币信息失败"

**检查：**
1. 确认表结构已经修改成功：`DESCRIBE t_user_coins;`
2. 确认测试用户记录存在：`SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';`
3. 检查 film_api 服务是否重启
4. 检查浏览器控制台的完整错误信息

### Q3: 提示"Table doesn't exist"

**解决：**
表可能未创建，先执行：
```bash
cd film_api
mysql -u root -p film < create_coin_tables.sql
```
然后再执行修复脚本。

### Q4: MySQL 认证错误 "ER_NOT_SUPPORTED_AUTH_MODE"

**解决：**
这是 MySQL 8.0 的认证插件问题，使用以下命令修复：
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
FLUSH PRIVILEGES;
```

## ✅ 测试清单

- [ ] 数据库连接正常
- [ ] SQL 修复脚本执行成功
- [ ] t_user_coins 表的 user_id 字段是 VARCHAR(50)
- [ ] t_coin_records 表的 user_id 字段是 VARCHAR(50)
- [ ] 测试用户记录存在
- [ ] film_api 服务启动正常
- [ ] 前端服务启动正常
- [ ] 签到功能正常（显示"签到成功！"）
- [ ] 金币余额正确增加
- [ ] 签到记录正确写入数据库

## 📞 如果问题仍未解决

请提供以下信息：
1. 数据库版本：`SELECT VERSION();`
2. 表结构：`DESCRIBE t_user_coins;`
3. 测试用户数据：`SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';`
4. 完整的错误日志
5. Network 面板的完整请求和响应
