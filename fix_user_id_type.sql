-- ============================================
-- 修复用户金币表的 user_id 字段类型问题
-- ============================================
-- 问题：user_id 字段是 INT 类型，但前端传递的是字符串 'test_user_001'
-- 解决：将 user_id 改为 VARCHAR(50) 类型
-- ============================================

USE film;

-- 步骤 1: 删除外键约束（如果存在）
SET FOREIGN_KEY_CHECKS = 0;

-- 步骤 2: 删除唯一索引（如果存在）
ALTER TABLE t_user_coins DROP INDEX IF EXISTS uk_user_id;

-- 步骤 3: 修改 t_user_coins 的 user_id 字段类型为 VARCHAR
ALTER TABLE t_user_coins 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 步骤 4: 修改 t_coin_records 的 user_id 字段类型为 VARCHAR
ALTER TABLE t_coin_records 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 步骤 5: 重新添加唯一索引
ALTER TABLE t_user_coins 
ADD UNIQUE KEY uk_user_id (user_id);

-- 步骤 6: 确保索引存在
ALTER TABLE t_coin_records 
ADD INDEX IF NOT EXISTS idx_user_id (user_id);

-- 步骤 7: 为测试用户插入初始金币记录
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days, last_checkin_date)
VALUES ('test_user_001', 0, 0, 0, NULL)
ON DUPLICATE KEY UPDATE 
  coin_balance = coin_balance,
  total_earned = total_earned;

-- 步骤 8: 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 验证修复结果
-- ============================================

-- 查看 t_user_coins 表结构
DESCRIBE t_user_coins;

-- 查看 t_coin_records 表结构  
DESCRIBE t_coin_records;

-- 查看测试用户的金币信息
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';

-- 显示成功信息
SELECT '✅ 修复完成！user_id 字段已改为 VARCHAR(50) 类型' AS Status;
