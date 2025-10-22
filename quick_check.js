// 快速诊断脚本
const conn = require('./db/db');

console.log('检查 userId=55 的状态...\n');

// 检查 t_user
conn.query('SELECT * FROM t_user WHERE user_id = 55', (err, result) => {
  console.log('1. t_user 表中 user_id=55:');
  if (err) {
    console.log('   ❌ 查询失败:', err.message);
  } else {
    result = JSON.parse(JSON.stringify(result));
    if (result.length > 0) {
      console.log('   ✅ 存在 -', result[0].user_name);
    } else {
      console.log('   ❌ 不存在');
    }
  }

  // 检查 t_user_coins
  conn.query('SELECT * FROM t_user_coins WHERE user_id = 55', (err, result) => {
    console.log('\n2. t_user_coins 表中 user_id=55:');
    if (err) {
      console.log('   ❌ 查询失败:', err.message);
      console.log('   错误码:', err.code);
    } else {
      result = JSON.parse(JSON.stringify(result));
      if (result.length > 0) {
        console.log('   ✅ 存在 - 余额:', result[0].coin_balance);
      } else {
        console.log('   ❌ 不存在');
      }
    }

    // 检查 t_admin
    conn.query('SELECT * FROM t_admin WHERE admin_id = 55', (err, result) => {
      console.log('\n3. t_admin 表中 admin_id=55:');
      if (err) {
        console.log('   ❌ 查询失败:', err.message);
      } else {
        result = JSON.parse(JSON.stringify(result));
        if (result.length > 0) {
          console.log('   ✅ 存在 -', result[0].name);
        } else {
          console.log('   ❌ 不存在');
        }
      }

      console.log('\n========== 诊断结论 ==========');
      console.log('如果只在 t_admin 表存在：');
      console.log('  → admin 账户无法使用金币系统');
      console.log('  → 需要使用普通用户账号（t_user 表）');
      console.log('\n建议：用手机号或用户名登录普通账号测试');
      
      conn.end();
    });
  });
});
