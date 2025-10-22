/**
 * 测试签到状态检查接口
 * 用于验证 /api/checkSigninStatus 接口是否正常工作
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 4000;

// 测试用户ID（admin账户）
const TEST_USER_ID = 55;

async function testCheckSigninStatus() {
  console.log('\n========== 测试签到状态检查接口 ==========\n');
  
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📝 请求参数:');
    console.log('  URL:', `http://${BASE_URL}:${PORT}/api/checkSigninStatus`);
    console.log('  UserId:', TEST_USER_ID);
    console.log('  Date:', today);
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api/checkSigninStatus?userId=${TEST_USER_ID}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          
          console.log('\n✅ 响应成功:');
          console.log('  状态码:', res.statusCode);
          console.log('  响应数据:', JSON.stringify(responseData, null, 2));
          
          const { success_code, checked, data: responseInfo } = responseData;
          
          console.log('\n📊 解析结果:');
          console.log('  Success Code:', success_code);
          console.log('  今日已签到:', checked ? '是 ✅' : '否 ❌');
          
          if (responseInfo) {
            console.log('  最后签到日期:', responseInfo.last_checkin_date || '从未签到');
            console.log('  连续签到天数:', responseInfo.continuous_days || 0);
          }
          
          // 给出建议
          console.log('\n💡 建议:');
          if (checked) {
            console.log('  - 今天已经签到过了，签到按钮应该显示为禁用状态');
            console.log('  - 前端应该显示"今日已签到"');
          } else {
            console.log('  - 今天还没有签到，可以进行签到');
            console.log('  - 签到按钮应该是可点击状态');
          }
          
          resolve(responseData);
        } catch (error) {
          console.error('\n❌ 解析响应失败:', error.message);
          console.error('  原始响应:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ 请求失败:');
      console.error('  错误信息:', error.message);
      console.error('  请确保 film_api 服务已启动 (端口 4000)');
      reject(error);
    });
    
    req.end();
  });
}

// 运行测试
console.log('开始测试签到状态检查接口...');
testCheckSigninStatus()
  .then(() => {
    console.log('\n✅ 测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  });
