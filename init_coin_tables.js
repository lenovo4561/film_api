const conn = require('./db/db');

console.log('开始创建金币系统表...\n');

// SQL 1: 创建用户金币表
const createUserCoinsTable = `
CREATE TABLE IF NOT EXISTS t_user_coins (
  coin_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  coin_balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  last_checkin_date DATE NULL,
  continuous_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (coin_id),
  UNIQUE KEY uk_user_id (user_id),
  CONSTRAINT fk_user_coins_user FOREIGN KEY (user_id) REFERENCES t_user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

// SQL 2: 创建金币记录表
const createCoinRecordsTable = `
CREATE TABLE IF NOT EXISTS t_coin_records (
  record_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  coin_change INT NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  change_reason VARCHAR(200) NULL,
  balance_after INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at),
  CONSTRAINT fk_coin_records_user FOREIGN KEY (user_id) REFERENCES t_user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

// SQL 3: 为现有用户初始化金币
const initUserCoins = `
INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days)
SELECT user_id, 0, 0, 0
FROM t_user
WHERE user_id NOT IN (SELECT user_id FROM t_user_coins)
`;

// 执行 SQL
conn.query(createUserCoinsTable, (err) => {
  if (err) {
    console.log('❌ 创建 t_user_coins 表失败:', err.message);
  } else {
    console.log('✅ t_user_coins 表创建成功');
  }

  conn.query(createCoinRecordsTable, (err) => {
    if (err) {
      console.log('❌ 创建 t_coin_records 表失败:', err.message);
    } else {
      console.log('✅ t_coin_records 表创建成功');
    }

    conn.query(initUserCoins, (err, result) => {
      if (err) {
        console.log('❌ 初始化用户金币失败:', err.message);
      } else {
        console.log(`✅ 为 ${result.affectedRows} 个用户初始化金币`);
      }

      console.log('\n数据库表创建完成！现在可以测试签到功能了。');
      conn.end();
    });
  });
});
