// 金币系统API测试脚本
// 使用方法: node test_coin_system.js

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
const TEST_USER_ID = 1; // 请修改为实际存在的用户ID

// 测试用例
async function testCoinSystem() {
  console.log('======= 开始测试用户金币系统 =======\n');
  
  try {
    // 1. 测试获取用户金币信息
    console.log('1. 测试获取用户金币信息...');
    const coinInfo = await axios.get(`${BASE_URL}/api/getUserCoins`, {
      params: { userId: TEST_USER_ID }
    });
    console.log('✓ 金币信息:', coinInfo.data);
    console.log('');
    
    // 2. 测试检查今天是否已签到
    console.log('2. 测试检查今天是否已签到...');
    const checkResult = await axios.get(`${BASE_URL}/api/checkTodayCheckin`, {
      params: { userId: TEST_USER_ID }
    });
    console.log('✓ 签到状态:', checkResult.data);
    console.log('');
    
    // 3. 测试签到（如果今天还未签到）
    if (!checkResult.data.checked) {
      console.log('3. 测试用户签到...');
      const checkinResult = await axios.post(`${BASE_URL}/api/userCheckin`, {
        userId: TEST_USER_ID
      });
      console.log('✓ 签到结果:', checkinResult.data);
      console.log('');
    } else {
      console.log('3. 今天已签到，跳过签到测试\n');
    }
    
    // 4. 测试获取金币记录
    console.log('4. 测试获取金币记录...');
    const records = await axios.get(`${BASE_URL}/api/getUserCoinRecords`, {
      params: { userId: TEST_USER_ID, limit: 10 }
    });
    console.log('✓ 金币记录:', records.data);
    console.log('');
    
    console.log('======= 用户端测试完成 =======\n');
    
    // 管理员接口测试
    console.log('======= 开始测试管理员接口 =======\n');
    
    // 5. 测试获取用户金币列表
    console.log('5. 测试获取用户金币列表...');
    const userCoinsList = await axios.get(`${BASE_URL}/api/admin/getCurrentPageUserCoins`, {
      params: { currentPage: 1, pageSize: 10, input: '' }
    });
    console.log('✓ 用户金币列表:', userCoinsList.data);
    console.log('');
    
    // 6. 测试管理员修改用户金币
    console.log('6. 测试管理员修改用户金币（增加10金币）...');
    const updateResult = await axios.post(`${BASE_URL}/api/admin/updateUserCoins`, {
      userId: TEST_USER_ID,
      coinChange: 10,
      changeReason: '测试奖励'
    });
    console.log('✓ 修改结果:', updateResult.data);
    console.log('');
    
    // 7. 测试获取金币统计
    console.log('7. 测试获取金币统计信息...');
    const statistics = await axios.get(`${BASE_URL}/api/admin/getCoinStatistics`);
    console.log('✓ 统计信息:', statistics.data);
    console.log('');
    
    // 8. 测试获取用户金币变动记录
    console.log('8. 测试获取用户金币变动记录...');
    const userRecords = await axios.get(`${BASE_URL}/api/admin/getUserCoinRecords`, {
      params: { userId: TEST_USER_ID, currentPage: 1, pageSize: 10 }
    });
    console.log('✓ 用户金币记录:', userRecords.data);
    console.log('');
    
    console.log('======= 管理员接口测试完成 =======\n');
    console.log('✅ 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testCoinSystem();
