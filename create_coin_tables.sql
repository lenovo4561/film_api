-- 创建用户金币表
CREATE TABLE IF NOT EXISTS `t_user_coins` (
  `coin_id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '金币记录ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `coin_balance` INT NOT NULL DEFAULT 0 COMMENT '金币余额',
  `total_earned` INT NOT NULL DEFAULT 0 COMMENT '累计获得金币',
  `last_checkin_date` DATE NULL COMMENT '最后签到日期',
  `continuous_days` INT NOT NULL DEFAULT 0 COMMENT '连续签到天数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`coin_id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_user_coins_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户金币表';

-- 创建金币记录表
CREATE TABLE IF NOT EXISTS `t_coin_records` (
  `record_id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `coin_change` INT NOT NULL COMMENT '金币变动数量（正数为增加，负数为减少）',
  `change_type` VARCHAR(50) NOT NULL COMMENT '变动类型：checkin-签到，reward-奖励，consume-消费',
  `change_reason` VARCHAR(200) NULL COMMENT '变动原因描述',
  `balance_after` INT NOT NULL COMMENT '变动后余额',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_coin_records_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金币变动记录表';

-- 为现有用户初始化金币数据
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days)
SELECT user_id, 0, 0, 0
FROM t_user
WHERE user_id NOT IN (SELECT user_id FROM t_user_coins);
