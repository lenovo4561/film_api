/**
 * 测试 getUserCoins 接口
 * 诊断为什么前端没有获取到金币数据
 */

const conn = require('./db/db');

console.log('========== 测试 getUserCoins 接口 ==========\n');

// 测试用户 ID
const testUserId = 55;

console.log('【步骤1】检查 t_user_coins 表中的数据...');
conn.query('SELECT * FROM t_user_coins WHERE user_id = ?', [testUserId], (error, result) => {
  if (error) {
    console.error('❌ 查询失败:', error.message);
  } else {
    result = JSON.parse(JSON.stringify(result));
    if (result[0]) {
      console.log('✅ 找到金币记录:');
      console.log('   - user_id:', result[0].user_id);
      console.log('   - coin_balance:', result[0].coin_balance);
      console.log('   - total_earned:', result[0].total_earned);
      console.log('   - continuous_days:', result[0].continuous_days);
      console.log('   - last_checkin_date:', result[0].last_checkin_date);
      console.log('\n   完整数据:', result[0]);
    } else {
      console.log('❌ 未找到 user_id=' + testUserId + ' 的金币记录');
      console.log('   需要先签到或插入初始记录');
    }
  }
  
  console.log('\n【步骤2】模拟前端请求...');
  console.log('   请求: GET /api/getUserCoins?userId=' + testUserId);
  console.log('   携带: cookies (withCredentials: true)');
  
  console.log('\n【步骤3】后端验证逻辑...');
  console.log('   1. getCurrentUserId(req)');
  console.log('      - 从 session 获取 userId');
  console.log('      - 从 cookie 获取 userId');
  console.log('      - 从参数获取 userId (兜底)');
  console.log('   2. 查询 t_user_coins 表');
  console.log('   3. 返回 { success_code: 200, data: {...} }');
  
  console.log('\n【步骤4】前端处理逻辑...');
  console.log('   const res = await getUserCoins()');
  console.log('   if (res.success_code === 200 && res.data) {');
  console.log('     this.userCoins = res.data.coin_balance');
  console.log('   }');
  
  console.log('\n========== 可能的问题 ==========\n');
  
  console.log('问题1: localStorage 中没有 userId');
  console.log('   检查: localStorage.getItem("userId")');
  console.log('   解决: localStorage.setItem("userId", "55")');
  
  console.log('\n问题2: Cookie 中没有 user_id');
  console.log('   检查: document.cookie');
  console.log('   解决: 重新登录');
  
  console.log('\n问题3: Session 已过期');
  console.log('   检查: 后端日志是否显示 "用户未登录"');
  console.log('   解决: 重新登录');
  
  console.log('\n问题4: 数据库中没有金币记录');
  console.log('   检查: SELECT * FROM t_user_coins WHERE user_id = 55');
  console.log('   解决: 执行一次签到创建记录');
  
  console.log('\n问题5: 响应数据格式不匹配');
  console.log('   检查: Network 面板查看实际响应');
  console.log('   预期: { success_code: 200, data: { coin_balance: 100 } }');
  
  console.log('\n========== 快速测试步骤 ==========\n');
  
  console.log('【前端】打开浏览器 Console:');
  console.log('');
  console.log('// 1. 检查 userId');
  console.log('console.log("userId:", localStorage.getItem("userId"))');
  console.log('console.log("cookie:", document.cookie)');
  console.log('');
  console.log('// 2. 手动设置 userId (如果没有)');
  console.log('localStorage.setItem("userId", "55")');
  console.log('');
  console.log('// 3. 手动调用 API');
  console.log('getUserCoins().then(res => {');
  console.log('  console.log("响应数据:", res)');
  console.log('  if (res.data) {');
  console.log('    console.log("金币余额:", res.data.coin_balance)');
  console.log('  }');
  console.log('})');
  console.log('');
  console.log('// 4. 查看 Network 请求');
  console.log('// 打开 Network 面板，刷新页面');
  console.log('// 找到 getUserCoins 请求，查看:');
  console.log('//   - Request URL: 是否正确');
  console.log('//   - Request Headers: 是否有 Cookie');
  console.log('//   - Query String: userId 是否正确');
  console.log('//   - Response: 查看返回数据');
  
  conn.end();
});
