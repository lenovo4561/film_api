const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function exportDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "13249709366",
    database: "db_film",
  });

  try {
    console.log("正在导出数据库结构...");

    // 获取所有表名
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map((t) => Object.values(t)[0]);

    console.log("找到表:", tableNames.join(", "));

    let sqlContent = `-- MySQL dump for database: db_film
-- Generated on: ${new Date()
      .toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
      .replace(/\//g, "-")}
-- Host: localhost:3306

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

    // 为每个表生成DDL
    for (const tableName of tableNames) {
      console.log(`导出表: ${tableName}`);

      // 获取建表语句
      const [createTable] = await connection.query(
        `SHOW CREATE TABLE \`${tableName}\``
      );
      const createTableSql = createTable[0]["Create Table"];

      sqlContent += `-- ----------------------------
-- Table structure for ${tableName}
-- ----------------------------
DROP TABLE IF EXISTS \`${tableName}\`;
${createTableSql};

`;

      // 获取表数据
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);

      if (rows.length > 0) {
        sqlContent += `-- ----------------------------
-- Records of ${tableName}
-- ----------------------------
BEGIN;
`;

        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map((col) => {
            const val = row[col];
            if (val === null) return "NULL";
            if (typeof val === "string") {
              // 转义单引号
              return `'${val.replace(/'/g, "''")}'`;
            }
            if (val instanceof Date) {
              return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            }
            return val;
          });

          sqlContent += `INSERT INTO \`${tableName}\` (\`${columns.join(
            "`, `"
          )}\`) VALUES (${values.join(", ")});\n`;
        }

        sqlContent += `COMMIT;

`;
      }
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;
`;

    // 写入文件
    const outputPath = path.join(__dirname, "all_db_film.sql");
    fs.writeFileSync(outputPath, sqlContent, "utf8");

    console.log(`✅ 数据库导出完成!`);
    console.log(`📁 文件位置: ${outputPath}`);
    console.log(`📊 导出了 ${tableNames.length} 个表`);
  } catch (error) {
    console.error("❌ 导出失败:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

exportDatabase().catch(console.error);
