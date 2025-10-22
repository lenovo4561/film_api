-- ============================================
-- 诊断脚本：检查签到功能相关的数据库状态
-- ============================================

USE film;

SELECT '=== 1. 检查 t_user_coins 表是否存在 ===' AS '';
SHOW TABLES LIKE 't_user_coins';

SELECT '=== 2. 检查 t_user_coins 表结构 ===' AS '';
DESCRIBE t_user_coins;

SELECT '=== 3. 检查 t_coin_records 表结构 ===' AS '';
DESCRIBE t_coin_records;

SELECT '=== 4. 检查测试用户是否存在 ===' AS '';
SELECT * FROM t_user_coins WHERE user_id = 'test_user_001';

SELECT '=== 5. 统计金币记录数量 ===' AS '';
SELECT COUNT(*) AS total_records FROM t_user_coins;

SELECT '=== 6. 检查最近的金币记录 ===' AS '';
SELECT * FROM t_coin_records 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '=== 7. 检查 user_id 字段类型 ===' AS '';
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  IS_NULLABLE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'film' 
  AND TABLE_NAME = 't_user_coins'
  AND COLUMN_NAME = 'user_id';

SELECT '=== 诊断完成 ===' AS '';
