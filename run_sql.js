const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// 数据库配置
const config = {
  host: 'localhost',
  user: 'root',
  password: '13249709366',
  multipleStatements: true  // 允许执行多条 SQL 语句
};

// 要执行的 SQL 文件
const sqlFiles = [
  {
    path: path.join(__dirname, '..', 'film_api', 'all_db_film.sql'),
    database: 'db_film',
    name: 'db_film 数据库'
  },
  {
    path: path.join(__dirname, '..', 'server', 'all_db_film.sql'),
    database: 'jifen',
    name: 'jifen 数据库'
  }
];

async function executeSqlFile(sqlFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n开始执行: ${sqlFile.name}`);
    console.log(`SQL 文件: ${sqlFile.path}`);
    
    // 读取 SQL 文件
    if (!fs.existsSync(sqlFile.path)) {
      console.error(`文件不存在: ${sqlFile.path}`);
      return reject(new Error(`文件不存在: ${sqlFile.path}`));
    }
    
    const sql = fs.readFileSync(sqlFile.path, 'utf8');
    console.log(`SQL 文件大小: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // 创建连接
    const connection = mysql.createConnection(config);
    
    connection.connect((err) => {
      if (err) {
        console.error(`数据库连接失败:`, err.message);
        return reject(err);
      }
      console.log('数据库连接成功');
      
      // 首先尝试创建数据库（如果不存在）
      const createDbSql = `CREATE DATABASE IF NOT EXISTS \`${sqlFile.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
      
      connection.query(createDbSql, (err) => {
        if (err) {
          console.error(`创建数据库失败:`, err.message);
          connection.end();
          return reject(err);
        }
        
        console.log(`数据库 ${sqlFile.database} 已准备就绪`);
        
        // 选择数据库
        connection.query(`USE \`${sqlFile.database}\``, (err) => {
          if (err) {
            console.error(`选择数据库失败:`, err.message);
            connection.end();
            return reject(err);
          }
          
          // 执行 SQL 文件
          console.log(`开始执行 SQL 语句...`);
          connection.query(sql, (err, results) => {
            if (err) {
              console.error(`执行 SQL 失败:`, err.message);
              console.error(`错误详情:`, err);
              connection.end();
              return reject(err);
            }
            
            console.log(`✓ ${sqlFile.name} 创建完成!`);
            if (Array.isArray(results)) {
              console.log(`  执行了 ${results.length} 条 SQL 语句`);
            }
            
            connection.end();
            resolve();
          });
        });
      });
    });
  });
}

async function main() {
  console.log('========================================');
  console.log('开始创建数据库和表');
  console.log('========================================');
  
  for (const sqlFile of sqlFiles) {
    try {
      await executeSqlFile(sqlFile);
    } catch (error) {
      console.error(`\n执行失败: ${sqlFile.name}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n========================================');
  console.log('所有数据库和表创建完成！');
  console.log('========================================');
  console.log('\n创建的数据库:');
  console.log('  1. db_film - 电影系统数据库');
  console.log('  2. jifen - 积分墙系统数据库');
}

main().catch(error => {
  console.error('执行过程中出现错误:', error);
  process.exit(1);
});
