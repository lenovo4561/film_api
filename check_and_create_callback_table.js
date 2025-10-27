const mysql = require("mysql2");

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "13249709366",
  database: "db_film",
});

conn.connect((err) => {
  if (err) {
    console.error("❌ 数据库连接失败:", err.message);
    process.exit(1);
  }
  console.log("✅ 数据库连接成功 (db_film)\n");

  // 1. 检查 task_callback_records 表是否存在
  conn.query('SHOW TABLES LIKE "task_callback_records"', (err, result) => {
    if (err) {
      console.error("❌ 查询表失败:", err);
      conn.end();
      process.exit(1);
    }

    console.log("========== 检查表是否存在 ==========\n");

    if (result.length > 0) {
      console.log("✅ task_callback_records 表已存在\n");

      // 查看表结构
      conn.query("DESCRIBE task_callback_records", (err, columns) => {
        if (err) {
          console.error("❌ 查询表结构失败:", err);
        } else {
          console.log("表结构:");
          console.table(columns);
        }
        conn.end();
      });
    } else {
      console.log("❌ task_callback_records 表不存在，正在创建...\n");

      // 创建表
      const createTableSql = `
        CREATE TABLE task_callback_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id VARCHAR(100) NOT NULL UNIQUE,
          user_id INT NOT NULL,
          task_id INT DEFAULT NULL,
          reward_coins INT NOT NULL,
          total_count INT DEFAULT 0,
          completed_count INT DEFAULT 0,
          callback_timestamp BIGINT DEFAULT NULL,
          timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
          status VARCHAR(20) DEFAULT 'success',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_order_id (order_id),
          INDEX idx_task_id (task_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务回调记录表';
      `;

      conn.query(createTableSql, (err) => {
        if (err) {
          console.error("❌ 创建表失败:", err);
          conn.end();
          process.exit(1);
        }

        console.log("✅ task_callback_records 表创建成功！\n");

        // 验证表已创建
        conn.query("DESCRIBE task_callback_records", (err, columns) => {
          if (err) {
            console.error("❌ 验证表失败:", err);
          } else {
            console.log("新表结构:");
            console.table(columns);
          }
          conn.end();
        });
      });
    }
  });
});
