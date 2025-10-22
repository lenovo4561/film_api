-- 修复 t_user_coins 表的 user_id 字段类型
-- 从 INT 改为 VARCHAR(50) 以支持字符串类型的 userId

-- 1. 先删除外键约束（如果存在）
ALTER TABLE t_user_coins DROP FOREIGN KEY IF EXISTS fk_user_coins_user;
ALTER TABLE t_coin_records DROP FOREIGN KEY IF EXISTS fk_coin_records_user;

-- 2. 删除唯一索引
ALTER TABLE t_user_coins DROP INDEX IF EXISTS uk_user_id;

-- 3. 修改 t_user_coins 表的 user_id 字段类型
ALTER TABLE t_user_coins MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 4. 修改 t_coin_records 表的 user_id 字段类型
ALTER TABLE t_coin_records MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 5. 重新添加唯一索引
ALTER TABLE t_user_coins ADD UNIQUE KEY uk_user_id (user_id);

-- 6. 添加索引到 t_coin_records
ALTER TABLE t_coin_records ADD INDEX idx_user_id (user_id);

-- 7. 为测试用户插入初始金币记录
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days)
VALUES ('test_user_001', 0, 0, 0)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 查看修改后的表结构
DESCRIBE t_user_coins;
DESCRIBE t_coin_records;

-- 查看测试用户的金币信息
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';
