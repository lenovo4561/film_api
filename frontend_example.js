// ============================================
// 前端调用示例 - 用户金币系统
// ============================================

// 假设使用 axios 进行 HTTP 请求
const API_BASE_URL = 'http://localhost:4000';

// ============================================
// 1. 用户端功能示例
// ============================================

/**
 * 获取用户金币信息
 */
async function getUserCoins(userId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/getUserCoins`, {
      params: { userId }
    });
    
    if (response.data.success_code === 200) {
      const coinData = response.data.data;
      console.log('金币余额:', coinData.coin_balance);
      console.log('累计获得:', coinData.total_earned);
      console.log('连续签到:', coinData.continuous_days, '天');
      return coinData;
    }
  } catch (error) {
    console.error('获取金币信息失败:', error);
  }
}

/**
 * 用户签到
 */
async function userCheckin(userId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/userCheckin`, {
      userId
    });
    
    if (response.data.success_code === 200) {
      const result = response.data.data;
      alert(`${result.message}！当前余额：${result.coin_balance}`);
      return result;
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error('签到失败:', error);
    alert('签到失败，请重试');
  }
}

/**
 * 检查今天是否已签到
 */
async function checkTodayCheckin(userId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/checkTodayCheckin`, {
      params: { userId }
    });
    
    if (response.data.success_code === 200) {
      return response.data.checked; // true 表示已签到
    }
  } catch (error) {
    console.error('检查签到状态失败:', error);
  }
}

/**
 * 获取金币记录
 */
async function getUserCoinRecords(userId, limit = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/getUserCoinRecords`, {
      params: { userId, limit }
    });
    
    if (response.data.success_code === 200) {
      return response.data.data;
    }
  } catch (error) {
    console.error('获取金币记录失败:', error);
  }
}

// ============================================
// 2. 页面初始化示例
// ============================================

/**
 * 任务中心页面初始化
 */
async function initTaskCenter(userId) {
  // 获取用户金币信息
  const coinData = await getUserCoins(userId);
  
  // 更新页面显示
  document.getElementById('coin-balance').textContent = coinData.coin_balance;
  
  // 检查今天是否已签到
  const hasChecked = await checkTodayCheckin(userId);
  
  // 更新签到按钮状态
  const checkinBtn = document.getElementById('checkin-btn');
  if (hasChecked) {
    checkinBtn.disabled = true;
    checkinBtn.textContent = '已签到';
    checkinBtn.classList.add('disabled');
  } else {
    checkinBtn.disabled = false;
    checkinBtn.textContent = '签到 + 20奖励币';
    checkinBtn.onclick = () => handleCheckin(userId);
  }
  
  // 显示连续签到天数
  updateCheckinDays(coinData.continuous_days);
}

/**
 * 处理签到点击
 */
async function handleCheckin(userId) {
  const result = await userCheckin(userId);
  if (result) {
    // 刷新页面显示
    await initTaskCenter(userId);
  }
}

/**
 * 更新签到天数显示
 */
function updateCheckinDays(continuousDays) {
  const rewards = [
    { day: 1, coins: 20 },
    { day: 2, coins: 20 },
    { day: 3, coins: 30 },
    { day: 4, coins: 40 },
    { day: 5, coins: 50 },
    { day: 6, coins: 60 }
  ];
  
  rewards.forEach((reward, index) => {
    const dayElement = document.getElementById(`day-${index + 1}`);
    if (continuousDays >= reward.day) {
      dayElement.classList.add('checked');
    }
  });
}

// ============================================
// 3. 管理员功能示例
// ============================================

/**
 * 获取用户金币列表（分页）
 */
async function getAdminUserCoins(currentPage = 1, pageSize = 10, search = '') {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/getCurrentPageUserCoins`, {
      params: { currentPage, pageSize, input: search }
    });
    
    if (response.data.success_code === 200) {
      return {
        data: response.data.data,
        total: response.data.total
      };
    }
  } catch (error) {
    console.error('获取用户金币列表失败:', error);
  }
}

/**
 * 管理员调整用户金币
 */
async function adminUpdateUserCoins(userId, coinChange, reason = '') {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/admin/updateUserCoins`, {
      userId,
      coinChange: parseInt(coinChange),
      changeReason: reason
    });
    
    if (response.data.success_code === 200) {
      alert('金币调整成功');
      return response.data.data;
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error('调整金币失败:', error);
    alert('调整金币失败');
  }
}

/**
 * 获取金币统计信息
 */
async function getCoinStatistics() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/getCoinStatistics`);
    
    if (response.data.success_code === 200) {
      const stats = response.data.data;
      console.log('总发放金币:', stats.total_earned);
      console.log('总用户数:', stats.user_count);
      console.log('总金币余额:', stats.total_balance);
      console.log('今日签到人数:', stats.today_checkin);
      return stats;
    }
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }
}

/**
 * 获取用户金币变动记录
 */
async function getAdminUserCoinRecords(userId, currentPage = 1, pageSize = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/getUserCoinRecords`, {
      params: { userId, currentPage, pageSize }
    });
    
    if (response.data.success_code === 200) {
      return {
        data: response.data.data,
        total: response.data.total
      };
    }
  } catch (error) {
    console.error('获取用户金币记录失败:', error);
  }
}

// ============================================
// 4. HTML 示例结构
// ============================================

/*
<!-- 任务中心页面示例 -->
<div class="task-center">
  <div class="coin-display">
    <img src="/images/coin.png" alt="金币">
    <span>你的金币</span>
    <span id="coin-balance">0</span>
  </div>
  
  <div class="checkin-section">
    <h3>签到领奖励</h3>
    <div class="checkin-days">
      <div class="day" id="day-1">
        <span class="coin-icon">+20</span>
        <span>第1天</span>
      </div>
      <div class="day" id="day-2">
        <span class="coin-icon">+20</span>
        <span>第2天</span>
      </div>
      <div class="day" id="day-3">
        <span class="coin-icon">+30</span>
        <span>第3天</span>
      </div>
      <div class="day" id="day-4">
        <span class="coin-icon">+40</span>
        <span>第4天</span>
      </div>
      <div class="day" id="day-5">
        <span class="coin-icon">+50</span>
        <span>第5天</span>
      </div>
      <div class="day" id="day-6">
        <span class="coin-icon">+60</span>
        <span>第6天</span>
      </div>
    </div>
    <button id="checkin-btn" class="checkin-button">
      签到 + 20奖励币
    </button>
  </div>
</div>

<!-- 页面加载时初始化 -->
<script>
  // 从本地存储或 Cookie 获取用户ID
  const userId = localStorage.getItem('userId') || getCookie('user_id');
  
  if (userId) {
    initTaskCenter(userId);
  }
</script>
*/

// ============================================
// 5. 实用工具函数
// ============================================

/**
 * 格式化金币变动类型
 */
function formatChangeType(type) {
  const typeMap = {
    'checkin': '签到奖励',
    'reward': '系统奖励',
    'consume': '消费'
  };
  return typeMap[type] || type;
}

/**
 * 格式化时间
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}

/**
 * 渲染金币记录列表
 */
function renderCoinRecords(records) {
  const html = records.map(record => `
    <div class="coin-record-item">
      <div class="record-left">
        <span class="record-type">${formatChangeType(record.change_type)}</span>
        <span class="record-reason">${record.change_reason}</span>
      </div>
      <div class="record-right">
        <span class="coin-change ${record.coin_change > 0 ? 'positive' : 'negative'}">
          ${record.coin_change > 0 ? '+' : ''}${record.coin_change}
        </span>
        <span class="record-time">${formatDate(record.created_at)}</span>
      </div>
    </div>
  `).join('');
  
  document.getElementById('coin-records').innerHTML = html;
}

// ============================================
// 6. CSS 样式示例
// ============================================

/*
.task-center {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.coin-display {
  text-align: center;
  padding: 20px;
}

.coin-display img {
  width: 60px;
  height: 60px;
}

#coin-balance {
  font-size: 48px;
  font-weight: bold;
  display: block;
  margin: 10px 0;
}

.checkin-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.checkin-days {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.day {
  text-align: center;
  padding: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.2);
}

.day.checked {
  background: rgba(255, 215, 0, 0.3);
  border: 2px solid gold;
}

.coin-icon {
  display: block;
  font-weight: bold;
  color: gold;
  font-size: 18px;
}

.checkin-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.checkin-button:hover {
  opacity: 0.9;
}

.checkin-button.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.coin-record-item {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: white;
  margin-bottom: 10px;
  border-radius: 5px;
  color: #333;
}

.coin-change.positive {
  color: #52c41a;
}

.coin-change.negative {
  color: #f5222d;
}
*/
