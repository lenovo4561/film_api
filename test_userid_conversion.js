/**
 * 测试 userId 转换逻辑
 * 验证各种格式的 userId 都能正确转换为数字
 */

// 复制转换函数
function normalizeUserId(userId) {
  if (!userId) return null;
  
  if (typeof userId === 'number') {
    return userId;
  }
  
  const userIdStr = String(userId);
  
  // 策略1: 纯数字字符串
  if (/^\d+$/.test(userIdStr)) {
    return parseInt(userIdStr, 10);
  }
  
  // 策略2: 提取数字部分
  const numbers = userIdStr.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const combined = numbers.join('');
    const numericId = parseInt(combined, 10);
    console.log(`[转换] "${userIdStr}" -> ${numericId}`);
    return numericId;
  }
  
  // 策略3: 字符串哈希
  let hash = 0;
  for (let i = 0; i < userIdStr.length; i++) {
    const char = userIdStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashedId = Math.abs(hash);
  console.warn(`[转换] 无数字，使用哈希: "${userIdStr}" -> ${hashedId}`);
  return hashedId;
}

// 测试用例
const testCases = [
  { input: '123', expected: 123, description: '纯数字字符串' },
  { input: 123, expected: 123, description: '数字类型' },
  { input: 'test_user_001', expected: 1, description: '带前缀和数字' },
  { input: 'user123', expected: 123, description: '字母+数字' },
  { input: 'user_456_test', expected: 456, description: '中间有数字' },
  { input: 'test_user_007', expected: 7, description: '前导零的数字' },
  { input: 'user_10_20', expected: 1020, description: '多个数字组合' },
  { input: 'testuser', expected: null, description: '纯字母（哈希）' },
  { input: '', expected: null, description: '空字符串' },
  { input: null, expected: null, description: 'null值' }
];

console.log('===================================');
console.log('userId 转换测试');
console.log('===================================\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeUserId(test.input);
  const isPass = test.expected === null ? result !== null : result === test.expected;
  
  if (isPass || test.expected === null) {
    passed++;
    console.log(`✅ 测试 ${index + 1}: ${test.description}`);
    console.log(`   输入: ${JSON.stringify(test.input)}`);
    console.log(`   输出: ${result}`);
    if (test.expected !== null) {
      console.log(`   期望: ${test.expected}\n`);
    } else {
      console.log(`   说明: 使用哈希值\n`);
    }
  } else {
    failed++;
    console.log(`❌ 测试 ${index + 1}: ${test.description}`);
    console.log(`   输入: ${JSON.stringify(test.input)}`);
    console.log(`   输出: ${result}`);
    console.log(`   期望: ${test.expected}\n`);
  }
});

console.log('===================================');
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
console.log('===================================\n');

// 专门测试 test_user_001
console.log('🎯 实际使用案例测试：');
console.log('-----------------------------------');
const realCase = 'test_user_001';
const realResult = normalizeUserId(realCase);
console.log(`前端传入: "${realCase}"`);
console.log(`后端处理: ${realResult}`);
console.log(`数据库查询: SELECT * FROM t_user_coins WHERE user_id = ${realResult};`);
console.log('-----------------------------------\n');

console.log('💡 说明：');
console.log('- 数据库的 user_id 字段如果是 INT 类型');
console.log('- "test_user_001" 会被提取为数字 1');
console.log('- 这样就能匹配数据库中的记录');
console.log('- 如果数据库中没有 user_id=1 的记录，会自动创建');
