const mysql = require("mysql2/promise");

async function verifyDatabases() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "13249709366",
  });

  console.log("========================================");
  console.log("验证数据库创建结果");
  console.log("========================================\n");

  try {
    // 检查 db_film 数据库
    console.log("1. db_film 数据库:");
    const [tables1] = await connection.query("SHOW TABLES FROM db_film");
    console.log(`   共 ${tables1.length} 个表`);
    tables1.forEach((row, index) => {
      console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
    });

    // 检查 jifen 数据库
    console.log("\n2. jifen 数据库:");
    const [tables2] = await connection.query("SHOW TABLES FROM jifen");
    console.log(`   共 ${tables2.length} 个表/视图`);
    tables2.forEach((row, index) => {
      console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
    });

    console.log("\n========================================");
    console.log("✓ 所有数据库验证成功！");
    console.log("========================================");
  } catch (error) {
    console.error("验证失败:", error.message);
  } finally {
    await connection.end();
  }
}

verifyDatabases();
