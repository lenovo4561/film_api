/**
 * 为 t_user_coins 表添加 last_total_balance 字段
 * last_total_balance: 上一次总余额
 */

const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "13249709366",
  database: "db_film",
};

async function addLastTotalBalanceField() {
  let connection;

  try {
    console.log("=".repeat(80));
    console.log("为 t_user_coins 表添加 last_total_balance 字段");
    console.log("=".repeat(80));
    console.log("");

    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ 数据库连接成功");
    console.log("");

    // 1. 检查字段是否已存在
    console.log("步骤 1: 检查字段是否已存在...");
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 't_user_coins' 
         AND COLUMN_NAME = 'last_total_balance'`,
      ["db_film"]
    );

    if (columns.length > 0) {
      console.log("⚠️  字段 last_total_balance 已存在，无需添加");
      console.log("");

      // 显示当前表结构
      const [tableStructure] = await connection.query("DESC t_user_coins");
      console.log("当前表结构:");
      console.table(tableStructure);
      return;
    }

    console.log("✅ 字段不存在，准备添加...");
    console.log("");

    // 2. 添加字段
    console.log("步骤 2: 添加 last_total_balance 字段...");
    await connection.query(
      `ALTER TABLE t_user_coins 
       ADD COLUMN last_total_balance INT DEFAULT 0 COMMENT '上一次总余额' AFTER total_earned`
    );
    console.log("✅ 字段添加成功");
    console.log("");

    // 3. 查看更新后的表结构
    console.log("步骤 3: 查看更新后的表结构...");
    const [tableStructure] = await connection.query("DESC t_user_coins");
    console.log("");
    console.table(tableStructure);
    console.log("");

    // 4. 查看字段详细信息
    console.log("步骤 4: 查看字段详细信息...");
    const [fieldInfo] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_COMMENT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'db_film' 
         AND TABLE_NAME = 't_user_coins'
         AND COLUMN_NAME = 'last_total_balance'`
    );
    console.log("");
    console.table(fieldInfo);
    console.log("");

    // 5. 查询现有数据
    console.log("步骤 5: 查询现有数据（前5条）...");
    const [users] = await connection.query(
      `SELECT user_id, coin_balance, total_earned, last_total_balance, updated_at 
       FROM t_user_coins 
       ORDER BY updated_at DESC 
       LIMIT 5`
    );

    if (users.length > 0) {
      console.log("");
      console.table(users);
      console.log("");
      console.log(
        "✅ 所有现有记录的 last_total_balance 字段已自动设置为默认值 0"
      );
    } else {
      console.log("⚠️  表中暂无数据");
    }
    console.log("");

    // 6. 总结
    console.log("=".repeat(80));
    console.log("字段添加完成！");
    console.log("=".repeat(80));
    console.log("");
    console.log("✅ 新增字段信息:");
    console.log("   - 字段名: last_total_balance");
    console.log("   - 数据类型: INT");
    console.log("   - 默认值: 0");
    console.log("   - 是否允许NULL: NO");
    console.log("   - 注释: 上一次总余额");
    console.log("   - 位置: total_earned 字段之后");
    console.log("");
    console.log("💡 使用建议:");
    console.log(
      "   1. 在更新 coin_balance 或 total_earned 之前，先保存当前值到 last_total_balance"
    );
    console.log("   2. 可用于对比金币变化、追踪用户余额历史等");
    console.log("   3. 示例:");
    console.log("      UPDATE t_user_coins");
    console.log("      SET last_total_balance = coin_balance,  -- 保存旧值");
    console.log("          coin_balance = coin_balance + 10    -- 更新新值");
    console.log("      WHERE user_id = ?");
    console.log("");
  } catch (error) {
    console.error("❌ 操作失败:", error.message);
    console.error("错误详情:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("✅ 数据库连接已关闭");
    }
  }
}

// 运行脚本
addLastTotalBalanceField().catch(console.error);
