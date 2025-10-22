/**
 * 修复用户金币表的数据类型问题
 * 将 user_id 从 INT 改为 VARCHAR(50)
 */

const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// 创建数据库连接
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'film',
  multipleStatements: true
});

console.log('🔧 开始修复用户金币表结构...\n');

conn.connect((err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  
  console.log('✅ 数据库连接成功');
  
  // 执行修复步骤
  fixTables();
});

function fixTables() {
  console.log('\n📋 执行修复步骤...\n');
  
  const steps = [
    {
      name: '1. 删除外键约束',
      sql: `
        ALTER TABLE t_coin_records DROP FOREIGN KEY IF EXISTS fk_coin_records_user;
      `
    },
    {
      name: '2. 删除唯一索引',
      sql: `ALTER TABLE t_user_coins DROP INDEX IF EXISTS uk_user_id;`
    },
    {
      name: '3. 修改 t_user_coins 的 user_id 字段类型',
      sql: `ALTER TABLE t_user_coins MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';`
    },
    {
      name: '4. 修改 t_coin_records 的 user_id 字段类型',
      sql: `ALTER TABLE t_coin_records MODIFY COLUMN user_id VARCHAR(50) NOT NULL COMMENT '用户ID';`
    },
    {
      name: '5. 重新添加唯一索引',
      sql: `ALTER TABLE t_user_coins ADD UNIQUE KEY uk_user_id (user_id);`
    },
    {
      name: '6. 为测试用户插入初始记录',
      sql: `
        INSERT INTO t_user_coins (user_id, coin_balance, total_earned, continuous_days)
        VALUES ('test_user_001', 0, 0, 0)
        ON DUPLICATE KEY UPDATE user_id = user_id;
      `
    }
  ];
  
  executeStep(0, steps);
}

function executeStep(index, steps) {
  if (index >= steps.length) {
    // 所有步骤完成，验证结果
    verifyFix();
    return;
  }
  
  const step = steps[index];
  console.log(`⏳ ${step.name}`);
  
  conn.query(step.sql, (err, result) => {
    if (err) {
      // 某些错误可以忽略（如索引不存在）
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || 
          err.code === 'ER_CANT_DROP_KEY') {
        console.log(`   ⚠️  ${step.name} - 跳过（${err.message}）`);
      } else {
        console.error(`   ❌ ${step.name} 失败:`, err.message);
        conn.end();
        process.exit(1);
      }
    } else {
      console.log(`   ✅ ${step.name} 完成`);
    }
    
    // 执行下一步
    executeStep(index + 1, steps);
  });
}

function verifyFix() {
  console.log('\n🔍 验证修复结果...\n');
  
  // 检查表结构
  conn.query('DESCRIBE t_user_coins', (err, result) => {
    if (err) {
      console.error('❌ 查询表结构失败:', err.message);
      conn.end();
      process.exit(1);
    }
    
    console.log('📊 t_user_coins 表结构:');
    const userIdField = result.find(field => field.Field === 'user_id');
    if (userIdField) {
      console.log(`   user_id: ${userIdField.Type} ${userIdField.Null} ${userIdField.Key}`);
      
      if (userIdField.Type.includes('varchar')) {
        console.log('   ✅ user_id 字段类型正确 (VARCHAR)');
      } else {
        console.log('   ❌ user_id 字段类型错误:', userIdField.Type);
      }
    }
    
    // 检查测试用户数据
    conn.query("SELECT * FROM t_user_coins WHERE user_id = 'test_user_001'", (err, result) => {
      if (err) {
        console.error('❌ 查询测试用户失败:', err.message);
      } else if (result.length > 0) {
        console.log('\n✅ 测试用户数据:');
        console.log(result[0]);
      } else {
        console.log('\n⚠️  未找到测试用户数据');
      }
      
      conn.end();
      console.log('\n🎉 修复完成！');
    });
  });
}
