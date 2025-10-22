-- ============================================
-- 修复 t_user_coins 表的 user_id 字段类型
-- 兼容 MySQL 5.x 和 8.x
-- ============================================

USE film;

-- 临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 直接修改 t_user_coins 的 user_id 字段类型
ALTER TABLE t_user_coins 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 直接修改 t_coin_records 的 user_id 字段类型
ALTER TABLE t_coin_records 
MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 为测试用户插入初始金币记录
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days, last_checkin_date)
VALUES ('test_user_001', 0, 0, 0, NULL)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 验证结果
SELECT '✅ 修复完成！' AS Status;
DESCRIBE t_user_coins;
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';
