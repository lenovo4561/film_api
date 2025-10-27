-- 为 t_user_coins 表添加 last_total_balance 字段
-- last_total_balance: 上一次总余额（用于记录用户上一次的金币总余额）

USE db_film;

-- 添加字段
ALTER TABLE t_user_coins 
ADD COLUMN last_total_balance INT DEFAULT 0 COMMENT '上一次总余额' AFTER total_earned;

-- 查看表结构
DESC t_user_coins;

-- 验证字段添加成功
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'db_film' 
  AND TABLE_NAME = 't_user_coins'
ORDER BY ORDINAL_POSITION;
