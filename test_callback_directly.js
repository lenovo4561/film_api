/**
 * 直接测试客户端回调接口
 *
 * 这个脚本模拟积分墙后端调用客户端的 /api/task/callback 接口
 * 用于验证回调接口的响应格式和逻辑是否正确
 */

const axios = require("axios");

// 配置
const CLIENT_API_URL = "http://localhost:4000";
const USER_ID = "55";
const TASK_ID = "14";

// 生成唯一订单ID
function generateOrderId() {
  return `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

async function testCallback() {
  console.log("\n========== 直接测试客户端回调接口 ==========\n");

  const orderId = generateOrderId();
  console.log("生成订单ID:", orderId);

  // 测试数据
  const callbackData = {
    userId: USER_ID,
    taskId: TASK_ID,
    orderId: orderId,
    coins: 10,
    totalCount: 2,
    completedCount: 1,
    timestamp: Date.now(),
    timezone: "Asia/Shanghai",
  };

  console.log("请求数据:", JSON.stringify(callbackData, null, 2));

  try {
    console.log("\n发送回调请求...");
    const startTime = Date.now();

    const response = await axios.post(
      `${CLIENT_API_URL}/api/task/callback`,
      callbackData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const processTime = Date.now() - startTime;

    console.log("\n✅ 回调成功!");
    console.log("响应状态码:", response.status);
    console.log("响应数据:", JSON.stringify(response.data, null, 2));
    console.log("请求耗时:", processTime, "ms");

    // 验证响应格式
    console.log("\n验证响应格式:");
    const { success, message, data } = response.data;

    if (success === true) {
      console.log("✅ success 字段正确: true");
    } else {
      console.warn("⚠️ success 字段不正确:", success);
    }

    if (message === "ok" || message.includes("成功")) {
      console.log("✅ message 字段正确:", message);
    } else {
      console.warn("⚠️ message 字段不正确:", message);
    }

    if (data && data.userId && data.orderId && data.coins !== undefined) {
      console.log("✅ data 字段结构正确");
      console.log("   - userId:", data.userId);
      console.log("   - orderId:", data.orderId);
      console.log("   - coins:", data.coins);
      console.log("   - newBalance:", data.newBalance);
    } else {
      console.warn("⚠️ data 字段结构不完整:", data);
    }

    // 测试幂等性（重复调用同一订单）
    console.log("\n========== 测试幂等性（重复调用） ==========\n");
    console.log("使用相同订单ID再次调用...");

    const response2 = await axios.post(
      `${CLIENT_API_URL}/api/task/callback`,
      callbackData
    );

    console.log("\n✅ 幂等性测试完成!");
    console.log("响应数据:", JSON.stringify(response2.data, null, 2));

    if (response2.data.data?.duplicate === true) {
      console.log("✅ 正确识别为重复订单");
    } else {
      console.warn("⚠️ 未标记为重复订单");
    }

    console.log("\n========== 测试完成 ==========\n");
  } catch (error) {
    console.error("\n❌ 回调失败!");
    console.error("错误信息:", error.message);

    if (error.response) {
      console.error("响应状态码:", error.response.status);
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("请求已发送但无响应");
      console.error("可能原因: 服务未启动或端口不正确");
    } else {
      console.error("请求配置错误:", error.message);
    }
  }
}

// 运行测试
console.log("准备测试客户端回调接口...");
console.log("目标URL:", `${CLIENT_API_URL}/api/task/callback`);
console.log("测试用户ID:", USER_ID);
console.log("测试任务ID:", TASK_ID);

testCallback();
