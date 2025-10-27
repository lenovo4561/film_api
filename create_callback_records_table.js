// 创建任务回调记录表
const mysql = require("mysql2/promise");

async function createCallbackRecordsTable() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "13249709366",
    database: "jifen",
  });

  try {
    console.log("开始创建 task_callback_records 表...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS task_callback_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        order_id VARCHAR(50) NOT NULL UNIQUE COMMENT '订单ID（唯一标识）',
        user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
        task_id INT UNSIGNED COMMENT '任务ID',
        reward_coins INT NOT NULL DEFAULT 0 COMMENT '奖励金币数',
        total_count INT NOT NULL DEFAULT 0 COMMENT '任务总次数',
        completed_count INT NOT NULL DEFAULT 0 COMMENT '已完成次数',
        callback_timestamp BIGINT NOT NULL DEFAULT 0 COMMENT '回调时间戳(毫秒)',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Shanghai' COMMENT '时区',
        status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '处理状态：pending-待处理 success-成功 failed-失败',
        error_message TEXT COMMENT '错误信息',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_task_id (task_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务回调记录表'
    `);

    console.log("✅ task_callback_records 表创建成功！");

    // 查询表结构
    const [structure] = await connection.query(
      "DESCRIBE task_callback_records"
    );
    console.log("\n表结构：");
    console.table(structure);
  } catch (error) {
    console.error("❌ 操作失败:", error.message);
  } finally {
    await connection.end();
  }
}

createCallbackRecordsTable();
