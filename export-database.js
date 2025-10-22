const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '13249709366',
  database: 'db_film'
};

// 输出文件路径
const outputFile = path.join(__dirname, 'all_db_film.sql');

async function exportDatabase() {
  let connection;
  let sqlContent = '';

  try {
    console.log('🔗 正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 写入文件头
    sqlContent += `-- MySQL dump for database: ${dbConfig.database}\n`;
    sqlContent += `-- Generated on: ${new Date().toLocaleString()}\n`;
    sqlContent += `-- Host: ${dbConfig.host}:${dbConfig.port}\n\n`;
    sqlContent += `SET NAMES utf8mb4;\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 获取所有表
    console.log('📋 正在获取表列表...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(`✅ 找到 ${tableNames.length} 个表: ${tableNames.join(', ')}`);

    // 导出每个表
    for (const tableName of tableNames) {
      console.log(`\n📦 正在导出表: ${tableName}`);
      
      // 获取表结构
      const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSQL = createTableResult[0]['Create Table'];
      
      sqlContent += `-- ----------------------------\n`;
      sqlContent += `-- Table structure for ${tableName}\n`;
      sqlContent += `-- ----------------------------\n`;
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTableSQL};\n\n`;

      // 获取表数据
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlContent += `-- ----------------------------\n`;
        sqlContent += `-- Records of ${tableName}\n`;
        sqlContent += `-- ----------------------------\n`;
        sqlContent += `BEGIN;\n`;
        
        // 获取列名
        const columns = Object.keys(rows[0]);
        const columnList = columns.map(col => `\`${col}\``).join(', ');
        
        // 生成 INSERT 语句
        for (const row of rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) {
              return 'NULL';
            } else if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
            } else if (value instanceof Date) {
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            } else if (typeof value === 'boolean') {
              return value ? '1' : '0';
            } else if (Buffer.isBuffer(value)) {
              return `0x${value.toString('hex')}`;
            } else {
              return value;
            }
          }).join(', ');
          
          sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`;
        }
        
        sqlContent += `COMMIT;\n\n`;
        console.log(`  ✅ 导出 ${rows.length} 条数据`);
      } else {
        console.log(`  ℹ️  表为空，跳过数据导出`);
      }
    }

    // 恢复设置
    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // 写入文件
    console.log(`\n💾 正在写入文件: ${outputFile}`);
    fs.writeFileSync(outputFile, sqlContent, 'utf8');
    
    console.log('\n🎉 数据库导出成功！');
    console.log(`📄 文件路径: ${outputFile}`);
    console.log(`📊 文件大小: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('\n❌ 导出失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行导出
exportDatabase();
