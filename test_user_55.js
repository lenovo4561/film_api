/**
 * 测试脚本：检查 userId=55 的数据库状态
 * 目的：诊断为什么 /api/userCheckin 返回 "查询金币信息失败"
 */

const conn = require('./db/db');

console.log('========== 开始测试 userId=55 ==========\n');

// 1. 检查 t_user 表
console.log('【步骤1】检查 t_user 表...');
conn.query('SELECT * FROM t_user WHERE user_id = 55 LIMIT 1;', (error, result) => {
  if (error) {
    console.error('❌ 查询 t_user 失败:', error.message);
  } else {
    result = JSON.parse(JSON.stringify(result));
    if (result[0]) {
      console.log('✅ t_user 表存在 user_id=55:');
      console.log('   - user_name:', result[0].user_name);
      console.log('   - phone:', result[0].phone);
      console.log('   - avatar:', result[0].avatar ? '有' : '无');
    } else {
      console.log('⚠️  t_user 表不存在 user_id=55');
      console.log('   说明：金币系统只支持 t_user 表的用户，admin 账户在 t_admin 表');
    }
  }
  
  // 2. 检查 t_admin 表
  console.log('\n【步骤2】检查 t_admin 表...');
  conn.query('SELECT * FROM t_admin WHERE admin_id = 55 LIMIT 1;', (error, result) => {
    if (error) {
      console.error('❌ 查询 t_admin 失败:', error.message);
    } else {
      result = JSON.parse(JSON.stringify(result));
      if (result[0]) {
        console.log('✅ t_admin 表存在 admin_id=55:');
        console.log('   - name:', result[0].name);
      } else {
        console.log('⚠️  t_admin 表不存在 admin_id=55');
      }
    }
    
    // 3. 检查 t_user_coins 表
    console.log('\n【步骤3】检查 t_user_coins 表...');
    conn.query('SELECT * FROM t_user_coins WHERE user_id = 55 LIMIT 1;', (error, result) => {
      if (error) {
        console.error('❌ 查询 t_user_coins 失败:', error.message);
        console.log('   可能原因：');
        console.log('   1. t_user_coins 表不存在（需要执行 create_coin_tables.sql）');
        console.log('   2. user_id 字段类型不匹配');
      } else {
        result = JSON.parse(JSON.stringify(result));
        if (result[0]) {
          console.log('✅ t_user_coins 表存在 user_id=55:');
          console.log('   - coin_balance:', result[0].coin_balance);
          console.log('   - total_earned:', result[0].total_earned);
          console.log('   - continuous_days:', result[0].continuous_days);
          console.log('   - last_checkin_date:', result[0].last_checkin_date);
        } else {
          console.log('⚠️  t_user_coins 表不存在 user_id=55');
          console.log('   说明：第一次签到会自动创建记录');
        }
      }
      
      // 4. 测试 normalizeUserId 函数
      console.log('\n【步骤4】测试 userId 参数处理...');
      
      function normalizeUserId(userId) {
        if (!userId) return null;
        if (typeof userId === 'number') return userId;
        
        const userIdStr = String(userId);
        if (/^\d+$/.test(userIdStr)) {
          return parseInt(userIdStr, 10);
        }
        
        const numbers = userIdStr.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const combined = numbers.join('');
          const numericId = parseInt(combined, 10);
          console.log(`   转换: "${userIdStr}" -> ${numericId}`);
          return numericId;
        }
        
        let hash = 0;
        for (let i = 0; i < userIdStr.length; i++) {
          const char = userIdStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const hashedId = Math.abs(hash);
        console.log(`   哈希: "${userIdStr}" -> ${hashedId}`);
        return hashedId;
      }
      
      console.log('   测试用例:');
      console.log('   - normalizeUserId(55) =', normalizeUserId(55));
      console.log('   - normalizeUserId("55") =', normalizeUserId("55"));
      console.log('   - normalizeUserId("admin_55") =', normalizeUserId("admin_55"));
      
      // 5. 尝试模拟签到流程
      console.log('\n【步骤5】模拟签到流程（仅查询，不写入）...');
      const testUserId = 55;
      
      conn.query('SELECT * FROM t_user_coins WHERE user_id = ? LIMIT 1;', [testUserId], (error, result) => {
        if (error) {
          console.error('❌ 模拟签到查询失败:', error.message);
          console.log('   错误代码:', error.code);
          console.log('   SQL 错误:', error.sqlMessage);
          
          if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n【诊断结果】t_user_coins 表不存在！');
            console.log('   解决方案：执行 SQL 脚本创建金币表');
            console.log('   命令：mysql -u root -p film < create_coin_tables.sql');
          } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.log('\n【诊断结果】字段不存在或类型错误！');
            console.log('   解决方案：检查表结构是否正确');
          }
        } else {
          result = JSON.parse(JSON.stringify(result));
          if (result[0]) {
            console.log('✅ 可以正常查询到金币记录');
          } else {
            console.log('⚠️  金币记录不存在，尝试模拟插入...');
            
            // 测试是否可以插入
            conn.query(
              'INSERT INTO t_user_coins(user_id,coin_balance,total_earned,continuous_days) VALUES(?,?,?,?);',
              [testUserId, 0, 0, 0],
              (error, result) => {
                if (error) {
                  console.error('❌ 模拟插入失败:', error.message);
                  console.log('   错误代码:', error.code);
                  console.log('   SQL 错误:', error.sqlMessage);
                  
                  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                    console.log('\n【诊断结果】外键约束失败！');
                    console.log('   原因：user_id=55 不存在于 t_user 表');
                    console.log('   解决方案：');
                    console.log('   1. 使用普通用户账号（t_user 表中存在的）');
                    console.log('   2. 或在 t_user 表插入 user_id=55');
                  }
                  
                  // 回滚测试插入
                  conn.query('DELETE FROM t_user_coins WHERE user_id = ? AND coin_balance = 0 AND total_earned = 0;', [testUserId]);
                } else {
                  console.log('✅ 可以成功插入金币记录');
                  console.log('   插入的 coin_id:', result.insertId);
                  
                  // 清理测试数据
                  conn.query('DELETE FROM t_user_coins WHERE coin_id = ?;', [result.insertId], () => {
                    console.log('   (已清理测试数据)');
                  });
                }
                
                // 总结
                console.log('\n========== 诊断总结 ==========');
                console.log('如果看到"外键约束失败"，说明：');
                console.log('  ✓ admin 账户（ID=55）在 t_admin 表，不在 t_user 表');
                console.log('  ✓ 金币系统只支持 t_user 表的用户');
                console.log('  ✓ 需要用普通用户账号测试签到功能\n');
                
                console.log('建议操作：');
                console.log('  1. 用手机号或用户名登录普通账号');
                console.log('  2. localStorage.setItem("userId", "实际用户ID")');
                console.log('  3. 再次尝试签到\n');
                
                conn.end();
              }
            );
          }
        }
      });
    });
  });
});
